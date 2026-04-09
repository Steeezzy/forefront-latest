import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { Worker } from 'node:worker_threads';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { monitorEventLoopDelay, performance } from 'node:perf_hooks';
import { spawn } from 'node:child_process';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import IORedis from 'ioredis';
import { Queue } from 'bullmq';
import { buildFailureTags, detectBreakpoints, phaseTargetRps } from './report-analysis.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultEnvPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: process.env.HARNESS_ENV_FILE || defaultEnvPath });

const PROFILE_ORDER = ['immediate', 'relative_delay', 'absolute_delay', 'cancellation_heavy'];

const PROFILE_DEFAULTS = {
  immediate: {
    weight: 35,
    cancelProbability: 0.05,
    minActions: 8,
    maxActions: 10,
  },
  relative_delay: {
    weight: 30,
    cancelProbability: 0.15,
    minActions: 9,
    maxActions: 12,
    minDelaySteps: 2,
    maxDelaySteps: 4,
  },
  absolute_delay: {
    weight: 25,
    cancelProbability: 0.25,
    minActions: 10,
    maxActions: 12,
    minAbsoluteSteps: 1,
    maxAbsoluteSteps: 3,
  },
  cancellation_heavy: {
    weight: 10,
    cancelProbability: 0.8,
    minActions: 9,
    maxActions: 12,
    minDelaySteps: 3,
    maxDelaySteps: 5,
  },
};

function seededRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseInteger(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.trunc(parsed);
}

function parsePositiveInteger(value, fallback) {
  const parsed = parseInteger(value, fallback);
  return parsed > 0 ? parsed : fallback;
}

function parsePositiveNumber(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function parseJson(value, fallback) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function parseJsonText(value, fallback) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(String(value));
  } catch {
    return fallback;
  }
}

function parseBoolean(value, fallback) {
  if (value === undefined || value === null) {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }

  if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') {
    return true;
  }

  if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') {
    return false;
  }

  return fallback;
}

function percentile(values, p) {
  if (!values.length) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)));
  return sorted[index];
}

function mergeCountMap(target, source) {
  if (!source || typeof source !== 'object') {
    return;
  }

  for (const [key, value] of Object.entries(source)) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      continue;
    }
    target[key] = (target[key] || 0) + Math.trunc(parsed);
  }
}

function pushWithCap(list, value, cap) {
  if (list.length >= cap) {
    const idx = Math.floor(Math.random() * list.length);
    list[idx] = value;
    return;
  }

  list.push(value);
}

async function postJson(url, body, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(`POST ${url} failed (${response.status}): ${JSON.stringify(data)}`);
    }

    return data;
  } finally {
    clearTimeout(timer);
  }
}

function createConfig() {
  const cpuCount = os.cpus().length;
  const threadsDefault = Math.max(8, Math.min(16, cpuCount));

  const config = {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:8000',
    redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    workflows: parsePositiveInteger(process.env.HARNESS_WORKFLOWS, 10_000),
    threadCount: parsePositiveInteger(process.env.HARNESS_THREADS, threadsDefault),
    inflightPerThread: parsePositiveInteger(process.env.HARNESS_INFLIGHT_PER_THREAD, 250),
    workspaceCount: parsePositiveInteger(process.env.HARNESS_WORKSPACES, 5),
    customersPerWorkspace: parsePositiveInteger(process.env.HARNESS_CUSTOMERS_PER_WORKSPACE, 200),
    templatesPerProfile: parsePositiveInteger(process.env.HARNESS_TEMPLATES_PER_PROFILE, 10),
    failureRatio: Math.min(0.5, Math.max(0, Number(process.env.HARNESS_FAILURE_RATIO || 0.12))),
    conditionalSkipRatio: Math.min(0.6, Math.max(0, Number(process.env.HARNESS_CONDITIONAL_SKIP_RATIO || 0.2))),
    invalidRequestRatio: Math.min(0.5, Math.max(0, Number(process.env.HARNESS_INVALID_REQUEST_RATIO || 0.05))),
    requestTimeoutMs: parsePositiveInteger(process.env.HARNESS_REQUEST_TIMEOUT_MS, 20000),
    cancelDelayMinMs: parsePositiveInteger(process.env.HARNESS_CANCEL_DELAY_MIN_MS, 500),
    cancelDelayMaxMs: parsePositiveInteger(process.env.HARNESS_CANCEL_DELAY_MAX_MS, 15000),
    maxCancelDrainMs: parsePositiveInteger(process.env.HARNESS_MAX_CANCEL_DRAIN_MS, 20000),
    absoluteDelayMinSeconds: parsePositiveInteger(process.env.HARNESS_ABSOLUTE_DELAY_MIN_SECONDS, 120),
    absoluteDelayWindowSeconds: parsePositiveInteger(process.env.HARNESS_ABSOLUTE_DELAY_WINDOW_SECONDS, 3600),
    warmupSeconds: parsePositiveInteger(process.env.HARNESS_WARMUP_SECONDS, 120),
    rampSeconds: parsePositiveInteger(process.env.HARNESS_RAMP_SECONDS, 480),
    steadySeconds: parsePositiveInteger(process.env.HARNESS_STEADY_SECONDS, 900),
    soakSeconds: parsePositiveInteger(process.env.HARNESS_SOAK_SECONDS, 3600),
    warmupRps: parsePositiveNumber(process.env.HARNESS_WARMUP_RPS, 100),
    targetRps: parsePositiveNumber(process.env.HARNESS_TARGET_RPS, 1000),
    soakRps: parsePositiveNumber(process.env.HARNESS_SOAK_RPS, 300),
    metricsSampleSeconds: parsePositiveNumber(process.env.HARNESS_METRICS_SAMPLE_SECONDS, 5),
    stuckWorkflowSeconds: parsePositiveInteger(process.env.HARNESS_STUCK_WORKFLOW_SECONDS, 600),
    seed: parsePositiveInteger(process.env.HARNESS_SEED, 20260405),
    chaosEvents: [],
    chaosPlanJson: process.env.CHAOS_PLAN_JSON || process.env.CHAOS_EVENTS_JSON || '',
    chaosPlanFile: process.env.CHAOS_PLAN_FILE || '',
    chaosPlanPreset: String(process.env.CHAOS_PLAN_PRESET || '').trim().toLowerCase(),
    backendPidFile: process.env.CHAOS_BACKEND_PID_FILE || path.resolve(__dirname, '../../../backend.pid'),
    backendRestartCmd: process.env.CHAOS_BACKEND_RESTART_CMD || '',
    chaosRedisDownCmd: process.env.CHAOS_REDIS_DOWN_CMD || '',
    chaosRedisUpCmd: process.env.CHAOS_REDIS_UP_CMD || '',
    cleanStart: parseBoolean(process.env.HARNESS_CLEAN_START, true),
    cleanDbStart: parseBoolean(process.env.HARNESS_CLEAN_DB_START, true),
    cleanQueueStart: parseBoolean(process.env.HARNESS_CLEAN_QUEUE_START, true),
    cleanExecutionEvents: parseBoolean(process.env.HARNESS_CLEAN_EXECUTION_EVENTS, false),
    cleanupDeleteBatchSize: parsePositiveInteger(process.env.HARNESS_CLEANUP_DELETE_BATCH_SIZE, 5000),
    cleanupExecutionEventsBatchSize: parsePositiveInteger(
      process.env.HARNESS_CLEANUP_EXECUTION_EVENTS_BATCH_SIZE,
      500
    ),
    outputDir: process.env.HARNESS_OUTPUT_DIR || path.resolve(__dirname, 'output'),
  };

  if (config.cancelDelayMaxMs < config.cancelDelayMinMs) {
    config.cancelDelayMaxMs = config.cancelDelayMinMs;
  }

  return config;
}

