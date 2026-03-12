import { pool } from './src/config/db.js';

async function diagnose() {
    try {
        const AGENT_ID = 'ade07442-1e91-48c9-a6d1-6a6e8262e73c';
        
        console.log('--- Agent Check ---');
        const agent = await pool.query('SELECT id, name FROM agents WHERE id = $1', [AGENT_ID]);
        console.table(agent.rows);

        console.log('\n--- Sources Check ---');
        const sources = await pool.query('SELECT id, agent_id, name, type FROM knowledge_sources WHERE agent_id = $1', [AGENT_ID]);
        console.table(sources.rows);

        if (sources.rows.length > 0) {
            const sourceId = sources.rows[0].id;
            console.log(`\n--- Vectors Check for Source: ${sourceId} ---`);
            const vectors = await pool.query('SELECT id, content_chunk FROM knowledge_vectors WHERE source_id = $1 LIMIT 5', [sourceId]);
            console.table(vectors.rows);
            
            const count = await pool.query('SELECT COUNT(*) FROM knowledge_vectors WHERE source_id = $1', [sourceId]);
            console.log(`Total vectors for this source: ${count.rows[0].count}`);
        }

    } catch (err) {
        console.error('Diagnosis failed:', err);
    } finally {
        await pool.end();
    }
}

diagnose();
