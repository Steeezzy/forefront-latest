const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/forefront',
});

async function migrate() {
    let retries = 5;
    while (retries > 0) {
        try {
            console.log('Attempting to connect to database...');
            const client = await pool.connect();
            console.log('Connected successfully.');

            const schemaPath = path.join(__dirname, '../db/schema.sql');
            const sql = fs.readFileSync(schemaPath, 'utf8');

            console.log('Running migration...');
            await client.query(sql);
            console.log('Migration completed successfully.');

            client.release();
            await pool.end();
            process.exit(0);
        } catch (err) {
            console.error(`Connection failed: ${err.message}`);
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
