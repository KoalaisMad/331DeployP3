import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./db.js";
import dotenv from "dotenv";
dotenv.config();

// routers
import employeesRouter from "./routes/employees.js";

import inventoryRouter from "./routes/inventory.js";
import ordersRouter from "./routes/orders.js";
import reportsRouter from "./routes/reports.js";
import kitchenRouter from "./routes/kitchen.js";
import imagesRouter from "./routes/images.js";
import linksRouter from "./routes/links.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

// mount routers
app.use("/api/employees", employeesRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/kitchen", kitchenRouter);
app.use("/api/images", imagesRouter);
app.use("/api/link", linksRouter);

// Compatibility: mount inventory routes at top-level /api so older frontend
// requests like `/api/sizes` or `/api/sides` continue to work without
// rebuilding the frontend bundle.
app.use("/api", inventoryRouter);
// Compatibility for legacy image endpoints such as `/api/food-image/:id`
// Mount the images router at top-level `/api` as well so existing
// frontend code that references `/api/food-image/:id` continues to work.
app.use("/api", imagesRouter);

// quick DB check
pool.query("SELECT NOW()", (err, result) => {
  if (err) console.error("DB connection failed:", err);
  else console.log("Connected to database at:", result.rows[0].now);
});

// single app.listen (remove duplicates in original)
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});























































// import express from "express";
// import cors from "cors";
// import pool from "./db.js";
// import multer from "multer";
// import path from "path";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();
// const PORT = process.env.PORT || 5000;

// app.use(cors());
// app.use(express.json());

// // Serve static files from the React frontend app
// app.use(express.static(path.join(__dirname, '../frontend/build')));

// // Example route that queries data
// app.get("/api/employees", async (req, res) => {
//   try {
//     const result = await pool.query("SELECT * FROM employees ORDER by id");
//     res.json(result.rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Database query failed" });
//   }
// });

// // Update an employee's name or role
// app.put("/api/employees", async (req, res) => {
//   try {
//     const { employee, property, newValue } = req.body;

//     // Basic validation
//     if (!employee || typeof employee.id !== 'number') {
//       return res.status(400).json({ error: 'Missing or invalid employee.id' });
//     }

//     // Check if property falls within allowed columns
//     const allowed = { name: 'name', role: 'role' };
//     if (!allowed[property]) {
//       return res.status(400).json({ error: 'Invalid property' });
//     }

//     const column = allowed[property];

//     // Execute query that updates employees
//     const result = await pool.query(
//       `UPDATE employees SET ${column} = $1 WHERE id = $2 RETURNING id, name, role`,
//       [newValue, employee.id]
//     );

//     // Check if it does not return a row
//     if (result.rowCount === 0) {
//       return res.status(404).json({ error: 'Employee not found' });
//     }
//     // Only return one row: First row
//     res.json(result.rows[0]);
//   } catch (err) {
//     console.error('PUT /api/employees failed:', err);
//     res.status(500).json({ error: 'Failed to update employee' });
//   }
//   });

//   // Delete employee
//   app.delete("/api/employees", async(req, res) => {
//     try {
//       // Information that is needed: employee id
//       const employee = req.body; 
//       const result = await pool.query("DELETE FROM employees WHERE id=$1 RETURNING *", [employee.id]);
      
//       // Check if it does not return a row
//       if (result.rowCount === 0) {
//         return res.status(404).json({ error: 'Employee not found'});
//       }

//       // Return only one row
//       res.json(result.rows[0]);
//     } catch(err) {
//       console.error(err);
//       res.status(500).json({ error: 'Failed to delete employee'});
//     }
//   });

//   // Adding employee
//   app.post("/api/employees", async(req, res) => {
//     try {
//       // Information needed: employee
//       const employee = req.body;
//       const result = await pool.query("INSERT INTO employees (name, role) VALUES ($1, $2) RETURNING *", [employee.name, employee.role]);

//       // Check if result of query results in 0 row
//       if(result.rowCount === 0) {
//         return res.status(404).json({ error: 'Employee not found'});
//       }
//       res.json(result.rows[0]);
//     } catch(err) {
//       console.error(err);
//       res.status(500).json({ error: 'Failed to add employee'});
//     }
//   });

// app.get("/api/sides", async (req, res) => {
//   try {
//     const result = await pool.query("SELECT name FROM food WHERE is_side = TRUE and enabled = TRUE");
//     res.json(result.rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Database query failed" });
//   }
// });

// app.get("/api/entrees", async (req, res) => {
//   try {
//     const result = await pool.query("SELECT DISTINCT f.name FROM food f JOIN sizes_to_food stf ON f.id = stf.foodid JOIN food_to_inventory fti ON f.id = fti.foodid WHERE f.is_side = FALSE AND f.enabled = TRUE");
//     res.json(result.rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Database query failed" });
//   }
// });

// // Add size item
// app.post("/api/inventory/price-adjustment/sizes", async (req, res) => {
//   try {
//     const item = req.body;
//     const result = await pool.query("INSERT INTO sizes (name, price, numberofentrees, numberofsides) VALUES ($1, $2, $3, $4) RETURNING *", [item.name, item.price, item.numEntrees, item.numSides]);
//     if(result.rowCount == 0) {
//       return res.status(404).json({ error: 'Size could not be added'});
//     }

//     res.json(result.rows[0]);

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Database query failed' });
//   }
// });

// // Add appetizer/drink
// app.post("/api/inventory/price-adjustment/appetizers-drinks", async (req, res) => {
//   try {
//     const item = req.body;
//     const result = await pool.query("INSERT INTO appetizers_and_drinks (name, price, enabled) VALUES ($1, $2, $3) RETURNING *", [item.name, item.price, item.isEnabled]);
//     if(result.rowCount == 0) {
//       return res.status(404).json({ error: 'Appetizer/drink could not be added'});
//     }

//     res.json(result.rows[0]);

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Database query failed' });
//   }
// });

// // Add main item
// app.post("/api/inventory/price-adjustment/main-items", async (req, res) => {
//   try {
//     const item = req.body;
//     const result = await pool.query("INSERT INTO food (name, premium, enabled, is_side) VALUES ($1, $2, $3, $4) RETURNING *", [item.name, item.isPremium, item.isEnabled, item.isSide]);
//     if(result.rowCount == 0) {
//       return res.status(404).json({ error: 'Main item could not be added' });
//     }

//     res.json(result.rows[0]);

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Database query failed' });
//   }
// });

// // Update sizes table
// app.put("/api/inventory/price-adjustment/sizes", async (req, res) => {
//   try {
//     // Information needed: employee, property, newValue
//     const item = req.body;
//     // console.log(req.body)
//     // Basic validation
//     if(!item || typeof item.id !== 'number') {
//       // console.log('!item: ', !item);
//       // console.log('item.id !== number', item.id !== 'number');
//       return res.status(400).json({ error: 'Missing or invalid size.id' });
//       // return res.json({message: `UPDATE sizes SET ${property} = ${newValue} WHERE id = ${item.id}`});
//     }

//     const result = await pool.query(`UPDATE sizes SET numberofentrees = $1, numberofsides = $2, name = $3, price = $4 WHERE id = $5 RETURNING *`, [item.numEntrees, item.numSides, item.name, item.price, item.id]);

//     // Check if it does not return a row
//     if (result.rowCount === 0) {
//       return res.status(404).json({ error: 'Size not found'});
//     }

