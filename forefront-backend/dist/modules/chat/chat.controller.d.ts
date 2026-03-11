import type { FastifyReply, FastifyRequest } from 'fastify';
export declare class ChatController {
    createConversation(req: FastifyRequest, reply: FastifyReply): Promise<never>;
    getConversations(req: FastifyRequest<{
        Querystring: {
            workspaceId: string;
        };
    }>, reply: FastifyReply): Promise<never>;
    addMessage(req: FastifyRequest, reply: FastifyReply): Promise<never>;
    getMessages(req: FastifyRequest<{
        Params: {
            conversationId: string;
        };
    }>, reply: FastifyReply): Promise<never>;
}
//# sourceMappingURL=chat.controller.d.ts.map