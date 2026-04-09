import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { detectBreakpoints, extractCoreMetrics } from './report-analysis.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const harnessScript = path.resolve(__dirname, './run-harness.mjs');
const defaultOutputDir = path.resolve(__dirname, './output');

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function parseArgs(argv) {
  const args = {
    startRps: parseInteger(process.env.CAPACITY_START_RPS, 250),
    minRps: parseInteger(process.env.CAPACITY_MIN_RPS, 100),
    maxRps: parseInteger(process.env.CAPACITY_MAX_RPS, 2500),
    growthFactor: parseNumber(process.env.CAPACITY_GROWTH_FACTOR, 1.6),
    precision: parseInteger(process.env.CAPACITY_PRECISION_RPS, 25),
    maxRuns: parseInteger(process.env.CAPACITY_MAX_RUNS, 10),
    workflowMultiplier: parseNumber(process.env.CAPACITY_WORKFLOW_MULTIPLIER, 1.15),
    warmupSeconds: parseInteger(process.env.CAPACITY_WARMUP_SECONDS, 20),
    rampSeconds: parseInteger(process.env.CAPACITY_RAMP_SECONDS, 50),
    steadySeconds: parseInteger(process.env.CAPACITY_STEADY_SECONDS, 90),
    soakSeconds: parseInteger(process.env.CAPACITY_SOAK_SECONDS, 60),
    outputDir: process.env.HARNESS_OUTPUT_DIR || defaultOutputDir,
    output: '',
    jsonOnly: false,
    failureRateThreshold: parseNumber(process.env.CAPACITY_FAILURE_RATE_THRESHOLD, 0.02),
    dbLatencyThresholdMs: parseNumber(process.env.CAPACITY_DB_P95_THRESHOLD_MS, 150),
    delayDriftThresholdSec: parseNumber(process.env.CAPACITY_DELAY_DRIFT_THRESHOLD_SEC, 10),
    queueWaitingThreshold: parseNumber(process.env.CAPACITY_QUEUE_WAITING_THRESHOLD, 2000),
    stuckWorkflowThreshold: parseNumber(process.env.CAPACITY_STUCK_WORKFLOW_THRESHOLD, 5),
    breakpointRatioThreshold: parseNumber(process.env.CAPACITY_BREAKPOINT_RATIO_THRESHOLD, 0.85),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if ((token === '--start-rps' || token === '--start') && argv[i + 1]) {
      args.startRps = parseInteger(argv[i + 1], args.startRps);
      i += 1;
      continue;
    }

    if (token === '--min-rps' && argv[i + 1]) {
      args.minRps = parseInteger(argv[i + 1], args.minRps);
      i += 1;
      continue;
    }

    if (token === '--max-rps' && argv[i + 1]) {
      args.maxRps = parseInteger(argv[i + 1], args.maxRps);
      i += 1;
      continue;
    }

    if (token === '--growth-factor' && argv[i + 1]) {
      args.growthFactor = parseNumber(argv[i + 1], args.growthFactor);
      i += 1;
      continue;
    }

    if (token === '--precision' && argv[i + 1]) {
      args.precision = parseInteger(argv[i + 1], args.precision);
      i += 1;
      continue;
    }

    if (token === '--max-runs' && argv[i + 1]) {
      args.maxRuns = parseInteger(argv[i + 1], args.maxRuns);
      i += 1;
      continue;
    }

    if (token === '--output' && argv[i + 1]) {
      args.output = argv[i + 1];
      i += 1;
      continue;
    }

    if (token === '--json') {
      args.jsonOnly = true;
      continue;
    }

    if (token === '--help' || token === '-h') {
      printUsageAndExit(0);
    }
  }

  args.startRps = Math.max(args.minRps, args.startRps);
  args.maxRps = Math.max(args.minRps, args.maxRps);
  args.precision = Math.max(1, args.precision);
  args.maxRuns = Math.max(2, args.maxRuns);
  args.growthFactor = Math.max(1.1, args.growthFactor);

  return args;
}

function printUsageAndExit(code = 1) {
  const usage = [
    'Usage:',
    '  node scripts/load-chaos-harness/capacity-finder.mjs [options]',
    '',
    'Options:',
    '  --start-rps <n>              Initial RPS probe',
    '  --min-rps <n>                Minimum RPS lower bound',
    '  --max-rps <n>                Maximum RPS upper bound',
    '  --growth-factor <n>          Exponential step factor',
    '  --precision <n>              Binary-search stop size in RPS',
    '  --max-runs <n>               Max harness runs during search',
    '  --output <path>              Optional capacity report output path',
    '  --json                       Print JSON only',
    '  --help                       Show help',
  ];

  const stream = code === 0 ? process.stdout : process.stderr;
  stream.write(`${usage.join('\n')}\n`);
  process.exit(code);
}

