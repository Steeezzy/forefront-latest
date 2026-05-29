import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TeamService, inviteSchema, updateMemberSchema } from './team.service.js';
import { authenticate } from '../auth/auth.middleware.js';

const teamService = new TeamService();

export async function teamRoutes(fastify: FastifyInstance) {
  // All team routes require authentication
  fastify.addHook('onRequest', authenticate);
  
  // List workspace members
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const workspaceId = request.user?.workspaceId;
      
      if (!workspaceId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      
      const members = await teamService.getWorkspaceMembers(workspaceId);
      
      return reply.send({
        success: true,
        data: members,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });
  
  // Invite member
  fastify.post('/invite', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const workspaceId = request.user?.workspaceId;
      const invitedBy = request.user?.userId;
      
      if (!workspaceId || !invitedBy) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      
      // Check permissions
      const hasPermission = await teamService.checkPermission(
        workspaceId,
        invitedBy,
        'canManageTeam'
      );
      
      if (!hasPermission) {
        return reply.code(403).send({ error: 'Insufficient permissions' });
      }
      
      const data = inviteSchema.parse(request.body);
      const result = await teamService.inviteMember(workspaceId, invitedBy, data);
      
      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });
  
  // Update member
  fastify.patch('/:memberId', async (request: FastifyRequest<{ Params: { memberId: string } }>, reply: FastifyReply) => {
    try {
      const workspaceId = request.user?.workspaceId;
      const userId = request.user?.userId;
      
      if (!workspaceId || !userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      
      // Check permissions
      const hasPermission = await teamService.checkPermission(
        workspaceId,
        userId,
        'canManageTeam'
      );
      
      if (!hasPermission) {
        return reply.code(403).send({ error: 'Insufficient permissions' });
      }
      
      const data = updateMemberSchema.parse(request.body);
      const member = await teamService.updateMember(workspaceId, request.params.memberId, data);
      
      return reply.send({
        success: true,
        data: member,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });
  
  // Remove member
  fastify.delete('/:memberId', async (request: FastifyRequest<{ Params: { memberId: string } }>, reply: FastifyReply) => {
    try {
      const workspaceId = request.user?.workspaceId;
      const userId = request.user?.userId;
      
      if (!workspaceId || !userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      
      // Check permissions
      const hasPermission = await teamService.checkPermission(
        workspaceId,
        userId,
        'canManageTeam'
      );
      
      if (!hasPermission) {
        return reply.code(403).send({ error: 'Insufficient permissions' });
      }
      
      await teamService.removeMember(workspaceId, request.params.memberId);
      
      return reply.send({
        success: true,
        message: 'Member removed successfully',
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });
  
  // Get current user's permissions
  fastify.get('/permissions', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const workspaceId = request.user?.workspaceId;
      const userId = request.user?.userId;
      
      if (!workspaceId || !userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      
      const permissions = await teamService.getUserPermissions(workspaceId, userId);
      
      return reply.send({
        success: true,
        data: permissions,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });
}

// Public route for accepting invites (no auth required)
export async function inviteRoutes(fastify: FastifyInstance) {
  fastify.post('/accept-invite', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { token } = request.body as { token: string };
      const userId = request.user?.userId; // User must be logged in to accept
      
      if (!userId) {
        return reply.code(401).send({ 
          error: 'Please log in or sign up first',
          redirectTo: `/login?invite=${token}`,
        });
      }
      
      const member = await teamService.acceptInvite(token, userId);
      
      return reply.send({
        success: true,
        data: member,
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });
}
