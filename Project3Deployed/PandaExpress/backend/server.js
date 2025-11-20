import express from "express";
import cors from "cors";
import pool from "./db.js";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Example route that queries data
app.get("/api/employees", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM employees ORDER by id");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

// Update an employee's name or role
app.put("/api/employees", async (req, res) => {
  try {
    const { employee, property, newValue } = req.body;

    // Basic validation
    if (!employee || typeof employee.id !== 'number') {
      return res.status(400).json({ error: 'Missing or invalid employee.id' });
    }

    // Check if property falls within allowed columns
    const allowed = { name: 'name', role: 'role' };
    if (!allowed[property]) {
      return res.status(400).json({ error: 'Invalid property' });
    }

    const column = allowed[property];

    // Execute query that updates employees
    const result = await pool.query(
      `UPDATE employees SET ${column} = $1 WHERE id = $2 RETURNING id, name, role`,
      [newValue, employee.id]
    );

    // Check if it does not return a row
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    // Only return one row: First row
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /api/employees failed:', err);
    res.status(500).json({ error: 'Failed to update employee' });
  }
  });

  // Delete employee
  app.delete("/api/employees", async(req, res) => {
    try {
      // Information that is needed: employee id
      const employee = req.body; 
      const result = await pool.query("DELETE FROM employees WHERE id=$1 RETURNING *", [employee.id]);
      
      // Check if it does not return a row
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Employee not found'});
      }

      // Return only one row
      res.json(result.rows[0]);
    } catch(err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete employee'});
    }
  });

  // Adding employee
  app.post("/api/employees", async(req, res) => {
    try {
      // Information needed: employee
      const employee = req.body;
      const result = await pool.query("INSERT INTO employees (name, role) VALUES ($1, $2) RETURNING *", [employee.name, employee.role]);

      // Check if result of query results in 0 row
      if(result.rowCount === 0) {
        return res.status(404).json({ error: 'Employee not found'});
      }
      res.json(result.rows[0]);
    } catch(err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to add employee'});
    }
  });