function expectedWorkflowsForRun(targetRps, args) {
  const warmupRps = Math.max(10, Math.round(targetRps * 0.3));
  const soakRps = Math.max(10, Math.round(targetRps * 0.5));

  const warmupVolume = warmupRps * args.warmupSeconds;
  const rampVolume = ((warmupRps + targetRps) / 2) * args.rampSeconds;
  const steadyVolume = targetRps * args.steadySeconds;
  const soakVolume = soakRps * args.soakSeconds;

  return Math.max(200, Math.ceil((warmupVolume + rampVolume + steadyVolume + soakVolume) * args.workflowMultiplier));
}

async function findLatestReportAfter(outputDir, startedAtMs) {
  const entries = await readdir(outputDir, { withFileTypes: true });
  const reports = entries
    .filter((entry) => entry.isFile() && /^report-\d+\.json$/i.test(entry.name))
    .map((entry) => {
      const match = entry.name.match(/^report-(\d+)\.json$/i);
      return {
        filePath: path.join(outputDir, entry.name),
        ts: match ? Number(match[1]) : 0,
      };
    })
    .filter((entry) => Number.isFinite(entry.ts) && entry.ts >= startedAtMs - 1000)
    .sort((a, b) => a.ts - b.ts);

  return reports.length > 0 ? reports[reports.length - 1].filePath : null;
}

