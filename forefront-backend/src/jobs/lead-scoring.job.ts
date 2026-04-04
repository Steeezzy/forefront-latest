/**
 * Lead Scoring Job
 *
 * Runs nightly (2 AM local) via the general jobs queue.
 * Scores all customers in a workspace based on:
 *   - Interaction recency (last 7 days = +20)
 *   - Call count (> 3 calls = +15)
 *   - Chat engagement (> 5 sessions = +10)
 *   - Booking/purchase signals (+25)
 *   - Campaign response (+15)
 *   - Decay for inactivity (-5 per week idle after 30 days)
 *
 * Uses the general_jobs queue from Phase 0.
 */

import { pool } from '../config/db.js';
import { generalJobsQueue } from '../queues/execution-queues.js';
import cron from 'node-cron';

export async function runLeadScoring(workspaceId: string) {
  console.log(`[LeadScoring] Scoring customers for workspace ${workspaceId}`);

  const result = await pool.query(
    `WITH customer_signals AS (
       SELECT
         c.id,
         c.lead_score AS current_score,
         c.total_calls,
         c.last_contact_at,
         c.deal_stage,
         c.deal_value,
         c.created_at,
         COALESCE(
           (SELECT COUNT(*) FROM campaign_contacts cc
            WHERE cc.phone = c.phone AND cc.response IS NOT NULL
            AND cc.created_at > NOW() - INTERVAL '30 days'), 0
         )::int AS campaign_responses,
         EXTRACT(EPOCH FROM (NOW() - COALESCE(c.last_contact_at, c.created_at))) / 86400 AS days_since_contact
       FROM customers c
       WHERE c.workspace_id = $1
    )
    UPDATE customers
    SET lead_score = GREATEST(0, LEAST(100,
      -- Base score from interaction count
      LEAST(30, COALESCE(cs.total_calls, 0) * 5) +
      -- Recency bonus
      CASE WHEN cs.days_since_contact < 7 THEN 25
           WHEN cs.days_since_contact < 14 THEN 15
           WHEN cs.days_since_contact < 30 THEN 5
           ELSE 0 END +
      -- Campaign engagement
      LEAST(20, cs.campaign_responses * 10) +
      -- Deal stage bonus
      CASE cs.deal_stage
        WHEN 'qualified' THEN 15
        WHEN 'proposal' THEN 25
        WHEN 'negotiation' THEN 30
        WHEN 'won' THEN 40
        ELSE 0 END +
      -- Deal value bonus
      CASE WHEN cs.deal_value > 10000 THEN 10
           WHEN cs.deal_value > 1000 THEN 5
           ELSE 0 END -
      -- Inactivity decay
      CASE WHEN cs.days_since_contact > 60 THEN 15
           WHEN cs.days_since_contact > 30 THEN 5
           ELSE 0 END
    )),
    updated_at = NOW()
    FROM customer_signals cs
    WHERE customers.id = cs.id
      AND customers.workspace_id = $1
    RETURNING customers.id`,
    [workspaceId]
  );

  console.log(`[LeadScoring] Scored ${result.rowCount} customers for workspace ${workspaceId}`);
  return result.rowCount;
}

/**
 * Enqueue lead scoring for all active workspaces.
 * Called by the nightly cron or manually via API.
 */
export async function enqueueAllLeadScoring() {
  const result = await pool.query(
    `SELECT DISTINCT id FROM workspaces WHERE is_active = true`
  );

  let count = 0;
  for (const row of result.rows) {
    await generalJobsQueue.add(
      'lead-scoring',
      {
        type: 'lead_scoring',
        workspaceId: row.id,
        data: {},
      },
      {
          jobId: `lead-scoring-${row.id}-${new Date().toISOString().split('T')[0]}`,
      }
    );
    count++;
  }

  console.log(`[LeadScoring] Enqueued scoring for ${count} workspaces`);
  return count;
}

/**
 * Start the nightly lead scoring cron (2 AM IST).
 */
export function startLeadScoringCron() {
  cron.schedule('0 2 * * *', async () => {
    try {
      await enqueueAllLeadScoring();
    } catch (error: any) {
      console.error('[LeadScoring] Cron error:', error.message);
    }
  });

  console.log('[LeadScoring] Nightly cron started (2 AM daily)');
}
