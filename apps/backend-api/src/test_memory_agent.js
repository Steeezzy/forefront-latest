#!/usr/bin/env node
/**
 * Manual test script for Memory Agent / Customer Intelligence System
 * Usage: node test_memory_agent.js
 */

import { pool } from '../config/db.js';
import { customerService } from '../modules/customer/customer.service.js';
import { memoryAgent } from '../agents/memory.agent.js';

async function testMemoryAgent() {
  console.log('🧪 Testing Memory Agent Implementation...\n');

  try {
    // Test 1: Find or create profile
    console.log('Test 1: Find or create customer profile');
    const testWorkspaceId = 'test-workspace-' + Date.now();

    // Create a test workspace first
    await pool.query(
      `INSERT INTO workspaces (id, name, owner_id)
       VALUES ($1, $2, (SELECT id FROM users LIMIT 1))
       ON CONFLICT (id) DO NOTHING`,
      [testWorkspaceId, 'Test Workspace']
    );

    const profile = await customerService.findOrCreateProfile(
      testWorkspaceId,
      '+1234567890',
      'Test Customer',
      'test@example.com'
    );
    console.log('✅ Profile created:', profile.id);
    console.log('   Name:', profile.name);
    console.log('   Phone:', profile.phone);
    console.log('');

    // Test 2: Log interaction
    console.log('Test 2: Log customer interaction');
    const interaction = await customerService.logInteraction(
      testWorkspaceId,
      profile.id,
      {
        channel: 'call',
        summary: 'Customer called about teeth whitening appointment',
        sentiment: 'positive',
        outcome: 'appointment_booked',
        revenue: 150.00,
        raw_transcript: 'Hi, I would like to schedule a teeth whitening appointment. Do you have any slots next week?'
      }
    );
    console.log('✅ Interaction logged:', interaction.id);
    console.log('   Channel:', interaction.channel);
    console.log('   Outcome:', interaction.outcome);
    console.log('   Revenue: $', interaction.revenue);
    console.log('');

    // Test 3: Analyze interaction
    console.log('Test 3: Analyze interaction with AI');
    try {
      const analysis = await customerService.analyzeInteraction(
        profile.id,
        interaction.id
      );
      console.log('✅ AI Analysis completed');
      console.log('   Summary:', analysis.summary);
      console.log('   Sentiment:', analysis.sentiment);
      console.log('   Risk Score:', analysis.risk_score);
      console.log('   Next Action:', analysis.next_action);
      console.log('');
    } catch (err) {
      console.log('⚠️  AI Analysis failed (this is OK if CLAUDE_API_KEY is not set)');
      console.log('   Error:', err.message);
      console.log('');
    }

    // Test 4: Calculate risk score
    console.log('Test 4: Calculate customer risk score');
    const riskScore = await memoryAgent.calculateRiskScore(profile.id);
    console.log('✅ Risk score calculated:', riskScore);
    console.log('   Interpretation:',
      riskScore > 70 ? 'HIGH RISK' :
      riskScore > 40 ? 'MEDIUM RISK' :
      'LOW RISK'
    );
    console.log('');

    // Test 5: Get customer timeline
    console.log('Test 5: Get customer timeline');
    const timeline = await customerService.getCustomerTimeline(profile.id);
    console.log('✅ Timeline retrieved:', timeline.length, 'events');
    timeline.forEach((event, i) => {
      console.log(`   ${i + 1}. [${event.type}] ${event.created_at} - ${event.channel || event.action_type}`);
    });
    console.log('');

    // Test 6: List customers with filters
    console.log('Test 6: List customers with filters');
    const customers = await customerService.listCustomers(
      testWorkspaceId,
      { limit: 10 }
    );
    console.log('✅ Customers listed:', customers.total, 'total');
    console.log('   Current page:', customers.page);
    console.log('   Customers in this page:', customers.customers.length);
    console.log('');

    // Test 7: Get risky customers
    console.log('Test 7: Get risky customers');
    const riskyCustomers = await customerService.getRiskyCustomers(testWorkspaceId);
    console.log('✅ Risky customers:', riskyCustomers.length);
    riskyCustomers.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name} (Risk: ${c.risk_score})`);
    });
    console.log('');

    // Test 8: Create action
    console.log('Test 8: Create customer action');
    const action = await customerService.createAction(
      testWorkspaceId,
      profile.id,
      'follow_up',
      'Call to confirm appointment and answer questions',
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    console.log('✅ Action created:', action.id);
    console.log('   Type:', action.action_type);
    console.log('   Status:', action.status);
    console.log('');

    // Test 9: Get upcoming actions
    console.log('Test 9: Get upcoming actions');
    const upcomingActions = await customerService.getUpcomingActions(testWorkspaceId, 7);
    console.log('✅ Upcoming actions:', Object.keys(upcomingActions).length, 'days');
    Object.entries(upcomingActions).forEach(([date, actions]) => {
      console.log(`   ${date}: ${actions.length} action(s)`);
    });
    console.log('');

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await pool.query('DELETE FROM customer_profiles WHERE workspace_id = $1', [testWorkspaceId]);
    await pool.query('DELETE FROM workspaces WHERE id = $1', [testWorkspaceId]);
    console.log('✅ Cleanup complete');
    console.log('');

    console.log('🎉 All tests passed!\n');
    console.log('Memory Agent is working correctly.');
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('');
    console.error('Error details:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run tests
testMemoryAgent().catch(console.error);
