function toFiniteNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function percentile(values, p) {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }

  const sorted = [...values]
    .map((value) => toFiniteNumber(value, 0))
    .sort((a, b) => a - b);
  const clamped = Math.min(1, Math.max(0, toFiniteNumber(p, 0)));
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * clamped)));
  return sorted[index];
}

export function percentChange(baseValue, currentValue) {
  const base = toFiniteNumber(baseValue, 0);
  const current = toFiniteNumber(currentValue, 0);
  if (base === 0) {
    return current === 0 ? 0 : null;
  }
  return ((current - base) / Math.abs(base)) * 100;
}

function normalizeSamples(report) {
  if (!Array.isArray(report?.metricsSamples)) {
    return [];
  }

  return report.metricsSamples.filter((sample) => sample && typeof sample === 'object');
}

export function phaseTargetRps(elapsedSeconds, phaseConfig) {
  const elapsed = Math.max(0, toFiniteNumber(elapsedSeconds, 0));
  const warmupSeconds = Math.max(0, toFiniteNumber(phaseConfig?.warmupSeconds, 0));
  const rampSeconds = Math.max(0, toFiniteNumber(phaseConfig?.rampSeconds, 0));
  const steadySeconds = Math.max(0, toFiniteNumber(phaseConfig?.steadySeconds, 0));
  const warmupRps = Math.max(0, toFiniteNumber(phaseConfig?.warmupRps, 0));
  const targetRps = Math.max(0, toFiniteNumber(phaseConfig?.targetRps, 0));
  const soakRps = Math.max(0, toFiniteNumber(phaseConfig?.soakRps, targetRps));

  const warmupEnd = warmupSeconds;
  const rampEnd = warmupEnd + rampSeconds;
  const steadyEnd = rampEnd + steadySeconds;

  if (elapsed < warmupEnd) {
    return warmupRps;
  }

  if (elapsed < rampEnd) {
    if (rampSeconds <= 0) {
      return targetRps;
    }
    const progress = (elapsed - warmupEnd) / rampSeconds;
    return warmupRps + (targetRps - warmupRps) * progress;
  }

  if (elapsed < steadyEnd) {
    return targetRps;
  }

  return soakRps;
}

export function buildLoadTimeline(report) {
  const samples = normalizeSamples(report);
  if (samples.length === 0) {
    return [];
  }

  const startMs = Date.parse(report?.run?.startedAt || samples[0]?.timestamp || new Date().toISOString());

  return samples.map((sample, index) => {
    const sampleMs = Date.parse(sample.timestamp || new Date().toISOString());
    const elapsedSec = Number.isFinite(startMs)
      ? Math.max(0, (sampleMs - startMs) / 1000)
      : index;

    const previous = index > 0 ? samples[index - 1] : null;
    const previousMs = previous ? Date.parse(previous.timestamp || sample.timestamp) : null;
    const previousSuccess = toFiniteNumber(previous?.progress?.publishSuccess, NaN);
    const currentSuccess = toFiniteNumber(sample?.progress?.publishSuccess, NaN);

    let observedRps = null;
    if (
      previous &&
      Number.isFinite(previousMs) &&
      Number.isFinite(sampleMs) &&
      sampleMs > previousMs &&
      Number.isFinite(previousSuccess) &&
      Number.isFinite(currentSuccess)
    ) {
      observedRps = Math.max(0, (currentSuccess - previousSuccess) / ((sampleMs - previousMs) / 1000));
    }

    return {
      index,
      timestamp: sample.timestamp || null,
      elapsedSec,
      targetRpsEstimate: phaseTargetRps(elapsedSec, report?.config || {}),
      observedRps,
      queueWaiting: toFiniteNumber(sample?.queue?.waiting, 0),
      queueOldestWaitingAgeSec: toFiniteNumber(sample?.queue?.oldestWaitingAgeSec, 0),
      dbLatencyMs: toFiniteNumber(sample?.db?.queryLatencyMs, 0),
      delayDriftP95Sec: toFiniteNumber(sample?.db?.delayDriftP95Sec, 0),
      runsStuck: toFiniteNumber(sample?.db?.runsStuck, 0),
      lockWaiters: toFiniteNumber(sample?.db?.lockWaiters, 0),
      rateMultiplier: toFiniteNumber(sample?.load?.rateMultiplier, 1),
    };
  });
}