//     res.json(result.rows[0]);

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Database query failed' });
//   }
// });

// // Update appetizers-drinks table
// app.put("/api/inventory/price-adjustment/appetizers-drinks", async (req, res) => {
//   try {
//     // Information needed: employee, property, newValue
//     const item = req.body;
    
//     // Basic validation
//     if(!item || typeof item.id !== 'number') {
//       return res.status(400).json({ error: 'Missing or invalid item.id' });
//     }

//     const result = await pool.query(`UPDATE appetizers_and_drinks SET name = $1, price = $2, enabled = $3 WHERE id = $4 RETURNING *`, [item.name, item.price, item.isEnabled, item.id]);

//     // Check if it does not return a row
//     if (result.rowCount === 0) {
//       return res.status(404).json({ error: 'Appetizer/Drink not found'});
//     }

//     res.json(result.rows[0]);

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Database query failed' });
//   }
// });

// // Update main-items table
// app.put("/api/inventory/price-adjustment/main-items", async (req, res) => {
//   try {
//     // Information needed: employee, property, newValue
//     const item = req.body;
    
//     // Basic validation
//     if(!item || typeof item.id !== 'number') {
//       return res.status(400).json({ error: 'Missing or invalid item.id' });
//     }

//     const result = await pool.query(`UPDATE food SET name = $1, premium = $2, enabled = $3, is_side = $4 WHERE id = $5 RETURNING *`, [item.name, item.isPremium, item.isEnabled, item.isSide, item.id]);

//     // Check if it does not return a row
//     if (result.rowCount === 0) {
//       return res.status(404).json({ error: 'Main item not found'});
//     }

//     res.json(result.rows[0]);

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Database query failed' });
//   }
// });

// // Delete size
//   app.delete("/api/inventory/price-adjustment/sizes", async(req, res) => {
//     try {
//       // Information that is needed: employee id
//       const item = req.body; 
//       const result = await pool.query("DELETE FROM sizes WHERE id=$1 RETURNING *", [item.id]);
      
//       // Check if it does not return a row
//       if (result.rowCount === 0) {
//         return res.status(404).json({ error: 'Size not found'});
//       }

//       // Return only one row
//       res.json(result.rows[0]);
//     } catch(err) {
//       console.error(err);
//       res.status(500).json({ error: 'Failed to delete size'});
//     }
//   });

//   // Delete appetizer/drink
//   app.delete("/api/inventory/price-adjustment/appetizers-drinks", async(req, res) => {
//     try {
//       // Information that is needed: employee id
//       const item = req.body; 
//       const result = await pool.query("DELETE FROM appetizers_and_drinks WHERE id=$1 RETURNING *", [item.id]);
      
//       // Check if it does not return a row
//       if (result.rowCount === 0) {
//         return res.status(404).json({ error: 'Appetizer/drink not found'});
//       }

//       // Return only one row
//       res.json(result.rows[0]);
//     } catch(err) {
//       console.error(err);
//       res.status(500).json({ error: 'Failed to delete appetizer/drink'});
//     }
//   });

//   // Delete main item
//   app.delete("/api/inventory/price-adjustment/main-items", async(req, res) => {
//     try {
//       // Information that is needed: employee id
//       const item = req.body; 
//       const result = await pool.query("DELETE FROM food WHERE id=$1 RETURNING *", [item.id]);
      
//       // Check if it does not return a row
//       if (result.rowCount === 0) {
//         return res.status(404).json({ error: 'Main item not found'});
//       }

//       // Return only one row
//       res.json(result.rows[0]);
//     } catch(err) {
//       console.error(err);
//       res.status(500).json({ error: 'Failed to delete main item'});
//     }
//   });

// // Get data from sizes table
// app.get("/api/inventory/price-adjustment/sizes", async (req, res) => {
//   try {
//     const result = await pool.query("SELECT id, numberofentrees, numberofsides, name, price FROM sizes");
//     res.json(result.rows);
//   }
//   catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Database query failed" });
//   }

// });

// // Get data from appetizers-drinks
// app.get("/api/inventory/price-adjustment/appetizers-drinks", async (req, res) => {
//   try {
//     // Return only enabled appetizers/drinks for consumer-facing requests
//     const result = await pool.query("SELECT id, name, price, enabled FROM appetizers_and_drinks");
//     res.json(result.rows);
//   }
//   catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Database query failed" });
//   }
// });

// // Get data from appetizers-drinks
// app.get("/api/inventory/price-adjustment/appetizers-drinks-enabled", async (req, res) => {
//   try {
//     // Return only enabled appetizers/drinks for consumer-facing requests
//     const result = await pool.query("SELECT id, name, price, enabled FROM appetizers_and_drinks WHERE enabled = TRUE");
//     res.json(result.rows);
//   }
//   catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Database query failed" });
//   }
// });


// // Get data from main items table
// app.get("/api/inventory/price-adjustment/main-items", async (req, res) => {
//   try {
//     const result = await pool.query("SELECT id, name, premium, enabled, is_side FROM food");
//     res.json(result.rows);
//   }
//   catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Database query failed" });
//   }

// });

// app.get("/api/appetizers", async (req, res) => {
//   try {
//     const result = await pool.query("SELECT name FROM appetizers_and_drinks WHERE enabled = TRUE");
//     res.json(result.rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Database query failed" });
//   } 
// });



// app.get("/api/sizes", async (req, res) => {
//   try {
//     const result = await pool.query(
//       "SELECT id, name, price, numberofentrees, numberofsides FROM sizes"
//     );
//     res.json(result.rows);
//   } catch (err) {
//     res.status(500).json({ error: "Database query failed" });
//   }
// });

// app.get("/api/entrees", async (req, res) => {
//   try {
//     const result = await pool.query(`
//       SELECT f.id, f.name, f.premium 
//       FROM food f 
//       WHERE f.is_side = FALSE AND f.enabled = TRUE
//     `);
//     res.json(result.rows);
//   } catch (err) {
//     res.status(500).json({ error: "Database query failed" });
//   }
// });

// app.get("/api/appetizers", async (req, res) => {
//   try {
//     const result = await pool.query(`
//       SELECT id, name, price 
//       FROM appetizers_and_drinks 
//       WHERE enabled = TRUE
//     `);
//     res.json(result.rows);
//   } catch (err) {
//     res.status(500).json({ error: "Database query failed" });
//   }
// });

// // 1. Get all premium entree names
// app.get("/api/premium-entrees", async (req, res) => {
//   try {
//     const result = await pool.query(
//       "SELECT name FROM food WHERE premium = TRUE AND enabled = TRUE"
//     );
//     res.json(result.rows.map(r => r.name));
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to fetch premium entrees" });
//   }
// });

// // 2. Get all side names
// app.get("/api/sides/names", async (req, res) => {
//   try {
//     const result = await pool.query(
//       "SELECT name FROM food WHERE is_side = TRUE AND enabled = TRUE"
//     );
//     res.json(result.rows.map(r => r.name));
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to fetch side names" });
//   }
// });

// // 3. Get all size names + prices (Large, Medium, Bowl, etc.)
// app.get("/api/sizes/prices", async (req, res) => {
//   try {
//     const result = await pool.query(
//       "SELECT name, price FROM sizes"
//     );
//     res.json(result.rows); // [{name:"Bowl", price:8.05}, ...]
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to fetch sizes/prices" });
//   }
// });

