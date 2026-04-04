import { Job, Worker } from 'bullmq';
import { pool } from '../config/db.js';
import {
  ORCHESTRATOR_QUEUE,
  bullConnection,
  type CampaignJobPayload,
  type OrchestratorJobPayload,
} from '../queues/execution-queues.js';
import { processWorkspaceCoreTurn } from '../modules/orchestrator/workspace-core-orchestrator.service.js';
import { markExecutionEventProcessed } from '../services/execution-events.service.js';
import { campaignService } from '../services/campaign.service.js';
import { twilioService } from '../services/twilio.service.js';

function classifyCampaignFailure(error: any): 'network_error' | 'ai_error' | 'invalid_input' | 'external_api_error' | 'unknown' {
  const message = `${error?.message || error || ''}`.toLowerCase();

  if (!message) {
    return 'unknown';
  }

  if (message.includes('invalid') || message.includes('validation') || message.includes('required')) {
    return 'invalid_input';
  }

  if (message.includes('openai') || message.includes('llm') || message.includes('model') || message.includes('ai')) {
    return 'ai_error';
  }

  if (message.includes('twilio') || message.includes('api') || message.includes('http')) {
    return 'external_api_error';
  }

  if (message.includes('timeout') || message.includes('network') || message.includes('econn') || message.includes('socket')) {
    return 'network_error';
  }

  return 'unknown';
}

async function processOrchestratorJob(job: Job<OrchestratorJobPayload>) {
  const { workspaceId, jobType, input, campaignJob, executionEventId } = job.data;

  if (jobType === 'campaign_dispatch') {
    const payload = campaignJob as CampaignJobPayload | undefined;
    if (!payload?.campaignJobId) {
      console.warn(`[OrchestratorWorker] Skipping invalid campaign dispatch job ${job.id}`);
      return;
    }

    console.log(`Orchestrator worker running ${job.id}`);

    const processingResult = await pool.query(
      `UPDATE campaign_jobs
       SET status = 'processing',
           started_at = COALESCE(started_at, NOW()),
           error_message = NULL,
           updated_at = NOW()
       WHERE id = $1
         AND status IN ('queued', 'retry_scheduled')
       RETURNING id`,
      [payload.campaignJobId]
    );

    if (processingResult.rows.length === 0) {
      console.log(`[OrchestratorWorker] Campaign job ${payload.campaignJobId} is not dispatchable`);
      return;
    }

    try {
      console.log(`[OrchestratorWorker] Processing campaign dispatch ${payload.campaignJobId}`);
      await campaignService.processCampaignJob(pool, payload, twilioService);

      if (payload.channel === 'sms') {
        await pool.query(
          `UPDATE campaign_jobs
           SET status = 'completed',
               error_message = NULL,
               failure_type = NULL,
               next_retry_at = NULL,
               completed_at = NOW(),
               updated_at = NOW()
           WHERE id = $1
             AND status = 'processing'`,
          [payload.campaignJobId]
        );
      }

      console.log(`[OrchestratorWorker] Completed campaign dispatch ${payload.campaignJobId}`);
      return;
    } catch (error: any) {
      const attemptsResult = await pool.query(
        `SELECT COALESCE(attempts, 0) AS attempts
         FROM campaign_jobs
         WHERE id = $1
         LIMIT 1`,
        [payload.campaignJobId]
      );

      const currentAttempts = Number(attemptsResult.rows[0]?.attempts || 0);
      const nextAttempts = currentAttempts + 1;
      const maxAttempts = Number(job.opts.attempts ?? 3);
      const isRetryScheduled = nextAttempts < maxAttempts;
      const failureType = classifyCampaignFailure(error);

      await pool.query(
        `UPDATE campaign_jobs
         SET status = $2::text,
             attempts = $3,
             error_message = $4,
             failure_type = $5,
           next_retry_at = CASE WHEN $2::text = 'retry_scheduled' THEN NOW() + INTERVAL '5 minutes' ELSE NULL END,
           completed_at = CASE WHEN $2::text = 'failed' THEN NOW() ELSE completed_at END,
             updated_at = NOW()
         WHERE id = $1`,
        [
          payload.campaignJobId,
          isRetryScheduled ? 'retry_scheduled' : 'failed',
          nextAttempts,
          error?.message || 'campaign_dispatch_failed',
          failureType,
        ]
      );

      if (!isRetryScheduled) {
        await pool.query(
          `UPDATE campaign_contacts
           SET status = 'failed',
               called_at = NOW(),
               outcome = 'failed'
           WHERE id = (
             SELECT campaign_contact_id
             FROM campaign_jobs
             WHERE id = $1
             LIMIT 1
           )`,
          [payload.campaignJobId]
        );

        try {
          await pool.query(
            `INSERT INTO dead_letter_jobs (
               campaign_job_id,
               workspace_id,
               payload,
               error_message,
               failed_at,
               original_queue,
               original_job_id,
               original_job_name,
               failed_reason,
               attempts_made,
               status,
               created_at
             ) VALUES ($1, $2, $3, $4, NOW(), 'orchestrator', $5, 'campaign_dispatch', $4, $6, 'dead', NOW())`,
            [
              payload.campaignJobId,
              payload.workspaceId,
              JSON.stringify(payload),
              error?.message || 'campaign_dispatch_failed',
              payload.campaignJobId,
              nextAttempts,
            ]
          );
        } catch {
          await pool.query(
            `INSERT INTO dead_letter_jobs (
               original_queue,
               original_job_id,
               original_job_name,
               workspace_id,
               payload,
               failed_reason,
               attempts_made,
               status,
               created_at
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'dead', NOW())`,
            [
              'orchestrator',
              payload.campaignJobId,
              'campaign_dispatch',
              payload.workspaceId,
              JSON.stringify(payload),
              error?.message || 'campaign_dispatch_failed',
              nextAttempts,
            ]
          );
        }
      }

      console.error(`[OrchestratorWorker] Failed campaign dispatch ${payload.campaignJobId}:`, error?.message || error);
      throw error;
    }
  }

  if (!input) {
    throw new Error('Missing input for orchestrator_core job');
  }

  const normalizedInput = {
    ...input,
    ai_output: input.ai_output
      ? {
        intent: input.ai_output.intent,
        entities: input.ai_output.entities || {},
      }
      : undefined,
  };

  try {
    console.log(`Orchestrator worker running ${job.id}`);
    await processWorkspaceCoreTurn(normalizedInput);

    if (executionEventId) {
      await markExecutionEventProcessed(pool, executionEventId, 'processed');
    }

    console.log(`[OrchestratorWorker] Completed job ${job.id}`);
  } catch (error: any) {
    console.error(`[OrchestratorWorker] Failed job ${job.id}:`, error?.message || error);

    if (executionEventId) {
      await markExecutionEventProcessed(
        pool,
        executionEventId,
        'failed',
        error?.message || 'orchestrator_worker_failed'
      );
    }

    throw error;
  }
}

export const orchestratorWorker = new Worker<OrchestratorJobPayload>(
  ORCHESTRATOR_QUEUE,
  processOrchestratorJob,
  {
    connection: bullConnection,
    concurrency: 5,
  }
);
