import { Worker, Job } from 'bullmq';
import { pool } from '../config/db.js';
import {
  AUTOMATION_ACTIONS_QUEUE,
  VOICE_POST_CALL_QUEUE,
  GENERAL_JOBS_QUEUE,
  DEAD_LETTER_QUEUE,
  automationActionsQueue,
  bullConnection,
  deadLetterQueue,
  type VoicePostCallJobPayload,
  type AutomationActionJobPayload,
  type AutomationActionExecuteJobPayload,
  type GeneralJobPayload,
  type DeadLetterPayload,
} from '../queues/execution-queues.js';
import { campaignService } from '../services/campaign.service.js';
import { automationEngine } from '../modules/automation/automation.service.js';
import {
  appendWorkflowStepLog,
  flushWorkflowStepLogs,
} from '../modules/automation/workflow-step-log.service.js';

let workersStarted = false;
const workers: Worker[] = [];

function normalizePositiveIntegerFromEnv(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.trunc(parsed);
}

const DEFAULT_WORKFLOW_RECOVERY_STALE_MINUTES = 15;
const DEFAULT_WORKFLOW_RECOVERY_MAX_RUNS = 100;
const LIVE_AUTOMATION_QUEUE_STATES = new Set(['waiting', 'waiting-children', 'delayed', 'active', 'prioritized']);
const VOICE_POST_CALL_WORKER_CONCURRENCY = normalizePositiveIntegerFromEnv(
  process.env.VOICE_POST_CALL_WORKER_CONCURRENCY,
  2
);
const AUTOMATION_ACTIONS_WORKER_CONCURRENCY = normalizePositiveIntegerFromEnv(
  process.env.AUTOMATION_ACTIONS_WORKER_CONCURRENCY,
  5
);
const GENERAL_JOBS_WORKER_CONCURRENCY = normalizePositiveIntegerFromEnv(
  process.env.GENERAL_JOBS_WORKER_CONCURRENCY,
  3
);
const DEAD_LETTER_WORKER_CONCURRENCY = normalizePositiveIntegerFromEnv(
  process.env.DEAD_LETTER_WORKER_CONCURRENCY,
  1
);

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

async function markAutomationJobRefFailed(job: Job<AutomationActionJobPayload>, error: Error) {
  if (!job?.data || job.data.jobType !== 'execute_action') {
    return;
  }

  const actionJob = job.data as AutomationActionExecuteJobPayload;
  const delayBucketSeconds = Number(actionJob.actionDelaySeconds || 0);
  const stepIndex = Number(actionJob.actionStepIndex || 0);
  const workflowRunId =
    typeof actionJob.workflowRunId === 'string' && actionJob.workflowRunId.trim().length > 0
      ? actionJob.workflowRunId.trim()
      : null;

  try {
    const result = await pool.query(
      `UPDATE automation_job_refs
       SET status = 'failed',
           error_message = $5,
           updated_at = NOW()
       WHERE event_id = $1::uuid
         AND rule_id = $2::uuid
         AND delay_bucket_seconds = $3
         AND step_index = $4
         AND ($6::uuid IS NULL OR workflow_run_id = $6::uuid)
         AND status = 'scheduled'
       RETURNING workflow_run_id, workspace_id, event_id, rule_id, step_index, action_type`,
      [
        actionJob.eventId,
        String(actionJob.rule?.id || ''),
        Number.isFinite(delayBucketSeconds) && delayBucketSeconds > 0 ? Math.trunc(delayBucketSeconds) : 0,
        Number.isFinite(stepIndex) && stepIndex > 0 ? Math.trunc(stepIndex) : 0,
        error.message,
        workflowRunId,
      ]
    );

    const row = result.rows[0];
    if (row?.workflow_run_id) {
      await appendWorkflowStepLog({
        workflowRunId: row.workflow_run_id,
        workspaceId: row.workspace_id,
        eventId: row.event_id,
        ruleId: row.rule_id,
        stepIndex: Number(row.step_index || 0),
        actionType: String(row.action_type || actionJob.rule?.action_type || 'unknown'),
        status: 'failed',
        inputPayload: {
          source: 'worker_final_failure',
          attemptsMade: Number(job.attemptsMade || 0),
        },
        outputPayload: {},
        errorMessage: error.message,
      });

      await pool.query(
        `UPDATE workflow_runs
         SET status = 'failed',
             completed_at = COALESCE(completed_at, NOW()),
             updated_at = NOW()
         WHERE id = $1::uuid`,
        [row.workflow_run_id]
      );
    }
  } catch (dbError: any) {
    console.error('[Worker:automation_actions] Failed to persist automation_job_refs failure:', dbError.message);
  }
}