function normalizeChaosEvent(rawEvent) {
  if (!rawEvent || typeof rawEvent !== 'object') {
    return null;
  }

  const atSec = Math.max(0, Number(rawEvent.atSec ?? rawEvent.t ?? 0));
  const type = String(rawEvent.type || rawEvent.action || '').trim();
  if (!type) {
    return null;
  }

  const normalized = {
    ...rawEvent,
    atSec,
    type,
  };

  delete normalized.t;
  delete normalized.action;
  return normalized;
}

function buildPresetChaosPlan(preset, cfg) {
  const steadyStart = cfg.warmupSeconds + cfg.rampSeconds;
  const soakStart = steadyStart + cfg.steadySeconds;

  if (preset === 'progressive') {
    return [
      { atSec: Math.max(30, Math.floor(steadyStart * 0.5)), type: 'duplicate_events', count: 400 },
      { atSec: Math.max(60, steadyStart), type: 'queue_overload', multiplier: 2.5, durationSec: 120 },
      { atSec: Math.max(120, soakStart), type: 'db_lock_contention', durationSec: 15 },
      { atSec: Math.max(180, soakStart + 60), type: 'force_recovery_scan', staleMinutes: 2, maxRuns: 200 },
    ];
  }

  if (preset === 'aggressive') {
    return [
      { atSec: Math.max(20, Math.floor(steadyStart * 0.25)), type: 'duplicate_events', count: 800 },
      { atSec: Math.max(45, Math.floor(steadyStart * 0.6)), type: 'queue_overload', multiplier: 3.5, durationSec: 180 },
      { atSec: Math.max(90, steadyStart), type: 'db_lock_contention', durationSec: 25 },
      { atSec: Math.max(120, steadyStart + 30), type: 'duplicate_replay', count: 500 },
      { atSec: Math.max(180, soakStart), type: 'force_recovery_scan', staleMinutes: 1, maxRuns: 400 },
    ];
  }

  return [];
}

async function resolveChaosEvents(cfg) {
  let rawPlan = null;
  let source = 'none';

  if (cfg.chaosPlanFile) {
    try {
      const raw = await readFile(cfg.chaosPlanFile, 'utf8');
      rawPlan = parseJsonText(raw, []);
      source = 'file';
    } catch (error) {
      console.warn(
        `[Harness] Failed to read CHAOS_PLAN_FILE ${cfg.chaosPlanFile}: ${error?.message || error}`
      );
    }
  }

  if (!rawPlan) {
    const inlinePlan = parseJson(cfg.chaosPlanJson, null);
    if (Array.isArray(inlinePlan)) {
      rawPlan = inlinePlan;
      source = 'inline';
    }
  }

  if (!rawPlan && cfg.chaosPlanPreset) {
    rawPlan = buildPresetChaosPlan(cfg.chaosPlanPreset, cfg);
    source = `preset:${cfg.chaosPlanPreset}`;
  }

  const normalized = (Array.isArray(rawPlan) ? rawPlan : [])
    .map((event) => normalizeChaosEvent(event))
    .filter(Boolean)
    .sort((a, b) => a.atSec - b.atSec);

  return {
    source,
    events: normalized,
  };
}

function buildProfileWeights() {
  return PROFILE_ORDER.reduce((acc, profile) => {
    acc[profile] = PROFILE_DEFAULTS[profile].weight;
    return acc;
  }, {});
}

function buildActionStepConfig(rng, cfg, templateTag, stepIndex) {
  const shouldFail = rng() < cfg.failureRatio;
  const conditionSkip = rng() < cfg.conditionalSkipRatio;
  const failurePolicyRoll = rng();

  let failurePolicy = 'retry';
  if (failurePolicyRoll < 0.25) failurePolicy = 'skip';
  else if (failurePolicyRoll < 0.4) failurePolicy = 'stop';

  const config = {
    tag: shouldFail ? '   ' : `${templateTag}_step_${stepIndex}`,
    on_failure: failurePolicy,
  };

  if (conditionSkip) {
    config.condition = { customer_replied: true };
  }

  return {
    type: 'tag_customer',
    config,
  };
}

function randomIntInRange(rng, min, max) {
  if (max <= min) return min;
  return min + Math.floor(rng() * (max - min + 1));
}

function buildRuleActions(profile, rng, cfg, runStartMs, templateTag) {
  const profileCfg = PROFILE_DEFAULTS[profile];
  const actionCount = randomIntInRange(rng, profileCfg.minActions, profileCfg.maxActions);
  const actions = [];

  const insertRelativeDelay = () => ({
    type: 'delay',
    seconds: randomIntInRange(rng, 2, 90),
  });

  const insertAbsoluteDelay = () => {
    const offsetSeconds = randomIntInRange(
      rng,
      cfg.absoluteDelayMinSeconds,
      cfg.absoluteDelayWindowSeconds
    );
    return {
      type: 'delay_until',
      timestamp: new Date(runStartMs + offsetSeconds * 1000).toISOString(),
    };
  };

  let relativeDelayBudget = randomIntInRange(
    rng,
    profileCfg.minDelaySteps || 0,
    profileCfg.maxDelaySteps || 0
  );
  let absoluteDelayBudget = randomIntInRange(
    rng,
    profileCfg.minAbsoluteSteps || 0,
    profileCfg.maxAbsoluteSteps || 0
  );

  for (let i = 0; i < actionCount; i += 1) {
    if (profile === 'relative_delay' && relativeDelayBudget > 0 && rng() < 0.35) {
      actions.push(insertRelativeDelay());
      relativeDelayBudget -= 1;
    }

    if (profile === 'absolute_delay' && absoluteDelayBudget > 0 && rng() < 0.4) {
      actions.push(insertAbsoluteDelay());
      absoluteDelayBudget -= 1;
    }

    if (profile === 'cancellation_heavy' && (relativeDelayBudget > 0 || absoluteDelayBudget > 0) && rng() < 0.55) {
      if (absoluteDelayBudget > 0 && rng() < 0.5) {
        actions.push(insertAbsoluteDelay());
        absoluteDelayBudget -= 1;
      } else if (relativeDelayBudget > 0) {
        actions.push(insertRelativeDelay());
        relativeDelayBudget -= 1;
      }
    }

    actions.push(buildActionStepConfig(rng, cfg, templateTag, i));
  }

  while (relativeDelayBudget > 0) {
    actions.push(insertRelativeDelay());
    relativeDelayBudget -= 1;
  }

  while (absoluteDelayBudget > 0) {
    actions.push(insertAbsoluteDelay());
    absoluteDelayBudget -= 1;
  }

  return actions;
}

