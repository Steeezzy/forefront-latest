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

    const appointment = await createAppointment({
      workspace_id: context.workspaceId,
      customer_id: context.customerId || null,
      service: String(entities.service),
      date: String(entities.date),
    });

    const event = await emitEvent({
      workspace_id: context.workspaceId,
      type: 'appointment.created',
      payload: {
        appointment_id: appointment.id,
        customer_id: context.customerId || null,
        service: entities.service,
        date: entities.date,
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
          service: String(entities.service),
          date: String(entities.date),
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
