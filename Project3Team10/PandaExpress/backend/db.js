import pkg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory (PandaExpress/)
dotenv.config({ path: path.resolve(__dirname, "../.env") });
const { Pool } = pkg;

// Configure SSL for production database connections
const sslConfig = process.env.NODE_ENV === 'production' 
  ? { rejectUnauthorized: false }  // For external databases that may not have proper SSL certs
  : false;

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: sslConfig,
  options: '-c timezone=America/Chicago'
});

// Log database connection configuration (without password)
console.log('Database configuration:', {
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  ssl: sslConfig !== false ? 'enabled' : 'disabled'
});

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle database client', err);
});

export default pool;
