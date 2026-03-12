import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,   // 5s to establish connection
  idleTimeoutMillis: 30000,         // 30s idle before closing
  max: 10,                           // max pool size
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
