import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../auth/auth.middleware.js';
import { StoreService } from './store.service.js';

const storeService = new StoreService();

export async function storeRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  // ─── Stats ─────────────────────────────────────────────────────────────────

  app.get('/stats', async (req: FastifyRequest, reply: FastifyReply) => {
    const { workspaceId } = req.query as { workspaceId: string };
    if (!workspaceId) return reply.code(400).send({ error: 'workspaceId required' });
    const stats = await storeService.getStoreStats(workspaceId);
    return reply.send(stats);
  });

  // ─── Products ──────────────────────────────────────────────────────────────

  app.get('/products', async (req: FastifyRequest, reply: FastifyReply) => {
    const { workspaceId, category, status, search } = req.query as {
      workspaceId: string;
      category?: string;
      status?: string;
      search?: string;
    };
    if (!workspaceId) return reply.code(400).send({ error: 'workspaceId required' });
    const products = await storeService.listProducts(workspaceId, { category, status, search });
    return reply.send({ products });
  });

  app.post('/products', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as any;
    const { workspaceId, ...data } = body;
    if (!workspaceId) return reply.code(400).send({ error: 'workspaceId required' });
    const product = await storeService.createProduct(workspaceId, data);
    return reply.code(201).send({ product });
  });

  app.patch('/products/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;
    const { workspaceId, ...data } = body;
    if (!workspaceId) return reply.code(400).send({ error: 'workspaceId required' });
    const product = await storeService.updateProduct(workspaceId, id, data);
    if (!product) return reply.code(404).send({ error: 'Product not found' });
    return reply.send({ product });
  });

  app.delete('/products/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { workspaceId } = req.query as { workspaceId: string };
    if (!workspaceId) return reply.code(400).send({ error: 'workspaceId required' });
    await storeService.deleteProduct(workspaceId, id);
    return reply.code(204).send();
  });

  // ─── Orders ────────────────────────────────────────────────────────────────

  app.get('/orders', async (req: FastifyRequest, reply: FastifyReply) => {
    const { workspaceId, status } = req.query as { workspaceId: string; status?: string };
    if (!workspaceId) return reply.code(400).send({ error: 'workspaceId required' });
    const orders = await storeService.listOrders(workspaceId, status);
    return reply.send({ orders });
  });

  app.get('/orders/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { workspaceId } = req.query as { workspaceId: string };
    if (!workspaceId) return reply.code(400).send({ error: 'workspaceId required' });
    const order = await storeService.getOrder(workspaceId, id);
    if (!order) return reply.code(404).send({ error: 'Order not found' });
    return reply.send({ order });
  });

  app.patch('/orders/:id/fulfillment', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { workspaceId, status, trackingNumber } = req.body as {
      workspaceId: string;
      status: string;
      trackingNumber?: string;
    };
    if (!workspaceId) return reply.code(400).send({ error: 'workspaceId required' });
    await storeService.updateFulfillment(workspaceId, id, status, trackingNumber);
    return reply.send({ success: true });
  });

  // ─── Inventory ─────────────────────────────────────────────────────────────

  app.post('/inventory/adjust', async (req: FastifyRequest, reply: FastifyReply) => {
    const { workspaceId, productId, adjustment, reason } = req.body as {
      workspaceId: string;
      productId: string;
      adjustment: number;
      reason: string;
    };
    if (!workspaceId || !productId) {
      return reply.code(400).send({ error: 'workspaceId and productId required' });
    }
    await storeService.adjustStock(workspaceId, productId, adjustment, reason);
    return reply.send({ success: true });
  });
}