// // 4. Get a single size price by name
// app.get("/api/sizes/price/:name", async (req, res) => {
//   try {
//     const result = await pool.query(
//       "SELECT price FROM sizes WHERE name = $1",
//       [req.params.name]
//     );

//     if (result.rowCount === 0) {
//       return res.status(404).json({ error: "Size not found" });
//     }

//     res.json({ price: result.rows[0].price });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to fetch size price" });
//   }
// });

// // 5. Get prices for appetizers & drinks
// app.get("/api/appetizers-drinks/prices", async (req, res) => {
//   try {
//     const result = await pool.query(
//       "SELECT name, price FROM appetizers_and_drinks WHERE enabled = TRUE"
//     );
//     res.json(result.rows); // [{name:"Spring Roll", price:1.95}, ...]
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to fetch appetizer/drink prices" });
//   }
// });

// // 6. Get price for a single appetizer/drink by name
// app.get("/api/appetizers-drinks/price/:name", async (req, res) => {
//   try {
//     const result = await pool.query(
//       "SELECT price FROM appetizers_and_drinks WHERE name = $1 AND enabled = TRUE",
//       [req.params.name]
//     );

//     if (result.rowCount === 0) {
//       return res.status(404).json({ error: "Item not found" });
//     }

//     res.json({ price: result.rows[0].price });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to fetch appetizer/drink price" });
//   }
// });

// app.post("/api/orders", async (req, res) => {
//   const { combos, appetizers, drinks, totalPrice } = req.body;

//   try {
//     // Insert order
//     const orderResult = await pool.query(
//       "INSERT INTO orders (timestamp, cost) VALUES (NOW(), $1) RETURNING id",
//       [totalPrice]
//     );
//     const orderId = orderResult.rows[0].id;

//     // Combos
//     for (const combo of combos) {
//       // Get size ID from name
//       const sizeRes = await pool.query(
//         "SELECT id FROM sizes WHERE name = $1",
//         [combo.size]
//       );
//       if (sizeRes.rowCount === 0) continue;
//       const sizeId = sizeRes.rows[0].id;

//       try {
//         await pool.query(
//           "INSERT INTO orders_to_food_sizes (id, orderid, foodsizeid) VALUES (DEFAULT, $1, $2)",
//           [orderId, sizeId]
//         );
//       } catch (insErr) {
//         await pool.query(
//           "INSERT INTO orders_to_food_sizes (id, orderid, foodsizeid) VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM orders_to_food_sizes), $1, $2)",
//           [orderId, sizeId]
//         );
//       }

//       // Insert entrees
//       for (const itemName of combo.items) {
//         const foodRes = await pool.query(
//           "SELECT id FROM food WHERE name = $1",
//           [itemName]
//         );
//         if (foodRes.rowCount === 0) continue;
//         const foodId = foodRes.rows[0].id;

//         try {
//           await pool.query(
//             "INSERT INTO orders_to_food_sizes (id, orderid, foodsizeid) VALUES (DEFAULT, $1, $2)",
//             [orderId, foodId]
//           );
//         } catch (insErr) {
//           await pool.query(
//             "INSERT INTO orders_to_food_sizes (id, orderid, foodsizeid) VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM orders_to_food_sizes), $1, $2)",
//             [orderId, foodId]
//           );
//         }
//       }

//       // Insert sides
//       if (combo.sides && combo.sides.length > 0) {
//         for (const sideName of combo.sides) {
//           const sideRes = await pool.query(
//             "SELECT id FROM food WHERE name = $1 AND is_side = true",
//             [sideName]
//           );
//           if (sideRes.rowCount === 0) continue;
//           const sideId = sideRes.rows[0].id;

//           try {
//             await pool.query(
//               "INSERT INTO orders_to_food_sizes (id, orderid, foodsizeid) VALUES (DEFAULT, $1, $2)",
//               [orderId, sideId]
//             );
//           } catch (insErr) {
//             await pool.query(
//               "INSERT INTO orders_to_food_sizes (id, orderid, foodsizeid) VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM orders_to_food_sizes), $1, $2)",
//               [orderId, sideId]
//             );
//           }
//         }
//       }
//     }

//     // Appetizers & drinks
//     for (const itemName of [...appetizers, ...drinks]) {
//       const itemRes = await pool.query(
//         "SELECT id FROM appetizers_and_drinks WHERE name = $1",
//         [itemName]
//       );
//       if (itemRes.rowCount === 0) continue;
//       const itemId = itemRes.rows[0].id;

//       try {
//         await pool.query(
//           "INSERT INTO orders_to_appetizers_and_drinks (id, orderid, appetizeranddrinkid) VALUES (DEFAULT, $1, $2)",
//           [orderId, itemId]
//         );
//       } catch (insErr) {
//         await pool.query(
//           "INSERT INTO orders_to_appetizers_and_drinks (id, orderid, appetizeranddrinkid) VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM orders_to_appetizers_and_drinks), $1, $2)",
//           [orderId, itemId]
//         );
//       }
//     }

//     res.json({ orderId });
//   } catch (err) {
//     console.error("Failed to insert order:", err);
//     res.status(500).json({ error: "Failed to submit order" });
//   }
// });

// // X-REPORT & Z-REPORT ROUTES

// // Check if Z-Report has been run today
// // Check if Z-Report has been run today
// app.get("/api/reports/z-report-status", async (req, res) => {
//   try {
//     const result = await pool.query(`
//       SELECT z_report_run, total_sales, total_orders 
//       FROM daily_reports 
//       WHERE report_date = CURRENT_DATE AT TIME ZONE 'America/Chicago'
//     `);
    
//     const runToday = result.rows.length > 0 && result.rows[0].z_report_run === true;
    
//     let hourlyData = null;
    
//     // If Z-Report was run, also fetch the hourly breakdown
//     if (runToday) {
//       hourlyData = [];
//       for (let hour = 0; hour <= 23; hour++) {
//         const hourResult = await pool.query(`
//           SELECT COALESCE(SUM(cost), 0) AS total 
//           FROM orders 
//           WHERE DATE(timestamp AT TIME ZONE 'America/Chicago') = CURRENT_DATE AT TIME ZONE 'America/Chicago'
//           AND EXTRACT(HOUR FROM (timestamp AT TIME ZONE 'America/Chicago')) = $1
//         `, [hour]);
        
//         hourlyData.push({
//           hour: `${hour.toString().padStart(2, '0')}:00`,
//           sales: parseFloat(hourResult.rows[0].total)
//         });
//       }
//     }
    
//     res.json({ 
//       success: true, 
//       hasRun: runToday,
//       totalSales: runToday ? parseFloat(result.rows[0].total_sales) : 0,
//       totalOrders: runToday ? parseInt(result.rows[0].total_orders) : 0,
//       hourlyData: hourlyData
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to check Z-Report status" });
//   }
// });

// // Generate X-Report (hourly sales for today)
// app.get("/api/reports/x-report", async (req, res) => {
//   try {
//     // 1. Check if Z-Report has been run today
//     const zCheckResult = await pool.query(`
//       SELECT z_report_run FROM daily_reports 
//       WHERE report_date = CURRENT_DATE AND z_report_run = TRUE
//     `);
    
