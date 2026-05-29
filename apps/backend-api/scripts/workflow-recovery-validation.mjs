import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import IORedis from 'ioredis';
import { Queue } from 'bullmq';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8000';
const GENERAL_JOBS_QUEUE = 'general_jobs';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`POST ${url} failed (${response.status}): ${JSON.stringify(data)}`);
  }

  return data;
}

async function createWorkspace() {
  const payload = {
    industryId: 'dental',
    businessName: 'Workflow Recovery Validation Clinic',
    name: 'Workflow Recovery Validation Clinic',
    phone: '+15550009999',
    timezone: 'US/Eastern',
  };

  const workspace = await postJson(`${API_BASE}/api/workspace/create`, payload);
  if (!workspace?.id) {
    throw new Error(`Workspace create did not return id: ${JSON.stringify(workspace)}`);
  }

  return workspace.id;
}

async function ensureService(pool, workspaceId, name) {
  const existing = await pool.query(
    'SELECT id FROM services WHERE workspace_id = $1 AND lower(name) = lower($2) LIMIT 1',
    [workspaceId, name]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const inserted = await pool.query(
    'INSERT INTO services (workspace_id, name, duration, price, is_active, metadata) VALUES ($1, $2, 30, 500, true, $3::jsonb) RETURNING id',
    [workspaceId, name, JSON.stringify({ aliases: [] })]
  );

  return inserted.rows[0].id;
}

async function createRule(workspaceId, serviceId) {
  const response = await postJson(`${API_BASE}/api/automation/rules`, {
    workspaceId,
    triggerType: 'appointment_created',
    conditions: {
      service_id: serviceId,
    },
    actionType: 'tag_customer',
    actionConfig: {
      tag: 'workflow_recovery_validation',
      delay_seconds: 900,
    },
    priority: 80,
    executionMode: 'stop_on_match',
  });

  if (!response?.success || !response?.data?.id) {
    throw new Error(`Rule create response invalid: ${JSON.stringify(response)}`);
  }

  return response.data;
}

async function enqueueWorkflowRecovery(redisUrl) {
  const redis = new IORedis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  const queue = new Queue(GENERAL_JOBS_QUEUE, { connection: redis });

  try {
    await queue.add(
      'workflow-recovery',
      {
        type: 'workflow_recovery',
        workspaceId: 'system',
        data: {
          staleMinutes: 1,
          maxRuns: 20,
        },
      },
      {
        jobId: `workflow-recovery-validation-${Date.now()}`,
      }
    );
  } finally {
    await queue.close();
    await redis.quit();
  }
}

async function waitForWorkflowRunStatus(pool, workflowRunId, expectedStatus) {
  const timeoutMs = 20000;
  const pollMs = 250;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const result = await pool.query(
      `SELECT status, completed_at
       FROM workflow_runs
       WHERE id = $1::uuid
       LIMIT 1`,
      [workflowRunId]
    );

    const status = result.rows[0]?.status;
    if (status === expectedStatus) {
      return result.rows[0];
    }

    await sleep(pollMs);
  }

  throw new Error(`Timed out waiting for workflow_run ${workflowRunId} status=${expectedStatus}`);
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const workspaceId = await createWorkspace();
    const serviceId = await ensureService(pool, workspaceId, 'Cleaning');

    await pool.query(
      'DELETE FROM automation_rules WHERE workspace_id = $1 AND trigger_type = $2',
      [workspaceId, 'appointment_created']
    );

    const rule = await createRule(workspaceId, serviceId);

    const executionEventId = randomUUID();
    await pool.query(
      `INSERT INTO execution_events (
         id,
         workspace_id,
         event_type,
         event_source,
         payload,
         status,
         created_at
       ) VALUES ($1::uuid, $2, 'appointment.created', 'validation', $3::jsonb, 'pending', NOW() - INTERVAL '30 minutes')`,
      [
        executionEventId,
        workspaceId,
        JSON.stringify({ validation: 'workflow_recovery', service_id: serviceId }),
      ]
    );

    const workflowRunId = randomUUID();
    await pool.query(
      `INSERT INTO workflow_runs (
         id,
         workspace_id,
         event_id,
         rule_id,
         status,
         started_at,
         created_at,
         updated_at
       ) VALUES (
         $1::uuid,
         $2,
         $3::uuid,
         $4::uuid,
         'running',
         NOW() - INTERVAL '30 minutes',
         NOW() - INTERVAL '30 minutes',
         NOW() - INTERVAL '30 minutes'
       )`,
      [workflowRunId, workspaceId, executionEventId, rule.id]
    );

    const missingQueueJobId = `missing-workflow-recovery-${randomUUID()}`;
    await pool.query(
      `INSERT INTO automation_job_refs (
         id,
         workflow_run_id,
         workspace_id,
         event_id,
         rule_id,
         step_index,
         queue_job_id,
         action_type,
         delay_bucket_seconds,
         status,
         scheduled_for,
         created_at,
         updated_at
       ) VALUES (
         $1::uuid,
         $2::uuid,
         $3,
         $4::uuid,
         $5::uuid,
         0,
         $6,
         'tag_customer',
         900,
         'scheduled',
         NOW() - INTERVAL '20 minutes',
         NOW() - INTERVAL '30 minutes',
         NOW() - INTERVAL '30 minutes'
       )`,
      [
        randomUUID(),
        workflowRunId,
        workspaceId,
        executionEventId,
        rule.id,
        missingQueueJobId,
      ]
    );

    await enqueueWorkflowRecovery(process.env.REDIS_URL);

    const run = await waitForWorkflowRunStatus(pool, workflowRunId, 'failed');

    const refResult = await pool.query(
      `SELECT status, error_message
       FROM automation_job_refs
       WHERE workflow_run_id = $1::uuid
       ORDER BY step_index ASC
       LIMIT 1`,
      [workflowRunId]
    );

    const stepLogResult = await pool.query(
      `SELECT status,
              error,
              input->>'source' AS source,
              input->>'queueJobId' AS queue_job_id,
              input->>'queueState' AS queue_state
       FROM workflow_step_logs
       WHERE workflow_run_id = $1::uuid
       ORDER BY created_at DESC
       LIMIT 1`,
      [workflowRunId]
    );

    const ref = refResult.rows[0];
    const stepLog = stepLogResult.rows[0];

    if (!ref || ref.status !== 'failed') {
      throw new Error(`Expected recovered ref status failed. Found ${JSON.stringify(ref)}`);
    }

    if (!stepLog || stepLog.status !== 'failed' || stepLog.source !== 'workflow_recovery') {
      throw new Error(`Expected workflow_recovery failed step log. Found ${JSON.stringify(stepLog)}`);
    }

    console.log(JSON.stringify({
      workspaceId,
      ruleId: rule.id,
      executionEventId,
      workflowRunId,
      workflowRunStatus: run.status,
      workflowRunCompletedAt: run.completed_at,
      ref,
      stepLog,
    }, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
