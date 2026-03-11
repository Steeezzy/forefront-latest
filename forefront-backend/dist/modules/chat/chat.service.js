import { pool, query } from '../../config/db.js';
import { z } from 'zod';
import { integrationEvents } from '../integrations/integration-events.service.js';
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
    async createConversation(data) {
        const res = await query('INSERT INTO conversations (visitor_id, workspace_id) VALUES ($1, $2) RETURNING *', [data.visitorId, data.workspaceId]);
        const conversation = res.rows[0];
        // Fire integration events (Zapier, Slack, CRM sync) — non-blocking
        integrationEvents.fireEvent('conversation.created', {
            workspaceId: data.workspaceId,
            conversation: {
                id: conversation.id,
            },
            customFields: {
                visitorId: data.visitorId,
            }
        }).catch(e => console.error('[ChatService] Event fire error:', e.message));
        return conversation;
    }
    async getConversations(workspaceId) {
        const res = await query('SELECT * FROM conversations WHERE workspace_id = $1 ORDER BY updated_at DESC', [workspaceId]);
        return res.rows;
    }
    async getConversationById(conversationId) {
        const res = await query('SELECT * FROM conversations WHERE id = $1', [conversationId]);
        return res.rows[0];
    }
    async addMessage(data) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            // 1. Insert Message
            const messageRes = await client.query('INSERT INTO messages (conversation_id, content, sender_type) VALUES ($1, $2, $3) RETURNING *', [data.conversationId, data.content, data.senderType]);
            const message = messageRes.rows[0];
            // 2. Update Conversation timestamp
            await client.query('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [data.conversationId]);
            await client.query('COMMIT');
            // 3. Fire integration events — non-blocking
            if (data.senderType === 'visitor') {
                // Get workspace_id for event firing
                const convRes = await query('SELECT workspace_id FROM conversations WHERE id = $1', [data.conversationId]);
                if (convRes.rows[0]) {
                    integrationEvents.fireEvent('message.received', {
                        workspaceId: convRes.rows[0].workspace_id,
                        conversation: {
                            id: data.conversationId,
                        },
                        message: {
                            text: message.content,
                        },
                    }).catch(e => console.error('[ChatService] Event fire error:', e.message));
                }
            }
            return message;
        }
        catch (e) {
            await client.query('ROLLBACK');
            throw e;
        }
        finally {
            client.release();
        }
    }
    async getMessages(conversationId) {
        const res = await query('SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC', [conversationId]);
        return res.rows;
    }
}
//# sourceMappingURL=chat.service.js.map