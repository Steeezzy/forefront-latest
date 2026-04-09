import { Pool } from 'pg';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8000';

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
    businessName: 'Automation Condition Validation Clinic',
    name: 'Automation Condition Validation Clinic',
    phone: '+15550002222',
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
    [workspaceId, 'Validation Customer', phone, 'lead']
  );

  return { id: inserted.rows[0].id, phone };
}

async function ensureService(pool, workspaceId, name, duration, price) {
  const existing = await pool.query(
    'SELECT id FROM services WHERE workspace_id = $1 AND lower(name) = lower($2) LIMIT 1',
    [workspaceId, name]
  );

  if (existing.rows.length > 0) {
    await pool.query(
      'UPDATE services SET duration = $2, price = $3, is_active = true WHERE id = $1',
      [existing.rows[0].id, duration, price]
    );
    return existing.rows[0].id;
  }

  const inserted = await pool.query(
    'INSERT INTO services (workspace_id, name, duration, price, is_active, metadata) VALUES ($1, $2, $3, $4, true, $5::jsonb) RETURNING id',
    [workspaceId, name, duration, price, JSON.stringify({ aliases: [] })]
  );

  return inserted.rows[0].id;
}

async function seedRules(pool, workspaceId, cleaningServiceId, rootCanalServiceId) {
  await pool.query(
    'DELETE FROM automation_rules WHERE workspace_id = $1 AND trigger_type = $2',
    [workspaceId, 'appointment_created']
  );

  const cleaningRule = await pool.query(
    `INSERT INTO automation_rules (
      workspace_id, scope, trigger_type, event_type, condition_config, conditions, action_type, action_config, is_active, priority, cooldown_seconds, is_terminal
    ) VALUES ($1, 'workspace', 'appointment_created', 'appointment.created', $2, $2, 'send_sms', $3, true, 90, 0, false)
    RETURNING id`,
    [
      workspaceId,
      JSON.stringify({ service_id: cleaningServiceId }),
      JSON.stringify({ message: 'CLEANING_CONFIRMATION {{date}}', template: 'cleaning_confirmation' }),
    ]
  );

  const rootRule = await pool.query(
    `INSERT INTO automation_rules (
      workspace_id, scope, trigger_type, event_type, condition_config, conditions, action_type, action_config, is_active, priority, cooldown_seconds, is_terminal
    ) VALUES ($1, 'workspace', 'appointment_created', 'appointment.created', $2, $2, 'send_sms', $3, true, 95, 0, false)
    RETURNING id`,
    [
      workspaceId,
      JSON.stringify({ service_id: rootCanalServiceId }),
      JSON.stringify({ message: 'ROOT_CANAL_PREP {{date}}', template: 'root_canal_prep' }),
    ]
  );

  const fallbackRule = await pool.query(
    `INSERT INTO automation_rules (
      workspace_id, scope, trigger_type, event_type, condition_config, conditions, action_type, action_config, is_active, priority, cooldown_seconds, is_terminal
    ) VALUES ($1, 'workspace', 'appointment_created', 'appointment.created', $2, $2, 'send_sms', $3, true, 120, 0, false)
    RETURNING id`,
    [
      workspaceId,
      JSON.stringify({}),
      JSON.stringify({ message: 'FALLBACK_APPOINTMENT {{date}}', template: 'appointment_fallback' }),
    ]
  );

  return {
    cleaning: cleaningRule.rows[0].id,
    rootCanal: rootRule.rows[0].id,
    fallback: fallbackRule.rows[0].id,
  };
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

async function waitForAppointmentExecutionEvent(pool, workspaceId, appointmentId) {
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

async function waitForActionLogsToSettle(pool, workspaceId, executionEventId) {
  const timeoutMs = 20000;
  const stableWindowMs = 1500;
  const pollMs = 250;
  const startedAt = Date.now();

  let previousCount = -1;
  let stableSince = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM automation_action_logs
       WHERE workspace_id = $1
         AND COALESCE(payload->>'executionEventId', '') = $2`,
      [workspaceId, executionEventId]
    );

    const count = Number(countResult.rows[0]?.total || 0);

    if (count !== previousCount) {
      previousCount = count;
      stableSince = Date.now();
    } else if (count > 0 && Date.now() - stableSince >= stableWindowMs) {
      return;
    }

    await sleep(pollMs);
  }
}

async function fetchMatchedRuleSetForEvent(pool, workspaceId, executionEventId) {
  const result = await pool.query(
    `SELECT DISTINCT rule_id
     FROM automation_action_logs
     WHERE workspace_id = $1
       AND COALESCE(payload->>'executionEventId', '') = $2
       AND rule_id IS NOT NULL`,
    [workspaceId, executionEventId]
  );

  return new Set(result.rows.map((row) => row.rule_id));
}

async function runCase(pool, { workspaceId, customerId, customerPhone, serviceName, date, rules }) {
  const booking = await executeBooking({ workspaceId, customerId, customerPhone, serviceName, date });
  const appointmentId = booking?.data?.result?.appointment?.id;

  if (!appointmentId) {
    throw new Error(`Booking response did not include appointment id: ${JSON.stringify(booking)}`);
  }

  const executionEventId = await waitForAppointmentExecutionEvent(pool, workspaceId, appointmentId);
  await waitForActionLogsToSettle(pool, workspaceId, executionEventId);
  const matchedRules = await fetchMatchedRuleSetForEvent(pool, workspaceId, executionEventId);

  return {
    serviceName,
    date,
    appointmentId,
    executionEventId,
    hits: {
      cleaning: matchedRules.has(rules.cleaning) ? 1 : 0,
      rootCanal: matchedRules.has(rules.rootCanal) ? 1 : 0,
      fallback: matchedRules.has(rules.fallback) ? 1 : 0,
    },
  };
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const workspaceId = await createWorkspace();
    const customer = await ensureCustomer(pool, workspaceId);

    const cleaningServiceId = await ensureService(pool, workspaceId, 'Cleaning', 30, 500);
    const rootCanalServiceId = await ensureService(pool, workspaceId, 'Root Canal', 60, 3000);
    await ensureService(pool, workspaceId, 'Consultation', 30, 700);

    const rules = await seedRules(pool, workspaceId, cleaningServiceId, rootCanalServiceId);

    const case1 = await runCase(pool, {
      workspaceId,
      customerId: customer.id,
      customerPhone: customer.phone,
      serviceName: 'Cleaning',
      date: '2026-04-10T10:00:00Z',
      rules,
    });

    const case2 = await runCase(pool, {
      workspaceId,
      customerId: customer.id,
      customerPhone: customer.phone,
      serviceName: 'Root Canal',
      date: '2026-04-10T12:00:00Z',
      rules,
    });

    const case3 = await runCase(pool, {
      workspaceId,
      customerId: customer.id,
      customerPhone: customer.phone,
      serviceName: 'Consultation',
      date: '2026-04-10T14:00:00Z',
      rules,
    });

    const summary = {
      workspaceId,
      customerId: customer.id,
      services: {
        cleaningServiceId,
        rootCanalServiceId,
      },
      rules,
      cases: {
        cleaning: case1,
        rootCanal: case2,
        fallbackOnly: case3,
      },
    };

    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
