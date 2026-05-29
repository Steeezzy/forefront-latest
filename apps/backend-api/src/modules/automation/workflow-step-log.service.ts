import { pool } from '../../config/db.js';

export type WorkflowStepLogStatus =
  | 'scheduled'
  | 'executing'
  | 'executed'
  | 'failed'
  | 'skipped'
  | 'cancelled';

export interface WorkflowStepLogInput {
  workflowRunId: string;
  workspaceId: string;
  eventId: string;
  ruleId: string;
  stepIndex: number;
  actionType: string;
  status: WorkflowStepLogStatus;
  inputPayload?: Record<string, unknown>;
  outputPayload?: Record<string, unknown>;
  errorMessage?: string | null;
}

interface BufferedWorkflowStepLog {
  workflowRunId: string;
  workspaceId: string;
  eventId: string;
  ruleId: string;
  stepIndex: number;
  actionType: string;
  status: WorkflowStepLogStatus;
  inputPayload: string;
  outputPayload: string;
  errorMessage: string | null;
  createdAtIso: string;
}

const DEFAULT_BATCH_SIZE = 200;
const DEFAULT_FLUSH_INTERVAL_MS = 50;
const DEFAULT_SKIP_EXECUTING_STEP_LOGS = true;

function normalizeEnvInt(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

function normalizeEnvBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') {
    return true;
  }

  if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') {
    return false;
  }

  return fallback;
}

const WORKFLOW_STEP_LOG_BATCH_SIZE = normalizeEnvInt(
  process.env.WORKFLOW_STEP_LOG_BATCH_SIZE,
  DEFAULT_BATCH_SIZE,
  1,
  1000
);

const WORKFLOW_STEP_LOG_FLUSH_INTERVAL_MS = normalizeEnvInt(
  process.env.WORKFLOW_STEP_LOG_FLUSH_INTERVAL_MS,
  DEFAULT_FLUSH_INTERVAL_MS,
  10,
  5000
);

const WORKFLOW_SKIP_EXECUTING_STEP_LOGS = normalizeEnvBoolean(
  process.env.WORKFLOW_SKIP_EXECUTING_STEP_LOGS,
  DEFAULT_SKIP_EXECUTING_STEP_LOGS
);

const bufferedStepLogs: BufferedWorkflowStepLog[] = [];
let flushTimer: NodeJS.Timeout | null = null;
let inFlightFlush: Promise<void> | null = null;
let processHookRegistered = false;

function toBufferedStepLog(input: WorkflowStepLogInput): BufferedWorkflowStepLog {
  return {
    workflowRunId: input.workflowRunId,
    workspaceId: input.workspaceId,
    eventId: input.eventId,
    ruleId: input.ruleId,
    stepIndex: Number.isFinite(Number(input.stepIndex)) ? Math.trunc(Number(input.stepIndex)) : 0,
    actionType: String(input.actionType || 'unknown'),
    status: input.status,
    inputPayload: JSON.stringify(input.inputPayload || {}),
    outputPayload: JSON.stringify(input.outputPayload || {}),
    errorMessage: input.errorMessage || null,
    createdAtIso: new Date().toISOString(),
  };
}

function scheduleFlush() {
  if (flushTimer) {
    return;
  }

  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushWorkflowStepLogs();
  }, WORKFLOW_STEP_LOG_FLUSH_INTERVAL_MS);
}

function buildBulkInsert(batch: BufferedWorkflowStepLog[]) {
  const values: string[] = [];
  const params: Array<string | number | null> = [];

  batch.forEach((entry, index) => {
    const base = index * 11;
    values.push(
      `($${base + 1}::uuid, $${base + 2}, $${base + 3}::uuid, $${base + 4}::uuid, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}::jsonb, $${base + 9}::jsonb, $${base + 10}, $${base + 11}::timestamptz)`
    );

    params.push(
      entry.workflowRunId,
      entry.workspaceId,
      entry.eventId,
      entry.ruleId,
      entry.stepIndex,
      entry.actionType,
      entry.status,
      entry.inputPayload,
      entry.outputPayload,
      entry.errorMessage,
      entry.createdAtIso
    );
  });

  return {
    sql: `INSERT INTO workflow_step_logs (
      workflow_run_id,
      workspace_id,
      event_id,
      rule_id,
      step_index,
      action_type,
      status,
      input,
      output,
      error,
      created_at
    ) VALUES ${values.join(', ')}`,
    params,
  };
}

export async function flushWorkflowStepLogs(): Promise<void> {
  if (inFlightFlush) {
    await inFlightFlush;
    return;
  }

  if (bufferedStepLogs.length === 0) {
    return;
  }

  inFlightFlush = (async () => {
    while (bufferedStepLogs.length > 0) {
      const batch = bufferedStepLogs.splice(0, WORKFLOW_STEP_LOG_BATCH_SIZE);

      try {
        const { sql, params } = buildBulkInsert(batch);
        await pool.query(sql, params);
      } catch (error: any) {
        bufferedStepLogs.unshift(...batch);
        console.error('[Automation] Failed to persist workflow_step_logs batch:', error?.message || error);
        break;
      }
    }
  })();

  try {
    await inFlightFlush;
  } finally {
    inFlightFlush = null;
    if (bufferedStepLogs.length > 0) {
      scheduleFlush();
    }
  }
}

function ensureProcessHook() {
  if (processHookRegistered) {
    return;
  }

  processHookRegistered = true;
  process.once('beforeExit', () => {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }

    void flushWorkflowStepLogs();
  });
}

export async function appendWorkflowStepLog(input: WorkflowStepLogInput): Promise<void> {
  try {
    if (WORKFLOW_SKIP_EXECUTING_STEP_LOGS && input.status === 'executing') {
      return;
    }

    ensureProcessHook();
    bufferedStepLogs.push(toBufferedStepLog(input));

    if (bufferedStepLogs.length >= WORKFLOW_STEP_LOG_BATCH_SIZE) {
      await flushWorkflowStepLogs();
      return;
    }

    scheduleFlush();
  } catch (error: any) {
    console.error('[Automation] Failed to enqueue workflow_step_log:', error?.message || error);
  }
}