async function createWorkspace(baseUrl, index) {
  const now = Date.now();
  const suffix = `${index}-${now}`;
  const workspace = await postJson(`${baseUrl}/api/workspace/create`, {
    industryId: 'dental',
    businessName: `Harness Workspace ${suffix}`,
    name: `Harness Workspace ${suffix}`,
    phone: `+1555${String(index).padStart(3, '0')}${String(now).slice(-4)}`,
    timezone: 'UTC',
  });

  if (!workspace?.id) {
    throw new Error(`Workspace create did not return id for index=${index}`);
  }

  return workspace.id;
}

async function seedCustomers(pool, workspaceId, count, workspaceIndex) {
  const customers = [];

  for (let i = 0; i < count; i += 1) {
    const customerId = randomUUID();
    const phone = `+1557${String(workspaceIndex).padStart(2, '0')}${String(i).padStart(6, '0')}`;

    const result = await pool.query(
      `INSERT INTO customers (id, workspace_id, name, phone, lifecycle_stage)
       VALUES ($1::uuid, $2, $3, $4, 'lead')
       ON CONFLICT (workspace_id, phone)
       DO UPDATE SET updated_at = NOW()
       RETURNING id, phone`,
      [customerId, workspaceId, `Harness Customer ${workspaceIndex}-${i}`, phone]
    );

    customers.push({
      id: result.rows[0].id,
      phone: result.rows[0].phone,
    });
  }

  return customers;
}

async function createService(pool, workspaceId, serviceName) {
  const existing = await pool.query(
    `SELECT id
     FROM services
     WHERE workspace_id = $1
       AND lower(name) = lower($2)
     LIMIT 1`,
    [workspaceId, serviceName]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const inserted = await pool.query(
    `INSERT INTO services (workspace_id, name, duration, price, is_active, metadata)
     VALUES ($1, $2, 30, 500, true, $3::jsonb)
     RETURNING id`,
    [workspaceId, serviceName, JSON.stringify({ aliases: [] })]
  );

  return inserted.rows[0].id;
}

async function createAutomationRule(baseUrl, payload) {
  const response = await postJson(`${baseUrl}/api/automation/rules`, payload);
  if (!response?.success || !response?.data?.id) {
    throw new Error(`Automation rule create failed: ${JSON.stringify(response)}`);
  }

  return response.data;
}

async function seedTemplates(baseUrl, pool, cfg) {
  const rng = seededRng(cfg.seed);
  const templatesByProfile = PROFILE_ORDER.reduce((acc, profile) => {
    acc[profile] = [];
    return acc;
  }, {});
  const customersByWorkspace = {};
  const workspaces = [];

  const runStartMs = Date.now();

  for (let workspaceIndex = 0; workspaceIndex < cfg.workspaceCount; workspaceIndex += 1) {
    const workspaceId = await createWorkspace(baseUrl, workspaceIndex);
    workspaces.push(workspaceId);

    const customers = await seedCustomers(pool, workspaceId, cfg.customersPerWorkspace, workspaceIndex);
    customersByWorkspace[workspaceId] = customers;

    await pool.query(
      `DELETE FROM automation_rules
       WHERE workspace_id = $1
         AND trigger_type = 'appointment_created'`,
      [workspaceId]
    );

    for (const profile of PROFILE_ORDER) {
      for (let templateIndex = 0; templateIndex < cfg.templatesPerProfile; templateIndex += 1) {
        const serviceName = `harness_${profile}_ws${workspaceIndex}_tpl${templateIndex}`;
        const serviceId = await createService(pool, workspaceId, serviceName);
        const templateTag = `${profile}_ws${workspaceIndex}_tpl${templateIndex}`;
        const actions = buildRuleActions(profile, rng, cfg, runStartMs, templateTag);

        await createAutomationRule(baseUrl, {
          workspaceId,
          triggerType: 'appointment_created',
          conditions: {
            service_id: serviceId,
          },
          actionConfig: {
            actions,
          },
          priority: 70 + templateIndex,
          executionMode: 'stop_on_match',
        });

        templatesByProfile[profile].push({
          templateId: templateTag,
          workspaceId,
          serviceName,
          profile,
          cancelProbability: PROFILE_DEFAULTS[profile].cancelProbability,
        });
      }
    }
  }

  return {
    workspaces,
    templatesByProfile,
    customersByWorkspace,
  };
}

function getWorkflowAssignments(total, workers) {
  const base = Math.floor(total / workers);
  const remainder = total % workers;
  const assignments = [];

  for (let i = 0; i < workers; i += 1) {
    assignments.push(base + (i < remainder ? 1 : 0));
  }

  return assignments;
}

function createQueues(redisConnection) {
  return {
    automationQueue: new Queue('automation_actions', { connection: redisConnection }),
    generalQueue: new Queue('general_jobs', { connection: redisConnection }),
  };
}

async function purgeQueueForCleanStart(queue, queueName) {
  const before = {
    waiting: await queue.getWaitingCount(),
    active: await queue.getActiveCount(),
    delayed: await queue.getDelayedCount(),
    failed: await queue.getFailedCount(),
    completed: await queue.getCompletedCount(),
  };

  await queue.pause();
  try {
    await queue.obliterate({ force: true });
  } finally {
    await queue.resume();
  }

  const after = {
    waiting: await queue.getWaitingCount(),
    active: await queue.getActiveCount(),
    delayed: await queue.getDelayedCount(),
    failed: await queue.getFailedCount(),
    completed: await queue.getCompletedCount(),
  };

  return {
    queue: queueName,
    before,
    after,
  };
}

async function deleteByWorkspaceInChunks(pool, tableName, workspaceIds, chunkSize) {
  let totalDeleted = 0;
  let chunkCount = 0;
  const startedAt = Date.now();
  let lastLogAt = startedAt;
  const effectiveChunkSize = Math.max(1000, chunkSize);

  console.log(
    `[Harness][CleanStart] table=${tableName} starting chunkSize=${effectiveChunkSize} workspaceCount=${workspaceIds.length}`
  );

  for (const workspaceId of workspaceIds) {
    while (true) {
      const nextChunk = chunkCount + 1;
      const queryStartedAt = Date.now();
      const heartbeat = setInterval(() => {
        const waitingSec = ((Date.now() - queryStartedAt) / 1000).toFixed(1);
        console.log(
          `[Harness][CleanStart] table=${tableName} workspace=${workspaceId} chunk=${nextChunk} waiting=${waitingSec}s`
        );
      }, 10000);

      let result;
      try {
        result = await pool.query(
          `WITH doomed AS (
             SELECT id
             FROM ${tableName}
             WHERE workspace_id = $1
             ORDER BY id
             LIMIT ${effectiveChunkSize}
           )
           DELETE FROM ${tableName} target
           USING doomed
           WHERE target.id = doomed.id`,
          [workspaceId]
        );
      } finally {
        clearInterval(heartbeat);
      }

      const deleted = Number(result.rowCount || 0);
      chunkCount += 1;

      if (deleted === 0) {
        break;
      }

      totalDeleted += deleted;
      const now = Date.now();
      if (chunkCount % 5 === 0 || now - lastLogAt >= 3000) {
        const elapsedSec = ((now - startedAt) / 1000).toFixed(1);
        console.log(
          `[Harness][CleanStart] table=${tableName} chunks=${chunkCount} deleted=${totalDeleted} elapsed=${elapsedSec}s`
        );
        lastLogAt = now;
      }
    }
  }

  const totalElapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(
    `[Harness][CleanStart] table=${tableName} complete chunks=${chunkCount} deleted=${totalDeleted} elapsed=${totalElapsedSec}s`
  );

  return totalDeleted;
}

async function cleanupHarnessArtifacts(pool, queues, cfg) {
  const summary = {
    enabled: cfg.cleanStart,
    dbCleaned: false,
    queueCleaned: false,
    executionEventsCleaned: false,
    workspaceCount: 0,
    deletedRows: {},
    queues: [],
  };

  if (!cfg.cleanStart) {
    return summary;
  }

  if (cfg.cleanQueueStart) {
    summary.queues = await Promise.all([
      purgeQueueForCleanStart(queues.automationQueue, 'automation_actions'),
      purgeQueueForCleanStart(queues.generalQueue, 'general_jobs'),
    ]);
    summary.queueCleaned = true;
  }

  if (!cfg.cleanDbStart) {
    return summary;
  }

  const targetRows = await pool.query(
    `SELECT id::uuid AS workspace_id_uuid,
            id::text AS workspace_id_text
     FROM workspaces
     WHERE name LIKE 'Harness Workspace %'`
  );

  const workspaceIdsText = targetRows.rows
    .map((row) => String(row.workspace_id_text || '').trim())
    .filter(Boolean);

  const workspaceIdsUuid = targetRows.rows
    .map((row) => String(row.workspace_id_uuid || '').trim())
    .filter(Boolean);

  summary.workspaceCount = workspaceIdsText.length;

  if (workspaceIdsText.length === 0) {
    summary.dbCleaned = true;
    return summary;
  }

  const chunkSize = Math.max(100, Number(cfg.cleanupDeleteBatchSize || 5000));
  const executionEventsChunkSize = Math.max(
    100,
    Number(cfg.cleanupExecutionEventsBatchSize || Math.min(500, chunkSize))
  );

  summary.deletedRows.workflow_step_logs = await deleteByWorkspaceInChunks(
    pool,
    'workflow_step_logs',
    workspaceIdsText,
    chunkSize
  );
  summary.deletedRows.automation_job_refs = await deleteByWorkspaceInChunks(
    pool,
    'automation_job_refs',
    workspaceIdsText,
    chunkSize
  );
  summary.deletedRows.workflow_runs = await deleteByWorkspaceInChunks(
    pool,
    'workflow_runs',
    workspaceIdsText,
    chunkSize
  );
  if (cfg.cleanExecutionEvents) {
    summary.deletedRows.execution_events = await deleteByWorkspaceInChunks(
      pool,
      'execution_events',
      workspaceIdsText,
      executionEventsChunkSize
    );
    summary.executionEventsCleaned = true;
  } else {
    summary.deletedRows.execution_events = 0;
    console.log(
      '[Harness][CleanStart] table=execution_events skipped (set HARNESS_CLEAN_EXECUTION_EVENTS=true to enable)'
    );
  }

  const hasSmartActionExecutions = await pool.query(
    `SELECT to_regclass('public.smart_action_executions') IS NOT NULL AS exists`
  );

  if (Boolean(hasSmartActionExecutions.rows[0]?.exists)) {
    summary.deletedRows.smart_action_executions = await deleteByWorkspaceInChunks(
      pool,
      'smart_action_executions',
      workspaceIdsText,
      chunkSize
    );
  }

  const workspacesDelete = await pool.query(
    `DELETE FROM workspaces
     WHERE id = ANY($1::uuid[])`,
    [workspaceIdsUuid]
  );

  summary.deletedRows.workspaces = Number(workspacesDelete.rowCount || 0);
  summary.dbCleaned = true;

  return summary;
}

async function runShellCommand(command, timeoutMs = 30000) {
  return new Promise((resolve) => {
    if (!command || !String(command).trim()) {
      resolve({ ok: false, code: -1, stdout: '', stderr: 'empty command' });
      return;
    }

    const child = spawn('bash', ['-lc', command], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    });

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0, code: code ?? -1, stdout, stderr });
    });
  });
}

