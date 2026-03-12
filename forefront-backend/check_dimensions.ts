import { pool } from './src/config/db.js';

async function checkVectorDimensions() {
    try {
        const res = await pool.query(`
            SELECT id, embedding::text as vec_text 
            FROM knowledge_vectors 
            LIMIT 1;
        `);
        if (res.rows.length > 0) {
            const vec = JSON.parse(res.rows[0].vec_text.replace(/'/g, '"'));
            console.log(`Vector Dimension: ${vec.length}`);
        } else {
            console.log('No vectors found.');
        }
    } catch (err) {
        console.error('Error checking vector dimension:', err);
    } finally {
        await pool.end();
    }
}

checkVectorDimensions();
