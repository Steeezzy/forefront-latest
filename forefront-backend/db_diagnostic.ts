import { pool } from './src/config/db.js';

async function diagnose() {
    try {
        console.log('Testing connection...');
        const res = await pool.query('SELECT NOW()');
        console.log('Connection successful:', res.rows[0]);

        console.log('\nChecking extensions...');
        const ext = await pool.query("SELECT extname FROM pg_extension WHERE extname = 'vector'");
        console.log('pgvector status:', ext.rows.length > 0 ? 'INSTALLED' : 'NOT INSTALLED');

        console.log('\nChecking tables...');
        const tables = ['agents', 'knowledge_sources', 'knowledge_vectors', 'messages', 'conversations', 'ai_escalations', 'unanswered_questions'];
        for (const table of tables) {
            try {
                await pool.query(`SELECT 1 FROM ${table} LIMIT 1`);
                console.log(`Table '${table}': EXISTS`);
            } catch (e) {
                console.log(`Table '${table}': MISSING (${e.message})`);
            }
        }

    } catch (e) {
        console.error('DIAGNOSTIC FAILED:', e);
    } finally {
        await pool.end();
    }
}

diagnose();