//     const zReportRun = zCheckResult.rows.length > 0;
    
//     if (zReportRun) {
//       // Return all zeros for each hour (8:00 to 17:00)
//       const hourlyData = [];
//       for (let hour = 0; hour <= 23; hour++) {
//         hourlyData.push({
//           hour: `${hour.toString().padStart(2, '0')}:00`,
//           sales: 0
//         });
//       }
      
//       return res.json({
//         success: true,
//         closed: true,
//         message: "X Report Closed for the Day (Z Report already run)",
//         hourlyData: hourlyData
//       });
//     }
    
//     // 2. Get hourly sales for today (8:00 to 17:00)
//     const hourlyData = [];
//     for (let hour = 0; hour <= 23; hour++) {
//       const result = await pool.query(`
//         SELECT COALESCE(SUM(cost), 0) AS total 
//         FROM orders 
//         WHERE DATE(timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = CURRENT_DATE 
//         AND EXTRACT(HOUR FROM (timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago')) = $1
//       `, [hour]);
      
//       hourlyData.push({
//         hour: `${hour.toString().padStart(2, '0')}:00`,
//         sales: parseFloat(result.rows[0].total)
//       });
//     }
    
//     res.json({
//       success: true,
//       closed: false,
//       message: "X Report - Today's Hourly Sales",
//       hourlyData: hourlyData
//     });
    
//   } catch (err) {
//     console.error("Error generating X-Report:", err);
//     res.status(500).json({ 
//       success: false, 
//       error: "Failed to generate X-Report" 
//     });
//   }
// });

// // Run Z-Report (end of day)
// // Run Z-Report (end of day)
// app.post("/api/reports/z-report", async (req, res) => {
//   const client = await pool.connect();
//   try {
//     await client.query('BEGIN');

//     const checkResult = await client.query(`
//       SELECT z_report_run, total_sales FROM daily_reports WHERE report_date = CURRENT_DATE AT TIME ZONE 'America/Chicago'
//     `);

//     if (checkResult.rows.length > 0 && checkResult.rows[0].z_report_run) {
//       await client.query('COMMIT');
//       return res.status(409).json({ success: false, error: "Z-Report already run today. Sales finalized." });
//     }

//     const summaryResult = await client.query(`
//         SELECT 
//             COUNT(o.id) AS total_orders,
//             COALESCE(SUM(o.cost), 0) AS total_sales
//         FROM orders o
//         WHERE DATE(o.timestamp AT TIME ZONE 'America/Chicago') = CURRENT_DATE AT TIME ZONE 'America/Chicago'
//     `);

//     const { total_orders, total_sales } = summaryResult.rows[0];
//     const totalSalesFloat = parseFloat(total_sales);
//     const totalOrdersInt = parseInt(total_orders, 10);
    
//     // Get hourly breakdown for the Z-Report
//     const hourlyData = [];
//     for (let hour = 0; hour <= 23; hour++) {
//       const result = await client.query(`
//         SELECT COALESCE(SUM(cost), 0) AS total 
//         FROM orders 
//         WHERE DATE(timestamp AT TIME ZONE 'America/Chicago') = CURRENT_DATE AT TIME ZONE 'America/Chicago'
//         AND EXTRACT(HOUR FROM (timestamp AT TIME ZONE 'America/Chicago')) = $1
//       `, [hour]);
      
//       hourlyData.push({
//         hour: `${hour.toString().padStart(2, '0')}:00`,
//         sales: parseFloat(result.rows[0].total)
//       });
//     }
    
//     await client.query(`
//         INSERT INTO daily_reports (report_date, z_report_run, z_report_timestamp, total_orders, total_sales) 
//         VALUES (
//             CURRENT_DATE AT TIME ZONE 'America/Chicago', 
//             TRUE, 
//             NOW(), 
//             $1, 
//             $2
//         )
//         ON CONFLICT (report_date) DO UPDATE SET
//             z_report_run = TRUE,
//             z_report_timestamp = NOW(),
//             total_orders = $1,
//             total_sales = $2
//     `, [totalOrdersInt, totalSalesFloat]);

//     await client.query('COMMIT');

//     res.json({
//       success: true,
//       message: "Z-Report successfully recorded and finalized.",
//       totalSales: totalSalesFloat,
//       totalOrders: totalOrdersInt,
//       hourlyData: hourlyData
//     });
//   } catch (err) {
//     await client.query('ROLLBACK');
//     console.error("Error running Z-Report:", err);
//     res.status(500).json({ success: false, error: "Failed to run Z-Report." });
//   } finally {
//       client.release();
//   }
// });

// // Clear Z-Report (for testing)
// app.delete("/api/reports/z-report", async (req, res) => {
//   try {
//     await pool.query("DELETE FROM daily_reports WHERE report_date = CURRENT_DATE");
//     res.json({ success: true, message: "Z-Report cleared for today" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to clear Z-Report" });
//   }
// });
// /////////////////////////////////////////////////////////////////

// // Link a size with a food item
// app.post('/api/link/size-food', async (req, res) => {
//   const { sizeName, itemName } = req.body || {};
//   if (!sizeName || !itemName) return res.status(400).json({ error: 'sizeName and itemName are required' });

//   try {
//     const sizeRes = await pool.query(
//       'SELECT id FROM sizes WHERE LOWER(name) = LOWER($1) LIMIT 1',
//       [sizeName.trim()]
//     );
//     if (sizeRes.rowCount === 0) return res.status(404).json({ error: `Size not found: '${sizeName}'` });
//     const sizeId = sizeRes.rows[0].id;

//     const foodRes = await pool.query(
//       'SELECT id FROM food WHERE LOWER(name) = LOWER($1) LIMIT 1',
//       [itemName.trim()]
//     );
//     if (foodRes.rowCount === 0) return res.status(404).json({ error: `Food item not found: '${itemName}'` });
//     const foodId = foodRes.rows[0].id;

//     // avoid duplicate links
//     const exists = await pool.query('SELECT COUNT(*) AS count FROM sizes_to_food WHERE sizeid = $1 AND foodid = $2', [sizeId, foodId]);
//     if (parseInt(exists.rows[0].count, 10) > 0) {
//       return res.json({ success: true, message: 'Size already linked to food item' });
//     }

//     let insert;
//     try {
//       insert = await pool.query(
//         'INSERT INTO sizes_to_food (id, sizeid, foodid) VALUES (DEFAULT, $1, $2)',
//         [sizeId, foodId]
//       );
//     } catch (insErr) {
//       console.warn('Default insert into sizes_to_food failed, attempting computed id insert:', insErr && insErr.message);
//       // Fallback: compute an id if the id column has no default
//       insert = await pool.query(
//         'INSERT INTO sizes_to_food (id, sizeid, foodid) VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM sizes_to_food), $1, $2)',
//         [sizeId, foodId]
//       );
//     }

//     res.json({ success: insert.rowCount > 0, rowsInserted: insert.rowCount });
//   } catch (err) {
//     console.error('Error linking size and food:', err);
//     res.status(500).json({ error: 'Failed to link size and food' });
//   }
// });

// // Link an inventory item with a food item
// app.post('/api/link/inventory-food', async (req, res) => {
//   const { itemName, inventoryName, servingSize } = req.body || {};
//   if (!itemName || !inventoryName) return res.status(400).json({ error: 'itemName and inventoryName are required' });