export function detectBreakpoints(report, options = {}) {
  const samples = normalizeSamples(report);
  const timeline = buildLoadTimeline(report);

  const thresholds = {
    dbLatencyMs: toFiniteNumber(options?.dbLatencyMs, 150),
    queueWaiting: toFiniteNumber(options?.queueWaiting, 2000),
    delayDriftP95Sec: toFiniteNumber(options?.delayDriftP95Sec, 10),
    queueOldestWaitingAgeSec: toFiniteNumber(options?.queueOldestWaitingAgeSec, 60),
    runsStuck: toFiniteNumber(options?.runsStuck, 5),
    publishErrorRate: toFiniteNumber(options?.publishErrorRate, 0.02),
    baselineMultiplier: toFiniteNumber(options?.baselineMultiplier, 3),
    baselineWindow: Math.max(1, Math.trunc(toFiniteNumber(options?.baselineWindow, 3))),
  };

  const baselineSlice = samples.slice(0, Math.min(thresholds.baselineWindow, samples.length));

  const baseline = {
    dbLatencyMs: percentile(baselineSlice.map((sample) => sample?.db?.queryLatencyMs), 0.5),
    queueWaiting: percentile(baselineSlice.map((sample) => sample?.queue?.waiting), 0.5),
    delayDriftP95Sec: percentile(baselineSlice.map((sample) => sample?.db?.delayDriftP95Sec), 0.5),
    runsStuck: percentile(baselineSlice.map((sample) => sample?.db?.runsStuck), 0.5),
  };

  let firstDegradation = null;

  for (let i = 0; i < samples.length; i += 1) {
    const sample = samples[i];
    const timelineEntry = timeline[i] || null;

    const dbLatencyMs = toFiniteNumber(sample?.db?.queryLatencyMs, 0);
    const queueWaiting = toFiniteNumber(sample?.queue?.waiting, 0);
    const delayDriftP95Sec = toFiniteNumber(sample?.db?.delayDriftP95Sec, 0);
    const queueOldestWaitingAgeSec = toFiniteNumber(sample?.queue?.oldestWaitingAgeSec, 0);
    const runsStuck = toFiniteNumber(sample?.db?.runsStuck, 0);

    const triggers = [];

    const dbLatencyLimit = Math.max(thresholds.dbLatencyMs, baseline.dbLatencyMs * thresholds.baselineMultiplier);
    const queueWaitingLimit = Math.max(
      thresholds.queueWaiting,
      baseline.queueWaiting * thresholds.baselineMultiplier + 100
    );
    const delayDriftLimit = Math.max(
      thresholds.delayDriftP95Sec,
      baseline.delayDriftP95Sec * thresholds.baselineMultiplier + 1
    );
    const runsStuckLimit = Math.max(
      thresholds.runsStuck,
      baseline.runsStuck + thresholds.runsStuck
    );

    if (dbLatencyMs >= dbLatencyLimit) {
      triggers.push('db_latency');
    }
    if (queueWaiting >= queueWaitingLimit) {
      triggers.push('queue_depth');
    }
    if (delayDriftP95Sec >= delayDriftLimit) {
      triggers.push('delay_drift');
    }
    if (queueOldestWaitingAgeSec >= thresholds.queueOldestWaitingAgeSec) {
      triggers.push('queue_age');
    }
    if (runsStuck >= runsStuckLimit) {
      triggers.push('stuck_workflows');
    }

    if (triggers.length > 0) {
      firstDegradation = {
        index: i,
        timestamp: sample.timestamp || null,
        elapsedSec: timelineEntry?.elapsedSec ?? null,
        observedRps: timelineEntry?.observedRps ?? null,
        targetRpsEstimate: timelineEntry?.targetRpsEstimate ?? null,
        triggers,
        signals: {
          dbLatencyMs,
          queueWaiting,
          delayDriftP95Sec,
          queueOldestWaitingAgeSec,
          runsStuck,
        },
      };
      break;
    }
  }

  if (!firstDegradation) {
    const workflowsDispatched = toFiniteNumber(report?.summary?.worker?.workflowsDispatched, 0);
    const publishErrors = toFiniteNumber(report?.summary?.worker?.publishErrors, 0);
    const publishErrorRate = workflowsDispatched > 0 ? publishErrors / workflowsDispatched : 0;

    if (publishErrorRate >= thresholds.publishErrorRate) {
      firstDegradation = {
        index: -1,
        timestamp: report?.run?.endedAt || null,
        elapsedSec: toFiniteNumber(report?.run?.durationSeconds, 0),
        observedRps: null,
        targetRpsEstimate: null,
        triggers: ['publish_error_rate'],
        signals: {
          publishErrorRate,
        },
      };
    }
  }

  return {
    detected: Boolean(firstDegradation),
    thresholds,
    baseline,
    firstDegradation,
    timeline,
  };
}

