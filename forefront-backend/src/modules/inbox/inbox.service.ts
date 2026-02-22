import { pool, query } from '../../config/db.js';
import { z } from 'zod';

export const createConversationSchema = z.object({
  visitorId: z.string().min(1),
  workspaceId: z.string().uuid(),
  visitorName: z.string().optional(),
  visitorEmail: z.string().email().optional(),
  visitorPhone: z.string().optional(),
  channel: z.enum(['web', 'messenger', 'instagram', 'whatsapp', 'email']).default('web'),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const createMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1),
  senderType: z.enum(['visitor', 'agent', 'ai', 'system']),
  senderId: z.string().uuid().optional(),
  messageType: z.enum(['text', 'file', 'image', 'system', 'note']).default('text'),
  metadata: z.record(z.string(), z.any()).optional(),
  isInternal: z.boolean().optional().default(false),
});

export const updateConversationSchema = z.object({
  status: z.enum(['open', 'closed', 'snoozed', 'pending']).optional(),
  assignedUserId: z.string().uuid().optional().nullable(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  tags: z.array(z.string()).optional(),
  visitorName: z.string().optional(),
  visitorEmail: z.string().email().optional(),
  snoozedUntil: z.string().datetime().optional().nullable(),
});

export interface ConversationFilters {
  status?: 'open' | 'closed' | 'snoozed' | 'pending' | 'all';
  assignedTo?: 'me' | 'unassigned' | string;
  channel?: string;
  search?: string;
  tags?: string[];
  priority?: string;
  page?: number;
  limit?: number;
}

export class InboxService {
  async createConversation(data: z.infer<typeof createConversationSchema>) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get visitor info if exists
      let visitorId: string | null = null;
      const visitorRes = await client.query(
        'SELECT id FROM visitors WHERE workspace_id = $1 AND visitor_id = $2',
        [data.workspaceId, data.visitorId]
      );
      
      if (visitorRes.rows.length > 0) {
        visitorId = visitorRes.rows[0].id;
      }
      
      const result = await client.query(
        `INSERT INTO conversations 
         (visitor_id, workspace_id, visitor_name, visitor_email, visitor_phone, channel, visitor_metadata, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'open')
         RETURNING *`,
        [
          visitorId || data.visitorId,
          data.workspaceId,
          data.visitorName || null,
          data.visitorEmail || null,
          data.visitorPhone || null,
          data.channel,
          JSON.stringify(data.metadata || {}),
        ]
      );
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  async getConversations(workspaceId: string, filters: ConversationFilters = {}) {
    const {
      status = 'all',
      assignedTo,
      channel,
      search,
      tags,
      priority,
      page = 1,
      limit = 20,
    } = filters;
    
    const conditions: string[] = ['c.workspace_id = $1'];
    const values: any[] = [workspaceId];
    let paramIndex = 2;
    
    if (status !== 'all') {
      conditions.push(`c.status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }
    
    if (assignedTo) {
      if (assignedTo === 'unassigned') {
        conditions.push('c.assigned_user_id IS NULL');
      } else if (assignedTo === 'me') {
        // Will be replaced with actual user ID in controller
        conditions.push(`c.assigned_user_id = $${paramIndex}`);
        values.push(assignedTo);
        paramIndex++;
      } else {
        conditions.push(`c.assigned_user_id = $${paramIndex}`);
        values.push(assignedTo);
        paramIndex++;
      }
    }
    
    if (channel) {
      conditions.push(`c.channel = $${paramIndex}`);
      values.push(channel);
      paramIndex++;
    }
    
    if (priority) {
      conditions.push(`c.priority = $${paramIndex}`);
      values.push(priority);
      paramIndex++;
    }
    
    if (tags && tags.length > 0) {
      conditions.push(`c.tags && $${paramIndex}`);
      values.push(tags);
      paramIndex++;
    }
    
    if (search) {
      conditions.push(`(
        c.visitor_name ILIKE $${paramIndex} 
        OR c.visitor_email ILIKE $${paramIndex}
        OR EXISTS (
          SELECT 1 FROM messages m 
          WHERE m.conversation_id = c.id 
          AND m.content ILIKE $${paramIndex}
        )
      )`);
      values.push(`%${search}%`);
      paramIndex++;
    }
    
    const whereClause = conditions.join(' AND ');
    const offset = (page - 1) * limit;
    
    // Get conversations with message count and assigned user info
    const result = await query(
      `SELECT 
        c.*,
        u.name as assigned_user_name,
        u.avatar_url as assigned_user_avatar,
        (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as message_count,
        (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.read_at IS NULL AND m.sender_type != 'visitor') as unread_count
       FROM conversations c
       LEFT JOIN users u ON c.assigned_user_id = u.id
       WHERE ${whereClause}
       ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );
    
    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM conversations c WHERE ${whereClause}`,
      values.slice(0, -2)
    );
    
    return {
      conversations: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      },
    };
  }
  
  async getConversationById(conversationId: string, workspaceId: string) {
    const result = await query(
      `SELECT 
        c.*,
        u.name as assigned_user_name,
        u.avatar_url as assigned_user_avatar,
        u.email as assigned_user_email
       FROM conversations c
       LEFT JOIN users u ON c.assigned_user_id = u.id
       WHERE c.id = $1 AND c.workspace_id = $2`,
      [conversationId, workspaceId]
    );
    
    return result.rows[0] || null;
  }
  
  async updateConversation(
    conversationId: string,
    workspaceId: string,
    data: z.infer<typeof updateConversationSchema>
  ) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(data.status);
      paramIndex++;
      
      if (data.status === 'closed') {
        updates.push(`closed_at = CURRENT_TIMESTAMP`);
      }
    }
    
    if (data.assignedUserId !== undefined) {
      updates.push(`assigned_user_id = $${paramIndex}`);
      values.push(data.assignedUserId);
      paramIndex++;
    }
    
    if (data.priority !== undefined) {
      updates.push(`priority = $${paramIndex}`);
      values.push(data.priority);
      paramIndex++;
    }
    
    if (data.tags !== undefined) {
      updates.push(`tags = $${paramIndex}`);
      values.push(data.tags);
      paramIndex++;
    }
    
    if (data.visitorName !== undefined) {
      updates.push(`visitor_name = $${paramIndex}`);
      values.push(data.visitorName);
      paramIndex++;
    }
    
    if (data.visitorEmail !== undefined) {
      updates.push(`visitor_email = $${paramIndex}`);
      values.push(data.visitorEmail);
      paramIndex++;
    }
    
    if (data.snoozedUntil !== undefined) {
      updates.push(`snoozed_until = $${paramIndex}`);
      values.push(data.snoozedUntil);
      paramIndex++;
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    
    values.push(conversationId);
    values.push(workspaceId);
    
    const result = await query(
      `UPDATE conversations 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND workspace_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      throw new Error('Conversation not found');
    }
    
    return result.rows[0];
  }
  
  async addMessage(data: z.infer<typeof createMessageSchema>) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert message
      const messageRes = await client.query(
        `INSERT INTO messages 
         (conversation_id, content, sender_type, sender_id, message_type, metadata, is_internal)
         VALUES ($1, $2, $3, $4, $4, $5, $6, $7)
         RETURNING *`,
        [
          data.conversationId,
          data.content,
          data.senderType,
          data.senderId || null,
          data.messageType,
          JSON.stringify(data.metadata || {}),
          data.isInternal,
        ]
      );
      
      const message = messageRes.rows[0];
      
      // Update conversation last message info
      await client.query(
        `UPDATE conversations 
         SET last_message_preview = $1, 
             last_message_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [data.content.substring(0, 200), data.conversationId]
      );
      
      await client.query('COMMIT');
      return message;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  async getMessages(conversationId: string, workspaceId: string) {
    // First verify conversation belongs to workspace
    const convRes = await query(
      'SELECT id FROM conversations WHERE id = $1 AND workspace_id = $2',
      [conversationId, workspaceId]
    );
    
    if (convRes.rows.length === 0) {
      throw new Error('Conversation not found');
    }
    
    const result = await query(
      `SELECT 
        m.*,
        u.name as sender_name,
        u.avatar_url as sender_avatar
       FROM messages m
       LEFT JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [conversationId]
    );
    
    return result.rows;
  }
  
  async markMessagesAsRead(conversationId: string, userId: string) {
    await query(
      `UPDATE messages 
       SET read_at = CURRENT_TIMESTAMP 
       WHERE conversation_id = $1 
       AND sender_type != 'visitor' 
       AND read_at IS NULL`,
      [conversationId]
    );
    
    // Mark conversation as read
    await query(
      'UPDATE conversations SET is_read = true WHERE id = $1',
      [conversationId]
    );
  }
  
  async assignConversation(conversationId: string, workspaceId: string, assignedTo: string | null, assignedBy: string) {
    const result = await query(
      `UPDATE conversations 
       SET assigned_user_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND workspace_id = $3
       RETURNING *`,
      [assignedTo, conversationId, workspaceId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Conversation not found');
    }
    
    // Add system message about assignment
    const assigneeName = assignedTo ? (await query('SELECT name FROM users WHERE id = $1', [assignedTo])).rows[0]?.name : 'Unassigned';
    const assignerName = (await query('SELECT name FROM users WHERE id = $1', [assignedBy])).rows[0]?.name || 'System';
    
    await this.addMessage({
      conversationId,
      content: `Conversation assigned to ${assigneeName} by ${assignerName}`,
      senderType: 'system',
      messageType: 'system',
      isInternal: false,
    });
    
    return result.rows[0];
  }
  
  async getConversationStats(workspaceId: string) {
    const result = await query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'open') as open_count,
        COUNT(*) FILTER (WHERE status = 'closed') as closed_count,
        COUNT(*) FILTER (WHERE status = 'snoozed') as snoozed_count,
        COUNT(*) FILTER (WHERE status = 'open' AND assigned_user_id IS NULL) as unassigned_count,
        COUNT(*) FILTER (WHERE status = 'open' AND is_read = false) as unread_count
       FROM conversations 
       WHERE workspace_id = $1`,
      [workspaceId]
    );
    
    return result.rows[0];
  }
}

export const inboxService = new InboxService();
