import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

const isLocal = env.DATABASE_URL.includes('localhost') || env.DATABASE_URL.includes('127.0.0.1');

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,   // 10s to establish connection
  idleTimeoutMillis: 30000,         // 30s idle before closing
  max: 10,                           // max pool size
});

pool.on('error', (err) => {
  console.error('[Postgres Pool Error]', err);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