function normalizePositiveInteger(value: any, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.trunc(parsed);
}

type WorkflowRunTerminalStatus = 'completed' | 'failed' | 'cancelled' | 'running';

function resolveWorkflowRunStatusFromRefs(statuses: string[]): WorkflowRunTerminalStatus {
  if (statuses.length === 0) {
    return 'failed';
  }

  const normalized = statuses.map((status) => String(status || '').toLowerCase());

  if (normalized.includes('scheduled')) {
    return 'running';
  }

  if (normalized.includes('failed')) {
    return 'failed';
  }

  if (normalized.every((status) => status === 'cancelled')) {
    return 'cancelled';
  }

  if (normalized.every((status) => ['executed', 'skipped', 'cancelled'].includes(status))) {
    return 'completed';
  }

  return 'failed';
}

async function appendWorkflowRecoveryStepFailureLog(input: {
  workflowRunId: string;
  workspaceId: string;
  eventId: string;
  ruleId: string;
  stepIndex: number;
  actionType: string;
  errorMessage: string;
  queueJobId?: string | null;
  queueState?: string | null;
}) {
  await appendWorkflowStepLog({
    workflowRunId: input.workflowRunId,
    workspaceId: input.workspaceId,
    eventId: input.eventId,
    ruleId: input.ruleId,
    stepIndex: input.stepIndex,
    actionType: input.actionType,
    status: 'failed',
    inputPayload: {
      source: 'workflow_recovery',
      queueJobId: input.queueJobId || null,
      queueState: input.queueState || null,
    },
    outputPayload: {},
    errorMessage: input.errorMessage,
  });
}

