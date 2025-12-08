import express from "express";
import pool from "../db.js";

const router = express.Router();





/**
 * Route to get all employees ordered by ID.
 * @name GET /api/employees
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM employees ORDER by id");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

/**
 * Route to update an employee's name, role, or email.
 * @name PUT /api/employees
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.put("/", async (req, res) => {
  try {
    const { employee, property, newValue } = req.body;

    // Basic validation
    if (!employee || typeof employee.id !== 'number') {
      return res.status(400).json({ error: 'Missing or invalid employee.id' });
    }

    // Check if property falls within allowed columns
    const allowed = { name: 'name', role: 'role', email: 'email' };
    if (!allowed[property]) {
      return res.status(400).json({ error: 'Invalid property' });
    }

    const column = allowed[property];

    const result = await pool.query(
      `UPDATE employees SET ${column} = $1 WHERE id = $2 RETURNING id, name, email, role`,
      [newValue, employee.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /employees failed:', err);
    res.status(500).json({ error: 'Failed to update employee' });
  }
  });

/**
 * Route to delete an employee by ID.
 * @name DELETE /api/employees
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.delete("/", async(req, res) => {
try {
    const employee = req.body; 
    const result = await pool.query("DELETE FROM employees WHERE id=$1 RETURNING *", [employee.id]);
    
    if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Employee not found'});
    }

    res.json(result.rows[0]);
} catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete employee'});
}
});

/**
 * Route to add a new employee.
 * @name POST /api/employees
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.post("/", async(req, res) => {
try {
    const employee = req.body;
    const result = await pool.query("INSERT INTO employees (name, role, email) VALUES ($1, $2, $3) RETURNING *", [employee.name, employee.role, employee.email]);

    if(result.rowCount === 0) {
    return res.status(404).json({ error: 'Employee not found'});
    }
    res.json(result.rows[0]);
} catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add employee'});
}
});

/**
 * Route to update employee details (email, phone, address, age, role).
 * @name PUT /api/employees/details
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.put("/details", async (req, res) => {
  try {
    const { id, email, phone, address, age, role } = req.body;

    if (!id || typeof id !== 'number') {
      return res.status(400).json({ error: 'Missing or invalid employee id' });
    }

    const result = await pool.query(
      `UPDATE employees 
       SET email = $1, phone = $2, address = $3, age = $4, role = $5 
       WHERE id = $6 
       RETURNING *`,
      [email, phone, address, age, role, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /employees/details failed:', err);
    res.status(500).json({ error: 'Failed to update employee details' });
  }
});

export default router;