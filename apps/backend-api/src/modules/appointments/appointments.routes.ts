import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createAppointment, isSlotAvailable } from '../../services/booking.service.js';
import { pool } from '../../config/db.js';
import { publishExecutionEvent } from '../../services/execution-events.service.js';

const availabilityQuerySchema = z.object({
  workspace_id: z.string().uuid(),
  date: z.string().min(8),
  service_id: z.string().uuid().optional(),
  service: z.string().min(2).optional(),
});

const createAppointmentSchema = z.object({
  workspace_id: z.string().uuid(),
  customer_id: z.string().uuid().optional(),
  service: z.string().min(2).optional(),
  service_id: z.string().uuid().optional(),
  date: z.string().min(8),
  notes: z.string().optional(),
  status: z.string().optional(),
}).superRefine((value, ctx) => {
  if (!value.service && !value.service_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'service or service_id is required',
      path: ['service'],
    });
  }
});

const listQuerySchema = z.object({
  workspace_id: z.string().uuid(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

const updateStatusSchema = z.object({
  workspace_id: z.string().uuid(),
  status: z.string().min(3),
  notes: z.string().optional(),
});

function isCancelledStatus(status?: string | null) {
  const value = String(status || '').trim().toLowerCase();
  return value === 'cancelled' || value === 'canceled';
}

export default async function coreAppointmentsRoutes(app: FastifyInstance) {
  app.get('/availability', async (request, reply) => {
    try {
      const query = availabilityQuerySchema.parse(request.query || {});
      let requestedDuration: number | null = null;

      if (query.service_id) {
        const serviceById = await pool.query(
          `SELECT duration
           FROM services
           WHERE workspace_id = $1
             AND id = $2
             AND COALESCE(is_active, true) = true
           LIMIT 1`,
          [query.workspace_id, query.service_id]
        );

        if (serviceById.rows.length === 0) {
          throw new Error('service_id does not belong to workspace');
        }

        requestedDuration = serviceById.rows[0]?.duration || null;
      } else if (query.service) {
        const serviceByName = await pool.query(
          `SELECT duration
           FROM services
           WHERE workspace_id = $1
             AND COALESCE(is_active, true) = true
             AND (
               lower(name) = lower($2)
               OR EXISTS (
                 SELECT 1
                 FROM jsonb_array_elements_text(COALESCE(metadata->'aliases', '[]'::jsonb)) AS alias(value)
                 WHERE lower(alias.value) = lower($2)
               )
             )
           ORDER BY
             CASE WHEN lower(name) = lower($2) THEN 0 ELSE 1 END,
             created_at ASC
           LIMIT 1`,
          [query.workspace_id, query.service]
        );

        if (serviceByName.rows.length === 0) {
          const inactiveService = await pool.query(
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
            [query.workspace_id, query.service]
          );

          if (inactiveService.rows.length > 0) {
            throw new Error('Selected service is currently inactive');
          }
        }

        requestedDuration = serviceByName.rows[0]?.duration || null;
      }

      const available = await isSlotAvailable(query.workspace_id, query.date, requestedDuration);
      return reply.send({ success: true, data: { available } });
    } catch (error: any) {
      return reply.code(400).send({ success: false, error: error.message });
    }
  });

  app.post('/', async (request, reply) => {
    try {
      const body = createAppointmentSchema.parse(request.body || {});
      const appointment = await createAppointment(body);
      return reply.code(201).send({ success: true, data: appointment });
    } catch (error: any) {
      return reply.code(400).send({ success: false, error: error.message });
    }
  });

  app.get('/', async (request, reply) => {
    try {
      const query = listQuerySchema.parse(request.query || {});
      const result = await pool.query(
        `SELECT *
         FROM appointments
         WHERE workspace_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [query.workspace_id, query.limit || 50]
      );

      return reply.send({ success: true, data: result.rows });
    } catch (error: any) {
      return reply.code(400).send({ success: false, error: error.message });
    }
  });

  app.patch('/:id/status', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = updateStatusSchema.parse(request.body || {});
      const nextStatus = body.status.trim().toLowerCase();

      const existingResult = await pool.query(
        `SELECT id, workspace_id, customer_id, service_id, service, date, status
         FROM appointments
         WHERE id = $1
           AND workspace_id = $2
         LIMIT 1`,
        [id, body.workspace_id]
      );

      if (existingResult.rows.length === 0) {
        return reply.code(404).send({ success: false, error: 'Appointment not found' });
      }

      const existing = existingResult.rows[0];

      const updatedResult = await pool.query(
        `UPDATE appointments
         SET status = $3,
             notes = COALESCE($4, notes)
         WHERE id = $1
           AND workspace_id = $2
         RETURNING *`,
        [id, body.workspace_id, nextStatus, body.notes || null]
      );

      const updated = updatedResult.rows[0];
      const changedToCancelled = !isCancelledStatus(existing.status) && isCancelledStatus(updated.status);

      if (changedToCancelled) {
        await publishExecutionEvent(pool, {
          workspaceId: body.workspace_id,
          customerId: existing.customer_id || null,
          eventType: 'appointment.cancelled',
          eventSource: 'appointments',
          dedupeKey: `appointment-cancelled-${id}`,
          payload: {
            appointment_id: id,
            appointmentId: id,
            customer_id: existing.customer_id || null,
            service_id: existing.service_id || null,
            service: existing.service || null,
            date: existing.date,
            status: updated.status,
            workspace_id: body.workspace_id,
          },
        });
      }

      return reply.send({ success: true, data: updated });
    } catch (error: any) {
      return reply.code(400).send({ success: false, error: error.message });
    }
  });
}
