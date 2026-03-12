import { pool } from './src/config/db.js';

async function runQueries() {
    try {
        console.log('--- Step 1: Agent Knowledge Counts ---');
        const query1 = `
            SELECT 
              a.id as agent_id,
              a.name as agent_name,
              o.name as org_name,
              COUNT(kv.id) as vector_count
            FROM agents a
            LEFT JOIN organizations o ON o.id = a.organization_id
            LEFT JOIN knowledge_vectors kv ON kv.agent_id = a.id
            GROUP BY a.id, a.name, o.name
            ORDER BY vector_count DESC;
        `;
        const res1 = await pool.query(query1);
        console.table(res1.rows);

        console.log('\n--- Step 2: Shopify Config for forefront-7108.myshopify.com ---');
        const query2 = `
            SELECT shop, chatbot_id FROM shopify_configs
            WHERE shop = 'forefront-7108.myshopify.com';
        `;
        const res2 = await pool.query(query2);
        console.table(res2.rows);

    } catch (err) {
        console.error('Error running queries:', err);
    } finally {
        await pool.end();
    }
}

runQueries();
