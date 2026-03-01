import jwt from 'jsonwebtoken';
import pg from 'pg';

const testToken = jwt.sign({ userId: 'test', workspaceId: 'test' }, 'dev_secret_key_change_in_prod', { expiresIn: '1h' });

async function test() {
    const resp = await fetch('http://localhost:3001/knowledge/website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + testToken },
        body: JSON.stringify({
            agentId: 'd97e60d2-0818-468e-afaf-6d5e689457c9',
            url: 'https://www.adidas.co.in',
            mode: 'single'
        })
    });
    console.log('Status:', resp.status);
    const data = await resp.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    // Wait for processing
    console.log('\nWaiting 10s...');
    await new Promise(r => setTimeout(r, 10000));
    
    // Check result
    const pool = new pg.Pool({ connectionString: 'postgres://postgres:password@localhost:5433/forefront' });
    const result = await pool.query("SELECT status, error_message FROM knowledge_sources WHERE url LIKE '%adidas%' ORDER BY created_at DESC LIMIT 1");
    console.log('\nResult:', result.rows[0]);
    await pool.end();
}
test();
