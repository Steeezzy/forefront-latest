import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import {
  buildFailureTags,
  detectBreakpoints,
  extractCoreMetrics,
  percentChange,
} from './report-analysis.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultOutputDir = path.resolve(__dirname, './output');

function parseArgs(argv) {
  const args = {
    baseline: '',
    current: '',
    output: '',
    jsonOnly: false,
    failOnRegression: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === '--baseline' && argv[i + 1]) {
      args.baseline = argv[i + 1];
      i += 1;
      continue;
    }

    if (token === '--current' && argv[i + 1]) {
      args.current = argv[i + 1];
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

    if (token === '--fail-on-regression') {
      args.failOnRegression = true;
      continue;
    }

    if (token === '--help' || token === '-h') {
      printUsageAndExit(0);
    }
  }

  return args;
}

function printUsageAndExit(code = 1) {
  const usage = [
    'Usage:',
    '  node scripts/load-chaos-harness/compare-report.mjs [options]',
    '',
    'Options:',
    '  --baseline <path>            Baseline report JSON file',
    '  --current <path>             Current report JSON file',
    '  --output <path>              Optional output path for comparison JSON',
    '  --json                       Print JSON only',
    '  --fail-on-regression         Exit with code 2 when regressions are detected',
    '  --help                       Show this help',
    '',
    'If --baseline/--current are omitted, the newest two report files from output/ are compared.',
  ];

  const stream = code === 0 ? process.stdout : process.stderr;
  stream.write(`${usage.join('\n')}\n`);
  process.exit(code);
}

function toFiniteNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function signedPercent(value, digits = 1) {
  if (value === null) {
    return 'n/a';
  }

  const n = toFiniteNumber(value, 0);
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(digits)}%`;
}

function signedNumber(value, digits = 2, unit = '') {
  const n = toFiniteNumber(value, 0);
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(digits)}${unit}`;
}

function diffCounts(baselineCounts, currentCounts) {
  const keys = new Set([
    ...Object.keys(baselineCounts || {}),
    ...Object.keys(currentCounts || {}),
  ]);

  const deltas = {};
  for (const key of keys) {
    deltas[key] = toFiniteNumber(currentCounts?.[key], 0) - toFiniteNumber(baselineCounts?.[key], 0);
  }
  return deltas;
}

async function listReportFiles(outputDir) {
  const entries = await readdir(outputDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && /^report-\d+\.json$/i.test(entry.name))
    .map((entry) => path.join(outputDir, entry.name))
    .sort();

  return files;
}

async function resolveReportPaths(args) {
  if (args.baseline && args.current) {
    return {
      baselinePath: path.resolve(process.cwd(), args.baseline),
      currentPath: path.resolve(process.cwd(), args.current),
      source: 'explicit',
    };
  }

  const files = await listReportFiles(defaultOutputDir);
  if (files.length < 2) {
    throw new Error('Need at least two harness reports in output/ or pass --baseline and --current');
  }

  return {
    baselinePath: files[files.length - 2],
    currentPath: files[files.length - 1],
    source: 'latest-two',
  };
}

