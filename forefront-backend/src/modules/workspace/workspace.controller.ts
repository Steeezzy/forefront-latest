import { FastifyRequest, FastifyReply } from 'fastify';
import { workspaceService } from './workspace.service.js';
import { getSupportedLanguages } from '../../config/languages.js';

export class WorkspaceController {
  async createWorkspace(request: FastifyRequest, reply: FastifyReply) {
    try {
      const workspace = await workspaceService.createWorkspace(request.body);
      return reply.status(201).send(workspace);
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ error: error.message });
    }
  }

  async getWorkspace(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const workspace = await workspaceService.getWorkspace(id);
      return reply.send(workspace);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return reply.status(404).send({ error: error.message });
      }
      return reply.status(500).send({ error: error.message });
    }
  }

  async updateConfig(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const updated = await workspaceService.updateConfig(id, request.body);
      return reply.send({ status: 'updated', updatedFields: updated });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  }

  async getLanguages(request: FastifyRequest, reply: FastifyReply) {
    try {
      const languages = getSupportedLanguages();
      return reply.send({ languages });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  }
}

export const workspaceController = new WorkspaceController();
