import { pool } from './src/config/db.js';

async function listTables() {
    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        `);
        console.log('Tables in public schema:');
        console.table(res.rows);
    } catch (err) {
        console.error('Error listing tables:', err);
    } finally {
        await pool.end();
    }
}

listTables();