export function classifyFailureCode(errorCode) {
  const code = String(errorCode || '').toLowerCase();

  if (
    /postgres|\bpg\b|sql|deadlock|lock timeout|too many clients|database|relation|econnrefused.*5432|query/.test(code)
  ) {
    return 'db';
  }

  if (/redis|bullmq|queue|job stalled|maxmemory|econnrefused.*6379|delayed job|waiting/.test(code)) {
    return 'queue';
  }

  if (/workflow[_-]?recovery|recovery|stale run|reconcile/.test(code)) {
    return 'recovery';
  }

  if (/duplicate|already exists|jobid|idempotent/.test(code)) {
    return 'duplicate';
  }

  if (/http_409|conflict/.test(code)) {
    return 'duplicate';
  }

  if (
    /http_5\d\d|http_4\d\d|fetch|socket|abort|sigkill|terminated|worker exited|econnreset|timeout|validation|bad request|forbidden|unauthorized|not found/.test(
      code
    )
  ) {
    return 'worker';
  }

  return 'unknown';
}

export function extractCoreMetrics(report) {
  const runDurationSeconds = toFiniteNumber(report?.run?.durationSeconds, 0);
  const worker = report?.summary?.worker || {};
  const db = report?.summary?.db || {};
  const queue = report?.summary?.queue || {};
  const samples = normalizeSamples(report);

  const stuckPeak = samples.length
    ? Math.max(...samples.map((sample) => toFiniteNumber(sample?.db?.runsStuck, 0)))
    : 0;

  const publishSuccess = toFiniteNumber(worker.publishSuccess, 0);
  const workflowsDispatched = toFiniteNumber(worker.workflowsDispatched, 0);
  const publishErrors = toFiniteNumber(worker.publishErrors, 0);

  return {
    runDurationSeconds,
    publishSuccess,
    publishErrors,
    workflowsDispatched,
    throughputRps: runDurationSeconds > 0 ? publishSuccess / runDurationSeconds : 0,
    publishErrorRate: workflowsDispatched > 0 ? publishErrors / workflowsDispatched : 0,
    delayDriftP95PeakSec: toFiniteNumber(db.delayDriftP95PeakSec, 0),
    dbQueryP95Ms: toFiniteNumber(db.queryLatencyP95Ms, 0),
    queueWaitingPeak: toFiniteNumber(queue.waitingPeak, 0),
    queueOldestWaitingAgePeakSec: toFiniteNumber(queue.oldestWaitingAgePeakSec, 0),
    stuckWorkflowsPeak: stuckPeak,
    duplicatePublishes: toFiniteNumber(worker.duplicatePublishes, 0),
    lockWaitersPeak: toFiniteNumber(db.lockWaitersPeak, 0),
    lockWaitMaxPeakSec: toFiniteNumber(db.lockWaitMaxPeakSec, 0),
    publishLatencyP95Ms: toFiniteNumber(worker?.publishLatencySummary?.p95, 0),
    cancellationLatencyP95Ms: toFiniteNumber(worker?.cancellationLatencySummary?.p95, 0),
  };
}

