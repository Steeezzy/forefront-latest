/**
 * Invoice Routes
 *
 * @route GET    /api/invoices              — List invoices for workspace
 * @route GET    /api/invoices/:id          — Get invoice detail with items
 * @route POST   /api/invoices              — Create new invoice
 * @route PUT    /api/invoices/:id/status   — Update invoice status
 * @route POST   /api/invoices/:id/send     — Mark as sent
 * @route POST   /api/invoices/:id/pay      — Mark as paid
 * @route GET    /api/invoices/summary      — Revenue summary
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../auth/auth.middleware.js';
import { invoiceService } from './invoice.service.js';

export async function invoiceRoutes(app: FastifyInstance) {

  // List invoices
  app.get('/', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { workspaceId, status } = req.query as { workspaceId: string; status?: string };
      if (!workspaceId) return reply.status(400).send({ error: 'workspaceId is required' });

      const invoices = await invoiceService.getInvoices(workspaceId, status);
      return reply.send({ invoices });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // Revenue summary
  app.get('/summary', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { workspaceId } = req.query as { workspaceId: string };
      if (!workspaceId) return reply.status(400).send({ error: 'workspaceId is required' });

      const summary = await invoiceService.getRevenueSummary(workspaceId);
      return reply.send(summary);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // Get invoice detail
  app.get('/:id', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as { id: string };
      const invoice = await invoiceService.getInvoiceById(id);
      if (!invoice) return reply.status(404).send({ error: 'Invoice not found' });
      return reply.send(invoice);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // Create invoice
  app.post('/', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = req.body as {
        workspaceId: string;
        customerId?: string;
        items: Array<{ description: string; quantity: number; unit_price: number }>;
        notes?: string;
        dueDate?: string;
        taxRate?: number;
      };

      if (!body.workspaceId || !body.items?.length) {
        return reply.status(400).send({ error: 'workspaceId and at least one item are required' });
      }

      const invoice = await invoiceService.createInvoice(body);
      return reply.status(201).send(invoice);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // Update status
  app.put('/:id/status', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as { id: string };
      const { status } = req.body as { status: string };
      const invoice = await invoiceService.updateStatus(id, status);
      if (!invoice) return reply.status(404).send({ error: 'Invoice not found' });
      return reply.send(invoice);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // Mark as sent
  app.post('/:id/send', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as { id: string };
      const invoice = await invoiceService.updateStatus(id, 'sent');
      if (!invoice) return reply.status(404).send({ error: 'Invoice not found' });
      return reply.send({ success: true, invoice });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  // Mark as paid
  app.post('/:id/pay', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as { id: string };
      const invoice = await invoiceService.markAsPaid(id);
      if (!invoice) return reply.status(404).send({ error: 'Invoice not found' });
      return reply.send({ success: true, invoice });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
}
