#!/usr/bin/env node
/**
 * Quick test for the Qestron MCP Server
 * Run: node forefront-backend/mcp/test-mcp.js
 *
 * Make sure backend is running on localhost:3001 first.
 */

const API_URL   = process.env.QESTRON_API_URL   || 'http://localhost:3001';
const API_TOKEN = process.env.QESTRON_ADMIN_TOKEN || '';

async function call(path, method = 'GET', body) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_TOKEN}`,
      'x-mcp-client': 'hermes',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function run() {
  console.log('\n🔌 Qestron MCP Server — Integration Test\n');
  console.log(`API: ${API_URL}\n`);

  // 1. Workspace health
  console.log('1️⃣  GET /api/mcp/workspace-health');
  const health = await call('/api/mcp/workspace-health');
  console.log(`   Status: ${health.status}`);
  console.log(`   Data: ${JSON.stringify(health.data).slice(0, 120)}...\n`);

  // 2. Churn alerts
  console.log('2️⃣  GET /api/mcp/churn-alerts?threshold=50');
  const churn = await call('/api/mcp/churn-alerts?threshold=50&limit=5');
  console.log(`   Status: ${churn.status}`);
  console.log(`   Data: ${JSON.stringify(churn.data).slice(0, 120)}...\n`);

  // 3. BI report
  console.log('3️⃣  GET /api/mcp/bi-report');
  const bi = await call('/api/mcp/bi-report');
  console.log(`   Status: ${bi.status}`);
  console.log(`   Data: ${JSON.stringify(bi.data).slice(0, 120)}...\n`);

  // 4. Memory sync
  console.log('4️⃣  POST /api/mcp/memory-sync');
  const sync = await call('/api/mcp/memory-sync', 'POST', {});
  console.log(`   Status: ${sync.status}`);
  console.log(`   Data: ${JSON.stringify(sync.data).slice(0, 120)}...\n`);

  // 5. Managed agent run (only if enabled)
  console.log('5️⃣  POST /api/mcp/run-managed-agent (text)');
  const agent = await call('/api/mcp/run-managed-agent', 'POST', {
    type: 'text',
    prompt: 'Say "Qestron MCP integration test successful" in one sentence.',
    title: 'MCP Test Run',
  });
  console.log(`   Status: ${agent.status}`);
  console.log(`   Data: ${JSON.stringify(agent.data).slice(0, 200)}...\n`);

  // 6. Managed agent runs log
  console.log('6️⃣  GET /api/mcp/managed-agent-runs');
  const runs = await call('/api/mcp/managed-agent-runs?limit=3');
  console.log(`   Status: ${runs.status}`);
  console.log(`   Runs: ${runs.data?.data?.count || 0}\n`);

  console.log('✅ Test complete. If all statuses are 200 or 503 (agents disabled), the MCP bridge is working.');
}

run().catch(console.error);
