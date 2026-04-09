import { Pool } from 'pg';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8000';
const DELAY_SECONDS_INPUT = Number(process.env.CHAIN_DELAY_SECONDS || 2);
const CHAIN_DELAY_SECONDS = Number.isFinite(DELAY_SECONDS_INPUT) && DELAY_SECONDS_INPUT >= 1
  ? Math.trunc(DELAY_SECONDS_INPUT)
  : 2;

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
    businessName: 'Workflow Chaining Validation Clinic',
    name: 'Workflow Chaining Validation Clinic',
    phone: '+15550005555',
    timezone: 'US/Eastern',
  };

  const workspace = await postJson(`${API_BASE}/api/workspace/create`, payload);
  if (!workspace?.id) {
    throw new Error(`Workspace create did not return id: ${JSON.stringify(workspace)}`);
  }

  return workspace.id;
}

async function ensureCustomer(pool, workspaceId) {
  const phone = '+15551230002';
  const existing = await pool.query(
    'SELECT id FROM customers WHERE workspace_id = $1 AND phone = $2 LIMIT 1',
    [workspaceId, phone]
  );

  if (existing.rows.length > 0) {
    return { id: existing.rows[0].id, phone };
  }

  const inserted = await pool.query(
    'INSERT INTO customers (workspace_id, name, phone, lifecycle_stage) VALUES ($1, $2, $3, $4) RETURNING id',
    [workspaceId, 'Workflow Chain Customer', phone, 'lead']
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

async function createChainedRule(workspaceId, serviceId, delaySeconds) {
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
            tag: 'chain_step_1',
          },
        },
        {
          type: 'delay',
          seconds: delaySeconds,
        },
        {
          type: 'tag_customer',
          config: {
            tag: 'chain_step_2',
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

  if (response.data.execution_mode !== 'stop_on_match') {
    throw new Error(`Expected execution_mode=stop_on_match, found ${response.data.execution_mode}`);
  }

  if (!Array.isArray(response.data?.action_config?.actions) || response.data.action_config.actions.length !== 3) {
    throw new Error('Expected normalized action_config.actions to contain 3 steps');
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
      `SELECT id, created_at
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
      return {
        id: result.rows[0].id,
        createdAt: result.rows[0].created_at,
      };
    }

    await sleep(pollMs);
  }

  throw new Error(`Timed out waiting for appointment.created execution event for appointment ${appointmentId}`);
}

async function fetchStepLogs(pool, workspaceId, ruleId, eventId) {
  const result = await pool.query(
    `SELECT COALESCE(payload->>'actionStepIndex', '0') AS step_index,
            status,
            COALESCE(payload->>'tag', '') AS tag,
            created_at
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
    createdAt: row.created_at,
  }));
}

async function waitForStepLog(pool, workspaceId, ruleId, eventId, stepIndex) {
  const timeoutMs = 20000;
  const pollMs = 250;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const logs = await fetchStepLogs(pool, workspaceId, ruleId, eventId);
    if (logs.some((entry) => entry.stepIndex === stepIndex)) {
      return;
    }

    await sleep(pollMs);
  }

  throw new Error(`Timed out waiting for action log at stepIndex=${stepIndex}`);
}

async function getStepLagSeconds(pool, workspaceId, ruleId, eventId, stepIndex) {
  const result = await pool.query(
    `SELECT EXTRACT(EPOCH FROM (l.created_at - e.created_at)) AS lag_seconds
     FROM automation_action_logs l
     JOIN execution_events e ON e.id = $3::uuid
     WHERE l.workspace_id = $1
       AND l.rule_id = $2
       AND COALESCE(l.payload->>'executionEventId', '') = $3::text
       AND COALESCE(l.payload->>'actionStepIndex', '0') = $4
     ORDER BY l.created_at ASC
     LIMIT 1`,
    [workspaceId, ruleId, eventId, String(stepIndex)]
  );

  const lagSeconds = Number(result.rows[0]?.lag_seconds);
  return Number.isFinite(lagSeconds) ? lagSeconds : null;
}

