import { Pool } from 'pg';
import dotenv from 'dotenv';


dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set in environment variables.');
  process.exit(1);
}

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';


const sslConfig = connectionString.includes('sslmode=require')
  ? { rejectUnauthorized: false }
  : false;

export const pool = new Pool({
  connectionString,
  ssl: sslConfig,
  
  max: isTest ? 2 : 10, 
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const testConnection = async (): Promise<boolean> => {
  let client;
  try {
    client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    console.log(`🚀 PostgreSQL Database connected successfully! Server time: ${res.rows[0].now}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL Database:', error);
    return false;
  } finally {
    if (client) client.release();
  }
};
