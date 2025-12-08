import express from "express";
import pool from "../db.js";

const router = express.Router();

/**
 * Route to create or get a food item by name.
 * @name POST /api/food
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.post('/food', async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Missing or invalid name' });
    }

    const trimmed = name.trim();

    // Try to find existing food (case-insensitive)
    const existing = await pool.query(
      'SELECT id, name, premium FROM food WHERE LOWER(name) = LOWER($1) LIMIT 1',
      [trimmed]
    );
    if (existing.rowCount > 0) {
      return res.json({ item: existing.rows[0] });
    }

    // Insert a new food row (not a side, enabled by default)
    const inserted = await pool.query(
      'INSERT INTO food (name, premium, is_side, enabled) VALUES ($1, FALSE, FALSE, TRUE) RETURNING id, name, premium',
      [trimmed]
    );
    return res.json({ item: inserted.rows[0] });
  } catch (err) {
    console.error('POST /food failed:', err);
    return res.status(500).json({ error: 'Failed to get or create food' });
  }
});

/**
 * Route to get all enabled sides.
 * @name GET /api/sides
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.get("/sides", async (req, res) => {
  try {
    const result = await pool.query("SELECT name FROM food WHERE is_side = TRUE and enabled = TRUE");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

/**
 * Route to get all enabled entrees.
 * @name GET /api/entrees
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.get("/entrees", async (req, res) => {
  try {
    const result = await pool.query("SELECT DISTINCT f.name FROM food f JOIN sizes_to_food stf ON f.id = stf.foodid JOIN food_to_inventory fti ON f.id = fti.foodid WHERE f.is_side = FALSE AND f.enabled = TRUE");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

/**
 * Route to add a new size item.
 * @name POST /api/inventory/price-adjustment/sizes
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.post("/price-adjustment/sizes", async (req, res) => {
  try {
    const item = req.body;
    const result = await pool.query("INSERT INTO sizes (name, price, numberofentrees, numberofsides) VALUES ($1, $2, $3, $4) RETURNING *", [item.name, item.price, item.numEntrees, item.numSides]);
    if(result.rowCount == 0) {
      return res.status(404).json({ error: 'Size could not be added'});
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

/**
 * Route to add a new appetizer or drink.
 * @name POST /api/inventory/price-adjustment/appetizers-drinks
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.post("/price-adjustment/appetizers-drinks", async (req, res) => {
  try {
    const item = req.body;
    const result = await pool.query("INSERT INTO appetizers_and_drinks (name, price, enabled) VALUES ($1, $2, $3) RETURNING *", [item.name, item.price, item.isEnabled]);
    if(result.rowCount == 0) {
      return res.status(404).json({ error: 'appetizer/drink could not be added'});
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

/**
 * Route to add a new main item.
 * @name POST /api/inventory/price-adjustment/main-items
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.post("/price-adjustment/main-items", async (req, res) => {
  try {
    const item = req.body;
    const result = await pool.query("INSERT INTO food (name, premium, enabled, is_side) VALUES ($1, $2, $3, $4) RETURNING *", [item.name, item.isPremium, item.isEnabled, item.isSide]);
    if(result.rowCount == 0) {
      return res.status(404).json({ error: 'Main item could not be added' });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

/**
 * Route to update a size item.
 * @name PUT /api/price-adjustment/sizes
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.put("/price-adjustment/sizes", async (req, res) => {
  try {
    // Information needed: employee, property, newValue
    const item = req.body;
    // console.log(req.body)
    // Basic validation
    if(!item || typeof item.id !== 'number') {
      // console.log('!item: ', !item);
      // console.log('item.id !== number', item.id !== 'number');
      return res.status(400).json({ error: 'Missing or invalid size.id' });
      // return res.json({message: `UPDATE sizes SET ${property} = ${newValue} WHERE id = ${item.id}`});
    }

    const result = await pool.query(`UPDATE sizes SET numberofentrees = $1, numberofsides = $2, name = $3, price = $4 WHERE id = $5 RETURNING *`, [item.numEntrees, item.numSides, item.name, item.price, item.id]);

    // Check if it does not return a row
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Size not found'});
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

/**
 * Route to update an appetizer or drink.
 * @name PUT /api/price-adjustment/appetizers-drinks
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.put("/price-adjustment/appetizers-drinks", async (req, res) => {
  try {
    // Information needed: employee, property, newValue
    const item = req.body;
    
    // Basic validation
    if(!item || typeof item.id !== 'number') {
      return res.status(400).json({ error: 'Missing or invalid item.id' });
    }

    const result = await pool.query(`UPDATE appetizers_and_drinks SET name = $1, price = $2, enabled = $3 WHERE id = $4 RETURNING *`, [item.name, item.price, item.isEnabled, item.id]);

    // Check if it does not return a row
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'appetizer/Drink not found'});
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

/**
 * Route to update a main item.
 * @name PUT /api/price-adjustment/main-items
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.put("/price-adjustment/main-items", async (req, res) => {
  try {
    // Information needed: employee, property, newValue
    const item = req.body;
    
    // Basic validation
    if(!item || typeof item.id !== 'number') {
      return res.status(400).json({ error: 'Missing or invalid item.id' });
    }

    const result = await pool.query(`UPDATE food SET name = $1, premium = $2, enabled = $3, is_side = $4 WHERE id = $5 RETURNING *`, [item.name, item.isPremium, item.isEnabled, item.isSide, item.id]);

    // Check if it does not return a row
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Main item not found'});
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

/**
 * Route to delete a size.
 * @name DELETE /api/price-adjustment/sizes
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.delete("/price-adjustment/sizes", async(req, res) => {
    try {
      // Information that is needed: employee id
      const item = req.body; 
      const result = await pool.query("DELETE FROM sizes WHERE id=$1 RETURNING *", [item.id]);
      
      // Check if it does not return a row
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Size not found'});
      }

      // Return only one row
      res.json(result.rows[0]);
    } catch(err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete size'});
    }
  });

/**
 * Route to delete an appetizer or drink.
 * @name DELETE /api/price-adjustment/appetizers-drinks
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.delete("/price-adjustment/appetizers-drinks", async(req, res) => {
    try {
      // Information that is needed: employee id
      const item = req.body; 
      const result = await pool.query("DELETE FROM appetizers_and_drinks WHERE id=$1 RETURNING *", [item.id]);
      
      // Check if it does not return a row
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'appetizer/drink not found'});
      }

      // Return only one row
      res.json(result.rows[0]);
    } catch(err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete appetizer/drink'});
    }
  });

/**
 * Route to delete a main item.
 * @name DELETE /api/price-adjustment/main-items
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.delete("/price-adjustment/main-items", async(req, res) => {
    try {
      // Information that is needed: employee id
      const item = req.body; 
      
      // Delete inventory entries from junction table that correspond to food id
      const resultJunction1 = await pool.query("DELETE FROM food_to_inventory WHERE foodid=$1 RETURNING *", [item.id]);

      const resultJunction2 = await pool.query("DELETE FROM sizes_to_food WHERE foodid=$1 RETURNING *", [item.id]);

      const resultJunction3 = await pool.query("DELETE FROM appetizer_images WHERE appetizer_drink_id=$1 RETURNING *", [item.id]);

      const resultJunction4 = await pool.query("DELETE from food_images WHERE food_id=$1 RETURNING *", [item.id]);

      const result = await pool.query("DELETE FROM food WHERE id=$1 RETURNING *", [item.id]);
      
      // Check if it does not return a row
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Main item not found'});
      }

      // Return only one row
      res.json(result.rows[0]);
    } catch(err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete main item'});
    }
  });

/**
 * Route to get all sizes.
 * @name GET /api/price-adjustment/sizes
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.get("/price-adjustment/sizes", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, numberofentrees, numberofsides, name, price FROM sizes");
    res.json(result.rows);
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }

});

/**
 * Route to get all appetizers and drinks.
 * @name GET /api/price-adjustment/appetizers-drinks
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.get("/price-adjustment/appetizers-drinks", async (req, res) => {
  try {
    // Return only enabled appetizers/drinks for consumer-facing requests
    const result = await pool.query("SELECT id, name, price, enabled FROM appetizers_and_drinks");
    res.json(result.rows);
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

/**
 * Route to get all enabled appetizers and drinks.
 * @name GET /api/price-adjustment/appetizers-drinks-enabled
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.get("/price-adjustment/appetizers-drinks-enabled", async (req, res) => {
  try {
    // Return only enabled appetizers/drinks for consumer-facing requests
    const result = await pool.query("SELECT id, name, price, enabled FROM appetizers_and_drinks WHERE enabled = TRUE");
    res.json(result.rows);
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

/**
 * Route to get all main items.
 * @name GET /api/price-adjustment/main-items
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.get("/price-adjustment/main-items", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, premium, enabled, is_side FROM food");
    res.json(result.rows);
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }

});

/**
 * Route to get all enabled appetizers.
 * @name GET /api/appetizers
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.get("/appetizers", async (req, res) => {
  try {
    const result = await pool.query("SELECT name FROM appetizers_and_drinks WHERE enabled = TRUE");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  } 
});

/**
 * Route to get all sizes.
 * @name GET /api/sizes
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.get("/sizes", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, price, numberofentrees, numberofsides FROM sizes"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Database query failed" });
  }
});

/**
 * Route to get all enabled entrees with details.
 * @name GET /api/entrees
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.get("/entrees", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.id, f.name, f.premium 
      FROM food f 
      WHERE f.is_side = FALSE AND f.enabled = TRUE
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Database query failed" });
  }
});

/**
 * Route to get all enabled appetizers with details.
 * @name GET /api/appetizers
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.get("/appetizers", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, price 
      FROM appetizers_and_drinks 
      WHERE enabled = TRUE
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Database query failed" });
  }
});

/**
 * Route to get all premium entree names.
 * @name GET /api/premium-entrees
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.get("/premium-entrees", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT name FROM food WHERE premium = TRUE AND enabled = TRUE"
    );
    res.json(result.rows.map(r => r.name));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch premium entrees" });
  }
});

/**
 * Route to get all side names.
 * @name GET /api/sides/names
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.get("/sides/names", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT name FROM food WHERE is_side = TRUE AND enabled = TRUE"
    );
    res.json(result.rows.map(r => r.name));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch side names" });
  }
});

/**
 * Route to get all entree names.
 * @name GET /api/entrees/names
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.get("/entrees/names", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT name FROM food WHERE is_side = FALSE AND enabled = TRUE"
    );
    res.json(result.rows.map(r => r.name));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch entree names" });
  }
});

/**
 * Route to get all size names and prices.
 * @name GET /api/sizes/prices
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.get("/sizes/prices", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT name, price FROM sizes"
    );
    res.json(result.rows); // [{name:"Bowl", price:8.05}, ...]
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch sizes/prices" });
  }
});

/**
 * Route to get a single size price by name.
 * @name GET /api/sizes/price/:name
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.get("/sizes/price/:name", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT price FROM sizes WHERE name = $1",
      [req.params.name]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Size not found" });
    }

    res.json({ price: result.rows[0].price });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch size price" });
  }
});

/**
 * Route to get prices for all appetizers and drinks.
 * @name GET /api/appetizers-drinks/prices
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.get("/appetizers-drinks/prices", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT name, price FROM appetizers_and_drinks WHERE enabled = TRUE"
    );
    res.json(result.rows); // [{name:"Spring Roll", price:1.95}, ...]
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch appetizer/drink prices" });
  }
});

/**
 * Route to get price for a single appetizer or drink by name.
 * @name GET /api/appetizers-drinks/price/:name
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.get("/appetizers-drinks/price/:name", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT price FROM appetizers_and_drinks WHERE name = $1 AND enabled = TRUE",
      [req.params.name]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json({ price: result.rows[0].price });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch appetizer/drink price" });
  }
});

/**
 * Route to create or return existing inventory item.
 * @name POST /api/inventory
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.post('/', async (req, res) => {
  const { name, quantity = 100 } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });

  try {
    const existing = await pool.query('SELECT id, name, quantity FROM inventory WHERE LOWER(name) = LOWER($1) LIMIT 1', [name.trim()]);
    if (existing.rowCount > 0) {
      const row = existing.rows[0];
      return res.json({ success: true, existed: true, item: { id: row.id, name: row.name, quantity: parseInt(row.quantity, 10) } });
    }

    const insert = await pool.query(
      'INSERT INTO inventory (name, quantity) VALUES ($1, $2) RETURNING id, name, quantity',
      [name.trim(), quantity]
    );

    const item = insert.rows[0];
    res.json({ success: true, existed: false, item: { id: item.id, name: item.name, quantity: parseInt(item.quantity, 10) } });
  } catch (err) {
    console.error('Error creating inventory item:', err);
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
});

/**
 * Route to get all inventory items with status.
 * @name GET /api/inventory
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, quantity, wet, supplier FROM inventory ORDER BY id');

    const items = result.rows.map((r) => {
      const quantity = Number.isFinite(Number(r.quantity)) ? parseInt(r.quantity, 10) : 0;
      let status = 'In Stock';
      if (quantity <= 10) status = 'Running Low';
      else if (quantity <= 50) status = 'Low';
    
      return {
        id: r.id,
        name: r.name,
        quantity,
        status,
        wet: (r.wet === true || r.wet === 't') ? 'Wet' : 'Dry', // account for wet/dry
        supplier: r.supplier || 'N/A'
      };
    });    

    res.json(items);
  } catch (err) {
    console.error('Failed to fetch inventory items:', err);
    res.status(500).json({ error: 'Failed to fetch inventory items' });
  }
});

/**
 * Route to add an inventory item to inventory board.
 * @name POST /api/inventory/inventory-board
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.post('/inventory-board', async (req, res) => {
  try {
    const { name, quantity, wet } = req.body;

    const result = await pool.query(
      'INSERT INTO inventory (name, quantity, wet) VALUES ($1, $2, $3) RETURNING id, name, quantity, wet',
      [name, quantity, wet]
    );

    const row = result.rows[0];
    const qty = Number.isFinite(Number(row.quantity)) ? parseInt(row.quantity, 10) : 0;

    let status = 'In Stock';
    if (qty <= 10) status = 'Running Low';
    else if (qty <= 50) status = 'Low';

    res.json({
      id: row.id,
      name: row.name,
      quantity: qty,
      status,
      wet: row.wet === true || row.wet === 't' ? 'Wet' : 'Dry'
    });
  } catch (err) {
    console.error('Failed to add inventory item into inventory board:', err);
    res.status(500).json({ error: 'Failed to add inventory item into inventory board' });
  }
});

/**
 * Route to update an inventory item in inventory board.
 * @name PUT /api/inventory/inventory-board
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.put('/inventory-board', async (req, res) => {
  try {
    const { id, name, quantity, wet, supplier } = req.body;

    const result = await pool.query(
      'UPDATE inventory SET name = $1, quantity = $2, wet = $3, supplier = $4 WHERE id = $5 RETURNING id, name, quantity, wet, supplier',
      [name, quantity, wet, supplier, id]
    );

    const row = result.rows[0];
    const qty = Number.isFinite(Number(row.quantity)) ? parseInt(row.quantity, 10) : 0;

    let status = 'In Stock';
    if (qty <= 10) status = 'Running Low';
    else if (qty <= 50) status = 'Low';

    res.json({
      id: row.id,
      name: row.name,
      quantity: qty,
      status,
      wet: row.wet === true || row.wet === 't' ? 'Wet' : 'Dry',
      supplier: row.supplier 
    });
  } catch (err) {
    console.error('Failed to update inventory item in inventory board:', err);
    res.status(500).json({ error: 'Failed to update inventory item in inventory board' });
  }
});

/**
 * Route to delete an inventory item from inventory board.
 * @name DELETE /api/inventory/inventory-board
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.delete('/inventory-board', async (req, res) => {
  try {
    const obj = req.body;

    // Delete from junction table food_to_inventory
    const resultJunction = await pool.query('DELETE FROM food_to_inventory WHERE inventoryid=$1', [obj.id]);

    const result = await pool.query('DELETE FROM inventory WHERE id=$1', [obj.id]);

    res.json({message: `${result.rowCount} inventory item deleted from inventory board`});
  } catch (err) {
    console.error('Failed to delete inventory item from inventory board:', err);
    res.status(500).json({ error: 'Failed to delete inventory item from inventory board' });
  }
});



export default router;