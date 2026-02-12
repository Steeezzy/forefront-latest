import type { FastifyReply, FastifyRequest } from 'fastify';
import { ChatService, createConversationSchema, createMessageSchema } from './chat.service.js';
import { z } from 'zod';

const chatService = new ChatService();

export class ChatController {
    async createConversation(req: FastifyRequest, reply: FastifyReply) {
        try {
            const body = createConversationSchema.parse(req.body);
            const conversation = await chatService.createConversation(body);
            return reply.code(201).send(conversation);
        } catch (e: any) {
            if (e instanceof z.ZodError) return reply.code(400).send(e.issues);
            return reply.code(500).send({ message: e.message });
        }
    }

    async getConversations(req: FastifyRequest<{ Querystring: { workspaceId: string } }>, reply: FastifyReply) {
        const { workspaceId } = req.query;
        if (!workspaceId) return reply.code(400).send({ message: 'workspaceId is required' });

        const conversations = await chatService.getConversations(workspaceId);
        return reply.send(conversations);
    }

    async addMessage(req: FastifyRequest, reply: FastifyReply) {
        try {
            const body = createMessageSchema.parse(req.body);
            const message = await chatService.addMessage(body);
            return reply.code(201).send(message);
        } catch (e: any) {
            if (e instanceof z.ZodError) return reply.code(400).send(e.issues);
            return reply.code(500).send({ message: e.message });
        }
    }

    async getMessages(req: FastifyRequest<{ Params: { conversationId: string } }>, reply: FastifyReply) {
        const { conversationId } = req.params;
        const messages = await chatService.getMessages(conversationId);
        return reply.send(messages);
    }
}