//   const serving = Number.isInteger(servingSize) ? servingSize : (servingSize ? parseInt(servingSize, 10) : 1);

//   try {
//     const foodRes = await pool.query('SELECT id FROM food WHERE LOWER(name) = LOWER($1) LIMIT 1', [itemName.trim()]);
//     if (foodRes.rowCount === 0) return res.status(404).json({ error: `Food item not found: '${itemName}'` });
//     const foodId = foodRes.rows[0].id;

//     const invRes = await pool.query('SELECT id FROM inventory WHERE LOWER(name) = LOWER($1) LIMIT 1', [inventoryName.trim()]);
//     if (invRes.rowCount === 0) return res.status(404).json({ error: `Inventory item not found: '${inventoryName}'` });
//     const invId = invRes.rows[0].id;

//     // avoid duplicate links
//     const exists = await pool.query('SELECT COUNT(*) AS count FROM food_to_inventory WHERE foodid = $1 AND inventoryid = $2', [foodId, invId]);
//     if (parseInt(exists.rows[0].count, 10) > 0) {
//       return res.json({ success: true, message: 'Inventory already linked to food item' });
//     }

//     let insert;
//     try {
//       insert = await pool.query(
//         'INSERT INTO food_to_inventory (id, foodid, inventoryid, servingsize) VALUES (DEFAULT, $1, $2, $3)',
//         [foodId, invId, serving]
//       );
//     } catch (insErr) {
//       console.warn('Default insert into food_to_inventory failed, attempting computed id insert:', insErr && insErr.message);
//       insert = await pool.query(
//         'INSERT INTO food_to_inventory (id, foodid, inventoryid, servingsize) VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM food_to_inventory), $1, $2, $3)',
//         [foodId, invId, serving]
//       );
//     }

//     res.json({ success: insert.rowCount > 0, rowsInserted: insert.rowCount });
//   } catch (err) {
//     console.error('Error linking inventory and food:', err);
//     res.status(500).json({ error: 'Failed to link inventory and food' });
//   }
// });

// // CALL IT AFTER THE SERVER STARTS
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
  
//   // Run diagnostics after a short delay to let DB connection establish
// });

// pool.query("SELECT NOW()", (err, result) => {
//   if (err) {
//     console.error("Connection failed:", err);
//   } else {
//     console.log("Connected to database at:", result.rows[0].now);
//   }
// });

// // Create or return existing food (main item)
// app.post('/api/food', async (req, res) => {
//   const { name, isPremium = false } = req.body || {};
//   if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });

//   try {
//     // food table does not include a price column; only look up id/name/premium
//     const existing = await pool.query('SELECT id, name, premium FROM food WHERE LOWER(name) = LOWER($1) LIMIT 1', [name.trim()]);
//     if (existing.rowCount > 0) {
//       const row = existing.rows[0];
//       return res.json({ success: true, existed: true, item: { id: row.id, name: row.name, premium: !!row.premium } });
//     }

//     const insert = await pool.query(
//       'INSERT INTO food (name, premium, is_side, enabled) VALUES ($1, $2, FALSE, TRUE) RETURNING id, name, premium',
//       [name.trim(), isPremium]
//     );

//     const item = insert.rows[0];
//     res.json({ success: true, existed: false, item: { id: item.id, name: item.name, premium: !!item.premium } });
//   } catch (err) {
//     console.error('Error creating food item:', err);
//     res.status(500).json({ error: 'Failed to create food item' });
//   }
// });

// // Create or return existing inventory item
// app.post('/api/inventory', async (req, res) => {
//   const { name, quantity = 100 } = req.body || {};
//   if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });

//   try {
//     const existing = await pool.query('SELECT id, name, quantity FROM inventory WHERE LOWER(name) = LOWER($1) LIMIT 1', [name.trim()]);
//     if (existing.rowCount > 0) {
//       const row = existing.rows[0];
//       return res.json({ success: true, existed: true, item: { id: row.id, name: row.name, quantity: parseInt(row.quantity, 10) } });
//     }

//     const insert = await pool.query(
//       'INSERT INTO inventory (name, quantity) VALUES ($1, $2) RETURNING id, name, quantity',
//       [name.trim(), quantity]
//     );

//     const item = insert.rows[0];
//     res.json({ success: true, existed: false, item: { id: item.id, name: item.name, quantity: parseInt(item.quantity, 10) } });
//   } catch (err) {
//     console.error('Error creating inventory item:', err);
//     res.status(500).json({ error: 'Failed to create inventory item' });
//   }
// });

// // Get all inventory items and derive a status from quantity
// app.get('/api/inventory', async (req, res) => {
//   try {
//     const result = await pool.query('SELECT id, name, quantity FROM inventory ORDER BY id');

//     const items = result.rows.map((r) => {
//       const quantity = Number.isFinite(Number(r.quantity)) ? parseInt(r.quantity, 10) : 0;
//       let status = 'In Stock';
//       // Derive status based on quantity thresholds. Tuned to match previous mock expectations:
//       // quantity <= 10 -> Running Low, quantity <= 50 -> Low, else In Stock
//       if (quantity <= 10) status = 'Running Low';
//       else if (quantity <= 50) status = 'Low';

//       return {
//         id: r.id,
//         name: r.name,
//         quantity,
//         status,
//       };
//     });

//     res.json(items);
//   } catch (err) {
//     console.error('Failed to fetch inventory items:', err);
//     res.status(500).json({ error: 'Failed to fetch inventory items' });
//   }
// });

// // Add an inventory item to inventory board database and assign a status to item
// app.post('/api/inventory-board', async (req, res) => {
//   try {
//     // Required information: item name, quantity
//     const {name, quantity} = req.body;

//     const result = await pool.query('INSERT INTO inventory (name, quantity) VALUES ($1, $2) RETURNING id, name, quantity', [name, quantity]);

//     const row = result.rows[0];

//     const qty = Number.isFinite(Number(row.quantity)) ? parseInt(row.quantity, 10): 0;

//     let status = 'In Stock';

//     if(quantity <= 10) status = 'Running Low';
//     else if(quantity <= 50) status = 'Low';

//     res.json({id: row.id, name: row.name, quantity: qty, status});

//   } catch (err) {
//     console.error('Failed to add inventory item into inventory board:', err);
//     res.status(500).json({ error: 'Failed to add inventory item into inventory board' });
//   }
// });

// app.put('/api/inventory-board', async (req, res) => {
//   try {
//     // Required information: entire object
//     const obj = req.body;
    
//     const result = await pool.query('UPDATE inventory SET quantity = $1 WHERE id = $2 RETURNING id, name, quantity', [obj.quantity, obj.id]);

//     const row = result.rows[0];

//     const qty = Number.isFinite(Number(row.quantity)) ? parseInt(row.quantity, 10): 0;

//     let status = 'In Stock';

//     if(qty <= 10) status = 'Running Low';
//     else if(qty <= 50) status = 'Low';

//     res.json({id: row.id, name: row.name, quantity: qty, status});
//   }
//   catch (err) {
//     console.error('Failed to update inventory item in inventory board:', err);
//     res.status(500).json({ error: 'Failed to update inventory item in inventory board' });
//   }
// }); 

// app.delete('/api/inventory-board', async (req, res) => {
//   try {
//     const obj = req.body;