async function getJobRefRows(pool, eventId, ruleId) {
  const result = await pool.query(
    `SELECT step_index, delay_bucket_seconds, status
     FROM automation_job_refs
     WHERE event_id = $1::uuid
       AND rule_id = $2::uuid
     ORDER BY step_index ASC`,
    [eventId, ruleId]
  );

  return result.rows.map((row) => ({
    stepIndex: Number(row.step_index || 0),
    delayBucketSeconds: Number(row.delay_bucket_seconds || 0),
    status: row.status,
  }));
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const workspaceId = await createWorkspace();
    const customer = await ensureCustomer(pool, workspaceId);
    const cleaningServiceId = await ensureService(pool, workspaceId, 'Cleaning');

    await pool.query(
      'DELETE FROM automation_rules WHERE workspace_id = $1 AND trigger_type = $2',
      [workspaceId, 'appointment_created']
    );

    const rule = await createChainedRule(workspaceId, cleaningServiceId, CHAIN_DELAY_SECONDS);

    const booking = await executeBooking({
      workspaceId,
      customerId: customer.id,
      customerPhone: customer.phone,
      serviceName: 'Cleaning',
      date: '2026-04-12T10:00:00Z',
    });

    const appointmentId = booking?.data?.result?.appointment?.id;
    if (!appointmentId) {
      throw new Error(`Booking response did not include appointment id: ${JSON.stringify(booking)}`);
    }

    const executionEvent = await waitForExecutionEvent(pool, workspaceId, appointmentId);

    await waitForStepLog(pool, workspaceId, rule.id, executionEvent.id, 0);
    await sleep(1000);

    const earlyLogs = await fetchStepLogs(pool, workspaceId, rule.id, executionEvent.id);
    const earlyStepOneCount = earlyLogs.filter((entry) => entry.stepIndex === 1).length;
    if (earlyStepOneCount !== 0) {
      throw new Error(`Expected stepIndex=1 to be absent before delay window, found ${earlyStepOneCount}`);
    }

    await sleep((CHAIN_DELAY_SECONDS + 4) * 1000);

    const finalLogs = await fetchStepLogs(pool, workspaceId, rule.id, executionEvent.id);
    const finalStepIndexes = new Set(finalLogs.map((entry) => entry.stepIndex));
    if (!finalStepIndexes.has(0) || !finalStepIndexes.has(1)) {
      throw new Error(`Expected logs for stepIndex 0 and 1, found ${JSON.stringify(finalLogs)}`);
    }

    const stepOneLagSeconds = await getStepLagSeconds(pool, workspaceId, rule.id, executionEvent.id, 1);
    const minimumExpectedLag = Math.max(CHAIN_DELAY_SECONDS - 1, 0);
    if (stepOneLagSeconds !== null && stepOneLagSeconds < minimumExpectedLag) {
      throw new Error(
        `Second chained action executed too early. lag=${stepOneLagSeconds}s expected>=${minimumExpectedLag}s`
      );
    }

    const jobRefs = await getJobRefRows(pool, executionEvent.id, rule.id);
    if (jobRefs.length !== 2) {
      throw new Error(`Expected exactly 2 automation_job_refs rows for chained actions. Found ${jobRefs.length}`);
    }

    const notExecuted = jobRefs.filter((row) => row.status !== 'executed');
    if (notExecuted.length > 0) {
      throw new Error(`Expected all chained job refs to be executed. Found ${JSON.stringify(notExecuted)}`);
    }

    console.log(JSON.stringify({
      workspaceId,
      appointmentId,
      executionEventId: executionEvent.id,
      ruleId: rule.id,
      configuredDelaySeconds: CHAIN_DELAY_SECONDS,
      earlyStepOneCount,
      finalStepIndexes: Array.from(finalStepIndexes).sort((a, b) => a - b),
      stepOneLagSeconds,
      jobRefs,
    }, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