async function runSingleHarnessProbe(targetRps, args) {
  const startedAtMs = Date.now();
  const runLabel = `[capacity] rps=${targetRps}`;

  const warmupRps = Math.max(10, Math.round(targetRps * 0.3));
  const soakRps = Math.max(10, Math.round(targetRps * 0.5));
  const workflows = process.env.HARNESS_WORKFLOWS
    ? parseInteger(process.env.HARNESS_WORKFLOWS, expectedWorkflowsForRun(targetRps, args))
    : expectedWorkflowsForRun(targetRps, args);

  const env = {
    ...process.env,
    HARNESS_TARGET_RPS: String(targetRps),
    HARNESS_WARMUP_RPS: String(warmupRps),
    HARNESS_SOAK_RPS: String(soakRps),
    HARNESS_WARMUP_SECONDS: String(args.warmupSeconds),
    HARNESS_RAMP_SECONDS: String(args.rampSeconds),
    HARNESS_STEADY_SECONDS: String(args.steadySeconds),
    HARNESS_SOAK_SECONDS: String(args.soakSeconds),
    HARNESS_WORKFLOWS: String(workflows),
    HARNESS_OUTPUT_DIR: args.outputDir,
  };

  let reportPathFromStdout = '';
  let stdoutBuffer = '';
  let stderrBuffer = '';

  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [harnessScript], {
      cwd: path.resolve(__dirname, '../..'),
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    child.stdout.on('data', (chunk) => {
      const text = String(chunk);
      stdoutBuffer += text;
      process.stdout.write(text);

      const match = text.match(/Report written to\s+(.+)\s*$/m);
      if (match?.[1]) {
        reportPathFromStdout = match[1].trim();
      }
    });

    child.stderr.on('data', (chunk) => {
      const text = String(chunk);
      stderrBuffer += text;
      process.stderr.write(text);
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${runLabel} exited with code ${code}`));
    });
  }).catch(async (error) => {
    let fallbackReportPath = null;
    try {
      fallbackReportPath = await findLatestReportAfter(args.outputDir, startedAtMs);
    } catch {
      // ignore
    }

    if (!fallbackReportPath) {
      throw new Error(`${error?.message || error}\n${stderrBuffer || stdoutBuffer}`);
    }
  });

  const reportPath = reportPathFromStdout || await findLatestReportAfter(args.outputDir, startedAtMs);
  if (!reportPath) {
    throw new Error(`${runLabel} completed but report file could not be located`);
  }

  const report = JSON.parse(await readFile(reportPath, 'utf8'));
  const core = extractCoreMetrics(report);
  const breakpoints = report?.summary?.breakpoints || detectBreakpoints(report);
  const firstStuck = Number(report?.metricsSamples?.[0]?.db?.runsStuck || 0);
  const lastStuck = Number(
    report?.metricsSamples?.[report?.metricsSamples?.length - 1]?.db?.runsStuck || firstStuck
  );
  const stuckGrowth = Math.max(0, lastStuck - firstStuck);

  const reasons = [];
  if (report?.run?.fatalError) {
    reasons.push('fatal_error');
  }
  if (core.publishErrorRate > args.failureRateThreshold) {
    reasons.push('failure_rate');
  }
  if (core.dbQueryP95Ms > args.dbLatencyThresholdMs) {
    reasons.push('db_latency');
  }
  if (core.delayDriftP95PeakSec > args.delayDriftThresholdSec) {
    reasons.push('delay_drift');
  }
  if (core.queueWaitingPeak > args.queueWaitingThreshold) {
    reasons.push('queue_waiting');
  }
  if (stuckGrowth > args.stuckWorkflowThreshold) {
    reasons.push('stuck_workflows');
  }

  if (breakpoints.detected) {
    const breakpointRps = Number(breakpoints?.firstDegradation?.observedRps);
    if (!Number.isFinite(breakpointRps) || breakpointRps < targetRps * args.breakpointRatioThreshold) {
      reasons.push('breakpoint_detected');
    }
  }

  const degraded = reasons.length > 0;

  const result = {
    rps: targetRps,
    degraded,
    reasons,
    reportPath,
    metrics: core,
    stuckGrowth,
    breakpoint: breakpoints?.firstDegradation || null,
  };

  const throughput = core.throughputRps.toFixed(1);
  const failureRatePct = (core.publishErrorRate * 100).toFixed(2);
  process.stdout.write(
    `${runLabel} degraded=${degraded ? 'yes' : 'no'} throughput=${throughput}rps ` +
    `failureRate=${failureRatePct}% driftP95=${core.delayDriftP95PeakSec.toFixed(2)}s ` +
    `dbP95=${core.dbQueryP95Ms.toFixed(2)}ms queuePeak=${core.queueWaitingPeak}\n`
  );
  if (degraded) {
    process.stdout.write(`${runLabel} reasons=${reasons.join(',')}\n`);
  }

  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await mkdir(args.outputDir, { recursive: true });

  const tested = new Map();
  const runs = [];

  const evaluate = async (rps) => {
    const key = String(rps);
    if (tested.has(key)) {
      return tested.get(key);
    }

    const result = await runSingleHarnessProbe(rps, args);
    tested.set(key, result);
    runs.push(result);
    return result;
  };

  let lastGood = null;
  let firstBad = null;
  let probe = Math.max(args.minRps, args.startRps);

  while (runs.length < args.maxRuns) {
    const result = await evaluate(probe);

    if (result.degraded) {
      firstBad = probe;
      break;
    }

    lastGood = Math.max(lastGood ?? 0, probe);
    if (probe >= args.maxRps) {
      break;
    }

    const next = Math.min(args.maxRps, Math.max(probe + 1, Math.round(probe * args.growthFactor)));
    if (next === probe) {
      break;
    }
    probe = next;
  }

  if (firstBad === null && (lastGood ?? args.minRps) < args.maxRps && runs.length < args.maxRuns) {
    const maxProbe = await evaluate(args.maxRps);
    if (maxProbe.degraded) {
      firstBad = args.maxRps;
    } else {
      lastGood = Math.max(lastGood ?? 0, args.maxRps);
    }
  }

  if (firstBad !== null && !(lastGood === null && firstBad <= args.minRps)) {
    let binaryLow = lastGood ?? args.minRps;

    while (firstBad - binaryLow > args.precision && runs.length < args.maxRuns) {
      const mid = Math.max(args.minRps, Math.floor((firstBad + binaryLow) / 2));
      if (mid === firstBad || mid === binaryLow) {
        break;
      }

      const result = await evaluate(mid);

      if (result.degraded) {
        firstBad = mid;
      } else {
        binaryLow = mid;
        lastGood = Math.max(lastGood ?? 0, mid);
      }
    }
  }

  const capacityRps = lastGood !== null ? lastGood : Math.max(0, args.minRps - 1);
  const confidence = firstBad === null
    ? 'lower-bound-only'
    : (lastGood === null ? 'below-min' : 'bounded');

  const summary = {
    generatedAt: new Date().toISOString(),
    config: {
      startRps: args.startRps,
      minRps: args.minRps,
      maxRps: args.maxRps,
      growthFactor: args.growthFactor,
      precision: args.precision,
      maxRuns: args.maxRuns,
      thresholds: {
        failureRate: args.failureRateThreshold,
        dbLatencyMs: args.dbLatencyThresholdMs,
        delayDriftSec: args.delayDriftThresholdSec,
        queueWaiting: args.queueWaitingThreshold,
        stuckWorkflowGrowth: args.stuckWorkflowThreshold,
        breakpointRatio: args.breakpointRatioThreshold,
      },
    },
    capacityRps,
    firstDegradedRps: firstBad,
    confidence,
    testedRuns: runs,
  };

  const outputPath = args.output
    ? path.resolve(process.cwd(), args.output)
    : path.join(args.outputDir, `capacity-report-${Date.now()}.json`);

  await writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

  if (args.jsonOnly) {
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } else {
    const lines = [
      '=== Capacity Finder ===',
      `capacityRps: ${summary.capacityRps}`,
      `firstDegradedRps: ${summary.firstDegradedRps ?? 'not reached'}`,
      `confidence: ${summary.confidence}`,
      `runsExecuted: ${summary.testedRuns.length}`,
      `report: ${outputPath}`,
    ];
    process.stdout.write(`${lines.join('\n')}\n`);
  }
}

main().catch((error) => {
  process.stderr.write(`[capacity-finder] ${error?.message || error}\n`);
  process.exit(1);
});
