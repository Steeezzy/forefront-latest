import { Pool } from 'pg';
import { env } from './env.js';
export const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 10, // Maximum pool size
    connectionTimeoutMillis: 5000, // Fail fast instead of hanging forever
    idleTimeoutMillis: 30000, // Release idle connections after 30s
});
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});
export const query = (text, params) => pool.query(text, params);
