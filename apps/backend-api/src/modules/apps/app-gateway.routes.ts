import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AppGatewayService } from './app-gateway.service.js';
import { authenticate } from '../auth/auth.middleware.js';

const appGatewayService = new AppGatewayService();

export async function appGatewayRoutes(fastify: FastifyInstance) {

  // ═══════════════════════════════════════════════════════════════════
  // PUBLIC ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════

  // Validate a token — called by the PWA shell to authenticate end-users
  fastify.post('/validate-token', async (request: FastifyRequest, reply: FastifyReply) => {
    const { token } = request.body as { token?: string };
    if (!token) return reply.code(400).send({ error: 'token is required' });

    const result = await appGatewayService.validateToken(token);
    if (!result.valid) return reply.code(401).send({ valid: false, error: 'Invalid or expired token' });

    return reply.send({
      valid: true,
      appId: result.appId,
      workspaceId: result.workspaceId,
      app: result.app
        ? {
            id: result.app.id,
            name: result.app.name,
            template: result.app.template,
            brandColor: result.app.brand_color,
            logoUrl: result.app.logo_url,
            features: result.app.features,
            roles: result.app.roles,
            appUrl: result.app.app_url,
          }
        : null,
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // PROTECTED ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════

  fastify.register(async function protectedRoutes(app) {
    app.addHook('onRequest', authenticate);

    // List all apps for the workspace
    app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const apps = await appGatewayService.listApps(workspaceId);
      return reply.send({ success: true, apps });
    });

    // Create a new app
    app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      const workspaceSlug = (request as any).user?.workspaceSlug ?? workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const body = request.body as {
        name: string;
        slug: string;
        template: string;
        description?: string;
        brandColor?: string;
        logoUrl?: string;
        features?: string[];
        roles?: string[];
      };

      if (!body.name || !body.slug || !body.template) {
        return reply.code(400).send({ error: 'name, slug, and template are required' });
      }

      try {
        const app = await appGatewayService.createApp(workspaceId, workspaceSlug, {
          name: body.name,
          slug: body.slug,
          template: body.template,
          description: body.description ?? '',
          brandColor: body.brandColor ?? '#6366f1',
          logoUrl: body.logoUrl,
          features: body.features ?? [],
          roles: body.roles ?? ['Admin', 'Staff'],
        });
        return reply.code(201).send({ success: true, app });
      } catch (err: any) {
        if (err.code === '23505') {
          return reply.code(409).send({ error: 'An app with this slug already exists in your workspace' });
        }
        return reply.code(500).send({ error: err.message });
      }
    });

    // Get a single app
    app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const { id } = request.params as { id: string };
      const app = await appGatewayService.getApp(workspaceId, id);
      if (!app) return reply.code(404).send({ error: 'App not found' });

      return reply.send({ success: true, app });
    });

    // Update app settings
    app.patch('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const { id } = request.params as { id: string };
      const body = request.body as Partial<{
        name: string;
        description: string;
        brandColor: string;
        features: string[];
        roles: string[];
      }>;

      try {
        const app = await appGatewayService.updateApp(workspaceId, id, body);
        if (!app) return reply.code(404).send({ error: 'App not found' });
        return reply.send({ success: true, app });
      } catch (err: any) {
        return reply.code(500).send({ error: err.message });
      }
    });

    // Regenerate token
    app.post('/:id/regenerate-token', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const { id } = request.params as { id: string };
      try {
        const token = await appGatewayService.regenerateToken(workspaceId, id);
        return reply.send({ success: true, token });
      } catch (err: any) {
        return reply.code(500).send({ error: err.message });
      }
    });

    // Update app status (active / paused / draft)
    app.patch('/:id/status', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const { id } = request.params as { id: string };
      const { status } = request.body as { status: 'active' | 'paused' | 'draft' };

      if (!['active', 'paused', 'draft'].includes(status)) {
        return reply.code(400).send({ error: 'status must be active, paused, or draft' });
      }

      try {
        await appGatewayService.updateStatus(workspaceId, id, status);
        return reply.send({ success: true });
      } catch (err: any) {
        return reply.code(500).send({ error: err.message });
      }
    });

    // Delete an app
    app.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
      const workspaceId = (request as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

      const { id } = request.params as { id: string };
      try {
        await appGatewayService.deleteApp(workspaceId, id);
        return reply.send({ success: true });
      } catch (err: any) {
        return reply.code(500).send({ error: err.message });
      }
    });
  });
}
