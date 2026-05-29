import { createAppointment } from './booking.service.js';
import { emitEvent } from './event.service.js';
import { pool } from '../config/db.js';
import { publishExecutionEvent } from './execution-events.service.js';

export interface StructuredAIOutput {
  intent: string;
  entities?: Record<string, any>;
}

export interface AIActionContext {
  workspaceId: string;
  customerId?: string | null;
  customerPhone?: string | null;
}

type ResolvedService = {
  id: string;
  name: string;
  duration: number | null;
  price: string | null;
};

async function resolveWorkspaceService(workspaceId: string, requestedService: string): Promise<ResolvedService> {
  const normalized = requestedService.trim();
  if (!normalized) {
    throw new Error('Service name is required');
  }

  const likePattern = `%${normalized.replace(/\s+/g, '%')}%`;

  const bestMatch = await pool.query(
    `SELECT id, name, duration, price
     FROM services
     WHERE workspace_id = $1
       AND COALESCE(is_active, true) = true
       AND (
         lower(name) = lower($2)
         OR name ILIKE $3
         OR EXISTS (
           SELECT 1
           FROM jsonb_array_elements_text(COALESCE(metadata->'aliases', '[]'::jsonb)) AS alias(value)
           WHERE lower(alias.value) = lower($2)
         )
         OR EXISTS (
           SELECT 1
           FROM jsonb_array_elements_text(COALESCE(metadata->'aliases', '[]'::jsonb)) AS alias(value)
           WHERE alias.value ILIKE $3
         )
       )
     ORDER BY
       CASE
         WHEN lower(name) = lower($2) THEN 0
         WHEN EXISTS (
           SELECT 1
           FROM jsonb_array_elements_text(COALESCE(metadata->'aliases', '[]'::jsonb)) AS alias(value)
           WHERE lower(alias.value) = lower($2)
         ) THEN 1
         WHEN name ILIKE $3 THEN 2
         ELSE 3
       END,
       created_at ASC
     LIMIT 1`,
    [workspaceId, normalized, likePattern]
  );

  if (bestMatch.rows.length > 0) {
    return bestMatch.rows[0] as ResolvedService;
  }

  const inactiveMatch = await pool.query(
    `SELECT id
     FROM services
     WHERE workspace_id = $1
       AND COALESCE(is_active, true) = false
       AND (
         lower(name) = lower($2)
         OR EXISTS (
           SELECT 1
           FROM jsonb_array_elements_text(COALESCE(metadata->'aliases', '[]'::jsonb)) AS alias(value)
           WHERE lower(alias.value) = lower($2)
         )
       )
     LIMIT 1`,
    [workspaceId, normalized]
  );

  if (inactiveMatch.rows.length > 0) {
    throw new Error(`Service "${normalized}" is currently inactive.`);
  }

  const suggestionsResult = await pool.query(
    `SELECT DISTINCT s.name
     FROM services s
     LEFT JOIN LATERAL jsonb_array_elements_text(COALESCE(s.metadata->'aliases', '[]'::jsonb)) AS alias(value) ON true
     WHERE s.workspace_id = $1
       AND COALESCE(s.is_active, true) = true
       AND (
         s.name ILIKE $2
         OR alias.value ILIKE $2
       )
     ORDER BY name ASC
     LIMIT 5`,
    [workspaceId, likePattern]
  );

  const suggestions = suggestionsResult.rows.map((row) => String(row.name));
  if (suggestions.length > 0) {
    throw new Error(`Service "${normalized}" not found. Did you mean: ${suggestions.join(', ')}?`);
  }

  const availableResult = await pool.query(
    `SELECT name
     FROM services
     WHERE workspace_id = $1
       AND COALESCE(is_active, true) = true
     ORDER BY created_at ASC
     LIMIT 5`,
    [workspaceId]
  );

  const available = availableResult.rows.map((row) => String(row.name));
  if (available.length > 0) {
    throw new Error(`Service "${normalized}" not found. Available services: ${available.join(', ')}.`);
  }

  throw new Error('No services configured for this workspace. Add at least one service before booking appointments.');
}

export async function handleAIResponse(aiOutput: StructuredAIOutput, context: AIActionContext) {
  if (!context.workspaceId) {
    throw new Error('workspaceId is required');
  }

  const intent = aiOutput?.intent || 'unknown';
  const entities = aiOutput?.entities || {};

  if (intent === 'book_appointment') {
    if (!entities.service || !entities.date) {
      throw new Error('book_appointment intent requires entities.service and entities.date');
    }

    const service = await resolveWorkspaceService(context.workspaceId, String(entities.service));

    const appointment = await createAppointment({
      workspace_id: context.workspaceId,
      customer_id: context.customerId || null,
      service_id: service.id,
      service: service.name,
      date: String(entities.date),
    });

    const event = await emitEvent({
      workspace_id: context.workspaceId,
      type: 'appointment.created',
      payload: {
        appointment_id: appointment.id,
        customer_id: context.customerId || null,
        service: service.name,
        service_name: service.name,
        service_id: service.id,
        date: entities.date,
        workspace_id: context.workspaceId,
      },
    });

    try {
      await publishExecutionEvent(pool, {
        workspaceId: context.workspaceId,
        customerId: context.customerId || null,
        eventType: 'appointment.created',
        eventSource: 'orchestrator',
        dedupeKey: `appointment-created-${appointment.id}`,
        payload: {
          appointmentId: appointment.id,
          appointment_id: appointment.id,
          customerId: context.customerId || null,
          customer_id: context.customerId || null,
          customerPhone: context.customerPhone || null,
          customer_phone: context.customerPhone || null,
          service: service.name,
          service_name: service.name,
          service_id: service.id,
          date: String(entities.date),
          workspace_id: context.workspaceId,
        },
      });
    } catch (executionEventError: any) {
      // Keep appointment creation successful even if automation event publishing fails.
      console.error('[AI Action] Failed to publish appointment execution event:', executionEventError?.message || executionEventError);
    }

    return {
      action: 'appointment.created',
      appointment,
      event,
    };
  }

  const event = await emitEvent({
    workspace_id: context.workspaceId,
    type: 'ai.intent.unhandled',
    payload: {
      intent,
      entities,
      customer_id: context.customerId || null,
    },
  });

  return {
    action: 'no-op',
    event,
  };
}