async function readJson(filePath) {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

function computeComparison(baselineReport, currentReport) {
  const baselineMetrics = extractCoreMetrics(baselineReport);
  const currentMetrics = extractCoreMetrics(currentReport);

  const baselineBreakpoints = baselineReport?.summary?.breakpoints || detectBreakpoints(baselineReport);
  const currentBreakpoints = currentReport?.summary?.breakpoints || detectBreakpoints(currentReport);

  const baselineFailureTags = baselineReport?.summary?.failureTags || buildFailureTags(baselineReport);
  const currentFailureTags = currentReport?.summary?.failureTags || buildFailureTags(currentReport);

  const throughputChangePct = percentChange(baselineMetrics.throughputRps, currentMetrics.throughputRps);
  const delayDriftChangeSec = currentMetrics.delayDriftP95PeakSec - baselineMetrics.delayDriftP95PeakSec;
  const delayDriftChangePct = percentChange(
    baselineMetrics.delayDriftP95PeakSec,
    currentMetrics.delayDriftP95PeakSec
  );
  const failureRateChangePct =
    (currentMetrics.publishErrorRate - baselineMetrics.publishErrorRate) * 100;
  const stuckWorkflowDelta = currentMetrics.stuckWorkflowsPeak - baselineMetrics.stuckWorkflowsPeak;

  const changes = {
    throughputChangePct,
    delayDriftChangeSec,
    delayDriftChangePct,
    failureRateChangePct,
    stuckWorkflowDelta,
    queueWaitingPeakDelta: currentMetrics.queueWaitingPeak - baselineMetrics.queueWaitingPeak,
    dbQueryP95DeltaMs: currentMetrics.dbQueryP95Ms - baselineMetrics.dbQueryP95Ms,
  };

  const regressions = [];
  const improvements = [];

  if (throughputChangePct !== null && throughputChangePct < -5) {
    regressions.push('throughput_drop');
  } else if (throughputChangePct !== null && throughputChangePct > 5) {
    improvements.push('throughput_gain');
  }

  if (changes.failureRateChangePct > 0.5) {
    regressions.push('failure_rate_increase');
  } else if (changes.failureRateChangePct < -0.5) {
    improvements.push('failure_rate_decrease');
  }

  if (delayDriftChangeSec > 2) {
    regressions.push('delay_drift_increase');
  } else if (delayDriftChangeSec < -2) {
    improvements.push('delay_drift_reduction');
  }

  if (changes.dbQueryP95DeltaMs > 40) {
    regressions.push('db_latency_increase');
  } else if (changes.dbQueryP95DeltaMs < -40) {
    improvements.push('db_latency_reduction');
  }

  if (changes.queueWaitingPeakDelta > 500) {
    regressions.push('queue_backlog_growth');
  } else if (changes.queueWaitingPeakDelta < -500) {
    improvements.push('queue_backlog_reduction');
  }

  if (stuckWorkflowDelta > 0) {
    regressions.push('stuck_workflow_growth');
  }

  const baselineBreakpointRps = toFiniteNumber(baselineBreakpoints?.firstDegradation?.observedRps, 0);
  const currentBreakpointRps = toFiniteNumber(currentBreakpoints?.firstDegradation?.observedRps, 0);
  if (baselineBreakpointRps > 0 && currentBreakpointRps > 0) {
    const delta = currentBreakpointRps - baselineBreakpointRps;
    if (delta < -20) {
      regressions.push('earlier_saturation_point');
    } else if (delta > 20) {
      improvements.push('later_saturation_point');
    }
  }

  const verdict = regressions.length === 0
    ? (improvements.length > 0 ? 'improved_or_stable' : 'stable')
    : (improvements.length > 0 ? 'mixed' : 'regressed');

  return {
    summary: {
      throughput_change: signedPercent(throughputChangePct, 1),
      delay_drift_p95: signedNumber(delayDriftChangeSec, 2, 's'),
      failure_rate: signedPercent(failureRateChangePct, 2),
      stuck_workflows: signedNumber(stuckWorkflowDelta, 0),
      queue_waiting_peak: signedNumber(changes.queueWaitingPeakDelta, 0),
      db_latency_p95: signedNumber(changes.dbQueryP95DeltaMs, 2, 'ms'),
    },
    numeric: {
      baseline: baselineMetrics,
      current: currentMetrics,
      changes,
    },
    breakpoints: {
      baseline: baselineBreakpoints?.firstDegradation || null,
      current: currentBreakpoints?.firstDegradation || null,
    },
    failure_tags: {
      baseline: baselineFailureTags,
      current: currentFailureTags,
      delta: diffCounts(baselineFailureTags?.counts, currentFailureTags?.counts),
    },
    verdict,
    regressions,
    improvements,
  };
}

function printHumanSummary(result) {
  const lines = [
    '=== Harness Comparison ===',
    `throughput_change: ${result.summary.throughput_change}`,
    `delay_drift_p95: ${result.summary.delay_drift_p95}`,
    `failure_rate: ${result.summary.failure_rate}`,
    `stuck_workflows: ${result.summary.stuck_workflows}`,
    `queue_waiting_peak: ${result.summary.queue_waiting_peak}`,
    `db_latency_p95: ${result.summary.db_latency_p95}`,
    `verdict: ${result.verdict}`,
  ];

  if (result.regressions.length > 0) {
    lines.push(`regressions: ${result.regressions.join(', ')}`);
  }

  if (result.improvements.length > 0) {
    lines.push(`improvements: ${result.improvements.join(', ')}`);
  }

  if (result.breakpoints.current) {
    lines.push(
      `current_breakpoint: triggers=${result.breakpoints.current.triggers.join('+')} ` +
      `observedRps=${result.breakpoints.current.observedRps ?? 'n/a'}`
    );
  }

  process.stdout.write(`${lines.join('\n')}\n`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { baselinePath, currentPath, source } = await resolveReportPaths(args);

  const [baselineReport, currentReport] = await Promise.all([
    readJson(baselinePath),
    readJson(currentPath),
  ]);

  const comparison = computeComparison(baselineReport, currentReport);

  const output = {
    generatedAt: new Date().toISOString(),
    source,
    baselinePath,
    currentPath,
    ...comparison,
  };

  if (args.output) {
    const outputPath = path.resolve(process.cwd(), args.output);
    await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  }

  if (args.jsonOnly) {
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  } else {
    printHumanSummary(output);
  }

  if (args.failOnRegression && output.regressions.length > 0) {
    process.exit(2);
  }
}

main().catch((error) => {
  process.stderr.write(`[compare-report] ${error?.message || error}\n`);
  process.exit(1);
});
