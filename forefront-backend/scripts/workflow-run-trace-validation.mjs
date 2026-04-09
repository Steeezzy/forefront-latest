import { Pool } from 'pg';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8000';
const STEP_DELAY_SECONDS_INPUT = Number(process.env.TRACE_STEP_DELAY_SECONDS || 1);
const STEP_DELAY_SECONDS = Number.isFinite(STEP_DELAY_SECONDS_INPUT) && STEP_DELAY_SECONDS_INPUT >= 1
  ? Math.trunc(STEP_DELAY_SECONDS_INPUT)
  : 1;

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

async function getJson(url) {
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`GET ${url} failed (${response.status}): ${JSON.stringify(data)}`);
  }

  return data;
}

async function createWorkspace() {
  const payload = {
    industryId: 'dental',
    businessName: 'Workflow Trace Validation Clinic',
    name: 'Workflow Trace Validation Clinic',
    phone: '+15550007777',
    timezone: 'US/Eastern',
  };

  const workspace = await postJson(`${API_BASE}/api/workspace/create`, payload);
  if (!workspace?.id) {
    throw new Error(`Workspace create did not return id: ${JSON.stringify(workspace)}`);
  }

  return workspace.id;
}

async function ensureCustomer(pool, workspaceId) {
  const phone = '+15551230004';
  const existing = await pool.query(
    'SELECT id FROM customers WHERE workspace_id = $1 AND phone = $2 LIMIT 1',
    [workspaceId, phone]
  );

  if (existing.rows.length > 0) {
    return { id: existing.rows[0].id, phone };
  }

  const inserted = await pool.query(
    'INSERT INTO customers (workspace_id, name, phone, lifecycle_stage) VALUES ($1, $2, $3, $4) RETURNING id',
    [workspaceId, 'Workflow Trace Customer', phone, 'lead']
  );

  return { id: inserted.rows[0].id, phone };
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
    actionConfig: {
      actions: [
        {
          type: 'tag_customer',
          config: {
            tag: 'trace_step_0',
          },
        },
        {
          type: 'delay',
          seconds: STEP_DELAY_SECONDS,
        },
        {
          type: 'tag_customer',
          config: {
            tag: 'trace_step_1',
          },
        },
      ],
    },
    priority: 80,
    executionMode: 'stop_on_match',
  });

  if (!response?.success || !response?.data?.id) {
    throw new Error(`Rule create response invalid: ${JSON.stringify(response)}`);
  }

  return response.data;
}

async function executeBooking({ workspaceId, customerId, customerPhone, serviceName, date }) {
  const body = {
    workspace_id: workspaceId,
    customer_id: customerId,
    customer_phone: customerPhone,
    message: `Book ${serviceName} at ${date}`,
    ai_output: {
      intent: 'book_appointment',
      entities: {
        service: serviceName,
        date,
      },
    },
  };

  return postJson(`${API_BASE}/api/automation/intent/execute`, body);
}

async function waitForExecutionEvent(pool, workspaceId, appointmentId) {
  const timeoutMs = 15000;
  const pollMs = 250;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const result = await pool.query(
      `SELECT id
       FROM execution_events
       WHERE workspace_id = $1
         AND event_type = 'appointment.created'
         AND (
           payload->>'appointment_id' = $2
           OR payload->>'appointmentId' = $2
         )
       ORDER BY created_at DESC
       LIMIT 1`,
      [workspaceId, appointmentId]
    );

    if (result.rows.length > 0) {
      return result.rows[0].id;
    }

    await sleep(pollMs);
  }

  throw new Error(`Timed out waiting for appointment.created execution event for appointment ${appointmentId}`);
}

async function waitForWorkflowRun(pool, workspaceId, eventId, ruleId) {
  const timeoutMs = 30000;
  const pollMs = 250;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const result = await pool.query(
      `SELECT id, status
       FROM workflow_runs
       WHERE workspace_id = $1
         AND event_id = $2::uuid
         AND rule_id = $3::uuid
       LIMIT 1`,
      [workspaceId, eventId, ruleId]
    );

    if (result.rows.length > 0) {
      const run = result.rows[0];
      if (run.status !== 'running') {
        return run;
      }
    }

    await sleep(pollMs);
  }

  throw new Error(`Timed out waiting for workflow run completion for rule ${ruleId}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const workspaceId = await createWorkspace();
    const customer = await ensureCustomer(pool, workspaceId);
    const serviceId = await ensureService(pool, workspaceId, 'Cleaning');

    await pool.query(
      'DELETE FROM automation_rules WHERE workspace_id = $1 AND trigger_type = $2',
      [workspaceId, 'appointment_created']
    );

    const rule = await createRule(workspaceId, serviceId);

    const booking = await executeBooking({
      workspaceId,
      customerId: customer.id,
      customerPhone: customer.phone,
      serviceName: 'Cleaning',
      date: '2026-04-13T10:00:00Z',
    });

    const appointmentId = booking?.data?.result?.appointment?.id;
    if (!appointmentId) {
      throw new Error(`Booking response did not include appointment id: ${JSON.stringify(booking)}`);
    }

    const executionEventId = await waitForExecutionEvent(pool, workspaceId, appointmentId);
    const run = await waitForWorkflowRun(pool, workspaceId, executionEventId, rule.id);

    assert(run.status === 'completed', `Expected workflow run status=completed, found ${run.status}`);

    const traceResponse = await getJson(
      `${API_BASE}/api/automation/workflow-runs/${run.id}?workspaceId=${encodeURIComponent(workspaceId)}`
    );

    assert(traceResponse?.success === true, 'Trace response success flag missing');

    const trace = traceResponse.data || {};
    const stepRefs = Array.isArray(trace.stepRefs) ? trace.stepRefs : [];
    const stepLogs = Array.isArray(trace.stepLogs) ? trace.stepLogs : [];
    const actionLogs = Array.isArray(trace.actionLogs) ? trace.actionLogs : [];

    assert(stepRefs.length === 2, `Expected 2 stepRefs rows, found ${stepRefs.length}`);
    assert(stepRefs.every((row) => row.status === 'executed'), `Expected all stepRefs executed: ${JSON.stringify(stepRefs)}`);

    const statusByStep = new Map();
    for (const row of stepLogs) {
      const key = Number(row.step_index || 0);
      const bucket = statusByStep.get(key) || new Set();
      bucket.add(String(row.status || ''));
      statusByStep.set(key, bucket);
    }

    for (const stepIndex of [0, 1]) {
      const statuses = statusByStep.get(stepIndex) || new Set();
      assert(statuses.has('scheduled'), `Missing scheduled trace for step ${stepIndex}`);
      assert(statuses.has('executed'), `Missing executed trace for step ${stepIndex}`);
    }

    assert(actionLogs.length >= 2, `Expected at least 2 action logs, found ${actionLogs.length}`);
    assert(
      actionLogs.every((row) => String(row?.payload?.workflowRunId || '') === String(run.id)),
      `Expected all action logs to include workflowRunId=${run.id}`
    );

    console.log(JSON.stringify({
      workspaceId,
      ruleId: rule.id,
      appointmentId,
      executionEventId,
      workflowRunId: run.id,
      workflowRunStatus: run.status,
      stepRefs,
      stepLogsCount: stepLogs.length,
      actionLogsCount: actionLogs.length,
    }, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
