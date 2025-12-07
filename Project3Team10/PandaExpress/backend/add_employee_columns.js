import dotenv from 'dotenv';
import pool from './db.js';

dotenv.config({ path: '../.env' });

(async () => {
  try {
    await pool.query(`
      ALTER TABLE employees 
      ADD COLUMN IF NOT EXISTS email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS age INTEGER
    `);
    console.log('Successfully added columns to employees table');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
    process.exit(1);
  }
})();
