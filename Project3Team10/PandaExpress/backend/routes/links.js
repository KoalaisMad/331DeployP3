import express from "express";
import pool from "../db.js";

const router = express.Router();





// Link a size with a food item
// Mounted at /api/link -> POST /api/link/size-food
router.post('/size-food', async (req, res) => {
  const { sizeName, itemName } = req.body || {};
  if (!sizeName || !itemName) return res.status(400).json({ error: 'sizeName and itemName are required' });

  try {
    const sizeRes = await pool.query(
      'SELECT id FROM sizes WHERE LOWER(name) = LOWER($1) LIMIT 1',
      [sizeName.trim()]
    );
    if (sizeRes.rowCount === 0) return res.status(404).json({ error: `Size not found: '${sizeName}'` });
    const sizeId = sizeRes.rows[0].id;

    const foodRes = await pool.query(
      'SELECT id FROM food WHERE LOWER(name) = LOWER($1) LIMIT 1',
      [itemName.trim()]
    );
    if (foodRes.rowCount === 0) return res.status(404).json({ error: `Food item not found: '${itemName}'` });
    const foodId = foodRes.rows[0].id;

    // avoid duplicate links
    const exists = await pool.query('SELECT COUNT(*) AS count FROM sizes_to_food WHERE sizeid = $1 AND foodid = $2', [sizeId, foodId]);
    if (parseInt(exists.rows[0].count, 10) > 0) {
      return res.json({ success: true, message: 'Size already linked to food item' });
    }

    let insert;
    try {
      insert = await pool.query(
        'INSERT INTO sizes_to_food (id, sizeid, foodid) VALUES (DEFAULT, $1, $2)',
        [sizeId, foodId]
      );
    } catch (insErr) {
      console.warn('Default insert into sizes_to_food failed, attempting computed id insert:', insErr && insErr.message);
      // Fallback: compute an id if the id column has no default
      insert = await pool.query(
        'INSERT INTO sizes_to_food (id, sizeid, foodid) VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM sizes_to_food), $1, $2)',
        [sizeId, foodId]
      );
    }

    res.json({ success: insert.rowCount > 0, rowsInserted: insert.rowCount });
  } catch (err) {
    console.error('Error linking size and food:', err);
    res.status(500).json({ error: 'Failed to link size and food' });
  }
});

// Link an inventory item with a food item
// Mounted at /api/link -> POST /api/link/inventory-food
router.post('/inventory-food', async (req, res) => {
  const { itemName, inventoryName, servingSize } = req.body || {};
  if (!itemName || !inventoryName) return res.status(400).json({ error: 'itemName and inventoryName are required' });

  const serving = Number.isInteger(servingSize) ? servingSize : (servingSize ? parseInt(servingSize, 10) : 1);

  try {
    const foodRes = await pool.query('SELECT id FROM food WHERE LOWER(name) = LOWER($1) LIMIT 1', [itemName.trim()]);
    if (foodRes.rowCount === 0) return res.status(404).json({ error: `Food item not found: '${itemName}'` });
    const foodId = foodRes.rows[0].id;

    const invRes = await pool.query('SELECT id FROM inventory WHERE LOWER(name) = LOWER($1) LIMIT 1', [inventoryName.trim()]);
    if (invRes.rowCount === 0) return res.status(404).json({ error: `Inventory item not found: '${inventoryName}'` });
    const invId = invRes.rows[0].id;

    // avoid duplicate links
    const exists = await pool.query('SELECT COUNT(*) AS count FROM food_to_inventory WHERE foodid = $1 AND inventoryid = $2', [foodId, invId]);
    if (parseInt(exists.rows[0].count, 10) > 0) {
      return res.json({ success: true, message: 'Inventory already linked to food item' });
    }

    let insert;
    try {
      insert = await pool.query(
        'INSERT INTO food_to_inventory (id, foodid, inventoryid, servingsize) VALUES (DEFAULT, $1, $2, $3)',
        [foodId, invId, serving]
      );
    } catch (insErr) {
      console.warn('Default insert into food_to_inventory failed, attempting computed id insert:', insErr && insErr.message);
      insert = await pool.query(
        'INSERT INTO food_to_inventory (id, foodid, inventoryid, servingsize) VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM food_to_inventory), $1, $2, $3)',
        [foodId, invId, serving]
      );
    }

    res.json({ success: insert.rowCount > 0, rowsInserted: insert.rowCount });
  } catch (err) {
    console.error('Error linking inventory and food:', err);
    res.status(500).json({ error: 'Failed to link inventory and food' });
  }
});




export default router;