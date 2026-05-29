import { performance } from 'node:perf_hooks';
import { pool } from '../../config/db.js';
import { automationActionsQueue, redisConnection } from '../../queues/execution-queues.js';

type PressureMode = 'open' | 'soft' | 'hard';

type BackpressureSnapshot = {
  sampledAt: string;
  queueWaiting: number;
  queueDelayed: number;
  queueActive: number;
  dbProbeMs: number;
  dbProbeP95Ms: number;
};

export type AutomationIngressDecision = {
  allowed: boolean;
  statusCode?: 429 | 503;
  reason: string;
  mode: PressureMode;
  deferMs: number;
  retryAfterMs: number;
  snapshot: BackpressureSnapshot;
};

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

function percentile(values: number[], p: number) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const clamped = Math.max(0, Math.min(1, p));
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * clamped)));
  return sorted[index];
}

const BACKPRESSURE_ENABLED = normalizeEnvBoolean(
  process.env.AUTOMATION_BACKPRESSURE_ENABLED,
  true
);

const SAMPLE_INTERVAL_MS = normalizeEnvInt(
  process.env.AUTOMATION_BACKPRESSURE_SAMPLE_MS,
  500,
  100,
  5000
);

const HISTORY_SIZE = normalizeEnvInt(
  process.env.AUTOMATION_BACKPRESSURE_HISTORY_SIZE,
  120,
  10,
  2000
);

const DB_PROBE_SOFT_MS = normalizeEnvInt(
  process.env.AUTOMATION_BP_DB_P95_SOFT_MS,
  700,
  50,
  10000
);

const DB_PROBE_HARD_MS = normalizeEnvInt(
  process.env.AUTOMATION_BP_DB_P95_HARD_MS,
  1200,
  100,
  20000
);

const QUEUE_WAITING_SOFT = normalizeEnvInt(
  process.env.AUTOMATION_BP_QUEUE_WAITING_SOFT,
  4000,
  100,
  500000
);

const QUEUE_WAITING_HARD = normalizeEnvInt(
  process.env.AUTOMATION_BP_QUEUE_WAITING_HARD,
  12000,
  200,
  1000000
);

const QUEUE_DELAYED_HARD = normalizeEnvInt(
  process.env.AUTOMATION_BP_QUEUE_DELAYED_HARD,
  20000,
  200,
  1000000
);

const GLOBAL_RPS_OPEN = normalizeEnvInt(
  process.env.AUTOMATION_BP_GLOBAL_RPS_OPEN,
  320,
  10,
  100000
);

const GLOBAL_RPS_SOFT = normalizeEnvInt(
  process.env.AUTOMATION_BP_GLOBAL_RPS_SOFT,
  240,
  5,
  100000
);

const WORKSPACE_RPS_OPEN = normalizeEnvInt(
  process.env.AUTOMATION_BP_WORKSPACE_RPS_OPEN,
  90,
  1,
  100000
);

const WORKSPACE_RPS_SOFT = normalizeEnvInt(
  process.env.AUTOMATION_BP_WORKSPACE_RPS_SOFT,
  50,
  1,
  100000
);

const SOFT_DEFER_BASE_MS = normalizeEnvInt(
  process.env.AUTOMATION_BP_SOFT_DEFER_BASE_MS,
  60,
  0,
  5000
);

const SOFT_DEFER_MAX_EXTRA_MS = normalizeEnvInt(
  process.env.AUTOMATION_BP_SOFT_DEFER_MAX_EXTRA_MS,
  180,
  0,
  5000
);

const THROTTLE_RETRY_AFTER_MS = normalizeEnvInt(
  process.env.AUTOMATION_BP_RETRY_AFTER_MS,
  1000,
  100,
  30000
);

const dbProbeHistoryMs: number[] = [];
let lastSampleAtMs = 0;
let inFlightSample: Promise<BackpressureSnapshot> | null = null;

let snapshot: BackpressureSnapshot = {
  sampledAt: new Date(0).toISOString(),
  queueWaiting: 0,
  queueDelayed: 0,
  queueActive: 0,
  dbProbeMs: 0,
  dbProbeP95Ms: 0,
};

function toMode(current: BackpressureSnapshot): PressureMode {
  if (
    current.dbProbeP95Ms >= DB_PROBE_HARD_MS ||
    current.queueWaiting >= QUEUE_WAITING_HARD ||
    current.queueDelayed >= QUEUE_DELAYED_HARD
  ) {
    return 'hard';
  }

  if (
    current.dbProbeP95Ms >= DB_PROBE_SOFT_MS ||
    current.queueWaiting >= QUEUE_WAITING_SOFT
  ) {
    return 'soft';
  }

  return 'open';
}

function getRateLimits(mode: PressureMode) {
  if (mode === 'soft') {
    return {
      globalRps: GLOBAL_RPS_SOFT,
      workspaceRps: WORKSPACE_RPS_SOFT,
    };
  }

  return {
    globalRps: GLOBAL_RPS_OPEN,
    workspaceRps: WORKSPACE_RPS_OPEN,
  };
}

