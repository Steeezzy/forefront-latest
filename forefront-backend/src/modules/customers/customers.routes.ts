import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createCustomer, getCustomerByPhone, logInteraction } from '../../services/crm.service.js';

const createCustomerSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  tags: z.array(z.string()).optional(),
  lead_score: z.number().int().optional(),
  lifecycle_stage: z.string().optional(),
});

const getByPhoneSchema = z.object({
  workspace_id: z.string().uuid(),
  phone: z.string().min(3),
});

const logInteractionSchema = z.object({
  workspace_id: z.string().uuid(),
  customer_id: z.string().uuid().optional(),
  channel: z.string().min(2),
  message: z.string().optional(),
  response: z.string().optional(),
  intent: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export default async function coreCustomersRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    try {
      const body = createCustomerSchema.parse(request.body || {});
      const customer = await createCustomer(body);
      return reply.code(201).send({ success: true, data: customer });
    } catch (error: any) {
      return reply.code(400).send({ success: false, error: error.message });
    }
  });

  app.get('/phone/:phone', async (request, reply) => {
    try {
      const query = getByPhoneSchema.parse({
        workspace_id: (request.query as any)?.workspace_id,
        phone: (request.params as any)?.phone,
      });

      const customer = await getCustomerByPhone(query.phone, query.workspace_id);
      if (!customer) {
        return reply.code(404).send({ success: false, error: 'Customer not found' });
      }

      return reply.send({ success: true, data: customer });
    } catch (error: any) {
      return reply.code(400).send({ success: false, error: error.message });
    }
  });

  app.post('/interactions', async (request, reply) => {
    try {
      const body = logInteractionSchema.parse(request.body || {});
      const interaction = await logInteraction(body);
      return reply.code(201).send({ success: true, data: interaction });
    } catch (error: any) {
      return reply.code(400).send({ success: false, error: error.message });
    }
  });
}
