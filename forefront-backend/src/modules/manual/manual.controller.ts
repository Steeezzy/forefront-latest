import { FastifyRequest, FastifyReply } from 'fastify';
import { manualService } from './manual.service.js';

export class ManualController {
  async createEntry(request: FastifyRequest, reply: FastifyReply) {
    try {
      const entry = await manualService.createEntry(request.body);
      return reply.status(201).send(entry);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  }

  async getEntries(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const { entryType } = request.query as { entryType?: string };
      const entries = await manualService.getEntries(workspaceId, entryType);
      return reply.send({ entries, total: entries.length });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  }

  async deleteEntry(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { entryId } = request.params as { entryId: string };
      await manualService.deleteEntry(entryId);
      return reply.send({ success: true });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  }

  async getSummary(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const summary = await manualService.getSummary(workspaceId);
      return reply.send(summary);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  }
}

export const manualController = new ManualController();
