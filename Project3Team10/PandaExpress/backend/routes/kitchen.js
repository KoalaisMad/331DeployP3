import express from "express";
import pool from "../db.js";

const router = express.Router();





// KITCHEN BOARD ENDPOINTS

// POST /api/kitchen/init-db
router.post('/init-db', async (req, res) => {
  try {
    console.log('Initializing kitchen board database...');
    
    // Create orders_status table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders_status (
        order_id INTEGER PRIMARY KEY,
        status VARCHAR(20) DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'completed', 'canceled')),
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_status_status ON orders_status(status)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_status_completed_at ON orders_status(completed_at)
    `);

    // Set up status for today's orders
    const initResult = await pool.query(`
      INSERT INTO orders_status (order_id, status, completed_at)
      SELECT o.id, 'in-progress', NULL
      FROM orders o
      WHERE DATE(o.timestamp) = CURRENT_DATE
        AND NOT EXISTS (
          SELECT 1 FROM orders_status os WHERE os.order_id = o.id
        )
      ON CONFLICT (order_id) DO NOTHING
      RETURNING order_id
    `);

    console.log(`Initialized ${initResult.rows.length} orders with 'in-progress' status`);
    
    res.json({ 
      success: true, 
      message: 'Database initialized successfully',
      ordersInitialized: initResult.rows.length
    });
  } catch (err) {
    console.error('Error initializing database:', err);
    res.status(500).json({ error: 'Failed to initialize database', details: err.message });
  }
});

// Get kitchen orders (current and past)
// GET /api/kitchen/orders
router.get('/orders', async (req, res) => {
  try {
    // Create orders_status table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders_status (
        order_id INTEGER PRIMARY KEY,
        status VARCHAR(20) DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'completed', 'canceled')),
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_orders_status_status ON orders_status(status);
      CREATE INDEX IF NOT EXISTS idx_orders_status_completed_at ON orders_status(completed_at);
    `);

    // Set up status for today's orders
    await pool.query(`
      INSERT INTO orders_status (order_id, status, completed_at)
      SELECT o.id, 'in-progress', NULL
      FROM orders o
      WHERE DATE(o.timestamp) = CURRENT_DATE
        AND NOT EXISTS (SELECT 1 FROM orders_status os WHERE os.order_id = o.id)
      ON CONFLICT (order_id) DO NOTHING
    `);

    const parseOrderString = (orderString) => {
      const result = {
        combos: [],  // Array of {size, entrees, sides}
        appetizers: [],
        drinks: []
      };

      if (!orderString) {
        return result;
      }

      // Split by pipe to get sections
      const sections = orderString.split('|');

      for (const section of sections) {
        const trimmed = section.trim();
        
        if (trimmed.startsWith('APP(') && trimmed.endsWith(')')) {
          // Appetizers: APP(item1,item2)
          const items = trimmed.substring(4, trimmed.length - 1).split(',');
          result.appetizers = items.map(item => item.trim());
        } 
        else if (trimmed.startsWith('DRK(') && trimmed.endsWith(')')) {
          // Drinks: DRK(item1,item2)
          const items = trimmed.substring(4, trimmed.length - 1).split(',');
          result.drinks = items.map(item => item.trim());
        } 
        else if (trimmed.includes(':')) {
          // Combo section: Bowl:E(...)S(...) or Plate:E(...)
          const parts = trimmed.split(':');
          const size = parts[0].trim();
          
          // Parse any E(...) or S(...) in the same section
          const remainder = parts.slice(1).join(':');
          const eMatch = remainder.match(/E\(([^)]*)\)/);
          const sMatch = remainder.match(/S\(([^)]*)\)/);
          
          const entrees = eMatch && eMatch[1] 
            ? eMatch[1].split(',').map(item => item.trim()) 
            : [];
          const sides = sMatch && sMatch[1] 
            ? sMatch[1].split(',').map(item => item.trim()) 
            : [];
          
          result.combos.push({ size, entrees, sides });
        }
      }

      return result;
    };

    const fetchOrderDetails = async (baseQuery) => {
      // Get the list of orders first
      const ordersResult = await pool.query(baseQuery);
      
      // Process each order - now just parse the order_string
      return ordersResult.rows.map((order) => {
        try {
          const parsed = parseOrderString(order.order_string);

          return {
            id: order.id,
            timestamp: order.timestamp,
            cost: parseFloat(order.cost) || 0,
            combos: parsed.combos,
            appetizers: parsed.appetizers,
            drinks: parsed.drinks,
            status: order.status || (order.completed_at ? 'completed' : 'in-progress')
          };

        } catch (err) {
          console.error(`Error parsing order string for Order ${order.id}:`, err);
          return { 
            id: order.id, 
            timestamp: order.timestamp, 
            cost: 0, 
            combos: [],
            appetizers: [], 
            drinks: [],
            status: 'in-progress'
          };
        }
      });
    };

    console.log('Fetching kitchen orders...');

    // Get Current Orders
    const currentOrders = await fetchOrderDetails(`
      SELECT DISTINCT o.id, o.timestamp, o.cost, o.order_string, NULL as completed_at
      FROM orders o
      LEFT JOIN orders_status os ON o.id = os.order_id
      WHERE DATE(o.timestamp) = CURRENT_DATE
        AND (os.status IS NULL OR os.status = 'in-progress')
      ORDER BY o.timestamp ASC
      LIMIT 20
    `);

    // Get Past Orders
    const pastOrders = await fetchOrderDetails(`
      SELECT DISTINCT o.id, o.timestamp, o.cost, o.order_string, os.completed_at, os.status
      FROM orders o
      JOIN orders_status os ON o.id = os.order_id
      WHERE DATE(o.timestamp) = CURRENT_DATE
        AND os.status IN ('completed', 'canceled')
      ORDER BY os.completed_at DESC
      LIMIT 50
    `);

    console.log(`Sending: ${currentOrders.length} current, ${pastOrders.length} past`);
    
    res.json({ currentOrders, pastOrders });

  } catch (err) {
    console.error('CRITICAL Error fetching kitchen orders:', err);
    res.status(500).json({ error: 'Failed to fetch kitchen orders', details: err.message });
  }
});

