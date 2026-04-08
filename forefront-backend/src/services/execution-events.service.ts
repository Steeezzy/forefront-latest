import { randomUUID } from 'node:crypto';
import { automationActionsQueue } from '../queues/execution-queues.js';

type Queryable = {
  query: (text: string, params?: any[]) => Promise<{ rows: any[] }>;
};

export interface ExecutionEventInput {
  workspaceId: string;
  sessionId?: string | null;
  campaignId?: string | null;
  campaignContactId?: string | null;
  customerId?: string | null;
  eventType: string;
  eventSource?: string;
  dedupeKey?: string | null;
  payload?: Record<string, any>;
}

function shouldEnqueueAutomation(eventType: string) {
  return !eventType.startsWith('automation.');
}

export async function publishExecutionEvent(db: Queryable, input: ExecutionEventInput) {
  try {
    const result = await db.query(
      `INSERT INTO execution_events (
         id,
         workspace_id,
         session_id,
         campaign_id,
         campaign_contact_id,
         customer_id,
         event_type,
         event_source,
         dedupe_key,
         payload
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        randomUUID(),
        input.workspaceId,
        input.sessionId || null,
        input.campaignId || null,
        input.campaignContactId || null,
        input.customerId || null,
        input.eventType,
        input.eventSource || 'system',
        input.dedupeKey || null,
        JSON.stringify(input.payload || {}),
      ]
    );

    const event = result.rows[0];
    if (event && shouldEnqueueAutomation(input.eventType)) {
      await automationActionsQueue.add(
        'evaluate-event',
        {
          jobType: 'evaluate_event',
          eventId: event.id,
        },
        {
          jobId: `automation-evaluate-${event.id}`,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        }
      );
    }

    return event;
  } catch (error: any) {
    if (error?.code === '23505' && input.dedupeKey) {
      const existing = await db.query(
        `SELECT *
         FROM execution_events
         WHERE dedupe_key = $1
         LIMIT 1`,
        [input.dedupeKey]
      );

      return existing.rows[0] || null;
    }

    throw error;
  }
}

export async function markExecutionEventProcessed(
  db: Queryable,
  eventId: string,
  status: 'processed' | 'failed',
  errorMessage?: string | null
) {
  await db.query(
    `UPDATE execution_events
     SET status = $2,
         error_message = $3,
         processed_at = NOW()
     WHERE id = $1`,
    [eventId, status, errorMessage || null]
  );
}
