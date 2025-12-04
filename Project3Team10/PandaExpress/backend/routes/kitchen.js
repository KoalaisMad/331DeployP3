import express from "express";
import pool from "../db.js";

const router = express.Router();

// KITCHEN BOARD ENDPOINTS

// Initialize database for kitchen board
// Mounted at /api/kitchen -> POST /api/kitchen/init-db
router.post('/init-db', async (req, res) => {
  try {
    console.log('Initializing kitchen board database...');
    
    // Create orders_status table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders_status (
        order_id INTEGER PRIMARY KEY,
        status VARCHAR(20) DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'completed')),
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

    // Initialize status for all orders from today that don't have one
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
        status VARCHAR(20) DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'completed')),
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

    // Initialize status for today's orders that don't have one
    await pool.query(`
      INSERT INTO orders_status (order_id, status, completed_at)
      SELECT o.id, 'in-progress', NULL
      FROM orders o
      WHERE DATE(o.timestamp) = CURRENT_DATE
        AND NOT EXISTS (
          SELECT 1 FROM orders_status os WHERE os.order_id = o.id
        )
      ON CONFLICT (order_id) DO NOTHING
    `);

    console.log('Fetching kitchen orders...');

    // Get current orders (in-progress, from today)
    const currentOrdersResult = await pool.query(`
      SELECT DISTINCT o.id, o.timestamp, o.cost
      FROM orders o
      LEFT JOIN orders_status os ON o.id = os.order_id
      WHERE DATE(o.timestamp) = CURRENT_DATE
        AND (os.status IS NULL OR os.status = 'in-progress')
      ORDER BY o.timestamp ASC
      LIMIT 20
    `);

    console.log(`Found ${currentOrdersResult.rows.length} current orders`);

    const currentOrders = await Promise.all(currentOrdersResult.rows.map(async (order) => {
      try {
        // Get all food items for this order (sides and entrees)
        const foodItems = await pool.query(`
          SELECT DISTINCT f.name, f.is_side
          FROM orders_to_food_sizes otfs
          JOIN food f ON otfs.foodsizeid = f.id
          WHERE otfs.orderid = $1
          ORDER BY f.is_side, f.name
        `, [order.id]);

        // Get the size for this order
        const sizeResult = await pool.query(`
          SELECT DISTINCT s.name
          FROM orders_to_food_sizes otfs
          JOIN sizes s ON otfs.foodsizeid = s.id
          WHERE otfs.orderid = $1
          LIMIT 1
        `, [order.id]);

        // Get appetizers/drinks for this order
        const appetizersResult = await pool.query(`
          SELECT DISTINCT ad.name
          FROM orders_to_appetizers_and_drinks otad
          JOIN appetizers_and_drinks ad ON otad.appetizeranddrinkid = ad.id
          WHERE otad.orderid = $1
        `, [order.id]);

        const entrees = foodItems.rows
          .filter(item => !item.is_side)
          .map(item => item.name);
        
        const sides = foodItems.rows
          .filter(item => item.is_side)
          .map(item => item.name);

        const sizeLabel = sizeResult.rows.length > 0 ? sizeResult.rows[0].name : 'Custom Order';

        console.log(`Order ${order.id}: size=${sizeLabel}, entrees=[${entrees.join(', ')}], sides=[${sides.join(', ')}]`);

        return {
          id: order.id,
          timestamp: order.timestamp,
          cost: parseFloat(order.cost) || 0,
          size: sizeLabel,
          entrees: entrees,
          sides: sides,
          appetizers: appetizersResult.rows.map(r => r.name)
        };
      } catch (err) {
        console.error(`Error processing order ${order.id}:`, err);
        return {
          id: order.id,
          timestamp: order.timestamp,
          cost: parseFloat(order.cost) || 0,
          size: 'Error Loading',
          entrees: [],
          sides: [],
          appetizers: []
        };
      }
    }));

    // Get past orders (completed today)
    const pastOrdersResult = await pool.query(`
      SELECT DISTINCT o.id, o.timestamp, o.cost, os.completed_at
      FROM orders o
      JOIN orders_status os ON o.id = os.order_id
      WHERE DATE(o.timestamp) = CURRENT_DATE
        AND os.status = 'completed'
      ORDER BY os.completed_at DESC
      LIMIT 50
    `);

    console.log(`Found ${pastOrdersResult.rows.length} past orders`);

    const pastOrders = await Promise.all(pastOrdersResult.rows.map(async (order) => {
      try {
        // Get all food items for this order (sides and entrees)
        const foodItems = await pool.query(`
          SELECT DISTINCT f.name, f.is_side
          FROM orders_to_food_sizes otfs
          JOIN food f ON otfs.foodsizeid = f.id
          WHERE otfs.orderid = $1
          ORDER BY f.is_side, f.name
        `, [order.id]);

        // Get the size for this order
        const sizeResult = await pool.query(`
          SELECT DISTINCT s.name
          FROM orders_to_food_sizes otfs
          JOIN sizes s ON otfs.foodsizeid = s.id
          WHERE otfs.orderid = $1
          LIMIT 1
        `, [order.id]);

        // Get appetizers/drinks for this order
        const appetizersResult = await pool.query(`
          SELECT DISTINCT ad.name
          FROM orders_to_appetizers_and_drinks otad
          JOIN appetizers_and_drinks ad ON otad.appetizeranddrinkid = ad.id
          WHERE otad.orderid = $1
        `, [order.id]);

        const entrees = foodItems.rows
          .filter(item => !item.is_side)
          .map(item => item.name);
        
        const sides = foodItems.rows
          .filter(item => item.is_side)
          .map(item => item.name);

        const sizeLabel = sizeResult.rows.length > 0 ? sizeResult.rows[0].name : 'Custom Order';

        return {
          id: order.id,
          timestamp: order.timestamp,
          cost: parseFloat(order.cost) || 0,
          size: sizeLabel,
          entrees: entrees,
          sides: sides,
          appetizers: appetizersResult.rows.map(r => r.name)
        };
      } catch (err) {
        console.error(`Error processing past order ${order.id}:`, err);
        return {
          id: order.id,
          timestamp: order.timestamp,
          cost: parseFloat(order.cost) || 0,
          size: 'Error Loading',
          entrees: [],
          sides: [],
          appetizers: []
        };
      }
    }));

    console.log('Successfully fetched all kitchen orders');
    console.log(`Sending to frontend: ${currentOrders.length} current, ${pastOrders.length} past`);
    
    // Log sample data for debugging
    if (currentOrders.length > 0) {
      console.log('Sample current order:', JSON.stringify(currentOrders[0], null, 2));
    }
    
    res.json({ currentOrders, pastOrders });
  } catch (err) {
    console.error('Error fetching kitchen orders:', err);
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