//     const result = await pool.query('DELETE FROM inventory WHERE id=$1', [obj.id]);

//     res.json({message: `${result.rowCount} inventory item deleted from inventory board`});
//   } catch (err) {
//     console.error('Failed to delete inventory item from inventory board:', err);
//     res.status(500).json({ error: 'Failed to delete inventory item from inventory board' });
//   }
// });

// // Sales report for an arbitrary date/time range
// app.get('/api/reports/sales', async (req, res) => {
//   try {
//     let { start, end } = req.query;

//     if (!start || !end) {
//       const today = new Date().toISOString().slice(0, 10);
//       start = `${today} 00:00:00`;
//       end = `${today} 23:59:59`;
//     }

//     // Convert input times (assumed to be Central) to UTC for comparison
//     const summaryResult = await pool.query(
//       `SELECT COUNT(*) AS orders, COALESCE(SUM(cost),0) AS total_sales 
//        FROM orders 
//        WHERE timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago' 
//        BETWEEN ($1::timestamp) AND ($2::timestamp)`,
//       [start, end]
//     );

//     const orders = parseInt(summaryResult.rows[0].orders, 10) || 0;
//     const totalSales = parseFloat(summaryResult.rows[0].total_sales) || 0.0;

//     const seriesResult = await pool.query(
//       `SELECT 
//          to_char(date_trunc('hour', timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago'), 'YYYY-MM-DD HH24:MI') AS time, 
//          COALESCE(SUM(cost),0) AS amount
//        FROM orders
//        WHERE timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago' 
//        BETWEEN ($1::timestamp) AND ($2::timestamp)
//        GROUP BY date_trunc('hour', timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago')
//        ORDER BY date_trunc('hour', timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago')`,
//       [start, end]
//     );

//     const series = seriesResult.rows.map(r => ({ time: r.time, amount: parseFloat(r.amount) }));

//     res.json({ orders, total_sales: totalSales, series });
//   } catch (err) {
//     console.error('Failed to fetch sales report:', err);
//     res.status(500).json({ error: 'Failed to fetch sales report' });
//   }
// });


// // image handling
// const storage  = multer.memoryStorage();
// const upload = multer({ storage: storage });

// app.post('/api/upload-image', upload.single('image'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: 'No image file uploaded' });
//     }
//     const {food_id} = req.body;
//     const {buffer, mimetype} = req.file;

//     if(!food_id || !buffer || !mimetype) {
//       return res.status(400).json({ error: 'Missing required fields' });
//     }

//     const query = `
//       INSERT INTO food_images (food_id, image_data, mime_type)
//       VALUES ($1, $2, $3)
//       RETURNING id
//       `;

//     const values = [food_id, buffer, mimetype];

//     await pool.query(query, values);
//     res.status(201).send('Image uploaded successfully');

//   } catch (err) {
//     console.error('Error uploading image:', err);
//     res.status(500).json({ error: 'Failed to upload image' });
//   }
// });

// app.post('/api/upload-appetizer-drink-image', upload.single('image'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: 'No image file uploaded' });
//     }
//     const {appetizer_drink_id} = req.body;
//     const {buffer, mimetype} = req.file;
//     if(!appetizer_drink_id || !buffer || !mimetype) {
//       return res.status(400).json({ error: 'Missing required fields' });
//     }
//     const query = `
//       INSERT INTO appetizer_images (appetizer_drink_id, image_data, mime_type)
//       VALUES ($1, $2, $3)
//       RETURNING id
//       `;
//     const values = [appetizer_drink_id, buffer, mimetype];
//     await pool.query(query, values);
//     res.status(201).send('Image uploaded successfully');
//   } catch (err) { 
//     console.error('Error uploading image:', err);
//     res.status(500).json({ error: 'Failed to upload image' });
//   }
// });

// // Serve a food image by food id or image id
// app.get('/api/food-image/:id', async (req, res) => {
//   try {
//     const id = parseInt(req.params.id, 10);
//     if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

//     // Find the most recent image for this food_id (avoid matching by image id)
//     const result = await pool.query(
//       `SELECT image_data, mime_type FROM food_images WHERE food_id = $1 ORDER BY id DESC LIMIT 1`,
//       [id]
//     );

//     if (result.rowCount === 0) {
//       return res.status(404).json({ error: 'Image not found' });
//     }

//     const row = result.rows[0];
//     const imageBuffer = row.image_data;
//     const mime = row.mime_type || 'application/octet-stream';

//     res.set('Content-Type', mime);
//     // Send raw buffer back to client
//     return res.send(imageBuffer);
//   } catch (err) {
//     console.error('Error fetching image:', err);
//     return res.status(500).json({ error: 'Failed to fetch image' });
//   }
// });


// //Serve an appetizer/drink image by its id
// app.get('/api/appetizer-drink-image/:id', async (req, res) => {
//   try {
//     const id = parseInt(req.params.id, 10);
//     if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
//     const result = await pool.query(
//       `SELECT image_data, mime_type FROM appetizer_images WHERE appetizer_drink_id = $1 ORDER BY id DESC LIMIT 1`,
//       [id]
//     );
//     if (result.rowCount === 0) {
//       return res.status(404).json({ error: 'Image not found' });
//     }
//     const row = result.rows[0];
//     const imageBuffer = row.image_data;
//     const mime = row.mime_type || 'application/octet-stream';
//     res.set('Content-Type', mime);
//     return res.send(imageBuffer);
//   } catch (err) {
//     console.error('Error fetching image:', err);
//     return res.status(500).json({ error: 'Failed to fetch image' });
//   }
// });

// // KITCHEN BOARD ENDPOINTS

// // Initialize database for kitchen board
// app.post('/api/kitchen/init-db', async (req, res) => {
//   try {
//     console.log('Initializing kitchen board database...');
    