export function buildFailureTags(report) {
  const counts = {
    db: 0,
    queue: 0,
    worker: 0,
    recovery: 0,
    duplicate: 0,
    unknown: 0,
  };

  const stageCounts = {
    enqueue: 0,
    worker_execute: 0,
    db_write: 0,
    external_action: 0,
    unknown: 0,
  };

  const workerSummary = report?.summary?.worker || {};
  const structured = workerSummary.failureDetails || {};
  const structuredTypeCounts = structured.typeCounts || {};
  const structuredStageCounts = structured.stageCounts || {};
  const structuredCodeCounts = structured.codeCounts || {};
  const hasStructuredTypeCounts = Object.values(structuredTypeCounts)
    .some((value) => toFiniteNumber(value, 0) > 0);

  if (hasStructuredTypeCounts) {
    for (const [bucket, value] of Object.entries(structuredTypeCounts)) {
      const safeCount = Math.max(0, Math.trunc(toFiniteNumber(value, 0)));
      if (Object.prototype.hasOwnProperty.call(counts, bucket)) {
        counts[bucket] += safeCount;
      } else {
        counts.unknown += safeCount;
      }
    }
  }

  if (!hasStructuredTypeCounts) {
    const errorCodes = workerSummary.errorCodes || {};
    for (const [errorCode, count] of Object.entries(errorCodes)) {
      const bucket = classifyFailureCode(errorCode);
      counts[bucket] += Math.max(0, Math.trunc(toFiniteNumber(count, 0)));
    }
  }

  for (const [stage, count] of Object.entries(structuredStageCounts)) {
    const safeCount = Math.max(0, Math.trunc(toFiniteNumber(count, 0)));
    if (Object.prototype.hasOwnProperty.call(stageCounts, stage)) {
      stageCounts[stage] += safeCount;
    } else {
      stageCounts.unknown += safeCount;
    }
  }

  const core = extractCoreMetrics(report);
  if (core.dbQueryP95Ms > 150 || core.lockWaitersPeak > 0 || core.lockWaitMaxPeakSec > 2) {
    counts.db += 1;
  }
  if (core.queueWaitingPeak > 500 || core.queueOldestWaitingAgePeakSec > 30) {
    counts.queue += 1;
  }
  if (core.publishErrorRate > 0) {
    counts.worker += 1;
  }
  if (core.duplicatePublishes > 0) {
    counts.duplicate += 1;
  }

  const recoveryEntry = Array.isArray(report?.summary?.failureCascade)
    ? report.summary.failureCascade.find((entry) => entry?.component === 'recovery_false_positive_risk')
    : null;
  if (toFiniteNumber(recoveryEntry?.score, 0) >= 2) {
    counts.recovery += 1;
  }

  const dominantEntry = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])[0];

  const topErrorCodes = Object.entries(
    hasStructuredTypeCounts && Object.keys(structuredCodeCounts).length > 0
      ? structuredCodeCounts
      : workerSummary.errorCodes || {}
  )
    .map(([code, count]) => [code, Math.max(0, Math.trunc(toFiniteNumber(count, 0)))])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([code, count]) => ({ code, count }));

  return {
    counts,
    stageCounts,
    topErrorCodes,
    dominant: dominantEntry && dominantEntry[1] > 0 ? dominantEntry[0] : 'none',
  };
}
