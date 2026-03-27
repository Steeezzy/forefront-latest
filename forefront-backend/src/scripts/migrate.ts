import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && (process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1')) ? false : { rejectUnauthorized: false }
});

async function runSqlFile(client: any, filePath: string) {
    console.log(`Running migration: ${path.basename(filePath)}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    await client.query(sql);
}

async function migrate() {
    console.log('--- Migration Environment Check ---');
    console.log('DATABASE_URL defined:', !!process.env.DATABASE_URL);
    if (process.env.DATABASE_URL) {
        const parsed = new URL(process.env.DATABASE_URL);
        console.log('DB Host:', parsed.hostname);
        console.log('DB Port:', parsed.port);
        console.log('DB Name:', parsed.pathname.substring(1));
    }
    console.log('----------------------------------');

    let retries = 5;
    while (retries > 0) {
        try {
            console.log(`Attempting to connect to database (Retry ${6 - retries}/5)...`);
            const client = await pool.connect();
            console.log('Connected successfully.');

            // Enable extensions
            try {
                console.log('Enabling extensions...');
                await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
                await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
                console.log('✅ Extensions enabled (uuid-ossp, vector)');
            } catch (extErr: any) {
                console.warn('⚠️ Failed to enable extensions (might already exist or lack permissions):', extErr.message);
            }

            // 1. Run base schema
            const schemaPath = path.join(__dirname, '../../src/db/schema.sql');
            if (fs.existsSync(schemaPath)) {
                await runSqlFile(client, schemaPath);
            } else {
                console.warn(`Schema file not found at ${schemaPath}, skipping.`);
            }

            // 2. Run all migration files in order
            const migrationsDir = path.join(__dirname, '../../migrations');
            if (fs.existsSync(migrationsDir)) {
                const files = fs.readdirSync(migrationsDir)
                    .filter(f => f.endsWith('.sql') && !f.startsWith('rollback_'))
                    .sort();
                
                for (const file of files) {
                    await runSqlFile(client, path.join(migrationsDir, file));
                }
            } else {
                console.warn(`Migrations directory not found at ${migrationsDir}, skipping.`);
            }

            console.log('All migrations completed successfully.');

            client.release();
            await pool.end();
            process.exit(0);
        } catch (err: any) {
            console.error(`Migration failed with error:`, err);
            retries--;
            if (retries === 0) {
                console.error('Max retries reached. Exiting.');
                process.exit(1);
            }
            console.log(`Retrying in 2 seconds... (${retries} retries left)`);
            await new Promise(res => setTimeout(res, 2000));
        }
    }
}

migrate();
