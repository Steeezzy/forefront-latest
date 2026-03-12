import { pool } from './src/config/db.js';

async function checkChunks() {
    try {
        console.log('--- document_chunks columns ---');
        const res1 = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'document_chunks';
        `);
        console.table(res1.rows);

        console.log('\n--- document_chunks data for source ---');
        const AGENT_ID = 'ade07442-1e91-48c9-a6d1-6a6e8262e73c';
        const res2 = await pool.query(`
            SELECT dc.id, dc.content, dc.source_id 
            FROM document_chunks dc
            JOIN knowledge_sources ks ON dc.source_id = ks.id
            WHERE ks.agent_id = $1
            LIMIT 5;
        `, [AGENT_ID]);
        console.table(res2.rows);

    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        await pool.end();
    }
}

checkChunks();
