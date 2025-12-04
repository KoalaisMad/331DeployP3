import express from "express";
import pool from "../db.js";

const router = express.Router();





// Example route that queries data
// Mounted at /api/employees -> GET /api/employees
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM employees ORDER by id");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

// Update an employee's name or role
// Update an employee's name or role -> PUT /api/employees
router.put("/", async (req, res) => {
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
    console.error('PUT /employees failed:', err);
    res.status(500).json({ error: 'Failed to update employee' });
  }
  });

// Delete employee
// DELETE /api/employees
router.delete("/", async(req, res) => {
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
// POST /api/employees
router.post("/", async(req, res) => {
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

export default router;