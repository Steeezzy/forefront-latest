import cron from 'node-cron';
import { pool } from '../config/db.js';
import { memoryAgent } from '../agents/memory.agent.js';

/**
 * Customer Sync Job
 * Runs periodically to analyze new interactions and update customer profiles
 * This is a safe, additive process that doesn't modify existing code
 */

let isRunning = false;

async function syncCustomerMemory() {
  if (isRunning) {
    console.log('[CustomerSync] Previous job still running, skipping...');
    return;
  }

  isRunning = true;

  try {
    console.log('[CustomerSync] Starting customer memory sync...');

    // Find interactions that haven't been fully analyzed yet
    // We look for interactions with NULL or empty ai_analysis
    const unanalyzedResult = await pool.query(
      `SELECT il.*, cp.id as profile_id
       FROM interaction_logs il
       JOIN customer_profiles cp ON cp.id = il.customer_profile_id
       WHERE il.ai_analysis IS NULL OR il.ai_analysis = '{}'::jsonb
       ORDER BY il.created_at DESC
       LIMIT 50`
    );

    const unanalyzed = unanalyzedResult.rows;

    if (unanalyzed.length === 0) {
      console.log('[CustomerSync] No new interactions to analyze');
      return;
    }

    console.log(`[CustomerSync] Found ${unanalyzed.length} interactions to analyze`);

    let successCount = 0;
    let errorCount = 0;

    // Process each interaction
    for (const interaction of unanalyzed) {
      try {
        // Analyze the interaction
        const analysis = await memoryAgent.analyzeInteraction(
          interaction.profile_id,
          interaction.id,
          { includeHistory: true, maxHistoryItems: 5 }
        );

        // Update the interaction with analysis
        await pool.query(
          `UPDATE interaction_logs
           SET ai_analysis = $1,
               summary = COALESCE(summary, $2),
               sentiment = COALESCE(sentiment, $3)
           WHERE id = $4`,
          [JSON.stringify(analysis), analysis.summary, analysis.sentiment, interaction.id]
        );

        // Update customer profile based on analysis
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        // Update risk score
        if (analysis.risk_score !== undefined) {
          updates.push(`risk_score = $${paramIndex++}`);
          values.push(analysis.risk_score);
        }

        // Update next action
        if (analysis.next_action && analysis.next_action !== 'none') {
          updates.push(`next_action = $${paramIndex++}`);
          values.push(analysis.next_action);

          if (analysis.next_action_date) {
            updates.push(`next_action_date = $${paramIndex++}`);
            values.push(analysis.next_action_date);
          }
        }

        // Append notes
        if (analysis.notes_update) {
          updates.push(`ai_notes = COALESCE(ai_notes, '') || $${paramIndex++}`);
          values.push('\n[' + new Date().toISOString().split('T')[0] + '] ' + analysis.notes_update);
        }

        // Update preferences
        if (analysis.preferences_detected && Object.keys(analysis.preferences_detected).length > 0) {
          updates.push(`preferences = COALESCE(preferences, '{}'::jsonb) || $${paramIndex++}::jsonb`);
          values.push(JSON.stringify(analysis.preferences_detected));
        }

        // Update tags
        if (analysis.tags_to_add && analysis.tags_to_add.length > 0) {
          // Get current tags
          const profileResult = await pool.query(
            `SELECT tags FROM customer_profiles WHERE id = $1`,
            [interaction.profile_id]
          );
          const currentTags = profileResult.rows[0]?.tags || [];
          const newTags = [...new Set([...currentTags, ...analysis.tags_to_add])];
          updates.push(`tags = $${paramIndex++}::jsonb`);
          values.push(JSON.stringify(newTags));
        }

        // Update sentiment trend
        const profileResult = await pool.query(
          `SELECT sentiment_trend FROM customer_profiles WHERE id = $1`,
          [interaction.profile_id]
        );
        const sentimentTrend = profileResult.rows[0]?.sentiment_trend || [];
        sentimentTrend.push({
          date: new Date().toISOString(),
          sentiment: analysis.sentiment
        });
        updates.push(`sentiment_trend = $${paramIndex++}::jsonb`);
        values.push(JSON.stringify(sentimentTrend.slice(-20))); // Keep last 20

        // Always update updated_at
        updates.push(`updated_at = NOW()`);

        // Execute update if there are changes
        if (updates.length > 1) { // More than just updated_at
          values.push(interaction.profile_id);
          await pool.query(
            `UPDATE customer_profiles
             SET ${updates.join(', ')}
             WHERE id = $${paramIndex}`,
            values
          );
        }

        // Log AI action if there's a next action
        if (analysis.next_action && analysis.next_action !== 'none') {
          await pool.query(
            `INSERT INTO ai_actions_log
             (workspace_id, customer_profile_id, action_type, action_detail, status, created_at)
             VALUES ($1, $2, $3, $4, 'pending', NOW())`,
            [
              interaction.workspace_id,
              interaction.profile_id,
              analysis.next_action,
              `Recommended by Memory Agent: ${analysis.summary}`
            ]
          );
        }

        successCount++;
      } catch (error: any) {
        console.error(`[CustomerSync] Error analyzing interaction ${interaction.id}:`, error.message);
        errorCount++;

        // Mark as analyzed with error to prevent infinite retries
        await pool.query(
          `UPDATE interaction_logs
           SET ai_analysis = $1
           WHERE id = $2`,
          [JSON.stringify({ error: error.message }), interaction.id]
        );
      }
    }

    console.log(`[CustomerSync] Completed: ${successCount} success, ${errorCount} errors`);

    // Update risk scores for all active customers periodically
    if (Math.random() < 0.1) { // 10% chance per run
      console.log('[CustomerSync] Running risk score update for active customers...');
      const activeProfiles = await pool.query(
        `SELECT id FROM customer_profiles
         WHERE last_interaction > NOW() - INTERVAL '90 days'
         LIMIT 100`
      );

      for (const profile of activeProfiles.rows) {
        try {
          const riskScore = await memoryAgent.calculateRiskScore(profile.id);
          await pool.query(
            `UPDATE customer_profiles SET risk_score = $1, updated_at = NOW() WHERE id = $2`,
            [riskScore, profile.id]
          );
        } catch (error: any) {
          console.error(`[CustomerSync] Error updating risk score for ${profile.id}:`, error.message);
        }
      }
    }

  } catch (error: any) {
    console.error('[CustomerSync] Job error:', error);
  } finally {
    isRunning = false;
  }
}

/**
 * Start the customer sync jobs
 */
export function startCustomerSyncJobs() {
  console.log('[CustomerSync] Starting customer memory sync job (every 5 minutes)...');

  // Run every 5 minutes
  cron.schedule('*/5 * * * *', syncCustomerMemory);

  // Also run immediately on startup (after a short delay)
  setTimeout(syncCustomerMemory, 10000); // 10 seconds after startup
}

// Export for manual testing
export { syncCustomerMemory };
