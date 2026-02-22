import { z } from 'zod';
import { KnowledgeService } from './knowledge.service.js';
const knowledgeService = new KnowledgeService();
const addSourceSchema = z.object({
    agentId: z.string().uuid(),
    type: z.enum(['text', 'url', 'pdf', 'qa_pair']),
    content: z.string().min(1), // URL or raw text
});
export class KnowledgeController {
    async addSource(req, reply) {
        const { agentId, type, content } = addSourceSchema.parse(req.body);
        // Ensure user owns agent/workspace (omitted for brevity, requires AuthGuard)
        const user = req.user;
        const result = await knowledgeService.addSource(user.workspaceId, agentId, type, content);
        return reply.status(201).send(result);
    }
    async getSources(req, reply) {
        const { agentId } = req.params;
        const sources = await knowledgeService.getSources(agentId);
        return reply.send(sources);
    }
}
