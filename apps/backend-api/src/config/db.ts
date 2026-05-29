import { Pool } from 'pg';
import { env } from './env.js';

function parseEnvInt(value: string | undefined, fallback: number, min: number, max: number) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }

    return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

const maxConnections = parseEnvInt(env.DB_POOL_MAX, 28, 4, 200);
const minConnections = parseEnvInt(env.DB_POOL_MIN, 6, 0, maxConnections);
const connectionTimeoutMillis = parseEnvInt(env.DB_POOL_CONNECTION_TIMEOUT_MS, 2000, 250, 30000);
const idleTimeoutMillis = parseEnvInt(env.DB_POOL_IDLE_TIMEOUT_MS, 10000, 1000, 120000);
const statementTimeoutMillis = parseEnvInt(env.DB_POOL_STATEMENT_TIMEOUT_MS, 5000, 500, 120000);
const queryTimeoutMillis = parseEnvInt(env.DB_POOL_QUERY_TIMEOUT_MS, 6000, 500, 120000);
const maxUses = parseEnvInt(env.DB_POOL_MAX_USES, 7500, 100, 1000000);

export const pool = new Pool({
    connectionString: env.DATABASE_URL,
    connectionTimeoutMillis,
    idleTimeoutMillis,
    max: maxConnections,
    min: minConnections,
    maxUses,
    statement_timeout: statementTimeoutMillis,
    query_timeout: queryTimeoutMillis,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