async function reconcileStaleWorkflowRuns(input: {
  staleMinutes: number;
  maxRuns: number;
  workspaceId?: string | null;
}) {
  const workspaceFilter = input.workspaceId && input.workspaceId !== 'system'
    ? input.workspaceId
    : null;

  const lockKey = 'workflow-recovery-lock';
  const lockResult = await pool.query(
    'SELECT pg_try_advisory_lock(hashtext($1)) AS acquired',
    [lockKey]
  );

  if (!lockResult.rows[0]?.acquired) {
    return {
      scanned: 0,
      runsRecovered: 0,
      runsFailed: 0,
      runsCompleted: 0,
      runsCancelled: 0,
      skippedBecauseLocked: true,
    };
  }

  try {
    const staleRunsResult = await pool.query(
      `WITH candidate_runs AS (
         SELECT
           wr.id,
           wr.workspace_id,
           wr.event_id,
           wr.rule_id,
           GREATEST(
             wr.updated_at,
             wr.started_at,
             COALESCE(
               (SELECT MAX(r.updated_at)
                FROM automation_job_refs r
                WHERE r.workflow_run_id = wr.id),
               'epoch'::timestamptz
             ),
             COALESCE(
               (SELECT MAX(l.created_at)
                FROM workflow_step_logs l
                WHERE l.workflow_run_id = wr.id),
               'epoch'::timestamptz
             )
           ) AS last_activity_at
         FROM workflow_runs wr
         WHERE wr.status = 'running'
           AND ($1::text IS NULL OR wr.workspace_id = $1)
       )
       SELECT id, workspace_id, event_id, rule_id, last_activity_at
       FROM candidate_runs
       WHERE last_activity_at < NOW() - ($2 || ' minutes')::interval
       ORDER BY last_activity_at ASC
       LIMIT $3`,
      [workspaceFilter, String(input.staleMinutes), input.maxRuns]
    );

    let runsRecovered = 0;
    let runsFailed = 0;
    let runsCompleted = 0;
    let runsCancelled = 0;

    for (const run of staleRunsResult.rows) {
      const refsResult = await pool.query(
        `SELECT id, queue_job_id, step_index, action_type, status
         FROM automation_job_refs
         WHERE workflow_run_id = $1::uuid
         ORDER BY step_index ASC`,
        [run.id]
      );

      if (refsResult.rows.length === 0) {
        await pool.query(
          `UPDATE workflow_runs
           SET status = 'failed',
               completed_at = COALESCE(completed_at, NOW()),
               updated_at = NOW()
           WHERE id = $1::uuid`,
          [run.id]
        );
        runsFailed += 1;
        continue;
      }

      let hasLiveScheduledWork = false;

      for (const ref of refsResult.rows) {
        if (String(ref.status || '') !== 'scheduled') {
          continue;
        }

        let queueState: string | null = null;
        try {
          const queuedJob = await automationActionsQueue.getJob(String(ref.queue_job_id || ''));
          if (queuedJob) {
            queueState = await queuedJob.getState();
          }
        } catch (error: any) {
          queueState = null;
          console.error('[WorkflowRecovery] Queue state read failed:', error?.message || error);
        }

        if (queueState && LIVE_AUTOMATION_QUEUE_STATES.has(queueState)) {
          hasLiveScheduledWork = true;
          continue;
        }

        const errorMessage = queueState
          ? `Scheduled step queue state is ${queueState}; marking failed during recovery.`
          : 'Scheduled step queue job missing during recovery scan.';

        const updateRefResult = await pool.query(
          `UPDATE automation_job_refs
           SET status = 'failed',
               error_message = $2,
               updated_at = NOW()
           WHERE id = $1::uuid
             AND status = 'scheduled'`,
          [ref.id, errorMessage]
        );

        if (updateRefResult.rowCount && updateRefResult.rowCount > 0) {
          await appendWorkflowRecoveryStepFailureLog({
            workflowRunId: String(run.id),
            workspaceId: String(run.workspace_id),
            eventId: String(run.event_id),
            ruleId: String(run.rule_id),
            stepIndex: Number(ref.step_index || 0),
            actionType: String(ref.action_type || 'unknown'),
            errorMessage,
            queueJobId: ref.queue_job_id || null,
            queueState,
          });
        }
      }

      if (hasLiveScheduledWork) {
        await pool.query(
          `UPDATE workflow_runs
           SET updated_at = NOW()
           WHERE id = $1::uuid`,
          [run.id]
        );
        runsRecovered += 1;
        continue;
      }

      const finalStatusResult = await pool.query(
        `SELECT status
         FROM automation_job_refs
         WHERE workflow_run_id = $1::uuid`,
        [run.id]
      );

      const resolvedStatus = resolveWorkflowRunStatusFromRefs(
        finalStatusResult.rows.map((row) => String(row.status || ''))
      );

      if (resolvedStatus === 'running') {
        await pool.query(
          `UPDATE workflow_runs
           SET updated_at = NOW()
           WHERE id = $1::uuid`,
          [run.id]
        );
        runsRecovered += 1;
        continue;
      }

      await pool.query(
        `UPDATE workflow_runs
         SET status = $2,
             completed_at = COALESCE(completed_at, NOW()),
             updated_at = NOW()
         WHERE id = $1::uuid`,
        [run.id, resolvedStatus]
      );

      if (resolvedStatus === 'failed') runsFailed += 1;
      if (resolvedStatus === 'completed') runsCompleted += 1;
      if (resolvedStatus === 'cancelled') runsCancelled += 1;
    }

    return {
      scanned: staleRunsResult.rows.length,
      runsRecovered,
      runsFailed,
      runsCompleted,
      runsCancelled,
      skippedBecauseLocked: false,
    };
  } finally {
    await pool.query('SELECT pg_advisory_unlock(hashtext($1))', [lockKey]);
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
    case 'workflow_recovery': {
      const staleMinutes = normalizePositiveInteger(
        data?.staleMinutes ?? process.env.WORKFLOW_RECOVERY_STALE_MINUTES,
        DEFAULT_WORKFLOW_RECOVERY_STALE_MINUTES
      );
      const maxRuns = normalizePositiveInteger(
        data?.maxRuns ?? process.env.WORKFLOW_RECOVERY_MAX_RUNS,
        DEFAULT_WORKFLOW_RECOVERY_MAX_RUNS
      );

      const summary = await reconcileStaleWorkflowRuns({
        staleMinutes,
        maxRuns,
        workspaceId: workspaceId || null,
      });

      console.log(
        `[GeneralJobs] workflow_recovery scanned=${summary.scanned} ` +
        `recovered=${summary.runsRecovered} failed=${summary.runsFailed} ` +
        `completed=${summary.runsCompleted} cancelled=${summary.runsCancelled} ` +
        `locked=${summary.skippedBecauseLocked}`
      );
      break;
    }

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
      concurrency: VOICE_POST_CALL_WORKER_CONCURRENCY,
    }
  );

  // 2. Automation Actions Worker (concurrency: 5)
  const automationActionsWorker = new Worker<AutomationActionJobPayload>(
    AUTOMATION_ACTIONS_QUEUE,
    async (job) => {
      if (job.data.jobType === 'execute_action') {
        const actionJob = job.data as AutomationActionExecuteJobPayload;
        await automationEngine.executeQueuedAction(
          actionJob.rule,
          actionJob.context,
          actionJob.eventId,
          {
            workflowRunId: actionJob.workflowRunId,
            actionDelaySeconds: actionJob.actionDelaySeconds,
            actionStepIndex: actionJob.actionStepIndex,
          }
        );
        return;
      }

      await automationEngine.processExecutionEvent(job.data.eventId);
    },
    {
      connection: bullConnection,
      concurrency: AUTOMATION_ACTIONS_WORKER_CONCURRENCY,
    }
  );

  // 3. General Jobs Worker (concurrency: 3) — NEW
  const generalJobsWorker = new Worker<GeneralJobPayload>(
    GENERAL_JOBS_QUEUE,
    processGeneralJob,
    {
      connection: bullConnection,
      concurrency: GENERAL_JOBS_WORKER_CONCURRENCY,
    }
  );

  // 4. Dead Letter Worker (concurrency: 1) — NEW
  const deadLetterWorker = new Worker<DeadLetterPayload>(
    DEAD_LETTER_QUEUE,
    processDeadLetter,
    {
      connection: bullConnection,
      concurrency: DEAD_LETTER_WORKER_CONCURRENCY,
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
          if (name === AUTOMATION_ACTIONS_QUEUE) {
            markAutomationJobRefFailed(job as Job<AutomationActionJobPayload>, error);
          }
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
    `voice_post_call(${VOICE_POST_CALL_WORKER_CONCURRENCY}), ` +
    `automation_actions(${AUTOMATION_ACTIONS_WORKER_CONCURRENCY}), ` +
    `general_jobs(${GENERAL_JOBS_WORKER_CONCURRENCY}), ` +
    `dead_letter(${DEAD_LETTER_WORKER_CONCURRENCY})`
  );
}

// ── Graceful Shutdown ────────────────────────────────────────────────────

export async function stopV2ExecutionWorkers() {
  console.log('[V2ExecutionWorkers] Shutting down workers...');
  await Promise.allSettled(workers.map((w) => w.close()));
  await flushWorkflowStepLogs();
  console.log('[V2ExecutionWorkers] All workers stopped');
}
