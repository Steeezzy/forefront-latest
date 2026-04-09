import { parentPort, workerData } from 'node:worker_threads';
import { performance } from 'node:perf_hooks';

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

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)));
  return sorted[index];
}

const ERROR_SAMPLE_CAP = 120;

function toSafeString(value, maxLength = 512) {
  const text = String(value ?? '').trim();
  if (!text) {
    return '';
  }
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

function normalizeErrorCode(message) {
  const raw = String(message || 'UNKNOWN_ERROR').trim();
  if (!raw) {
    return 'UNKNOWN_ERROR';
  }

  const normalized = raw.toUpperCase();
  if (/^HTTP_\d{3}$/.test(normalized)) {
    return normalized;
  }

  if (/TIMEOUT|ABORT/.test(normalized)) {
    return 'REQUEST_TIMEOUT';
  }

  if (/FETCH|NETWORK|ECONNRESET|ECONNREFUSED|EHOSTUNREACH|ENOTFOUND|SOCKET/.test(normalized)) {
    return 'FETCH_ERROR';
  }

  const compact = normalized
    .replace(/[^A-Z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return compact ? compact.slice(0, 64) : 'UNKNOWN_ERROR';
}

function classifyFailureType(text) {
  if (
    /postgres|\bpg\b|sql|deadlock|lock timeout|lock wait|too many clients|database|relation|econnrefused.*5432|query/.test(
      text
    )
  ) {
    return 'db';
  }

  if (/redis|bullmq|queue|job stalled|maxmemory|econnrefused.*6379|delayed job|waiting/.test(text)) {
    return 'queue';
  }

  if (/workflow[_-]?recovery|recovery|stale run|reconcile/.test(text)) {
    return 'recovery';
  }

  if (/duplicate|already exists|jobid|idempotent|unique constraint|http_409/.test(text)) {
    return 'duplicate';
  }

  if (
    /http_[45]\d\d|fetch|socket|abort|sigkill|terminated|worker exited|econnreset|econnrefused|timeout|validation|bad request/.test(
      text
    )
  ) {
    return 'worker';
  }

  return 'unknown';
}

function inferErrorStage(operation, failureType, errorCode, text) {
  if (failureType === 'db') {
    return 'db_write';
  }

  if (operation === 'external_action') {
    return 'external_action';
  }

  if (operation === 'enqueue') {
    return 'enqueue';
  }

  if (failureType === 'queue' || /enqueue|queue|redis/.test(text)) {
    return 'enqueue';
  }

  if (/^HTTP_4\d\d$/.test(errorCode) || /^HTTP_5\d\d$/.test(errorCode) || /fetch|network|socket/.test(text)) {
    return 'worker_execute';
  }

  return 'worker_execute';
}

function normalizeFailure(error, operation) {
  const errorCode = normalizeErrorCode(error?.message);
  const payloadText = (() => {
    if (error?.payload === undefined || error?.payload === null) {
      return '';
    }
    try {
      return toSafeString(JSON.stringify(error.payload), 1200);
    } catch {
      return toSafeString(String(error.payload), 1200);
    }
  })();
  const causeText = toSafeString(error?.cause?.message || '', 240);
  const messageText = toSafeString(error?.message || errorCode, 240);
  const fullText = `${messageText} ${payloadText} ${causeText}`.toLowerCase();
  const failureType = classifyFailureType(`${errorCode.toLowerCase()} ${fullText}`);
  const errorStage = inferErrorStage(operation, failureType, errorCode, fullText);

  return {
    errorCode,
    failureType,
    errorStage,
    message: messageText || errorCode,
    detail: toSafeString(fullText.replace(/\s+/g, ' ').trim(), 600),
  };
}

function incrementCount(map, key, increment = 1) {
  map[key] = (map[key] || 0) + increment;
}

function resolvePhaseRate(elapsedSeconds, phases) {
  const warmupEnd = phases.warmupSeconds;
  const rampEnd = warmupEnd + phases.rampSeconds;
  const steadyEnd = rampEnd + phases.steadySeconds;

  if (elapsedSeconds < warmupEnd) {
    return phases.warmupRps;
  }

  if (elapsedSeconds < rampEnd) {
    const progress = phases.rampSeconds <= 0
      ? 1
      : (elapsedSeconds - warmupEnd) / phases.rampSeconds;
    return phases.warmupRps + (phases.targetRps - phases.warmupRps) * progress;
  }

  if (elapsedSeconds < steadyEnd) {
    return phases.targetRps;
  }

  return phases.soakRps;
}

function pickWeightedProfile(profileWeights, rng) {
  const entries = Object.entries(profileWeights);
  const total = entries.reduce((sum, [, weight]) => sum + Number(weight || 0), 0);
  if (total <= 0) {
    return entries[0]?.[0] || 'immediate';
  }

  let draw = rng() * total;
  for (const [profile, weight] of entries) {
    draw -= Number(weight || 0);
    if (draw <= 0) {
      return profile;
    }
  }

  return entries[entries.length - 1]?.[0] || 'immediate';
}

function pickRandom(list, rng) {
  if (!Array.isArray(list) || list.length === 0) {
    return null;
  }
  const index = Math.floor(rng() * list.length);
  return list[index];
}

async function postJson(url, body, timeoutMs) {
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
      const error = new Error(`HTTP_${response.status}`);
      error.payload = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error?.name === 'AbortError') {
      const timeoutError = new Error('REQUEST_TIMEOUT');
      timeoutError.cause = error;
      throw timeoutError;
    }

    if (/^HTTP_\d{3}$/.test(String(error?.message || ''))) {
      throw error;
    }

    const fetchError = new Error('FETCH_ERROR');
    fetchError.cause = error;
    if (error?.payload !== undefined) {
      fetchError.payload = error.payload;
    }
    throw fetchError;
  } finally {
    clearTimeout(timer);
  }
}

async function patchJson(url, body, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(`HTTP_${response.status}`);
      error.payload = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error?.name === 'AbortError') {
      const timeoutError = new Error('REQUEST_TIMEOUT');
      timeoutError.cause = error;
      throw timeoutError;
    }

    if (/^HTTP_\d{3}$/.test(String(error?.message || ''))) {
      throw error;
    }

    const fetchError = new Error('FETCH_ERROR');
    fetchError.cause = error;
    if (error?.payload !== undefined) {
      fetchError.payload = error.payload;
    }
    throw fetchError;
  } finally {
    clearTimeout(timer);
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

const {
  workerId,
  seed,
  baseUrl,
  workflowsTarget,
  threadCount,
  inflightLimit,
  requestTimeoutMs,
  cancelDelayRangeMs,
  maxCancelDrainMs,
  phases,
  profileWeights,
  templatesByProfile,
  customersByWorkspace,
  invalidRequestRatio,
} = workerData;

const rng = seededRng(seed + workerId * 1009);

const control = {
  stopRequested: false,
  rateMultiplier: 1,
  duplicateBurstRemaining: 0,
};

const metrics = {
  workerId,
  workflowsDispatched: 0,
  publishSuccess: 0,
  publishErrors: 0,
  duplicatePublishes: 0,
  cancellationsScheduled: 0,
  cancellationSuccess: 0,
  cancellationErrors: 0,
  publishLatencyMs: [],
  cancellationLatencyMs: [],
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

const BUSINESS_HOUR_START_UTC = 9;
const BUSINESS_HOUR_END_UTC = 17;
const SLOTS_PER_HOUR = 2;
const SLOTS_PER_DAY = (BUSINESS_HOUR_END_UTC - BUSINESS_HOUR_START_UTC) * SLOTS_PER_HOUR;

const workspaceSlotCounters = new Map();
const scheduleAnchorDate = (() => {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + 1);

  while (date.getUTCDay() === 0 || date.getUTCDay() === 6) {
    date.setUTCDate(date.getUTCDate() + 1);
  }

  return date;
})();

function countError(error, operation = 'worker_execute') {
  const failure = normalizeFailure(error, operation);
  incrementCount(metrics.errorCodes, failure.errorCode);
  incrementCount(metrics.failureDetails.codeCounts, failure.errorCode);
  incrementCount(metrics.failureDetails.typeCounts, failure.failureType);
  incrementCount(metrics.failureDetails.stageCounts, failure.errorStage);

  pushWithCap(
    metrics.failureDetails.samples,
    {
      at: new Date().toISOString(),
      operation,
      error_code: failure.errorCode,
      failure_type: failure.failureType,
      error_stage: failure.errorStage,
      message: failure.message,
      detail: failure.detail,
    },
    ERROR_SAMPLE_CAP
  );
}

if (parentPort) {
  parentPort.on('message', (message) => {
    if (!message || typeof message !== 'object') {
      return;
    }

    if (message.type === 'stop') {
      control.stopRequested = true;
      return;
    }

    if (message.type === 'setRateMultiplier') {
      const nextMultiplier = Number(message.multiplier);
      if (Number.isFinite(nextMultiplier) && nextMultiplier > 0) {
        control.rateMultiplier = nextMultiplier;
      }
      return;
    }

    if (message.type === 'injectDuplicateBurst') {
      const additional = Number(message.count || 0);
      if (Number.isFinite(additional) && additional > 0) {
        control.duplicateBurstRemaining += Math.trunc(additional);
      }
    }
  });
}

function addBusinessDaysUtc(startDate, businessDays) {
  const date = new Date(startDate.getTime());
  let remaining = Math.max(0, businessDays);

  while (remaining > 0) {
    date.setUTCDate(date.getUTCDate() + 1);
    const day = date.getUTCDay();
    if (day !== 0 && day !== 6) {
      remaining -= 1;
    }
  }

  return date;
}

function nextWorkspaceSlotIndex(workspaceId) {
  const current = workspaceSlotCounters.get(workspaceId) || 0;
  workspaceSlotCounters.set(workspaceId, current + 1);

  // Spread slots across workers to avoid cross-thread collisions.
  return current * Math.max(1, threadCount) + Math.max(0, workerId - 1);
}

function buildBookingDateIso(workspaceId) {
  const slotIndex = nextWorkspaceSlotIndex(workspaceId);
  const businessDayOffset = Math.floor(slotIndex / SLOTS_PER_DAY);
  const slotInDay = slotIndex % SLOTS_PER_DAY;
  const hour = BUSINESS_HOUR_START_UTC + Math.floor(slotInDay / SLOTS_PER_HOUR);
  const minute = (slotInDay % SLOTS_PER_HOUR) * 30;

  const date = addBusinessDaysUtc(scheduleAnchorDate, businessDayOffset);
  date.setUTCHours(hour, minute, 0, 0);
  return date.toISOString();
}

function buildExecutePayload(template, customer, isInvalidRequest) {
  if (isInvalidRequest) {
    return {
      workspace_id: template.workspaceId,
      customer_id: 'invalid-customer-id',
      customer_phone: customer.phone,
      message: `Invalid harness payload for ${template.serviceName}`,
      ai_output: {
        intent: 'book_appointment',
        entities: {
          service: template.serviceName,
          date: 'not-a-date',
        },
      },
    };
  }

  const bookingDate = buildBookingDateIso(template.workspaceId);
  return {
    workspace_id: template.workspaceId,
    customer_id: customer.id,
    customer_phone: customer.phone,
    message: `Load test booking ${template.serviceName} at ${bookingDate}`,
    ai_output: {
      intent: 'book_appointment',
      entities: {
        service: template.serviceName,
        date: bookingDate,
      },
    },
  };
}

function pickTemplate() {
  const profile = pickWeightedProfile(profileWeights, rng);
  const bucket = templatesByProfile[profile] || [];
  const template = pickRandom(bucket, rng);
  if (!template) {
    throw new Error(`No templates available for profile ${profile}`);
  }
  return { profile, template };
}

function pickCustomer(workspaceId) {
  const customers = customersByWorkspace[workspaceId] || [];
  const customer = pickRandom(customers, rng);
  if (!customer) {
    throw new Error(`No customer pool available for workspace ${workspaceId}`);
  }
  return customer;
}

async function dispatchWorkflow(withDuplicate = false) {
  let profile;
  let template;
  let customer;

  try {
    const selected = pickTemplate();
    profile = selected.profile;
    template = selected.template;
    customer = pickCustomer(template.workspaceId);
  } catch (error) {
    metrics.publishErrors += 1;
    countError(error, 'worker_execute');
    return null;
  }

  metrics.profileCounts[profile] = (metrics.profileCounts[profile] || 0) + 1;
  const isInvalidRequest = rng() < Number(invalidRequestRatio || 0);
  if (isInvalidRequest) {
    metrics.requestQuality.intendedInvalid += 1;
  } else {
    metrics.requestQuality.intendedValid += 1;
  }

  const payload = buildExecutePayload(template, customer, isInvalidRequest);

  const started = performance.now();
  let response;

  try {
    response = await postJson(`${baseUrl}/api/automation/intent/execute`, payload, requestTimeoutMs);
    metrics.publishSuccess += 1;
    if (isInvalidRequest) {
      metrics.requestQuality.invalidSuccess += 1;
    } else {
      metrics.requestQuality.validSuccess += 1;
    }
    const latencyMs = performance.now() - started;
    pushWithCap(metrics.publishLatencyMs, latencyMs, 8000);
  } catch (error) {
    metrics.publishErrors += 1;
    if (isInvalidRequest) {
      metrics.requestQuality.invalidErrors += 1;
    } else {
      metrics.requestQuality.validErrors += 1;
    }
    countError(error, 'enqueue');
    return;
  }

  const appointmentId = response?.data?.result?.appointment?.id;
  const shouldCancel = rng() < Number(template.cancelProbability || 0);

  if (appointmentId && shouldCancel && !withDuplicate) {
    metrics.cancellationsScheduled += 1;
    const delayMs = cancelDelayRangeMs.min + Math.floor(rng() * (cancelDelayRangeMs.max - cancelDelayRangeMs.min + 1));

    return {
      cancellationTask: (async () => {
        await sleep(delayMs);
        const cancelStarted = performance.now();
        try {
          await patchJson(
            `${baseUrl}/api/core/appointments/${appointmentId}/status`,
            {
              workspace_id: template.workspaceId,
              status: 'cancelled',
              notes: 'load-chaos-harness cancellation',
            },
            requestTimeoutMs
          );
          metrics.cancellationSuccess += 1;
          pushWithCap(metrics.cancellationLatencyMs, performance.now() - cancelStarted, 4000);
        } catch (error) {
          metrics.cancellationErrors += 1;
          countError(error, 'external_action');
        }
      })(),
    };
  }

  return null;
}

async function runWorker() {
  const inflight = new Set();
  const cancellationTasks = new Set();

  const startedAtMs = Date.now();
  let bucketTokens = 0;
  let lastTick = performance.now();
  let lastProgressSent = Date.now();

  while (!control.stopRequested && metrics.workflowsDispatched < workflowsTarget) {
    const now = performance.now();
    const deltaSeconds = Math.max(0, (now - lastTick) / 1000);
    lastTick = now;

    const elapsedSeconds = Math.max(0, (Date.now() - startedAtMs) / 1000);
    const globalRate = resolvePhaseRate(elapsedSeconds, phases);
    const localRate = Math.max(0.1, (globalRate / Math.max(threadCount, 1)) * control.rateMultiplier);

    bucketTokens = Math.min(bucketTokens + deltaSeconds * localRate, localRate * 3);

    while (
      bucketTokens >= 1 &&
      inflight.size < inflightLimit &&
      metrics.workflowsDispatched < workflowsTarget &&
      !control.stopRequested
    ) {
      bucketTokens -= 1;
      metrics.workflowsDispatched += 1;

      const task = (async () => {
        const result = await dispatchWorkflow(false);
        if (result?.cancellationTask) {
          cancellationTasks.add(result.cancellationTask);
          result.cancellationTask.finally(() => cancellationTasks.delete(result.cancellationTask));
        }

        if (control.duplicateBurstRemaining > 0) {
          control.duplicateBurstRemaining -= 1;
          metrics.duplicatePublishes += 1;
          await dispatchWorkflow(true);
        }
      })();

      inflight.add(task);
      task.finally(() => inflight.delete(task));
    }

    if (Date.now() - lastProgressSent >= 5000 && parentPort) {
      lastProgressSent = Date.now();
      parentPort.postMessage({
        type: 'progress',
        workerId,
        metrics: {
          workflowsDispatched: metrics.workflowsDispatched,
          publishSuccess: metrics.publishSuccess,
          publishErrors: metrics.publishErrors,
          cancellationsScheduled: metrics.cancellationsScheduled,
          cancellationSuccess: metrics.cancellationSuccess,
          cancellationErrors: metrics.cancellationErrors,
          duplicatePublishes: metrics.duplicatePublishes,
          inflight: inflight.size,
        },
      });
    }

    if (inflight.size >= inflightLimit || bucketTokens < 1) {
      await sleep(20);
    }
  }

  await Promise.allSettled([...inflight]);

  const cancelDeadline = Date.now() + maxCancelDrainMs;
  while (cancellationTasks.size > 0 && Date.now() < cancelDeadline) {
    await Promise.race([...cancellationTasks]);
  }

  return {
    ...metrics,
    publishLatencySummary: {
      p50: percentile(metrics.publishLatencyMs, 0.5),
      p95: percentile(metrics.publishLatencyMs, 0.95),
      p99: percentile(metrics.publishLatencyMs, 0.99),
      max: metrics.publishLatencyMs.length ? Math.max(...metrics.publishLatencyMs) : 0,
    },
    cancellationLatencySummary: {
      p50: percentile(metrics.cancellationLatencyMs, 0.5),
      p95: percentile(metrics.cancellationLatencyMs, 0.95),
      p99: percentile(metrics.cancellationLatencyMs, 0.99),
      max: metrics.cancellationLatencyMs.length ? Math.max(...metrics.cancellationLatencyMs) : 0,
    },
  };
}

runWorker()
  .then((result) => {
    if (parentPort) {
      parentPort.postMessage({ type: 'done', workerId, result });
    }
  })
  .catch((error) => {
    if (parentPort) {
      parentPort.postMessage({
        type: 'fatal',
        workerId,
        error: {
          message: error?.message || String(error),
          stack: error?.stack || null,
        },
      });
    }
  });
