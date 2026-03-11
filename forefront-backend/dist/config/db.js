import { Pool } from 'pg';
import { env } from './env.js';
export const pool = new Pool({
    connectionString: env.DATABASE_URL,
    connectionTimeoutMillis: 5000, // 5s to establish connection
    idleTimeoutMillis: 30000, // 30s idle before closing
    max: 10, // max pool size
    statement_timeout: 10000, // 10s per query max
});
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});
export const query = (text, params) => pool.query(text, params);
//# sourceMappingURL=db.js.map