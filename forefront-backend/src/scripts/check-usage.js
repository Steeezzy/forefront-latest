import { query } from '../config/db.js';

async function checkUsage() {
    const res = await query('SELECT * FROM usage_logs ORDER BY recorded_at DESC LIMIT 5');
    console.log('Recent Usage Logs:', res.rows);
    process.exit(0);
}

checkUsage().catch(console.error);
