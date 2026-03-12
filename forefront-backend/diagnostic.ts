
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function diagnostic() {
  try {
    const extensions = await pool.query('SELECT extname FROM pg_extension');
    console.log('--- Installed Extensions ---');
    console.table(extensions.rows);

    const configs = await pool.query('SELECT shop_domain, chatbot_id, is_active FROM shopify_configs');
    console.log('--- Shopify Configs ---');
    console.table(configs.rows);

    const agentId = 'ade07442-1e91-48c9-a6d1-6a6e8262e73c';
    const agentLookup = await pool.query(
        'SELECT workspace_id FROM agents WHERE id = $1',
        [agentId]
    );
    console.log('--- Agent Lookup (ade07442...) ---');
    console.table(agentLookup.rows);

    await pool.end();
  } catch (err) {
    console.error('Diagnostic failed:', err);
    process.exit(1);
  }
}

diagnostic();