app.get("/api/sides", async (req, res) => {
  try {
    const result = await pool.query("SELECT name FROM food WHERE is_side = TRUE and enabled = TRUE");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

app.get("/api/entrees", async (req, res) => {
  try {
    const result = await pool.query("SELECT DISTINCT f.name FROM food f JOIN sizes_to_food stf ON f.id = stf.foodid JOIN food_to_inventory fti ON f.id = fti.foodid WHERE f.is_side = FALSE AND f.enabled = TRUE");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

// Add size item
app.post("/api/inventory/price-adjustment/sizes", async (req, res) => {
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

// Add appetizer/drink
app.post("/api/inventory/price-adjustment/appetizers-drinks", async (req, res) => {
  try {
    const item = req.body;
    const result = await pool.query("INSERT INTO appetizers_and_drinks (name, price, enabled) VALUES ($1, $2, $3) RETURNING *", [item.name, item.price, item.isEnabled]);
    if(result.rowCount == 0) {
      return res.status(404).json({ error: 'Appetizer/drink could not be added'});
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Add main item
app.post("/api/inventory/price-adjustment/main-items", async (req, res) => {
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

// Update sizes table
app.put("/api/inventory/price-adjustment/sizes", async (req, res) => {
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

// Update appetizers-drinks table
app.put("/api/inventory/price-adjustment/appetizers-drinks", async (req, res) => {
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
      return res.status(404).json({ error: 'Appetizer/Drink not found'});
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Update main-items table
app.put("/api/inventory/price-adjustment/main-items", async (req, res) => {
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

// Delete size
  app.delete("/api/inventory/price-adjustment/sizes", async(req, res) => {
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

  // Delete appetizer/drink
  app.delete("/api/inventory/price-adjustment/appetizers-drinks", async(req, res) => {
    try {
      // Information that is needed: employee id
      const item = req.body; 
      const result = await pool.query("DELETE FROM appetizers_and_drinks WHERE id=$1 RETURNING *", [item.id]);
      
      // Check if it does not return a row
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Appetizer/drink not found'});
      }

      // Return only one row
      res.json(result.rows[0]);
    } catch(err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete appetizer/drink'});
    }
  });

  // Delete main item
  app.delete("/api/inventory/price-adjustment/main-items", async(req, res) => {
    try {
      // Information that is needed: employee id
      const item = req.body; 
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

// Get data from sizes table
app.get("/api/inventory/price-adjustment/sizes", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, numberofentrees, numberofsides, name, price FROM sizes");
    res.json(result.rows);
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }

});

// Get data from appetizers-drinks
app.get("/api/inventory/price-adjustment/appetizers-drinks", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, price, enabled FROM appetizers_and_drinks");
    res.json(result.rows);
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

// Get data from main items table
app.get("/api/inventory/price-adjustment/main-items", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, premium, enabled, is_side FROM food");
    res.json(result.rows);
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }

});

app.get("/api/appetizers", async (req, res) => {
  try {
    const result = await pool.query("SELECT name FROM appetizers_and_drinks WHERE enabled = TRUE");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  } 
});



app.get("/api/sizes", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, price, numberofentrees, numberofsides FROM sizes"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Database query failed" });
  }
});

app.get("/api/entrees", async (req, res) => {
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

app.get("/api/appetizers", async (req, res) => {
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

// 1. Get all premium entree names
app.get("/api/premium-entrees", async (req, res) => {
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

// 2. Get all side names
app.get("/api/sides/names", async (req, res) => {
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

// 3. Get all size names + prices (Large, Medium, Bowl, etc.)
app.get("/api/sizes/prices", async (req, res) => {
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

// 4. Get a single size price by name
app.get("/api/sizes/price/:name", async (req, res) => {
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

// 5. Get prices for appetizers & drinks
app.get("/api/appetizers-drinks/prices", async (req, res) => {
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

// 6. Get price for a single appetizer/drink by name
app.get("/api/appetizers-drinks/price/:name", async (req, res) => {
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

app.post("/api/orders", async (req, res) => {
  const { combos, appetizers, drinks, totalPrice } = req.body;

  try {
    // Insert order
    const orderResult = await pool.query(
      "INSERT INTO orders (timestamp, cost) VALUES (NOW(), $1) RETURNING id",
      [totalPrice]
    );
    const orderId = orderResult.rows[0].id;

    // Combos
    for (const combo of combos) {
      // Get size ID from name
      const sizeRes = await pool.query(
        "SELECT id FROM sizes WHERE name = $1",
        [combo.size]
      );
      if (sizeRes.rowCount === 0) continue;
      const sizeId = sizeRes.rows[0].id;

      await pool.query(
        "INSERT INTO orders_to_food_sizes (orderid, foodsizeid) VALUES ($1, $2)",
        [orderId, sizeId]
      );

      // Insert entrees
      for (const itemName of combo.items) {
        const foodRes = await pool.query(
          "SELECT id FROM food WHERE name = $1",
          [itemName]
        );
        if (foodRes.rowCount === 0) continue;
        const foodId = foodRes.rows[0].id;

        await pool.query(
          "INSERT INTO orders_to_food_sizes (orderid, foodsizeid) VALUES ($1, $2)",
          [orderId, foodId]
        );
      }
    }

    // Appetizers & drinks
    for (const itemName of [...appetizers, ...drinks]) {
      const itemRes = await pool.query(
        "SELECT id FROM appetizers_and_drinks WHERE name = $1",
        [itemName]
      );
      if (itemRes.rowCount === 0) continue;
      const itemId = itemRes.rows[0].id;

      await pool.query(
        "INSERT INTO orders_to_appetizers_and_drinks (orderid, appetizer_or_drinkid) VALUES ($1, $2)",
        [orderId, itemId]
      );
    }

    res.json({ orderId });
  } catch (err) {
    console.error("Failed to insert order:", err);
    res.status(500).json({ error: "Failed to submit order" });
  }
});

// X-REPORT & Z-REPORT ROUTES

// Check if Z-Report has been run today
app.get("/api/reports/z-report-status", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT z_report_run, total_sales, total_orders 
      FROM daily_reports 
      WHERE report_date = CURRENT_DATE
    `);
    
    const runToday = result.rows.length > 0 && result.rows[0].z_report_run === true;
    
    res.json({ 
      success: true, 
      hasRun: runToday,
      totalSales: runToday ? parseFloat(result.rows[0].total_sales) : 0,
      totalOrders: runToday ? parseInt(result.rows[0].total_orders) : 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to check Z-Report status" });
  }
});

// Generate X-Report (hourly sales for today)
app.get("/api/reports/x-report", async (req, res) => {
  try {
    // 1. Check if Z-Report has been run today
    const zCheckResult = await pool.query(`
      SELECT z_report_run FROM daily_reports 
      WHERE report_date = CURRENT_DATE AND z_report_run = TRUE
    `);
    
    const zReportRun = zCheckResult.rows.length > 0;
    
    if (zReportRun) {
      // Return all zeros for each hour (8:00 to 17:00)
      const hourlyData = [];
      for (let hour = 0; hour <= 23; hour++) {
        hourlyData.push({
          hour: `${hour.toString().padStart(2, '0')}:00`,
          sales: 0
        });
      }
      
      return res.json({
        success: true,
        closed: true,
        message: "X Report Closed for the Day (Z Report already run)",
        hourlyData: hourlyData
      });
    }
    
    // 2. Get hourly sales for today (8:00 to 17:00)
    const hourlyData = [];
    for (let hour = 0; hour <= 23; hour++) {
      const result = await pool.query(`
        SELECT COALESCE(SUM(cost), 0) AS total 
        FROM orders 
        WHERE DATE(timestamp) = CURRENT_DATE 
        AND EXTRACT(HOUR FROM timestamp) = $1
      `, [hour]);
      
      hourlyData.push({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        sales: parseFloat(result.rows[0].total)
      });
    }
    
    res.json({
      success: true,
      closed: false,
      message: "X Report - Today's Hourly Sales",
      hourlyData: hourlyData
    });
    
  } catch (err) {
    console.error("Error generating X-Report:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to generate X-Report" 
    });
  }
});

// Run Z-Report (end of day)
app.post("/api/reports/z-report", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN'); // Start transaction

    // 1. Check if Z-Report has already been run for the current database date
    const checkResult = await client.query(`
      SELECT z_report_run, total_sales FROM daily_reports WHERE report_date = CURRENT_DATE
    `);

    if (checkResult.rows.length > 0 && checkResult.rows[0].z_report_run) {
      // Report exists and is marked as run
      await client.query('COMMIT');
      return res.status(409).json({ success: false, error: "Z-Report already run today. Sales finalized." });
    }

    // 2. Calculate Total Sales and Orders for the day
    const summaryResult = await client.query(`
        SELECT 
            COUNT(o.id) AS total_orders,
            COALESCE(SUM(o.cost), 0) AS total_sales
        FROM orders o
        WHERE DATE(o.timestamp) = CURRENT_DATE
    `);

    const { total_orders, total_sales } = summaryResult.rows[0];
    const totalSalesFloat = parseFloat(total_sales);
    const totalOrdersInt = parseInt(total_orders, 10);
    
    // 3. Insert or Update the Z-Report record using ON CONFLICT for safety
    await client.query(`
        INSERT INTO daily_reports (report_date, z_report_run, z_report_timestamp, total_orders, total_sales) 
        VALUES (
            CURRENT_DATE, 
            TRUE, 
            NOW(), 
            $1, 
            $2
        )
        ON CONFLICT (report_date) DO UPDATE SET
            z_report_run = TRUE,
            z_report_timestamp = NOW(),
            total_orders = $1,
            total_sales = $2
    `, [totalOrdersInt, totalSalesFloat]);

    await client.query('COMMIT'); // Commit transaction

    res.json({
      success: true,
      message: "Z-Report successfully recorded and finalized.",
      totalSales: totalSalesFloat,
      totalOrders: totalOrdersInt
    });
  } catch (err) {
    await client.query('ROLLBACK'); // Rollback transaction on error
    console.error("Error running Z-Report:", err);
    res.status(500).json({ success: false, error: "Failed to run Z-Report." });
  } finally {
      client.release();
  }
});

// Clear Z-Report (for testing)
app.delete("/api/reports/z-report", async (req, res) => {
  try {
    await pool.query("DELETE FROM daily_reports WHERE report_date = CURRENT_DATE");
    res.json({ success: true, message: "Z-Report cleared for today" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to clear Z-Report" });
  }
});
/////////////////////////////////////////////////////////////////

// Link a size with a food item
app.post('/api/link/size-food', async (req, res) => {
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
app.post('/api/link/inventory-food', async (req, res) => {
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


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

pool.query("SELECT NOW()", (err, result) => {
  if (err) {
    console.error("Connection failed:", err);
  } else {
    console.log("Connected to database at:", result.rows[0].now);
  }
});

// Create or return existing food (main item)
app.post('/api/food', async (req, res) => {
  const { name, isPremium = false } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });

  try {
    // food table does not include a price column; only look up id/name/premium
    const existing = await pool.query('SELECT id, name, premium FROM food WHERE LOWER(name) = LOWER($1) LIMIT 1', [name.trim()]);
    if (existing.rowCount > 0) {
      const row = existing.rows[0];
      return res.json({ success: true, existed: true, item: { id: row.id, name: row.name, premium: !!row.premium } });
    }

    const insert = await pool.query(
      'INSERT INTO food (name, premium, is_side, enabled) VALUES ($1, $2, FALSE, TRUE) RETURNING id, name, premium',
      [name.trim(), isPremium]
    );

    const item = insert.rows[0];
    res.json({ success: true, existed: false, item: { id: item.id, name: item.name, premium: !!item.premium } });
  } catch (err) {
    console.error('Error creating food item:', err);
    res.status(500).json({ error: 'Failed to create food item' });
  }
});

// Create or return existing inventory item
app.post('/api/inventory', async (req, res) => {
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

// Get all inventory items and derive a status from quantity
app.get('/api/inventory', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, quantity FROM inventory ORDER BY id');

    const items = result.rows.map((r) => {
      const quantity = Number.isFinite(Number(r.quantity)) ? parseInt(r.quantity, 10) : 0;
      let status = 'In Stock';
      // Derive status based on quantity thresholds. Tuned to match previous mock expectations:
      // quantity <= 10 -> Running Low, quantity <= 50 -> Low, else In Stock
      if (quantity <= 10) status = 'Running Low';
      else if (quantity <= 50) status = 'Low';

      return {
        id: r.id,
        name: r.name,
        quantity,
        status,
      };
    });

    res.json(items);
  } catch (err) {
    console.error('Failed to fetch inventory items:', err);
    res.status(500).json({ error: 'Failed to fetch inventory items' });
  }
});

// Sales report for an arbitrary date/time range
// Query params: start=YYYY-MM-DD HH:MM:SS, end=YYYY-MM-DD HH:MM:SS
app.get('/api/reports/sales', async (req, res) => {
  try {
    let { start, end } = req.query;

    // If not provided, default to today's full range
    if (!start || !end) {
      const today = new Date().toISOString().slice(0, 10);
      start = `${today} 00:00:00`;
      end = `${today} 23:59:59`;
    }

    // Summary: total orders and total sales
    const summaryResult = await pool.query(
      `SELECT COUNT(*) AS orders, COALESCE(SUM(cost),0) AS total_sales FROM orders WHERE timestamp BETWEEN $1 AND $2`,
      [start, end]
    );

    const orders = parseInt(summaryResult.rows[0].orders, 10) || 0;
    const totalSales = parseFloat(summaryResult.rows[0].total_sales) || 0.0;

    // Hourly series (grouped by hour)
    const seriesResult = await pool.query(
      `SELECT to_char(date_trunc('hour', timestamp), 'YYYY-MM-DD HH24:MI') AS time, COALESCE(SUM(cost),0) AS amount
       FROM orders
       WHERE timestamp BETWEEN $1 AND $2
       GROUP BY date_trunc('hour', timestamp)
       ORDER BY date_trunc('hour', timestamp)`,
      [start, end]
    );

    const series = seriesResult.rows.map(r => ({ time: r.time, amount: parseFloat(r.amount) }));

    res.json({ orders, total_sales: totalSales, series });
  } catch (err) {
    console.error('Failed to fetch sales report:', err);
    res.status(500).json({ error: 'Failed to fetch sales report' });
  }
});