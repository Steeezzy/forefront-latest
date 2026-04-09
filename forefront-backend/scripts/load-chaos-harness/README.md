# Workflow Load + Chaos Harness

This harness stress-tests the workflow engine with:

- 10,000 workflow target (default)
- 100,000+ step potential via template diversity
- worker_threads publisher model
- token-bucket phased traffic (warmup -> ramp -> steady -> soak)
- mixed delay types (`delay_seconds` and `delay_until`)
- cancellation injection (profile-weighted; global ~20%)
- failure injection via rule template step config (global ~10-15%)
- queue + DB + workflow metrics sampling
- optional chaos events

## Run

From repository root:

```bash
set -a && source forefront-backend/.env && set +a
node forefront-backend/scripts/load-chaos-harness/run-harness.mjs
```

From backend folder:

```bash
set -a && source .env && set +a
node scripts/load-chaos-harness/run-harness.mjs
```

Report output:

- `forefront-backend/scripts/load-chaos-harness/output/report-<timestamp>.json`

New fields in each report:

- `summary.failureTags` classified failures (`db`, `queue`, `worker`, `recovery`, `duplicate`, `unknown`)
- `summary.breakpoints` first detected degradation point and trigger signals

## Compare Two Reports

Compare explicit files:

```bash
node forefront-backend/scripts/load-chaos-harness/compare-report.mjs \
  --baseline forefront-backend/scripts/load-chaos-harness/output/report-1111111111111.json \
  --current forefront-backend/scripts/load-chaos-harness/output/report-2222222222222.json
```

Or compare newest two reports automatically:

```bash
npm --prefix forefront-backend run stress:workflow-compare
```

JSON-only output:

```bash
npm --prefix forefront-backend run stress:workflow-compare -- --json
```

## Capacity Finder

Automatically probes RPS ceilings with exponential + binary search:

```bash
npm --prefix forefront-backend run stress:workflow-capacity
```

Example tuned run:

```bash
npm --prefix forefront-backend run stress:workflow-capacity -- \
  --start-rps 300 \
  --max-rps 2000 \
  --precision 20 \
  --max-runs 8
```

Output:

- `capacity-report-<timestamp>.json` in harness output directory

## Core Environment Variables

- `API_BASE_URL` default: `http://localhost:8000`
- `HARNESS_WORKFLOWS` default: `10000`
- `HARNESS_THREADS` default: `8..16` based on CPU
- `HARNESS_INFLIGHT_PER_THREAD` default: `250`
- `HARNESS_WORKSPACES` default: `5`
- `HARNESS_CUSTOMERS_PER_WORKSPACE` default: `200`
- `HARNESS_INVALID_REQUEST_RATIO` default: `0.05`
- `HARNESS_REQUEST_TIMEOUT_MS` default: `20000`
- `HARNESS_CANCEL_DELAY_MIN_MS` default: `500`
- `HARNESS_CANCEL_DELAY_MAX_MS` default: `15000`
- `HARNESS_MAX_CANCEL_DRAIN_MS` default: `20000`
- `HARNESS_ABSOLUTE_DELAY_MIN_SECONDS` default: `120`
- `HARNESS_ABSOLUTE_DELAY_WINDOW_SECONDS` default: `3600`

Phase controls:

- `HARNESS_WARMUP_SECONDS` default: `120`
- `HARNESS_RAMP_SECONDS` default: `480`
- `HARNESS_STEADY_SECONDS` default: `900`
- `HARNESS_SOAK_SECONDS` default: `3600`
- `HARNESS_WARMUP_RPS` default: `100`
- `HARNESS_TARGET_RPS` default: `1000`
- `HARNESS_SOAK_RPS` default: `300`

Sampling + stuck detection:

- `HARNESS_METRICS_SAMPLE_SECONDS` default: `5`
- `HARNESS_STUCK_WORKFLOW_SECONDS` default: `600`

Determinism:

- `HARNESS_SEED` default: `20260405`

Clean-start controls (recommended for deterministic benchmark runs):

- `HARNESS_CLEAN_START` default: `true`
- `HARNESS_CLEAN_DB_START` default: `true`
- `HARNESS_CLEAN_QUEUE_START` default: `true`

When clean-start is enabled, the harness removes previous `Harness Workspace %` artifacts from DB tables and purges `automation_actions` plus `general_jobs` queues before seeding.

## Chaos Events

Use `CHAOS_EVENTS_JSON` to schedule chaos actions during the run.

You can also provide:

- `CHAOS_PLAN_JSON` (same format as `CHAOS_EVENTS_JSON`)
- `CHAOS_PLAN_FILE` (path to JSON array file)
- `CHAOS_PLAN_PRESET` (`progressive` or `aggressive`)

Example:

```bash
export CHAOS_EVENTS_JSON='[
  {"atSec":120,"type":"duplicate_events","count":500},
  {"atSec":180,"type":"queue_overload","multiplier":3,"durationSec":90},
  {"atSec":240,"type":"duplicate_replay","count":200},
  {"atSec":300,"type":"db_lock_contention","durationSec":15},
  {"atSec":360,"type":"force_recovery_scan","staleMinutes":1,"maxRuns":200}
]'
```

Supported event types:

- `queue_overload`
  - fields: `multiplier`, `durationSec`
  - temporarily increases publisher rate

- `duplicate_events`
  - fields: `count`
  - duplicates publisher requests burst

- `duplicate_replay`
  - fields: `count`
  - re-enqueues `evaluate-event` jobs for recent `appointment.created` events

- `db_lock_contention`
  - fields: `durationSec`
  - holds `ACCESS EXCLUSIVE` lock on `automation_job_refs`

- `force_recovery_scan`
  - fields: `staleMinutes`, `maxRuns`
  - enqueues workflow recovery job on `general_jobs`

- `worker_crash`
  - fields: `durationSec`
  - kills backend process from `backend.pid`, optional restart command
  - related env:
    - `CHAOS_BACKEND_PID_FILE` (default `backend.pid` in repo root)
    - `CHAOS_BACKEND_RESTART_CMD` (for example `./start-backend.sh`)

- `redis_outage`
  - fields: `durationSec`
  - runs external Redis down/up commands
  - related env:
    - `CHAOS_REDIS_DOWN_CMD`
    - `CHAOS_REDIS_UP_CMD`

## Notes

- This harness seeds fresh workspaces/rules/services/customers each run.
- Default profile weights are fixed to:
  - immediate: 35%
  - relative delay: 30%
  - absolute delay: 25%
  - cancellation-heavy: 10%
- Cancellation is profile-driven and converges near 20% globally.
- Failure is injected by rule step configs to target ~10-15% failed steps.
- Request payload quality defaults to ~95% valid / ~5% intentionally invalid and is reported via `summary.worker.requestQuality`.
- Run against non-production environments only.
