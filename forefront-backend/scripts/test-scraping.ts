import jwt from 'jsonwebtoken';
import pg from 'pg';

const JWT_SECRET = 'dev_secret_key_change_in_prod';
const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgres://postgres:password@localhost:5433/questron' });

async function main() {
    const agentId = 'd97e60d2-0818-468e-afaf-6d5e689457c9';  // The agent with httpbin.org knowledge
    
    // Generate a test token
    const testToken = jwt.sign(
        { userId: 'test-user', workspaceId: 'test-workspace' },
        JWT_SECRET,
        { expiresIn: '7d' }
    );

    // Test RAG chat
    console.log('Testing RAG chat...');
    const response = await fetch('http://localhost:3001/knowledge/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testToken}`,
        },
        body: JSON.stringify({
            agentId: agentId,
            question: 'Who is the blacksmith and what happened to him?'
        })
    });

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('AI Response:', JSON.stringify(data, null, 2));

    await pool.end();
}

main().catch(console.error);
