import type { FastifyReply, FastifyRequest } from 'fastify';
import { redis } from '../../../config/redis.js';

export class UsageGuard {
    static async checkLimit(req: FastifyRequest, reply: FastifyReply) {
        // Assuming workspaceId is in params or query or user context
        // This is a placeholder. In real app, extract from auth token or request
        const workspaceId = (req as any).workspaceId || (req.body as any)?.workspaceId;

        if (!workspaceId) return; // Skip if no workspace context (or handle error)

        const isRateLimited = await redis.get(`workspace_limit_reached:${workspaceId}`);

        if (isRateLimited) {
            reply.code(402).send({
                error: 'Payment Required',
                message: 'Usage limit reached. Please upgrade your plan or top up credits.'
            });
            throw new Error('Usage limit reached'); // Stop execution
        }
    }
}
