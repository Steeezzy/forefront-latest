import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createAppointment, isSlotAvailable } from '../../services/booking.service.js';
import { pool } from '../../config/db.js';

const availabilityQuerySchema = z.object({
  workspace_id: z.string().uuid(),
  date: z.string().min(8),
});

const createAppointmentSchema = z.object({
  workspace_id: z.string().uuid(),
  customer_id: z.string().uuid().optional(),
  service: z.string().min(2),
  date: z.string().min(8),
  notes: z.string().optional(),
  status: z.string().optional(),
});

const listQuerySchema = z.object({
  workspace_id: z.string().uuid(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export default async function coreAppointmentsRoutes(app: FastifyInstance) {
  app.get('/availability', async (request, reply) => {
    try {
      const query = availabilityQuerySchema.parse(request.query || {});
      const available = await isSlotAvailable(query.workspace_id, query.date);
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
}