async function acquireRunLock(outputDir) {
  await mkdir(outputDir, { recursive: true });

  const lockPath = path.join(outputDir, '.harness-run.lock');
  const lockData = {
    pid: process.pid,
    createdAt: new Date().toISOString(),
  };

  const writeLock = async () => {
    await writeFile(lockPath, `${JSON.stringify(lockData)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
    });
  };

  try {
    await writeLock();
    return lockPath;
  } catch (error) {
    if (error?.code !== 'EEXIST') {
      throw error;
    }
  }

  let staleLock = false;
  let existingPid = null;

  try {
    const existingRaw = await readFile(lockPath, 'utf8');
    const existingData = JSON.parse(String(existingRaw || '{}'));
    existingPid = Number(existingData?.pid);

    if (!Number.isFinite(existingPid) || existingPid <= 0) {
      staleLock = true;
    } else {
      try {
        process.kill(existingPid, 0);
      } catch {
        staleLock = true;
      }
    }
  } catch {
    staleLock = true;
  }

  if (!staleLock) {
    throw new Error(
      `[Harness] Another run is already active (pid=${existingPid || 'unknown'}). ` +
      `Stop it before starting a new run.`
    );
  }

  try {
    await unlink(lockPath);
  } catch {
    // Lock file may have been removed by another process.
  }

  await writeLock();
  return lockPath;
}

async function releaseRunLock(lockPath) {
  if (!lockPath) {
    return;
  }

  try {
    await unlink(lockPath);
  } catch {
    // Lock file may already be removed.
  }
}

async function killBackendProcess(pidFilePath) {
  try {
    const raw = await readFile(pidFilePath, 'utf8');
    const pid = parseInt(raw.trim(), 10);
    if (!Number.isFinite(pid) || pid <= 0) {
      return { killed: false, reason: 'invalid_pid' };
    }

    try {
      process.kill(pid, 'SIGKILL');
      return { killed: true, pid };
    } catch (error) {
      return { killed: false, reason: error?.message || 'kill_failed', pid };
    }
  } catch (error) {
    return { killed: false, reason: error?.message || 'pid_file_read_failed' };
  }
}

async function startDbLock(pool, durationSeconds) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('LOCK TABLE automation_job_refs IN ACCESS EXCLUSIVE MODE');
    await sleep(Math.max(1, durationSeconds) * 1000);
    await client.query('ROLLBACK');
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // noop
    }
    throw error;
  } finally {
    client.release();
  }
}

function summarizeQueueMetrics(samples) {
  const waiting = samples.map((sample) => sample.queue.waiting);
  const active = samples.map((sample) => sample.queue.active);
  const delayed = samples.map((sample) => sample.queue.delayed);
  const oldestWaitingAge = samples.map((sample) => sample.queue.oldestWaitingAgeSec);
  const oldestDelayedAge = samples.map((sample) => sample.queue.oldestDelayedAgeSec);

  return {
    waitingPeak: waiting.length ? Math.max(...waiting) : 0,
    activePeak: active.length ? Math.max(...active) : 0,
    delayedPeak: delayed.length ? Math.max(...delayed) : 0,
    oldestWaitingAgePeakSec: oldestWaitingAge.length ? Math.max(...oldestWaitingAge) : 0,
    oldestDelayedAgePeakSec: oldestDelayedAge.length ? Math.max(...oldestDelayedAge) : 0,
  };
}

function summarizeDbMetrics(samples) {
  const dbLatency = samples.map((sample) => sample.db.queryLatencyMs);
  const lockWaiters = samples.map((sample) => sample.db.lockWaiters);
  const lockWaitMax = samples.map((sample) => sample.db.lockWaitMaxSeconds);
  const driftP95 = samples.map((sample) => sample.db.delayDriftP95Sec);

  return {
    queryLatencyP50Ms: percentile(dbLatency, 0.5),
    queryLatencyP95Ms: percentile(dbLatency, 0.95),
    queryLatencyP99Ms: percentile(dbLatency, 0.99),
    lockWaitersPeak: lockWaiters.length ? Math.max(...lockWaiters) : 0,
    lockWaitMaxPeakSec: lockWaitMax.length ? Math.max(...lockWaitMax) : 0,
    delayDriftP95PeakSec: driftP95.length ? Math.max(...driftP95) : 0,
  };
}

function summarizeWorkerMetrics(results) {
  const merged = {
    workflowsDispatched: 0,
    publishSuccess: 0,
    publishErrors: 0,
    duplicatePublishes: 0,
    cancellationsScheduled: 0,
    cancellationSuccess: 0,
    cancellationErrors: 0,
    publishLatencies: [],
    cancellationLatencies: [],
    profileCounts: {
      immediate: 0,
      relative_delay: 0,
      absolute_delay: 0,
      cancellation_heavy: 0,
    },
    requestQuality: {
      intendedValid: 0,
      intendedInvalid: 0,
      validSuccess: 0,
      validErrors: 0,
      invalidSuccess: 0,
      invalidErrors: 0,
    },
    errorCodes: {},
    failureDetails: {
      stageCounts: {
        enqueue: 0,
        worker_execute: 0,
        db_write: 0,
        external_action: 0,
        unknown: 0,
      },
      typeCounts: {
        db: 0,
        queue: 0,
        worker: 0,
        recovery: 0,
        duplicate: 0,
        unknown: 0,
      },
      codeCounts: {},
      samples: [],
    },
  };

  for (const result of results) {
    merged.workflowsDispatched += Number(result.workflowsDispatched || 0);
    merged.publishSuccess += Number(result.publishSuccess || 0);
    merged.publishErrors += Number(result.publishErrors || 0);
    merged.duplicatePublishes += Number(result.duplicatePublishes || 0);
    merged.cancellationsScheduled += Number(result.cancellationsScheduled || 0);
    merged.cancellationSuccess += Number(result.cancellationSuccess || 0);
    merged.cancellationErrors += Number(result.cancellationErrors || 0);
    merged.publishLatencies.push(...(result.publishLatencyMs || []));
    merged.cancellationLatencies.push(...(result.cancellationLatencyMs || []));

    for (const profile of PROFILE_ORDER) {
      merged.profileCounts[profile] += Number(result.profileCounts?.[profile] || 0);
    }

    merged.requestQuality.intendedValid += Number(result.requestQuality?.intendedValid || 0);
    merged.requestQuality.intendedInvalid += Number(result.requestQuality?.intendedInvalid || 0);
    merged.requestQuality.validSuccess += Number(result.requestQuality?.validSuccess || 0);
    merged.requestQuality.validErrors += Number(result.requestQuality?.validErrors || 0);
    merged.requestQuality.invalidSuccess += Number(result.requestQuality?.invalidSuccess || 0);
    merged.requestQuality.invalidErrors += Number(result.requestQuality?.invalidErrors || 0);

    for (const [key, value] of Object.entries(result.errorCodes || {})) {
      merged.errorCodes[key] = (merged.errorCodes[key] || 0) + Number(value || 0);
    }

    mergeCountMap(merged.failureDetails.stageCounts, result.failureDetails?.stageCounts || {});
    mergeCountMap(merged.failureDetails.typeCounts, result.failureDetails?.typeCounts || {});
    mergeCountMap(merged.failureDetails.codeCounts, result.failureDetails?.codeCounts || {});

    for (const sample of result.failureDetails?.samples || []) {
      pushWithCap(merged.failureDetails.samples, sample, 300);
    }
  }

  merged.publishLatencySummary = {
    p50: percentile(merged.publishLatencies, 0.5),
    p95: percentile(merged.publishLatencies, 0.95),
    p99: percentile(merged.publishLatencies, 0.99),
    max: merged.publishLatencies.length ? Math.max(...merged.publishLatencies) : 0,
  };

  merged.cancellationLatencySummary = {
    p50: percentile(merged.cancellationLatencies, 0.5),
    p95: percentile(merged.cancellationLatencies, 0.95),
    p99: percentile(merged.cancellationLatencies, 0.99),
    max: merged.cancellationLatencies.length ? Math.max(...merged.cancellationLatencies) : 0,
  };

  return merged;
}

function inferFailureCascade(queueSummary, dbSummary, workerSummary) {
  const ranked = [];

  const dbScore =
    (dbSummary.queryLatencyP95Ms > 150 ? 2 : 0) +
    (dbSummary.lockWaitersPeak > 0 ? 2 : 0) +
    (dbSummary.lockWaitMaxPeakSec > 2 ? 2 : 0);

  const queueScore =
    (queueSummary.waitingPeak > 5000 ? 2 : 0) +
    (queueSummary.oldestWaitingAgePeakSec > 60 ? 2 : 0) +
    (workerSummary.publishErrors > 0 ? 1 : 0);

  const schedulerScore =
    (dbSummary.delayDriftP95PeakSec > 2 ? 2 : 0) +
    (dbSummary.delayDriftP95PeakSec > 10 ? 2 : 0) +
    (queueSummary.delayedPeak > 0 ? 1 : 0);

  const recoveryScore =
    (workerSummary.errorCodes['HTTP_500'] ? 1 : 0) +
    (dbSummary.lockWaitersPeak > 0 ? 1 : 0);

  ranked.push({ component: 'postgresql_write_path', score: dbScore });
  ranked.push({ component: 'queue_backlog_latency', score: queueScore });
  ranked.push({ component: 'delayed_scheduler_accuracy', score: schedulerScore });
  ranked.push({ component: 'recovery_false_positive_risk', score: recoveryScore });

  ranked.sort((a, b) => b.score - a.score);

  return ranked;
}

async function sampleMetrics(pool, queues, loopLagMonitor, cfg, workspaceIds) {
  const sampleStarted = performance.now();

  const scopedWorkspaceIds = Array.isArray(workspaceIds)
    ? workspaceIds.map((id) => String(id || '').trim()).filter(Boolean)
    : [];

  if (scopedWorkspaceIds.length === 0) {
    scopedWorkspaceIds.push('__harness_no_workspace__');
  }

  const [waiting, active, delayed, failed] = await Promise.all([
    queues.automationQueue.getWaitingCount(),
    queues.automationQueue.getActiveCount(),
    queues.automationQueue.getDelayedCount(),
    queues.automationQueue.getFailedCount(),
  ]);

  const [waitingJobs, delayedJobs] = await Promise.all([
    queues.automationQueue.getWaiting(0, 0),
    queues.automationQueue.getDelayed(0, 0),
  ]);

  const now = Date.now();
  const oldestWaitingAgeSec = waitingJobs.length > 0
    ? Math.max(0, (now - Number(waitingJobs[0].timestamp || now)) / 1000)
    : 0;
  const oldestDelayedAgeSec = delayedJobs.length > 0
    ? Math.max(0, (now - Number(delayedJobs[0].timestamp || now)) / 1000)
    : 0;

  const dbQueryStarted = performance.now();
  const dbResult = await pool.query(
    `SELECT
       (SELECT COUNT(*)::int
        FROM workflow_runs
        WHERE workspace_id::text = ANY($2::text[])
          AND status = 'running') AS runs_running,
       (SELECT COUNT(*)::int
        FROM workflow_runs
        WHERE workspace_id::text = ANY($2::text[])
          AND status = 'completed') AS runs_completed,
       (SELECT COUNT(*)::int
        FROM workflow_runs
        WHERE workspace_id::text = ANY($2::text[])
          AND status = 'failed') AS runs_failed,
       (SELECT COUNT(*)::int
        FROM workflow_runs
        WHERE workspace_id::text = ANY($2::text[])
          AND status = 'cancelled') AS runs_cancelled,
       (SELECT COUNT(*)::int
        FROM workflow_runs
        WHERE workspace_id::text = ANY($2::text[])
          AND status = 'running'
          AND updated_at < NOW() - ($1 || ' seconds')::interval) AS runs_stuck,
       (SELECT COUNT(*)::int FROM pg_stat_activity WHERE wait_event_type = 'Lock' AND state = 'active') AS lock_waiters,
       (SELECT COALESCE(MAX(EXTRACT(EPOCH FROM (NOW() - query_start))), 0)::float FROM pg_stat_activity WHERE wait_event_type = 'Lock' AND state = 'active') AS lock_wait_max_seconds,
       (SELECT COUNT(*)::int
        FROM workflow_step_logs
        WHERE workspace_id::text = ANY($2::text[])
          AND created_at > NOW() - INTERVAL '1 minute') AS step_logs_per_min,
       (SELECT COUNT(*)::int
        FROM automation_job_refs
        WHERE workspace_id::text = ANY($2::text[])
          AND updated_at > NOW() - INTERVAL '1 minute') AS job_refs_per_min,
       (
         SELECT COALESCE(
           percentile_cont(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (executed_at - scheduled_for))),
           0
         )::float
         FROM automation_job_refs
         WHERE workspace_id::text = ANY($2::text[])
           AND status = 'executed'
           AND scheduled_for IS NOT NULL
           AND executed_at IS NOT NULL
           AND updated_at > NOW() - INTERVAL '10 minutes'
       ) AS delay_drift_p95_sec`,
    [String(cfg.stuckWorkflowSeconds), scopedWorkspaceIds]
  );
  const dbQueryLatencyMs = performance.now() - dbQueryStarted;

  const db = dbResult.rows[0] || {};
  const loopLagMs = Number(loopLagMonitor.mean / 1e6 || 0);

  const sample = {
    timestamp: new Date().toISOString(),
    queue: {
      waiting,
      active,
      delayed,
      failed,
      oldestWaitingAgeSec,
      oldestDelayedAgeSec,
    },
    db: {
      queryLatencyMs: dbQueryLatencyMs,
      runsRunning: Number(db.runs_running || 0),
      runsCompleted: Number(db.runs_completed || 0),
      runsFailed: Number(db.runs_failed || 0),
      runsCancelled: Number(db.runs_cancelled || 0),
      runsStuck: Number(db.runs_stuck || 0),
      lockWaiters: Number(db.lock_waiters || 0),
      lockWaitMaxSeconds: Number(db.lock_wait_max_seconds || 0),
      stepLogsPerMin: Number(db.step_logs_per_min || 0),
      jobRefsPerMin: Number(db.job_refs_per_min || 0),
      delayDriftP95Sec: Number(db.delay_drift_p95_sec || 0),
    },
    process: {
      rssBytes: process.memoryUsage().rss,
      heapUsedBytes: process.memoryUsage().heapUsed,
      cpuLoad1m: os.loadavg()[0],
      eventLoopLagMs: loopLagMs,
    },
    sampleLatencyMs: performance.now() - sampleStarted,
  };

  return sample;
}

async function runChaosEvent(event, context) {
  const type = String(event.type || '').trim();
  if (!type) {
    return { type: 'invalid', error: 'missing_type' };
  }

  if (type === 'queue_overload') {
    const multiplier = Math.max(1, Number(event.multiplier || 2));
    const durationSec = Math.max(1, Number(event.durationSec || 60));

    context.setRateMultiplier(multiplier, durationSec);

    return { type, multiplier, durationSec, status: 'applied' };
  }

  if (type === 'duplicate_events') {
    const count = Math.max(1, Number(event.count || 200));
    const perWorker = Math.max(1, Math.ceil(count / Math.max(context.workers.length, 1)));
    context.workers.forEach((worker) => worker.postMessage({ type: 'injectDuplicateBurst', count: perWorker }));

    return { type, count, perWorker, status: 'applied' };
  }

  if (type === 'duplicate_replay') {
    const count = Math.max(1, Number(event.count || 100));
    const scopedWorkspaceIds = Array.isArray(context.workspaceIds)
      ? context.workspaceIds.map((id) => String(id || '').trim()).filter(Boolean)
      : [];

    const rows = scopedWorkspaceIds.length > 0
      ? await context.pool.query(
          `SELECT id
           FROM execution_events
           WHERE event_type = 'appointment.created'
             AND workspace_id::text = ANY($2::text[])
           ORDER BY created_at DESC
           LIMIT $1`,
          [count, scopedWorkspaceIds]
        )
      : await context.pool.query(
          `SELECT id
           FROM execution_events
           WHERE event_type = 'appointment.created'
           ORDER BY created_at DESC
           LIMIT $1`,
          [count]
        );

    let enqueued = 0;
    for (const row of rows.rows) {
      try {
        await context.queues.automationQueue.add(
          'evaluate-event',
          {
            jobType: 'evaluate_event',
            eventId: row.id,
          },
          {
            jobId: `dup-evaluate-${row.id}-${Date.now()}-${enqueued}`,
            attempts: 1,
            removeOnComplete: true,
            removeOnFail: true,
          }
        );
        enqueued += 1;
      } catch {
        // ignore duplicate job ids and continue
      }
    }

    return { type, requested: count, enqueued, status: 'applied' };
  }

  if (type === 'worker_crash') {
    const durationSec = Math.max(1, Number(event.durationSec || 30));
    const killed = await killBackendProcess(context.config.backendPidFile);

    if (context.config.backendRestartCmd) {
      setTimeout(() => {
        runShellCommand(context.config.backendRestartCmd, 120000);
      }, durationSec * 1000);
    }

    return { type, durationSec, killed, restartScheduled: Boolean(context.config.backendRestartCmd) };
  }

  if (type === 'redis_outage') {
    const durationSec = Math.max(1, Number(event.durationSec || 30));
    const down = await runShellCommand(context.config.chaosRedisDownCmd, 120000);

    if (context.config.chaosRedisUpCmd) {
      setTimeout(() => {
        runShellCommand(context.config.chaosRedisUpCmd, 120000);
      }, durationSec * 1000);
    }

    return {
      type,
      durationSec,
      down,
      upScheduled: Boolean(context.config.chaosRedisUpCmd),
    };
  }

  if (type === 'db_lock_contention') {
    const durationSec = Math.max(1, Number(event.durationSec || 20));
    startDbLock(context.pool, durationSec).catch((error) => {
      console.error('[Harness][Chaos] db_lock_contention failed:', error?.message || error);
    });

    return { type, durationSec, status: 'applied_async' };
  }

  if (type === 'force_recovery_scan') {
    const staleMinutes = Math.max(1, Number(event.staleMinutes || 5));
    const maxRuns = Math.max(1, Number(event.maxRuns || 200));

    await context.queues.generalQueue.add(
      'workflow-recovery',
      {
        type: 'workflow_recovery',
        workspaceId: 'system',
        data: {
          staleMinutes,
          maxRuns,
        },
      },
      {
        jobId: `harness-force-recovery-${Date.now()}`,
      }
    );

    return { type, staleMinutes, maxRuns, status: 'applied' };
  }

  return { type, status: 'ignored', reason: 'unsupported_type' };
}

async function runHarness() {
  const config = createConfig();
  const resolvedChaos = await resolveChaosEvents(config);
  config.chaosEvents = resolvedChaos.events;
  config.chaosPlanSource = resolvedChaos.source;

  const runStartedAt = new Date();

  const workerScript = path.resolve(__dirname, './publisher-worker.mjs');
  const profileWeights = buildProfileWeights();

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const redis = new IORedis(config.redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  const queues = createQueues(redis);
  let cleanStartSummary = null;
  let runLockPath = null;

  try {
    runLockPath = await acquireRunLock(config.outputDir);

    if (config.cleanStart) {
      console.log('[Harness] Clean start enabled. Clearing queue backlog and prior harness artifacts...');
      cleanStartSummary = await cleanupHarnessArtifacts(pool, queues, config);

      console.log(
        `[Harness] Clean start complete. workspaceCount=${cleanStartSummary.workspaceCount} ` +
        `queueCleaned=${cleanStartSummary.queueCleaned ? 'yes' : 'no'} ` +
        `dbCleaned=${cleanStartSummary.dbCleaned ? 'yes' : 'no'} ` +
        `executionEventsCleaned=${cleanStartSummary.executionEventsCleaned ? 'yes' : 'no'}`
      );
    }

    if (config.chaosEvents.length > 0) {
      console.log(
        `[Harness] Chaos plan loaded source=${config.chaosPlanSource} ` +
        `events=${config.chaosEvents.length}`
      );
    }

    const health = await fetch(`${config.baseUrl}/health`).then((response) => response.json());
    if (!health?.status || health.status !== 'ok') {
      throw new Error(`Backend health check failed: ${JSON.stringify(health)}`);
    }

    console.log('[Harness] Seeding workspaces, customers, services, and automation templates...');
    const seeded = await seedTemplates(config.baseUrl, pool, config);
    console.log(
      `[Harness] Seed complete. workspaces=${seeded.workspaces.length} ` +
      `templates=${PROFILE_ORDER.reduce((sum, p) => sum + (seeded.templatesByProfile[p]?.length || 0), 0)}`
    );

    const assignments = getWorkflowAssignments(config.workflows, config.threadCount);
    const phases = {
      warmupSeconds: config.warmupSeconds,
      rampSeconds: config.rampSeconds,
      steadySeconds: config.steadySeconds,
      soakSeconds: config.soakSeconds,
      warmupRps: config.warmupRps,
      targetRps: config.targetRps,
      soakRps: config.soakRps,
    };

    const workers = [];
    const workerDone = [];
    const workerProgress = new Map();
    const workerResults = [];

    for (let i = 0; i < config.threadCount; i += 1) {
    const worker = new Worker(workerScript, {
      workerData: {
        workerId: i + 1,
        seed: config.seed,
        baseUrl: config.baseUrl,
        workflowsTarget: assignments[i],
        threadCount: config.threadCount,
        inflightLimit: config.inflightPerThread,
        requestTimeoutMs: config.requestTimeoutMs,
        cancelDelayRangeMs: {
          min: config.cancelDelayMinMs,
          max: config.cancelDelayMaxMs,
        },
        maxCancelDrainMs: config.maxCancelDrainMs,
        invalidRequestRatio: config.invalidRequestRatio,
        phases,
        profileWeights,
        templatesByProfile: seeded.templatesByProfile,
        customersByWorkspace: seeded.customersByWorkspace,
      },
    });

    workers.push(worker);

    workerDone.push(
      new Promise((resolve, reject) => {
        worker.on('message', (message) => {
          if (!message || typeof message !== 'object') return;

          if (message.type === 'progress') {
            workerProgress.set(message.workerId, message.metrics);
            return;
          }

          if (message.type === 'done') {
            workerResults.push(message.result);
            resolve(message.result);
            return;
          }

          if (message.type === 'fatal') {
            reject(new Error(`Worker ${message.workerId} fatal: ${message.error?.message || 'unknown'}`));
          }
        });

        worker.on('error', reject);
        worker.on('exit', (code) => {
          if (code !== 0) {
            reject(new Error(`Worker exited with code ${code}`));
          }
        });
      })
    );
  }

    const loopLagMonitor = monitorEventLoopDelay({ resolution: 20 });
    loopLagMonitor.enable();

    const metricsSamples = [];
    let activeRateMultiplier = 1;
    const metricsInterval = setInterval(async () => {
    try {
      const sample = await sampleMetrics(pool, queues, loopLagMonitor, config, seeded.workspaces);

      const aggregateProgress = [...workerProgress.values()].reduce(
        (acc, cur) => {
          acc.workflowsDispatched += Number(cur.workflowsDispatched || 0);
          acc.publishSuccess += Number(cur.publishSuccess || 0);
          acc.publishErrors += Number(cur.publishErrors || 0);
          acc.cancellationSuccess += Number(cur.cancellationSuccess || 0);
          acc.cancellationErrors += Number(cur.cancellationErrors || 0);
          return acc;
        },
        {
          workflowsDispatched: 0,
          publishSuccess: 0,
          publishErrors: 0,
          cancellationSuccess: 0,
          cancellationErrors: 0,
        }
      );

      const elapsedSeconds = Math.max(0, (Date.now() - runStartedAt.getTime()) / 1000);
      sample.progress = aggregateProgress;
      sample.load = {
        elapsedSeconds,
        targetRpsEstimate: phaseTargetRps(elapsedSeconds, phases) * activeRateMultiplier,
        rateMultiplier: activeRateMultiplier,
      };

      metricsSamples.push(sample);

      console.log(
        `[Harness][Sample] workflows=${aggregateProgress.workflowsDispatched}/${config.workflows} ` +
        `targetRps=${sample.load.targetRpsEstimate.toFixed(1)} ` +
        `queue(waiting=${sample.queue.waiting},active=${sample.queue.active},delayed=${sample.queue.delayed}) ` +
        `db(running=${sample.db.runsRunning},failed=${sample.db.runsFailed},stuck=${sample.db.runsStuck}) ` +
        `driftP95=${sample.db.delayDriftP95Sec.toFixed(2)}s`
      );
    } catch (error) {
      console.error('[Harness] Metrics sample failed:', error?.message || error);
    }
    }, config.metricsSampleSeconds * 1000);

    const chaosResults = [];
    const chaosContext = {
    config,
    workers,
    queues,
    pool,
    workspaceIds: seeded.workspaces,
    setRateMultiplier: (multiplier, durationSec) => {
      activeRateMultiplier = multiplier;
      workers.forEach((worker) => worker.postMessage({ type: 'setRateMultiplier', multiplier }));
      setTimeout(() => {
        activeRateMultiplier = 1;
        workers.forEach((worker) => worker.postMessage({ type: 'setRateMultiplier', multiplier: 1 }));
      }, durationSec * 1000);
    },
  };

    for (const event of Array.isArray(config.chaosEvents) ? config.chaosEvents : []) {
    const atSec = Math.max(0, Number(event.atSec || 0));
    setTimeout(async () => {
      try {
        const result = await runChaosEvent(event, chaosContext);
        chaosResults.push({
          atSec,
          event,
          result,
          timestamp: new Date().toISOString(),
        });
        console.log(`[Harness][Chaos] Applied event type=${event.type} atSec=${atSec}`);
      } catch (error) {
        chaosResults.push({
          atSec,
          event,
          error: error?.message || String(error),
          timestamp: new Date().toISOString(),
        });
        console.error(`[Harness][Chaos] Failed event type=${event.type}:`, error?.message || error);
      }
    }, atSec * 1000);
  }

    let fatalError = null;

    try {
      await Promise.all(workerDone);
    } catch (error) {
      fatalError = error;
      workers.forEach((worker) => worker.postMessage({ type: 'stop' }));
      throw error;
    } finally {
      clearInterval(metricsInterval);
      loopLagMonitor.disable();
      await Promise.allSettled(workers.map((worker) => worker.terminate()));
    }

    const workerSummary = summarizeWorkerMetrics(workerResults);
    const queueSummary = summarizeQueueMetrics(metricsSamples);
    const dbSummary = summarizeDbMetrics(metricsSamples);
    const failureCascade = inferFailureCascade(queueSummary, dbSummary, workerSummary);

    const report = {
    run: {
      startedAt: runStartedAt.toISOString(),
      endedAt: new Date().toISOString(),
      durationSeconds: (Date.now() - runStartedAt.getTime()) / 1000,
      fatalError: fatalError ? String(fatalError?.message || fatalError) : null,
      seed: config.seed,
      cleanStart: cleanStartSummary,
    },
    config,
    seeded: {
      workspaceCount: seeded.workspaces.length,
      templatesByProfile: PROFILE_ORDER.reduce((acc, profile) => {
        acc[profile] = seeded.templatesByProfile[profile]?.length || 0;
        return acc;
      }, {}),
      customersPerWorkspace: Object.fromEntries(
        Object.entries(seeded.customersByWorkspace).map(([workspaceId, customers]) => [workspaceId, customers.length])
      ),
    },
    summary: {
      worker: {
        workflowsDispatched: workerSummary.workflowsDispatched,
        publishSuccess: workerSummary.publishSuccess,
        publishErrors: workerSummary.publishErrors,
        duplicatePublishes: workerSummary.duplicatePublishes,
        cancellationsScheduled: workerSummary.cancellationsScheduled,
        cancellationSuccess: workerSummary.cancellationSuccess,
        cancellationErrors: workerSummary.cancellationErrors,
        publishLatencySummary: workerSummary.publishLatencySummary,
        cancellationLatencySummary: workerSummary.cancellationLatencySummary,
        profileCounts: workerSummary.profileCounts,
        requestQuality: workerSummary.requestQuality,
        errorCodes: workerSummary.errorCodes,
        failureDetails: workerSummary.failureDetails,
      },
      queue: queueSummary,
      db: dbSummary,
      failureCascade,
    },
    chaosResults,
    metricsSamples,
    workerResults,
  };

    report.summary.failureTags = buildFailureTags(report);
    report.summary.breakpoints = detectBreakpoints(report);

    await mkdir(config.outputDir, { recursive: true });
    const reportPath = path.join(config.outputDir, `report-${Date.now()}.json`);
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

    console.log(`[Harness] Completed. Report written to ${reportPath}`);
    console.log(
      `[Harness] publishSuccess=${workerSummary.publishSuccess} ` +
      `publishErrors=${workerSummary.publishErrors} ` +
      `queueWaitingPeak=${queueSummary.waitingPeak} ` +
      `dbQueryP95=${dbSummary.queryLatencyP95Ms.toFixed(2)}ms ` +
      `driftP95Peak=${dbSummary.delayDriftP95PeakSec.toFixed(2)}s ` +
      `breakpoint=${report.summary.breakpoints.detected ? 'yes' : 'no'}`
    );
  } finally {
    await Promise.allSettled([
      queues.automationQueue.close(),
      queues.generalQueue.close(),
    ]);
    await redis.quit().catch(() => undefined);
    await pool.end().catch(() => undefined);
    await releaseRunLock(runLockPath);
  }
}

runHarness().catch(async (error) => {
  console.error('[Harness] Fatal error:', error?.message || error);
  process.exit(1);
});
