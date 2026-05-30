import { AuthService } from '../src/modules/auth/auth.service.js';
import { pool } from '../src/config/db.js';

// Mock Fastify Request/Reply objects are hard to simulate here without a running server context 
// or an HTTP client. Let's use axios with the cookie jar pattern if we were doing integration tests.
// But since we are in the backend repo, we can just use `fetch` with the localhost URL.

async function testEndpoints() {
    console.log('🧪 Testing Billing & Agent Endpoints...');
    const service = new AuthService();

    // 1. Get a valid token
    // We'll just login with the user created in previous test or register a new one
    const email = `test-verify-${Date.now()}@example.com`;
    const password = 'password123';

    let token = '';

    try {
        const reg = await service.register({ email, password, workspaceName: 'Verify WS' });
        token = reg.token;
    } catch (e) {
        // If user exists, login
        // In a real script we'd handle this better, but let's just use the clean email approach
        console.error("Registration failed (unexpected):", e);
        return;
    }

    const cookieHeader = `token=${token}`;
    const baseUrl = 'http://localhost:3001';

    console.log(`Token obtained. Testing endpoints at ${baseUrl}...`);

    // 2. Test GET /billing/status
    try {
        const res = await fetch(`${baseUrl}/billing/status`, {
            headers: { 'Cookie': cookieHeader }
        });

        console.log(`\nGET /billing/status: ${res.status} ${res.statusText}`);
        if (res.ok) {
            const data = await res.json();
            console.log('Response:', JSON.stringify(data, null, 2));
        } else {
            console.error('Body:', await res.text());
        }
    } catch (e) {
        console.error('Billing Test Error:', e);
    }

    // 3. Test GET /agents/primary
    try {
        const res = await fetch(`${baseUrl}/agents/primary`, {
            headers: { 'Cookie': cookieHeader }
        });

        console.log(`\nGET /agents/primary: ${res.status} ${res.statusText}`);
        if (res.ok) {
            const data = await res.json();
            console.log('Response:', JSON.stringify(data, null, 2));
        } else {
            console.error('Body:', await res.text());
        }
    } catch (e) {
        console.error('Agent Test Error:', e);
    }

    await pool.end();
}

testEndpoints();
