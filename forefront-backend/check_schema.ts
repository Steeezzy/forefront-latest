import { pool } from './src/config/db.js';

async function checkColumns() {
    try {
        console.log('--- knowledge_vectors columns ---');
        const res1 = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'knowledge_vectors';
        `);
        console.table(res1.rows);

        console.log('\n--- agents columns ---');
        const res2 = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'agents';
        `);
        console.table(res2.rows);

    } catch (err) {
        console.error('Error checking columns:', err);
    } finally {
        await pool.end();
    }
}

checkColumns();