//     // Create orders_status table if it doesn't exist
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS orders_status (
//         order_id INTEGER PRIMARY KEY,
//         status VARCHAR(20) DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'completed')),
//         completed_at TIMESTAMP,
//         created_at TIMESTAMP DEFAULT NOW(),
//         updated_at TIMESTAMP DEFAULT NOW()
//       )
//     `);

//     // Create indexes for better performance
//     await pool.query(`
//       CREATE INDEX IF NOT EXISTS idx_orders_status_status ON orders_status(status)
//     `);
    
//     await pool.query(`
//       CREATE INDEX IF NOT EXISTS idx_orders_status_completed_at ON orders_status(completed_at)
//     `);

//     // Initialize status for all orders from today that don't have one
//     const initResult = await pool.query(`
//       INSERT INTO orders_status (order_id, status, completed_at)
//       SELECT o.id, 'in-progress', NULL
//       FROM orders o
//       WHERE DATE(o.timestamp) = CURRENT_DATE
//         AND NOT EXISTS (
//           SELECT 1 FROM orders_status os WHERE os.order_id = o.id
//         )
//       ON CONFLICT (order_id) DO NOTHING
//       RETURNING order_id
//     `);

//     console.log(`Initialized ${initResult.rows.length} orders with 'in-progress' status`);
    
//     res.json({ 
//       success: true, 
//       message: 'Database initialized successfully',
//       ordersInitialized: initResult.rows.length
//     });
//   } catch (err) {
//     console.error('Error initializing database:', err);
//     res.status(500).json({ error: 'Failed to initialize database', details: err.message });
//   }
// });

// // Get kitchen orders (current and past)
// app.get('/api/kitchen/orders', async (req, res) => {
//   try {
//     // Create orders_status table if it doesn't exist
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS orders_status (
//         order_id INTEGER PRIMARY KEY,
//         status VARCHAR(20) DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'completed')),
//         completed_at TIMESTAMP,
//         created_at TIMESTAMP DEFAULT NOW(),
//         updated_at TIMESTAMP DEFAULT NOW()
//       )
//     `);

//     // Create indexes for better performance
//     await pool.query(`
//       CREATE INDEX IF NOT EXISTS idx_orders_status_status ON orders_status(status)
//     `);
    
//     await pool.query(`
//       CREATE INDEX IF NOT EXISTS idx_orders_status_completed_at ON orders_status(completed_at)
//     `);

//     // Initialize status for today's orders that don't have one
//     await pool.query(`
//       INSERT INTO orders_status (order_id, status, completed_at)
//       SELECT o.id, 'in-progress', NULL
//       FROM orders o
//       WHERE DATE(o.timestamp) = CURRENT_DATE
//         AND NOT EXISTS (
//           SELECT 1 FROM orders_status os WHERE os.order_id = o.id
//         )
//       ON CONFLICT (order_id) DO NOTHING
//     `);

//     console.log('Fetching kitchen orders...');

//     // Get current orders (in-progress, from today)
//     const currentOrdersResult = await pool.query(`
//       SELECT DISTINCT o.id, o.timestamp, o.cost
//       FROM orders o
//       LEFT JOIN orders_status os ON o.id = os.order_id
//       WHERE DATE(o.timestamp) = CURRENT_DATE
//         AND (os.status IS NULL OR os.status = 'in-progress')
//       ORDER BY o.timestamp ASC
//       LIMIT 20
//     `);

//     console.log(`Found ${currentOrdersResult.rows.length} current orders`);

//     const currentOrders = await Promise.all(currentOrdersResult.rows.map(async (order) => {
//       try {
//         // Get all entries from orders_to_food_sizes in order
//         const allEntries = await pool.query(`
//           SELECT otfs.id, otfs.foodsizeid
//           FROM orders_to_food_sizes otfs
//           WHERE otfs.orderid = $1
//           ORDER BY otfs.id
//         `, [order.id]);

//         // Identify which entries are sizes and which are food
//         const sizeEntries = [];
//         const foodEntries = [];
//         let lastSizeId = null;

//         for (const entry of allEntries.rows) {
//           // Check both size and food tables
//           const sizeCheck = await pool.query(`
//             SELECT name FROM sizes WHERE id = $1
//           `, [entry.foodsizeid]);
          
//           const foodCheck = await pool.query(`
//             SELECT name, is_side FROM food WHERE id = $1
//           `, [entry.foodsizeid]);

//           // If it matches size table, record it as the current size for subsequent items
//           if (sizeCheck.rows.length > 0) {
//             sizeEntries.push({ id: entry.id, name: sizeCheck.rows[0].name });
//             lastSizeId = entry.id;
//           }
          
//           // If it matches food table, it's a food item associated with the last size we saw
//           if (foodCheck.rows.length > 0) {
//             foodEntries.push({
//               id: entry.id,
//               name: foodCheck.rows[0].name,
//               is_side: foodCheck.rows[0].is_side,
//               sizeId: lastSizeId  // Associate with the most recent size
//             });
//           }
//         }

//         // Map food items to their associated sizes
//         const items = [];
        
//         for (const food of foodEntries) {
//           // Find the size entry that this food belongs to
//           const associatedSize = sizeEntries.find(s => s.id === food.sizeId);
//           const sizeName = associatedSize?.name || 'Custom';
          
//           if (!food.is_side) {
//             items.push({ type: 'entree', name: food.name, size: sizeName });
//           } else {
//             items.push({ type: 'side', name: food.name, size: sizeName });
//           }
//         }

//         // Get appetizers/drinks for this order
//         const appetizersResult = await pool.query(`
//           SELECT DISTINCT ad.name
//           FROM orders_to_appetizers_and_drinks otad
//           JOIN appetizers_and_drinks ad ON otad.appetizeranddrinkid = ad.id
//           WHERE otad.orderid = $1
//         `, [order.id]);

//         // Group by size for display
//         const sizeLabel = sizeEntries.map(s => s.name).join(' + ') || 'Custom Order';
//         const entrees = items.filter(i => i.type === 'entree').map(i => `${i.name} (${i.size})`);
//         const sides = items.filter(i => i.type === 'side').map(i => `${i.name} (${i.size})`);

//         return {
//           id: order.id,
//           timestamp: order.timestamp,
//           cost: parseFloat(order.cost) || 0,
//           size: sizeLabel,
//           entrees: entrees,
//           sides: sides,
//           appetizers: appetizersResult.rows.map(r => r.name)
//         };
//       } catch (err) {
//         console.error(`Error processing order ${order.id}:`, err);
//         return {
//           id: order.id,
//           timestamp: order.timestamp,
//           cost: parseFloat(order.cost) || 0,
//           size: 'Error Loading',
//           entrees: [],
//           sides: [],
//           appetizers: []
//         };
//       }
//     }));

//     // Get past orders (completed today)
//     const pastOrdersResult = await pool.query(`
//       SELECT DISTINCT o.id, o.timestamp, o.cost, os.completed_at
//       FROM orders o
//       JOIN orders_status os ON o.id = os.order_id
//       WHERE DATE(o.timestamp) = CURRENT_DATE
//         AND os.status = 'completed'
//       ORDER BY os.completed_at DESC
//       LIMIT 50
//     `);

//     console.log(`Found ${pastOrdersResult.rows.length} past orders`);

//     const pastOrders = await Promise.all(pastOrdersResult.rows.map(async (order) => {
//       try {
//         // Get all entries from orders_to_food_sizes in order
//         const allEntries = await pool.query(`
//           SELECT otfs.id, otfs.foodsizeid
//           FROM orders_to_food_sizes otfs
//           WHERE otfs.orderid = $1
//           ORDER BY otfs.id
//         `, [order.id]);

//         // Identify which entries are sizes and which are food
//         const sizeEntries = [];
//         const foodEntries = [];
//         let lastSizeId = null;

//         for (const entry of allEntries.rows) {
//           // Check both size and food tables
//           const sizeCheck = await pool.query(`
//             SELECT name FROM sizes WHERE id = $1
//           `, [entry.foodsizeid]);
          
//           const foodCheck = await pool.query(`
//             SELECT name, is_side FROM food WHERE id = $1
//           `, [entry.foodsizeid]);

//           // If it matches size table, record it as the current size for subsequent items
//           if (sizeCheck.rows.length > 0) {
//             sizeEntries.push({ id: entry.id, name: sizeCheck.rows[0].name });
//             lastSizeId = entry.id;
//           }
//           // If it matches food table, it's a food item associated with the last size we saw
//           if (foodCheck.rows.length > 0) {
//             foodEntries.push({
//               id: entry.id,
//               name: foodCheck.rows[0].name,
//               is_side: foodCheck.rows[0].is_side,
//               sizeId: lastSizeId  // Associate with the most recent size
//             });
//           }
//         }
//         // Map food items to their associated sizes
//         const items = [];
        
//         for (const food of foodEntries) {
//           // Find the size entry that this food belongs to
//           const associatedSize = sizeEntries.find(s => s.id === food.sizeId);
//           const sizeName = associatedSize?.name || 'Custom';
          
//           if (!food.is_side) {
//             items.push({ type: 'entree', name: food.name, size: sizeName });
//           } else {
//             items.push({ type: 'side', name: food.name, size: sizeName });
//           }
//         }

//         // Get appetizers/drinks for this order
//         const appetizersResult = await pool.query(`
//           SELECT DISTINCT ad.name
//           FROM orders_to_appetizers_and_drinks otad
//           JOIN appetizers_and_drinks ad ON otad.appetizeranddrinkid = ad.id
//           WHERE otad.orderid = $1
//         `, [order.id]);

//         // Group by size for display
//         const sizeLabel = sizeEntries.map(s => s.name).join(' + ') || 'Custom Order';
//         const entrees = items.filter(i => i.type === 'entree').map(i => `${i.name} (${i.size})`);
//         const sides = items.filter(i => i.type === 'side').map(i => `${i.name} (${i.size})`);

//         return {
//           id: order.id,
//           timestamp: order.timestamp,
//           cost: parseFloat(order.cost) || 0,
//           size: sizeLabel,
//           entrees: entrees,
//           sides: sides,
//           appetizers: appetizersResult.rows.map(r => r.name)
//         };
//       } catch (err) {
//         console.error(`Error processing past order ${order.id}:`, err);
//         return {
//           id: order.id,
//           timestamp: order.timestamp,
//           cost: parseFloat(order.cost) || 0,
//           size: 'Error Loading',
//           entrees: [],
//           sides: [],
//           appetizers: []
//         };
//       }
//     }));

//     // console.log('Successfully fetched all kitchen orders');
//     // console.log(`Sending to frontend: ${currentOrders.length} current, ${pastOrders.length} past`);
    
//     // Log sample data for debugging
//     // if (currentOrders.length > 0) {
//     //   console.log('Sample current order:', JSON.stringify(currentOrders[0], null, 2));
//     // }
//     // if (pastOrders.length > 0) {
//     //   console.log('Sample past order:', JSON.stringify(pastOrders[0], null, 2));
//     // }
    
//     res.json({ currentOrders, pastOrders });
//   } catch (err) {
//     console.error('Error fetching kitchen orders:', err);
//     res.status(500).json({ error: 'Failed to fetch kitchen orders', details: err.message });
//   }
// });

// // Complete an order
// app.post('/api/kitchen/complete-order', async (req, res) => {
//   const { orderId } = req.body;
  
//   if (!orderId) {
//     return res.status(400).json({ error: 'Order ID is required' });
//   }

//   try {
//     console.log(`Completing order ${orderId}`);
    
//     // Insert or update the order status
//     await pool.query(`
//       INSERT INTO orders_status (order_id, status, completed_at)
//       VALUES ($1, 'completed', NOW())
//       ON CONFLICT (order_id) 
//       DO UPDATE SET status = 'completed', completed_at = NOW()
//     `, [orderId]);

//     console.log(`Order ${orderId} marked as completed`);
//     res.json({ success: true, message: 'Order completed' });
//   } catch (err) {
//     console.error('Error completing order:', err);
//     res.status(500).json({ error: 'Failed to complete order', details: err.message });
//   }
// });

// // Mark order as incomplete (move from past to current)
// app.post('/api/kitchen/incomplete-order', async (req, res) => {
//   const { orderId } = req.body;
  
//   if (!orderId) {
//     return res.status(400).json({ error: 'Order ID is required' });
//   }

//   try {
//     console.log(`Marking order ${orderId} as incomplete`);
    
//     await pool.query(`
//       INSERT INTO orders_status (order_id, status, completed_at)
//       VALUES ($1, 'in-progress', NULL)
//       ON CONFLICT (order_id) 
//       DO UPDATE SET status = 'in-progress', completed_at = NULL
//     `, [orderId]);

//     console.log(`Order ${orderId} marked as in-progress`);
//     res.json({ success: true, message: 'Order marked as incomplete' });
//   } catch (err) {
//     console.error('Error marking order as incomplete:', err);
//     res.status(500).json({ error: 'Failed to mark order as incomplete', details: err.message });
//   }
// });

// // Remake an order (duplicate it)
// app.post('/api/kitchen/remake-order', async (req, res) => {
//   const { orderId } = req.body;
  
//   if (!orderId) {
//     return res.status(400).json({ error: 'Order ID is required' });
//   }

//   try {
//     console.log(`Remaking order ${orderId}`);
    
//     // Get the original order details
//     const orderResult = await pool.query('SELECT cost FROM orders WHERE id = $1', [orderId]);
//     if (orderResult.rows.length === 0) {
//       return res.status(404).json({ error: 'Order not found' });
//     }

//     // Create a new order
//     const newOrderResult = await pool.query(
//       'INSERT INTO orders (timestamp, cost) VALUES (NOW(), $1) RETURNING id',
//       [orderResult.rows[0].cost]
//     );
//     const newOrderId = newOrderResult.rows[0].id;
//     console.log(`Created new order ${newOrderId} from original order ${orderId}`);

//     // Copy food items
//     const foodItems = await pool.query(
//       'SELECT foodsizeid FROM orders_to_food_sizes WHERE orderid = $1',
//       [orderId]
//     );

//     for (const item of foodItems.rows) {
//       try {
//         await pool.query(
//           'INSERT INTO orders_to_food_sizes (id, orderid, foodsizeid) VALUES (DEFAULT, $1, $2)',
//           [newOrderId, item.foodsizeid]
//         );
//       } catch (insErr) {
//         await pool.query(
//           'INSERT INTO orders_to_food_sizes (id, orderid, foodsizeid) VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM orders_to_food_sizes), $1, $2)',
//           [newOrderId, item.foodsizeid]
//         );
//       }
//     }

//     // Copy appetizers and drinks
//     const appetizers = await pool.query(
//       'SELECT appetizeranddrinkid FROM orders_to_appetizers_and_drinks WHERE orderid = $1',
//       [orderId]
//     );

//     for (const item of appetizers.rows) {
//       try {
//         await pool.query(
//           'INSERT INTO orders_to_appetizers_and_drinks (id, orderid, appetizeranddrinkid) VALUES (DEFAULT, $1, $2)',
//           [newOrderId, item.appetizeranddrinkid]
//         );
//       } catch (insErr) {
//         await pool.query(
//           'INSERT INTO orders_to_appetizers_and_drinks (id, orderid, appetizeranddrinkid) VALUES ((SELECT COALESCE(MAX(id),0)+1 FROM orders_to_appetizers_and_drinks), $1, $2)',
//           [newOrderId, item.appetizeranddrinkid]
//         );
//       }
//     }

//     console.log(`Successfully remade order ${orderId} as new order ${newOrderId}`);
//     res.json({ success: true, message: 'Order remade', newOrderId });
//   } catch (err) {
//     console.error('Error remaking order:', err);
//     res.status(500).json({ error: 'Failed to remake order', details: err.message });
//   }
// });

// // Catch-all handler to serve React's index.html for any unknown routes
// // This must be AFTER all API routes
// // Commenting out for now to avoid PathError with '*'
// // app.get('*', (req, res) => {
// //   res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
// // });

// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });
