import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function runSqlFile(client: any, filePath: string) {
    console.log(`Running migration: ${path.basename(filePath)}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    await client.query(sql);
}

async function migrate() {
    let retries = 5;
    while (retries > 0) {
        try {
            console.log('Attempting to connect to database...');
            const client = await pool.connect();
            console.log('Connected successfully.');

            // 1. Run base schema
            const schemaPath = path.join(__dirname, '../db/schema.sql');
            await runSqlFile(client, schemaPath);

            // 2. Run all migration files in order
            const migrationsDir = path.join(__dirname, '../../migrations');
            if (fs.existsSync(migrationsDir)) {
                const files = fs.readdirSync(migrationsDir)
                    .filter((f) => f.endsWith('.sql'))
                    .filter((f) => !f.startsWith('rollback_'))
                    .sort();
                
                for (const file of files) {
                    await runSqlFile(client, path.join(migrationsDir, file));
                }
            }

            console.log('All migrations completed successfully.');

            client.release();
            await pool.end();
            process.exit(0);
        } catch (err: any) {
            console.error(`Migration failed: ${err.message}`);
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
