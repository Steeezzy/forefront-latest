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

  async saveSettings(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workspaceId, business_name, industry, language } = request.body as any;
      if (!workspaceId) return reply.status(400).send({ error: 'workspaceId is required' });

      const updated = await workspaceService.updateConfig(workspaceId, {
        business_name,
        industry_id: industry,
        language,
        onboarding_completed_at: new Date().toISOString()
      });

      return reply.send({ success: true, updated });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  }

  async getOnboardingStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const workspace = await workspaceService.getWorkspace(id);
      return reply.send({
        completed: !!workspace.onboarding_completed_at,
        completedAt: workspace.onboarding_completed_at
      });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  }
}

export const workspaceController = new WorkspaceController();
