import { pool } from './src/config/db.js';

async function executeDebug() {
    try {
        console.log('--- Query 1: Vector Count per Agent ---');
        // Adjusted to match actual schema: agents -> knowledge_sources -> knowledge_vectors
        const res1 = await pool.query(`
            SELECT a.id, a.name, COUNT(kv.id) as vectors
            FROM agents a
            LEFT JOIN knowledge_sources ks ON ks.agent_id = a.id
            LEFT JOIN knowledge_vectors kv ON kv.source_id = ks.id
            GROUP BY a.id, a.name
            ORDER BY vectors DESC;
        `);
        console.table(res1.rows);

        console.log('\n--- Query 2: Shopify Chatbot ID ---');
        // Adjusted 'shop' to 'shop_domain' to match actual schema
        const res2 = await pool.query(`
            SELECT chatbot_id FROM shopify_configs 
            WHERE shop_domain = 'forefront-7108.myshopify.com';
        `);
        console.table(res2.rows);

        const agentWithMostVectors = res1.rows[0]?.id;
        const currentChatbotId = res2.rows[0]?.chatbot_id;

        console.log(`\nAgent with most vectors: ${agentWithMostVectors} (${res1.rows[0]?.vectors} vectors)`);
        console.log(`Current chatbot_id in shopify_configs: ${currentChatbotId}`);

        if (agentWithMostVectors && currentChatbotId !== agentWithMostVectors) {
            console.log('\n--- Match Status: MISMATCH. Updating... ---');
            await pool.query(`
                UPDATE shopify_configs 
                SET chatbot_id = $1
                WHERE shop_domain = 'forefront-7108.myshopify.com';
            `, [agentWithMostVectors]);
            console.log('Update complete.');
        } else {
            console.log('\n--- Match Status: MATCH. No update needed. ---');
        }

    } catch (err) {
        console.error('Execution failed:', err);
    } finally {
        await pool.end();
    }
}

executeDebug();