async function sampleSnapshot(): Promise<BackpressureSnapshot> {
  const sampledAt = new Date().toISOString();
  let queueWaiting = 0;
  let queueDelayed = 0;
  let queueActive = 0;

  try {
    const [waitingCount, delayedCount, activeCount] = await Promise.all([
      automationActionsQueue.getWaitingCount(),
      automationActionsQueue.getDelayedCount(),
      automationActionsQueue.getActiveCount(),
    ]);

    queueWaiting = Number(waitingCount || 0);
    queueDelayed = Number(delayedCount || 0);
    queueActive = Number(activeCount || 0);
  } catch (error: any) {
    console.error('[Backpressure] Queue probe failed:', error?.message || error);
    queueWaiting = QUEUE_WAITING_HARD;
    queueDelayed = QUEUE_DELAYED_HARD;
  }

  const dbStartedAt = performance.now();
  let dbProbeMs = DB_PROBE_HARD_MS + 250;

  try {
    await pool.query('SELECT 1');
    dbProbeMs = performance.now() - dbStartedAt;
  } catch (error: any) {
    console.error('[Backpressure] DB probe failed:', error?.message || error);
  }

  dbProbeHistoryMs.push(dbProbeMs);
  while (dbProbeHistoryMs.length > HISTORY_SIZE) {
    dbProbeHistoryMs.shift();
  }

  snapshot = {
    sampledAt,
    queueWaiting,
    queueDelayed,
    queueActive,
    dbProbeMs,
    dbProbeP95Ms: percentile(dbProbeHistoryMs, 0.95),
  };

  lastSampleAtMs = Date.now();
  return snapshot;
}

async function getSnapshot(): Promise<BackpressureSnapshot> {
  if (!BACKPRESSURE_ENABLED) {
    return snapshot;
  }

  const now = Date.now();
  if (now - lastSampleAtMs < SAMPLE_INTERVAL_MS) {
    return snapshot;
  }

  if (inFlightSample) {
    return inFlightSample;
  }

  inFlightSample = sampleSnapshot();

  try {
    return await inFlightSample;
  } finally {
    inFlightSample = null;
  }
}

async function consumeRateBudget(workspaceId: string, mode: PressureMode) {
  const limits = getRateLimits(mode);
  const bucket = Math.floor(Date.now() / 1000);
  const globalKey = `bp:automation:global:${bucket}`;
  const workspaceKey = `bp:automation:workspace:${workspaceId}:${bucket}`;

  try {
    const txResult = await redisConnection
      .multi()
      .incr(globalKey)
      .expire(globalKey, 5)
      .incr(workspaceKey)
      .expire(workspaceKey, 5)
      .exec();

    const globalCount = Number(txResult?.[0]?.[1] || 0);
    const workspaceCount = Number(txResult?.[2]?.[1] || 0);

    if (globalCount > limits.globalRps) {
      return {
        allowed: false,
        reason: 'global_rate_limit',
      };
    }

    if (workspaceCount > limits.workspaceRps) {
      return {
        allowed: false,
        reason: 'workspace_rate_limit',
      };
    }

    return {
      allowed: true,
      reason: 'ok',
    };
  } catch (error: any) {
    console.error('[Backpressure] Redis rate limiter failed (fail-open):', error?.message || error);
    return {
      allowed: true,
      reason: 'redis_rate_limiter_unavailable',
    };
  }
}

export async function evaluateAutomationIngress(workspaceId: string): Promise<AutomationIngressDecision> {
  if (!BACKPRESSURE_ENABLED) {
    return {
      allowed: true,
      reason: 'backpressure_disabled',
      mode: 'open',
      deferMs: 0,
      retryAfterMs: 0,
      snapshot,
    };
  }

  const current = await getSnapshot();
  const mode = toMode(current);

  if (mode === 'hard') {
    return {
      allowed: false,
      statusCode: 503,
      reason: 'hard_pressure',
      mode,
      deferMs: 0,
      retryAfterMs: THROTTLE_RETRY_AFTER_MS,
      snapshot: current,
    };
  }

  const budget = await consumeRateBudget(workspaceId, mode);
  if (!budget.allowed) {
    return {
      allowed: false,
      statusCode: 429,
      reason: budget.reason,
      mode,
      deferMs: 0,
      retryAfterMs: THROTTLE_RETRY_AFTER_MS,
      snapshot: current,
    };
  }

  let deferMs = 0;
  if (mode === 'soft') {
    const queuePressure = Math.max(0, current.queueWaiting - QUEUE_WAITING_SOFT) /
      Math.max(1, QUEUE_WAITING_HARD - QUEUE_WAITING_SOFT);
    const dbPressure = Math.max(0, current.dbProbeP95Ms - DB_PROBE_SOFT_MS) /
      Math.max(1, DB_PROBE_HARD_MS - DB_PROBE_SOFT_MS);
    const pressure = Math.max(queuePressure, dbPressure);
    deferMs = SOFT_DEFER_BASE_MS + Math.round(SOFT_DEFER_MAX_EXTRA_MS * pressure);
  }

  return {
    allowed: true,
    reason: 'ok',
    mode,
    deferMs,
    retryAfterMs: 0,
    snapshot: current,
  };
}
