import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { WidgetService, widgetConfigSchema } from './widget.service.js';
import { authenticate } from '../auth/auth.middleware.js';

const widgetService = new WidgetService();

export async function widgetRoutes(fastify: FastifyInstance) {
  // Protected routes - require authentication
  fastify.addHook('onRequest', authenticate);
  
  // Get widget config
  fastify.get('/config', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const workspaceId = request.user?.workspaceId;
      
      if (!workspaceId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      
      const config = await widgetService.getWidgetConfig(workspaceId);
      
      return reply.send({
        success: true,
        data: config,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });
  
  // Update widget config
  fastify.patch('/config', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const workspaceId = request.user?.workspaceId;
      
      if (!workspaceId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      
      const data = widgetConfigSchema.parse(request.body);
      const config = await widgetService.updateWidgetConfig(workspaceId, data);
      
      return reply.send({
        success: true,
        data: config,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });
  
  // Get embed code
  fastify.get('/embed-code', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const workspaceId = request.user?.workspaceId;
      
      if (!workspaceId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      
      const protocol = request.protocol;
      const host = request.headers.host;
      const embedCode = widgetService.generateEmbedCode(workspaceId, `${protocol}://${host}`);
      
      return reply.send({
        success: true,
        data: { embedCode },
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });
}

// Public routes - no authentication required
export async function publicWidgetRoutes(fastify: FastifyInstance) {
  // Get public widget config
  fastify.get('/widget/config/:workspaceId', async (request: FastifyRequest<{ Params: { workspaceId: string } }>, reply: FastifyReply) => {
    try {
      const { workspaceId } = request.params;
      const config = await widgetService.getPublicWidgetConfig(workspaceId);
      
      return reply.send({
        success: true,
        data: config,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });
}
