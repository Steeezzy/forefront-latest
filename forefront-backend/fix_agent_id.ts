import { pool } from './src/config/db.js';

async function updateShopifyConfig() {
    try {
        const agentIdWithVectors = 'ade07442-1e91-48c9-a6d1-6a6e8262e73c';
        const shop = 'forefront-7108.myshopify.com';

        console.log('--- Step 2: Current Shopify Config ---');
        const res2 = await pool.query(`
            SELECT shop_domain, chatbot_id FROM shopify_configs
            WHERE shop_domain = $1;
        `, [shop]);
        console.table(res2.rows);

        if (res2.rows.length > 0 && res2.rows[0].chatbot_id !== agentIdWithVectors) {
            console.log('\n--- Step 3: Updating chatbot_id ---');
            await pool.query(`
                UPDATE shopify_configs
                SET chatbot_id = $1
                WHERE shop_domain = $2;
            `, [agentIdWithVectors, shop]);
            console.log(`Updated chatbot_id to ${agentIdWithVectors} for ${shop}`);
        } else {
            console.log('\nchatbot_id is already correct or shop not found.');
        }

    } catch (err) {
        console.error('Error updating shopify_configs:', err);
    } finally {
        await pool.end();
    }
}

updateShopifyConfig();
