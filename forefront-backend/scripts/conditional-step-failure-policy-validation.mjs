import { Pool } from 'pg';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8000';
const STEP_DELAY_SECONDS_INPUT = Number(process.env.POLICY_STEP_DELAY_SECONDS || 1);
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

async function createWorkspace() {
  const payload = {
    industryId: 'dental',
    businessName: 'Conditional Failure Policy Validation Clinic',
    name: 'Conditional Failure Policy Validation Clinic',
    phone: '+15550006666',
    timezone: 'US/Eastern',
  };

  const workspace = await postJson(`${API_BASE}/api/workspace/create`, payload);
  if (!workspace?.id) {
    throw new Error(`Workspace create did not return id: ${JSON.stringify(workspace)}`);
  }

  return workspace.id;
}

async function ensureCustomer(pool, workspaceId) {
  const phone = '+15551230003';
  const existing = await pool.query(
    'SELECT id FROM customers WHERE workspace_id = $1 AND phone = $2 LIMIT 1',
    [workspaceId, phone]
  );

  if (existing.rows.length > 0) {
    return { id: existing.rows[0].id, phone };
  }

  const inserted = await pool.query(
    'INSERT INTO customers (workspace_id, name, phone, lifecycle_stage) VALUES ($1, $2, $3, $4) RETURNING id',
    [workspaceId, 'Conditional Policy Customer', phone, 'lead']
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

async function createRule(workspaceId, serviceId, actions, executionMode = 'stop_on_match') {
  const response = await postJson(`${API_BASE}/api/automation/rules`, {
    workspaceId,
    triggerType: 'appointment_created',
    conditions: {
      service_id: serviceId,
    },
    actionConfig: {
      actions,
    },
    priority: 80,
    executionMode,
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

async function fetchJobRefs(pool, eventId, ruleId) {
  const refsResult = await pool.query(
    `SELECT step_index, delay_bucket_seconds, status, error_message
     FROM automation_job_refs
     WHERE event_id = $1::uuid
       AND rule_id = $2::uuid
     ORDER BY step_index ASC`,
    [eventId, ruleId]
  );

  return refsResult.rows.map((row) => ({
    stepIndex: Number(row.step_index || 0),
    delayBucketSeconds: Number(row.delay_bucket_seconds || 0),
    status: row.status,
    errorMessage: row.error_message,
  }));
}

async function waitForJobRefsToSettle(pool, eventId, ruleId, expectedCount) {
  const timeoutMs = 30000;
  const pollMs = 250;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const refs = await fetchJobRefs(pool, eventId, ruleId);
    if (refs.length >= expectedCount && refs.every((row) => row.status !== 'scheduled')) {
      return refs;
    }

    await sleep(pollMs);
  }

  throw new Error(`Timed out waiting for automation_job_refs to settle for rule ${ruleId}`);
}

async function fetchStepLogStatuses(pool, workspaceId, ruleId, eventId) {
  const result = await pool.query(
    `SELECT COALESCE(payload->>'actionStepIndex', '0') AS step_index,
            status,
            COALESCE(payload->>'tag', '') AS tag
     FROM automation_action_logs
     WHERE workspace_id = $1
       AND rule_id = $2
       AND COALESCE(payload->>'executionEventId', '') = $3
     ORDER BY created_at ASC`,
    [workspaceId, ruleId, eventId]
  );

  return result.rows.map((row) => ({
    stepIndex: Number(row.step_index || 0),
    status: row.status,
    tag: row.tag,
  }));
}

function assertStatus(refs, stepIndex, expectedStatus, label) {
  const row = refs.find((entry) => entry.stepIndex === stepIndex);
  if (!row) {
    throw new Error(`${label}: missing step_index=${stepIndex} in refs ${JSON.stringify(refs)}`);
  }

  if (row.status !== expectedStatus) {
    throw new Error(`${label}: expected step ${stepIndex} status=${expectedStatus}, found ${row.status}`);
  }
}

async function runCase(pool, params) {
  const {
    workspaceId,
    customer,
    serviceName,
    rule,
    expectedRefCount,
    expectedStatuses,
    caseName,
  } = params;

  const booking = await executeBooking({
    workspaceId,
    customerId: customer.id,
    customerPhone: customer.phone,
    serviceName,
    date: `2026-04-12T${String(10 + Math.trunc(Math.random() * 8)).padStart(2, '0')}:00:00Z`,
  });

  const appointmentId = booking?.data?.result?.appointment?.id;
  if (!appointmentId) {
    throw new Error(`${caseName}: booking response missing appointment id`);
  }

  const eventId = await waitForExecutionEvent(pool, workspaceId, appointmentId);
  const refs = await waitForJobRefsToSettle(pool, eventId, rule.id, expectedRefCount);

  for (const expected of expectedStatuses) {
    assertStatus(refs, expected.stepIndex, expected.status, caseName);
  }

  const logs = await fetchStepLogStatuses(pool, workspaceId, rule.id, eventId);

  return {
    caseName,
    appointmentId,
    eventId,
    ruleId: rule.id,
    refs,
    logs,
  };
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

    const conditionalRule = await createRule(workspaceId, serviceId, [
      {
        type: 'tag_customer',
        config: { tag: 'conditional_step_0' },
      },
      {
        type: 'delay',
        seconds: STEP_DELAY_SECONDS,
      },
      {
        type: 'tag_customer',
        config: {
          tag: 'conditional_step_should_skip',
          condition: { customer_replied: true },
        },
      },
      {
        type: 'tag_customer',
        config: { tag: 'conditional_step_2' },
      },
    ]);

    const conditionalCase = await runCase(pool, {
      workspaceId,
      customer,
      serviceName: 'Cleaning',
      rule: conditionalRule,
      expectedRefCount: 3,
      expectedStatuses: [
        { stepIndex: 0, status: 'executed' },
        { stepIndex: 1, status: 'skipped' },
        { stepIndex: 2, status: 'executed' },
      ],
      caseName: 'conditional_skip',
    });

    await pool.query(
      'DELETE FROM automation_rules WHERE workspace_id = $1 AND trigger_type = $2',
      [workspaceId, 'appointment_created']
    );

    const stopRule = await createRule(workspaceId, serviceId, [
      {
        type: 'tag_customer',
        config: {
          tag: '   ',
          on_failure: 'stop',
        },
      },
      {
        type: 'delay',
        seconds: STEP_DELAY_SECONDS,
      },
      {
        type: 'tag_customer',
        config: { tag: 'stop_policy_should_not_run' },
      },
    ]);

    const stopCase = await runCase(pool, {
      workspaceId,
      customer,
      serviceName: 'Cleaning',
      rule: stopRule,
      expectedRefCount: 2,
      expectedStatuses: [
        { stepIndex: 0, status: 'failed' },
        { stepIndex: 1, status: 'cancelled' },
      ],
      caseName: 'failure_stop',
    });

    await pool.query(
      'DELETE FROM automation_rules WHERE workspace_id = $1 AND trigger_type = $2',
      [workspaceId, 'appointment_created']
    );

    const skipRule = await createRule(workspaceId, serviceId, [
      {
        type: 'tag_customer',
        config: {
          tag: '   ',
          on_failure: 'skip',
        },
      },
      {
        type: 'delay',
        seconds: STEP_DELAY_SECONDS,
      },
      {
        type: 'tag_customer',
        config: { tag: 'skip_policy_recovered' },
      },
    ]);

    const skipCase = await runCase(pool, {
      workspaceId,
      customer,
      serviceName: 'Cleaning',
      rule: skipRule,
      expectedRefCount: 2,
      expectedStatuses: [
        { stepIndex: 0, status: 'skipped' },
        { stepIndex: 1, status: 'executed' },
      ],
      caseName: 'failure_skip',
    });

    console.log(JSON.stringify({
      workspaceId,
      configuredStepDelaySeconds: STEP_DELAY_SECONDS,
      cases: {
        conditional_skip: conditionalCase,
        failure_stop: stopCase,
        failure_skip: skipCase,
      },
    }, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