// Complete an order
// POST /api/kitchen/complete-order
router.post('/complete-order', async (req, res) => {
  const { orderId } = req.body;
  
  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  try {
    console.log(`Completing order ${orderId}`);
    
    // Insert or update the order status
    await pool.query(`
      INSERT INTO orders_status (order_id, status, completed_at)
      VALUES ($1, 'completed', NOW())
      ON CONFLICT (order_id) 
      DO UPDATE SET status = 'completed', completed_at = NOW()
    `, [orderId]);

    console.log(`Order ${orderId} marked as completed`);
    res.json({ success: true, message: 'Order completed' });
  } catch (err) {
    console.error('Error completing order:', err);
    res.status(500).json({ error: 'Failed to complete order', details: err.message });
  }
});

// Cancel an order
// POST /api/kitchen/cancel-order
router.post('/cancel-order', async (req, res) => {
  const { orderId } = req.body;
  
  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  try {
    console.log(`Canceling order ${orderId}`);
    
    // Mark order as canceled with timestamp
    await pool.query(`
      INSERT INTO orders_status (order_id, status, completed_at)
      VALUES ($1, 'canceled', NOW())
      ON CONFLICT (order_id) 
      DO UPDATE SET status = 'canceled', completed_at = NOW()
    `, [orderId]);

    console.log(`Order ${orderId} canceled`);
    res.json({ success: true, message: 'Order canceled' });
  } catch (err) {
    console.error('Error canceling order:', err);
    res.status(500).json({ error: 'Failed to cancel order', details: err.message });
  }
});

// Mark order as incomplete (move from past to current)
// POST /api/kitchen/incomplete-order
router.post('/incomplete-order', async (req, res) => {
  const { orderId } = req.body;
  
  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  try {
    console.log(`Marking order ${orderId} as incomplete`);
    
    await pool.query(`
      INSERT INTO orders_status (order_id, status, completed_at)
      VALUES ($1, 'in-progress', NULL)
      ON CONFLICT (order_id) 
      DO UPDATE SET status = 'in-progress', completed_at = NULL
    `, [orderId]);

    console.log(`Order ${orderId} marked as in-progress`);
    res.json({ success: true, message: 'Order marked as incomplete' });
  } catch (err) {
    console.error('Error marking order as incomplete:', err);
    res.status(500).json({ error: 'Failed to mark order as incomplete', details: err.message });
  }
});

// Remake an order (duplicate it)
// POST /api/kitchen/remake-order
router.post('/remake-order', async (req, res) => {
  const { orderId } = req.body;
  
  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  try {
    console.log(`Remaking order ${orderId}`);
    
    // Get the original order details
    const orderResult = await pool.query('SELECT cost FROM orders WHERE id = $1', [orderId]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Create a new order
    const newOrderResult = await pool.query(
      'INSERT INTO orders (timestamp, cost) VALUES (NOW(), $1) RETURNING id',
      [orderResult.rows[0].cost]
    );
    const newOrderId = newOrderResult.rows[0].id;
    console.log(`Created new order ${newOrderId} from original order ${orderId}`);

    // Copy food items
    const foodItems = await pool.query(
      'SELECT foodsizeid FROM orders_to_food_sizes WHERE orderid = $1',
      [orderId]
    );

    for (const item of foodItems.rows) {
      try {
        await pool.query(
          'INSERT INTO orders_to_food_sizes (id, orderid, foodsizeid) VALUES (DEFAULT, $1, $2)',
          [newOrderId, item.foodsizeid]
        );
      } catch (insErr) {
        await pool.query(
          'INSERT INTO orders_to_food_sizes (id, orderid, foodsizeid) VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM orders_to_food_sizes), $1, $2)',
          [newOrderId, item.foodsizeid]
        );
      }
    }

    // Copy appetizers and drinks
    const appetizers = await pool.query(
      'SELECT appetizeranddrinkid FROM orders_to_appetizers_and_drinks WHERE orderid = $1',
      [orderId]
    );

    for (const item of appetizers.rows) {
      try {
        await pool.query(
          'INSERT INTO orders_to_appetizers_and_drinks (id, orderid, appetizeranddrinkid) VALUES (DEFAULT, $1, $2)',
          [newOrderId, item.appetizeranddrinkid]
        );
      } catch (insErr) {
        await pool.query(
          'INSERT INTO orders_to_appetizers_and_drinks (id, orderid, appetizeranddrinkid) VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM orders_to_appetizers_and_drinks), $1, $2)',
          [newOrderId, item.appetizeranddrinkid]
        );
      }
    }

    console.log(`Successfully remade order ${orderId} as new order ${newOrderId}`);
    res.json({ success: true, message: 'Order remade', newOrderId });
  } catch (err) {
    console.error('Error remaking order:', err);
    res.status(500).json({ error: 'Failed to remake order', details: err.message });
  }
});

// Catch-all handler to serve React's index.html for any unknown routes
// This must be AFTER all API routes
// Commenting out for now to avoid PathError with '*'
// router.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
// });




export default router;