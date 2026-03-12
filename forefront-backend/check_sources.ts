import { pool } from './src/config/db.js';

async function checkKnowledgeSources() {
    try {
        console.log('--- knowledge_sources columns ---');
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'knowledge_sources';
        `);
        console.table(res.rows);
    } catch (err) {
        console.error('Error checking knowledge_sources columns:', err);
    } finally {
        await pool.end();
    }
}

checkKnowledgeSources();
