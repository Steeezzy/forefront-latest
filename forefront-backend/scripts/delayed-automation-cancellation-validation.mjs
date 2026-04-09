import { Pool } from 'pg';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8000';
const DELAY_SECONDS_INPUT = Number(process.env.DELAY_SECONDS || 6);
const DELAY_SECONDS = Number.isFinite(DELAY_SECONDS_INPUT) && DELAY_SECONDS_INPUT >= 2
  ? Math.trunc(DELAY_SECONDS_INPUT)
  : 6;

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

async function patchJson(url, body) {
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`PATCH ${url} failed (${response.status}): ${JSON.stringify(data)}`);
  }

  return data;
}

async function createWorkspace() {
  const payload = {
    industryId: 'dental',
    businessName: 'Delayed Cancellation Validation Clinic',
    name: 'Delayed Cancellation Validation Clinic',
    phone: '+15550004444',
    timezone: 'US/Eastern',
  };

  const workspace = await postJson(`${API_BASE}/api/workspace/create`, payload);
  if (!workspace?.id) {
    throw new Error(`Workspace create did not return id: ${JSON.stringify(workspace)}`);
  }

  return workspace.id;
}

async function ensureCustomer(pool, workspaceId) {
  const phone = '+15551230001';
  const existing = await pool.query(
    'SELECT id FROM customers WHERE workspace_id = $1 AND phone = $2 LIMIT 1',
    [workspaceId, phone]
  );

  if (existing.rows.length > 0) {
    return { id: existing.rows[0].id, phone };
  }

  const inserted = await pool.query(
    'INSERT INTO customers (workspace_id, name, phone, lifecycle_stage) VALUES ($1, $2, $3, $4) RETURNING id',
    [workspaceId, 'Delayed Cancellation Customer', phone, 'lead']
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
      service_id: serviceId,
    },
    actionType: 'tag_customer',
    actionConfig: {
      tag: 'delay_cancellation_validation',
      delay_seconds: delaySeconds,
    },
    priority: 90,
    isTerminal: true,
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

async function waitForExecutionEvent(pool, workspaceId, eventType, appointmentId) {
  const timeoutMs = 15000;
  const pollMs = 250;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const result = await pool.query(
      `SELECT id, created_at
       FROM execution_events
       WHERE workspace_id = $1
         AND event_type = $2
         AND (
           payload->>'appointment_id' = $3
           OR payload->>'appointmentId' = $3
         )
       ORDER BY created_at DESC
       LIMIT 1`,
      [workspaceId, eventType, appointmentId]
    );

    if (result.rows.length > 0) {
      return {
        id: result.rows[0].id,
        createdAt: result.rows[0].created_at,
      };
    }

    await sleep(pollMs);
  }

  throw new Error(`Timed out waiting for ${eventType} execution event for appointment ${appointmentId}`);
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

async function getJobRef(pool, eventId, ruleId, delaySeconds) {
  const result = await pool.query(
    `SELECT status,
            queue_job_id,
            cancelled_at,
            cancellation_event_id,
            error_message
     FROM automation_job_refs
     WHERE event_id = $1::uuid
       AND rule_id = $2::uuid
       AND delay_bucket_seconds = $3
     ORDER BY created_at DESC
     LIMIT 1`,
    [eventId, ruleId, delaySeconds]
  );

  return result.rows[0] || null;
}

async function cancelAppointment(workspaceId, appointmentId) {
  const response = await patchJson(`${API_BASE}/api/core/appointments/${appointmentId}/status`, {
    workspace_id: workspaceId,
    status: 'cancelled',
  });

  if (!response?.success || !response?.data?.id) {
    throw new Error(`Appointment cancellation response invalid: ${JSON.stringify(response)}`);
  }

  return response.data;
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
      date: '2026-04-11T15:00:00Z',
    });

    const appointmentId = booking?.data?.result?.appointment?.id;
    if (!appointmentId) {
      throw new Error(`Booking response did not include appointment id: ${JSON.stringify(booking)}`);
    }

    const createdEvent = await waitForExecutionEvent(pool, workspaceId, 'appointment.created', appointmentId);
    await sleep(1000);

    const earlyCount = await countRuleLogsForEvent(pool, workspaceId, rule.id, createdEvent.id);
    if (earlyCount !== 0) {
      throw new Error(`Expected no action logs before cancellation. Got ${earlyCount}`);
    }

    await cancelAppointment(workspaceId, appointmentId);
    const cancelledEvent = await waitForExecutionEvent(pool, workspaceId, 'appointment.cancelled', appointmentId);

    await sleep(1500);
    const cancelledRef = await getJobRef(pool, createdEvent.id, rule.id, DELAY_SECONDS);
    if (!cancelledRef) {
      throw new Error('Expected automation_job_refs row for delayed action but none found');
    }

    if (cancelledRef.status !== 'cancelled') {
      throw new Error(`Expected automation_job_refs status=cancelled, found ${cancelledRef.status}`);
    }

    if (String(cancelledRef.cancellation_event_id || '') !== String(cancelledEvent.id)) {
      throw new Error(
        `Expected cancellation_event_id=${cancelledEvent.id}, found ${cancelledRef.cancellation_event_id}`
      );
    }

    await sleep((DELAY_SECONDS + 4) * 1000);
    const finalCount = await countRuleLogsForEvent(pool, workspaceId, rule.id, createdEvent.id);
    if (finalCount !== 0) {
      throw new Error(`Expected no action logs after cancellation. Got ${finalCount}`);
    }

    console.log(JSON.stringify({
      workspaceId,
      appointmentId,
      createdEventId: createdEvent.id,
      cancelledEventId: cancelledEvent.id,
      ruleId: rule.id,
      configuredDelaySeconds: DELAY_SECONDS,
      earlyCount,
      finalCount,
      cancelledRef,
    }, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
