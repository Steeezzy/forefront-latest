import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { VisitorService, trackVisitorSchema, trackPageViewSchema } from './visitor.service.js';
import { authenticate } from '../auth/auth.middleware.js';

const visitorService = new VisitorService();

export async function visitorRoutes(fastify: FastifyInstance) {
  // All visitor routes require authentication
  fastify.addHook('onRequest', authenticate);
  
  // List visitors
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const workspaceId = request.user?.workspaceId;
      
      if (!workspaceId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      
      const query = request.query as Record<string, any>;
      const options = {
        online: query.online === 'true' ? true : query.online === 'false' ? false : undefined,
        page: parseInt(query.page) || 1,
        limit: parseInt(query.limit) || 50,
      };
      
      const visitors = await visitorService.getVisitors(workspaceId, options);
      
      return reply.send({
        success: true,
        data: visitors,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });
  
  // Get single visitor
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const workspaceId = request.user?.workspaceId;
      
      if (!workspaceId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      
      const visitor = await visitorService.getVisitorById(request.params.id, workspaceId);
      
      if (!visitor) {
        return reply.code(404).send({ error: 'Visitor not found' });
      }
      
      return reply.send({
        success: true,
        data: visitor,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });
  
  // Get online visitors count
  fastify.get('/stats/online', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const workspaceId = request.user?.workspaceId;
      
      if (!workspaceId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      
      const count = await visitorService.getOnlineVisitorsCount(workspaceId);
      
      return reply.send({
        success: true,
        data: { count },
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });
}

// Public routes for widget
export async function publicVisitorRoutes(fastify: FastifyInstance) {
  // Track visitor (called from widget)
  fastify.post('/track', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = trackVisitorSchema.parse(request.body);
      const visitor = await visitorService.trackVisitor(data);
      
      return reply.send({
        success: true,
        data: visitor,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });
  
  // Track page view
  fastify.post('/track/pageview', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = trackPageViewSchema.parse(request.body);
      const pageView = await visitorService.trackPageView(data);
      
      return reply.send({
        success: true,
        data: pageView,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });
}
