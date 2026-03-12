import { pool } from './src/config/db.js';

async function checkShopifyConfigsColumns() {
    try {
        console.log('--- shopify_configs columns ---');
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'shopify_configs';
        `);
        console.table(res.rows);
    } catch (err) {
        console.error('Error checking shopify_configs columns:', err);
    } finally {
        await pool.end();
    }
}

checkShopifyConfigsColumns();
