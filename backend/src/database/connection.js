import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Always resolve .env relative to this file so it works from any CWD
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'stokvel_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: true } } : {}),
});

// Test connection on startup and log clear errors
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Database connected successfully');
    conn.release();
  } catch (err) {
    console.error('\n❌ DATABASE CONNECTION FAILED!');
    console.error('──────────────────────────────────────');
    if (err.code === 'ECONNREFUSED') {
      console.error('MySQL is not running. Please start MySQL first.');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Wrong database credentials. Check DB_USER and DB_PASSWORD in backend/.env');
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.error(`Database "${process.env.DB_NAME || 'stokvel_db'}" does not exist.`);
      console.error('Run: cd backend && npm run migrate');
    } else {
      console.error('Error:', err.message);
    }
    console.error('──────────────────────────────────────\n');
  }
})();

export default pool;
