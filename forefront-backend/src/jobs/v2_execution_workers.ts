import { Worker, Job } from 'bullmq';
import { pool } from '../config/db.js';
import {
  AUTOMATION_ACTIONS_QUEUE,
  VOICE_POST_CALL_QUEUE,
  GENERAL_JOBS_QUEUE,
  DEAD_LETTER_QUEUE,
  bullConnection,
  deadLetterQueue,
  type VoicePostCallJobPayload,
  type AutomationActionJobPayload,
  type GeneralJobPayload,
  type DeadLetterPayload,
} from '../queues/execution-queues.js';
import { campaignService } from '../services/campaign.service.js';
import { automationEngine } from '../modules/automation/automation.service.js';

let workersStarted = false;
const workers: Worker[] = [];

// ── Structured error logging ─────────────────────────────────────────────

interface WorkerErrorLog {
  worker: string;
  jobId: string;
  jobName: string;
  error: string;
  attemptsMade: number;
  timestamp: string;
}

function logWorkerError(log: WorkerErrorLog) {
  console.error(
    `[Worker:${log.worker}] Job ${log.jobId} (${log.jobName}) failed ` +
    `(attempt ${log.attemptsMade}): ${log.error}`
  );
}

async function persistWorkerError(log: WorkerErrorLog) {
  try {
    await pool.query(
      `INSERT INTO dead_letter_jobs (original_queue, original_job_id, original_job_name, failed_reason, attempts_made)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [log.worker, log.jobId, log.jobName, log.error, log.attemptsMade]
    );
  } catch {
    // Silently fail — DLJ table may not exist yet on first deploy
  }
}

// ── Dead letter handler: moves permanently failed jobs to DLQ ────────────

async function sendToDeadLetter(
  queueName: string,
  job: Job,
  error: Error
) {
  try {
    await deadLetterQueue.add(
      'dead-letter',
      {
        originalQueue: queueName,
        originalJobId: job.id || 'unknown',
        originalJobName: job.name,
        payload: job.data || {},
        failedReason: error.message,
        attemptsMade: job.attemptsMade,
        failedAt: new Date().toISOString(),
      },
      {
        jobId: `dlq-${queueName}-${job.id || Date.now()}`,
      }
    );
  } catch (dlqError: any) {
    console.error(`[DLQ] Failed to enqueue dead letter for ${queueName}:${job.id}:`, dlqError.message);
  }
}

// ── General Jobs Worker Processor ────────────────────────────────────────

async function processGeneralJob(job: Job<GeneralJobPayload>) {
  const { type, workspaceId, data } = job.data;

  switch (type) {
    case 'lead_scoring': {
      // Score all customers in workspace based on interaction patterns
      await pool.query(
        `UPDATE customers
         SET lead_score = GREATEST(0, LEAST(100,
           COALESCE(total_calls, 0) * 5 +
           CASE WHEN last_contact_at > NOW() - INTERVAL '7 days' THEN 20 ELSE 0 END +
           CASE WHEN total_calls > 3 THEN 15 ELSE 0 END +
           COALESCE(lead_score, 0) * 0.1
         )),
         updated_at = NOW()
         WHERE workspace_id = $1
           AND (last_contact_at > NOW() - INTERVAL '30 days' OR lead_score > 0)`,
        [workspaceId]
      );
      break;
    }

    case 'invoice_reminder': {
      // Placeholder: will be implemented in Phase 5 (Invoicing)
      console.log(`[GeneralJobs] Invoice reminder for workspace ${workspaceId}:`, data);
      break;
    }

    case 'review_request': {
      // Placeholder: will be implemented when review management is built
      console.log(`[GeneralJobs] Review request for workspace ${workspaceId}:`, data);
      break;
    }

    case 'cleanup': {
      // Clean up old execution events (>30 days, already processed)
      const result = await pool.query(
        `DELETE FROM execution_events
         WHERE workspace_id = $1
           AND status = 'processed'
           AND created_at < NOW() - INTERVAL '30 days'`,
        [workspaceId]
      );
      console.log(`[GeneralJobs] Cleaned ${result.rowCount} old execution events for ${workspaceId}`);
      break;
    }

    case 'data_export':
    case 'scheduled_report': {
      // Placeholder for future features
      console.log(`[GeneralJobs] ${type} for workspace ${workspaceId}:`, data);
      break;
    }

    default: {
      console.warn(`[GeneralJobs] Unknown job type: ${type}`);
    }
  }
}

// ── Dead Letter Worker ───────────────────────────────────────────────────

async function processDeadLetter(job: Job<DeadLetterPayload>) {
  const { originalQueue, originalJobId, originalJobName, failedReason, attemptsMade, failedAt } = job.data;

  // Persist to DB for dashboard visibility
  try {
    await pool.query(
      `INSERT INTO dead_letter_jobs
         (original_queue, original_job_id, original_job_name, payload, failed_reason, attempts_made, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT DO NOTHING`,
      [
        originalQueue,
        originalJobId,
        originalJobName,
        JSON.stringify(job.data.payload || {}),
        failedReason,
        attemptsMade,
        failedAt,
      ]
    );
  } catch (dbError: any) {
    // DLJ table may not exist yet
    console.error(`[DLQ] Failed to persist dead letter job:`, dbError.message);
  }

  console.warn(
    `[DLQ] Dead letter: ${originalQueue}:${originalJobId} (${originalJobName}) ` +
    `failed after ${attemptsMade} attempts: ${failedReason}`
  );
}

// ── Start All Workers ────────────────────────────────────────────────────

export function startV2ExecutionWorkers() {
  if (workersStarted) {
    return;
  }

  workersStarted = true;

  // 1. Voice Post-Call Worker (concurrency: 2)
  const voicePostCallWorker = new Worker<VoicePostCallJobPayload>(
    VOICE_POST_CALL_QUEUE,
    async (job) => {
      await campaignService.processCompletedCallJob(pool, job.data);
    },
    {
      connection: bullConnection,
      concurrency: 2,
    }
  );

  // 2. Automation Actions Worker (concurrency: 5)
  const automationActionsWorker = new Worker<AutomationActionJobPayload>(
    AUTOMATION_ACTIONS_QUEUE,
    async (job) => {
      await automationEngine.processExecutionEvent(job.data.eventId);
    },
    {
      connection: bullConnection,
      concurrency: 5,
    }
  );

  // 3. General Jobs Worker (concurrency: 3) — NEW
  const generalJobsWorker = new Worker<GeneralJobPayload>(
    GENERAL_JOBS_QUEUE,
    processGeneralJob,
    {
      connection: bullConnection,
      concurrency: 3,
    }
  );

  // 4. Dead Letter Worker (concurrency: 1) — NEW
  const deadLetterWorker = new Worker<DeadLetterPayload>(
    DEAD_LETTER_QUEUE,
    processDeadLetter,
    {
      connection: bullConnection,
      concurrency: 1,
    }
  );

  // ── Attach event handlers to ALL workers ──────────────────────────────

  const allWorkers = [
    { worker: voicePostCallWorker, name: VOICE_POST_CALL_QUEUE },
    { worker: automationActionsWorker, name: AUTOMATION_ACTIONS_QUEUE },
    { worker: generalJobsWorker, name: GENERAL_JOBS_QUEUE },
    { worker: deadLetterWorker, name: DEAD_LETTER_QUEUE },
  ];

  for (const { worker, name } of allWorkers) {
    // Structured error logging on failure
    worker.on('failed', (job, error) => {
      const log: WorkerErrorLog = {
        worker: name,
        jobId: job?.id || 'unknown',
        jobName: job?.name || 'unknown',
        error: error.message,
        attemptsMade: job?.attemptsMade || 0,
        timestamp: new Date().toISOString(),
      };

      logWorkerError(log);

      // If this was the final attempt, send to dead letter queue
      // (but not for the DLQ worker itself to avoid infinite loop)
      if (name !== DEAD_LETTER_QUEUE && job) {
        const maxAttempts = (job.opts?.attempts ?? 1);
        if (job.attemptsMade >= maxAttempts) {
          sendToDeadLetter(name, job, error);
          persistWorkerError(log);
        }
      }
    });

    // Completion logging (sampled for high-throughput queues)
    worker.on('completed', (job) => {
      // Only log every 100th completion to avoid log spam
      if (Math.random() < 0.01) {
        console.log(`[Worker:${name}] Job ${job.id} completed (sampled log)`);
      }
    });

    workers.push(worker);
  }

  console.log(
    '[V2ExecutionWorkers] Started 4 workers: ' +
    'voice_post_call(2), automation_actions(5), general_jobs(3), dead_letter(1)'
  );
}

// ── Graceful Shutdown ────────────────────────────────────────────────────

export async function stopV2ExecutionWorkers() {
  console.log('[V2ExecutionWorkers] Shutting down workers...');
  await Promise.allSettled(workers.map((w) => w.close()));
  console.log('[V2ExecutionWorkers] All workers stopped');
}
