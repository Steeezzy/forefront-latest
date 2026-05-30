import { Pool } from 'pg';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8000';
const DELAY_SECONDS_INPUT = Number(process.env.DELAY_SECONDS || 3);
const DELAY_SECONDS = Number.isFinite(DELAY_SECONDS_INPUT) && DELAY_SECONDS_INPUT >= 1
  ? Math.trunc(DELAY_SECONDS_INPUT)
  : 3;

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
    businessName: 'Delayed Automation Validation Clinic',
    name: 'Delayed Automation Validation Clinic',
    phone: '+15550003333',
    timezone: 'US/Eastern',
  };

  const workspace = await postJson(`${API_BASE}/api/workspace/create`, payload);
  if (!workspace?.id) {
    throw new Error(`Workspace create did not return id: ${JSON.stringify(workspace)}`);
  }

  return workspace.id;
}

async function ensureCustomer(pool, workspaceId) {
  const phone = '+15551230000';
  const existing = await pool.query(
    'SELECT id FROM customers WHERE workspace_id = $1 AND phone = $2 LIMIT 1',
    [workspaceId, phone]
  );

  if (existing.rows.length > 0) {
    return { id: existing.rows[0].id, phone };
  }

  const inserted = await pool.query(
    'INSERT INTO customers (workspace_id, name, phone, lifecycle_stage) VALUES ($1, $2, $3, $4) RETURNING id',
    [workspaceId, 'Delayed Validation Customer', phone, 'lead']
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

async function createDelayedRule(workspaceId, serviceId, delaySeconds) {
  const response = await postJson(`${API_BASE}/api/automation/rules`, {
    workspaceId,
    triggerType: 'appointment_created',
    conditions: {
      serviceId: serviceId,
    },
    actionType: 'tag_customer',
    actionConfig: {
      tag: 'delay_validation',
      delaySeconds,
    },
    priority: 90,
    isTerminal: true,
  });

  if (!response?.success || !response?.data?.id) {
    throw new Error(`Rule create response invalid: ${JSON.stringify(response)}`);
  }

  const created = response.data;
  const conditionServiceId = created?.conditions?.service_id;
  const persistedDelay = Number(created?.action_config?.delay_seconds ?? -1);

  if (conditionServiceId !== serviceId) {
    throw new Error(`Rule conditions were not normalized to service_id: ${JSON.stringify(created.conditions)}`);
  }

  if (persistedDelay !== delaySeconds) {
    throw new Error(`Rule delay was not normalized to delay_seconds=${delaySeconds}: ${JSON.stringify(created.action_config)}`);
  }

  return created;
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

  throw new Error(`Timed out waiting for execution event for appointment ${appointmentId}`);
}

async function countRuleLogsForEvent(pool, workspaceId, ruleId, eventId) {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM automation_action_logs
     WHERE workspace_id = $1
       AND rule_id = $2
       AND COALESCE(payload->>'executionEventId', '') = $3`,
    [workspaceId, ruleId, eventId]
  );

  return Number(result.rows[0]?.total || 0);
}

async function getFirstLagSeconds(pool, workspaceId, ruleId, eventId) {
  const result = await pool.query(
    `SELECT EXTRACT(EPOCH FROM (l.created_at - e.created_at)) AS lag_seconds
     FROM automation_action_logs l
     JOIN execution_events e ON e.id = $3::uuid
     WHERE l.workspace_id = $1
       AND l.rule_id = $2
       AND COALESCE(l.payload->>'executionEventId', '') = $3::text
     ORDER BY l.created_at ASC
     LIMIT 1`,
    [workspaceId, ruleId, eventId]
  );

  const lagSeconds = Number(result.rows[0]?.lag_seconds);
  return Number.isFinite(lagSeconds) ? lagSeconds : null;
}

async function getJobRefSummary(pool, eventId, ruleId, delaySeconds) {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS total,
            MIN(status) AS min_status,
            MAX(status) AS max_status
     FROM automation_job_refs
     WHERE event_id = $1::uuid
       AND rule_id = $2::uuid
       AND delay_bucket_seconds = $3`,
    [eventId, ruleId, delaySeconds]
  );

  return {
    total: Number(result.rows[0]?.total || 0),
    minStatus: result.rows[0]?.min_status || null,
    maxStatus: result.rows[0]?.max_status || null,
  };
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

    const rule = await createDelayedRule(workspaceId, cleaningServiceId, DELAY_SECONDS);

    const booking = await executeBooking({
      workspaceId,
      customerId: customer.id,
      customerPhone: customer.phone,
      serviceName: 'Cleaning',
      date: '2026-04-11T10:00:00Z',
    });

    const appointmentId = booking?.data?.result?.appointment?.id;
    if (!appointmentId) {
      throw new Error(`Booking response did not include appointment id: ${JSON.stringify(booking)}`);
    }

    const executionEvent = await waitForExecutionEvent(pool, workspaceId, appointmentId);

    await sleep(1000);
    const earlyCount = await countRuleLogsForEvent(pool, workspaceId, rule.id, executionEvent.id);
    if (earlyCount !== 0) {
      throw new Error(`Expected 0 early logs before delay. Got ${earlyCount}`);
    }

    await sleep((DELAY_SECONDS + 4) * 1000);
    const finalCount = await countRuleLogsForEvent(pool, workspaceId, rule.id, executionEvent.id);
    if (finalCount < 1) {
      throw new Error('Expected delayed automation log after delay window, but none found');
    }

    const lagSeconds = await getFirstLagSeconds(pool, workspaceId, rule.id, executionEvent.id);
    const minimumExpectedLag = Math.max(DELAY_SECONDS - 1, 0);
    if (lagSeconds !== null && lagSeconds < minimumExpectedLag) {
      throw new Error(
        `First action executed too early. lag=${lagSeconds}s expected>=${minimumExpectedLag}s`
      );
    }

    const jobRefSummary = await getJobRefSummary(pool, executionEvent.id, rule.id, DELAY_SECONDS);
    if (jobRefSummary.total !== 1) {
      throw new Error(
        `Expected exactly one automation_job_refs row for delayed action. Found ${jobRefSummary.total}`
      );
    }

    if (jobRefSummary.maxStatus !== 'executed') {
      throw new Error(
        `Expected delayed job ref status executed. Found min=${jobRefSummary.minStatus} max=${jobRefSummary.maxStatus}`
      );
    }

    console.log(JSON.stringify({
      workspaceId,
      appointmentId,
      executionEventId: executionEvent.id,
      ruleId: rule.id,
      configuredDelaySeconds: DELAY_SECONDS,
      earlyCount,
      finalCount,
      firstLagSeconds: lagSeconds,
      jobRefSummary,
    }, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
