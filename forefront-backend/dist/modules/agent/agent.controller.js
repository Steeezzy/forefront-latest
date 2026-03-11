import { z } from 'zod';
import { AgentService } from './agent.service.js';
const agentService = new AgentService();
const updateConfigSchema = z.object({
    name: z.string().optional(),
    tone: z.string().optional(),
    goal: z.string().optional(),
    first_message: z.string().optional(),
    fallback_message: z.string().optional(),
    is_active: z.boolean().optional(),
});
export class AgentController {
    async updateConfig(req, reply) {
        const { agentId } = req.params;
        const data = updateConfigSchema.parse(req.body);
        const user = req.user;
        // Filter out undefined values to satisfy exactOptionalPropertyTypes
        const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
        const updatedAgent = await agentService.updateConfig(user.workspaceId, agentId, cleanData);
        if (!updatedAgent) {
            return reply.code(404).send({ message: 'Agent not found or no changes' });
        }
        return reply.send(updatedAgent);
    }
    async getAgent(req, reply) {
        const { agentId } = req.params;
        const user = req.user;
        const agent = await agentService.getAgent(user.workspaceId, agentId);
        if (!agent)
            return reply.code(404).send({ message: 'Agent not found' });
        return reply.send(agent);
    }
    async getPrimary(req, reply) {
        const user = req.user;
        const agent = await agentService.ensureAgent(user.workspaceId);
        return reply.send(agent);
    }
}
//# sourceMappingURL=agent.controller.js.map