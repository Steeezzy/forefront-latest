import { pool, query } from '../../config/db.js';
import { z } from 'zod';

export const createConversationSchema = z.object({
    visitorId: z.string().min(1),
    workspaceId: z.string().uuid(),
});

export const createMessageSchema = z.object({
    conversationId: z.string().uuid(),
    content: z.string().min(1),
    senderType: z.enum(['visitor', 'agent', 'ai']),
});

export class ChatService {
    async createConversation(data: z.infer<typeof createConversationSchema>) {
        const res = await query(
            'INSERT INTO conversations (visitor_id, workspace_id) VALUES ($1, $2) RETURNING *',
            [data.visitorId, data.workspaceId]
        );
        return res.rows[0];
    }

    async getConversations(workspaceId: string) {
        const res = await query(
            'SELECT * FROM conversations WHERE workspace_id = $1 ORDER BY updated_at DESC',
            [workspaceId]
        );
        return res.rows;
    }

    async getConversationById(conversationId: string) {
        const res = await query(
            'SELECT * FROM conversations WHERE id = $1',
            [conversationId]
        );
        return res.rows[0];
    }

    async addMessage(data: z.infer<typeof createMessageSchema>) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Insert Message
            const messageRes = await client.query(
                'INSERT INTO messages (conversation_id, content, sender_type) VALUES ($1, $2, $3) RETURNING *',
                [data.conversationId, data.content, data.senderType]
            );
            const message = messageRes.rows[0];

            // 2. Update Conversation timestamp
            await client.query(
                'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
                [data.conversationId]
            );

            await client.query('COMMIT');
            return message;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    async getMessages(conversationId: string) {
        const res = await query(
            'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
            [conversationId]
        );
        return res.rows;
    }
}
