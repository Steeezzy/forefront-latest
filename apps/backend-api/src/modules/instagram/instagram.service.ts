import { randomUUID } from 'node:crypto';
import { pool } from '../../config/db.js';
import { instagramService } from '../../services/instagram.service.js';

interface ConnectInstagramInput {
  instagramAccountId: string;
  pageId: string;
  accessToken: string;
  verifyToken: string;
  instagramUsername?: string;
}

interface UpdateInstagramInput {
  enabled?: boolean;
  accessToken?: string;
  verifyToken?: string;
  instagramUsername?: string;
}

interface TestInstagramInput {
  recipientId: string;
  message: string;
}

export class InstagramModuleService {
  private sanitizeConfig(config: any) {
    if (!config) return null;

    return {
      ...config,
      access_token: undefined,
      masked_access_token: config.access_token
        ? `${config.access_token.slice(0, 6)}...${config.access_token.slice(-4)}`
        : null,
    };
  }

  async connect(workspaceId: string, input: ConnectInstagramInput) {
    const id = randomUUID();
    const webhookUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/webhooks/instagram`;

    await pool.query(
      `INSERT INTO instagram_configs
       (id, workspace_id, instagram_account_id, page_id, access_token, verify_token, instagram_username, enabled, webhook_verified, updated_at)
       VALUES ($1, $2::uuid, $3, $4, $5, $6, $7, true, false, NOW())
       ON CONFLICT (workspace_id)
       DO UPDATE SET
         instagram_account_id = EXCLUDED.instagram_account_id,
         page_id = EXCLUDED.page_id,
         access_token = EXCLUDED.access_token,
         verify_token = EXCLUDED.verify_token,
         instagram_username = EXCLUDED.instagram_username,
         enabled = true,
         updated_at = NOW()`,
      [
        id,
        workspaceId,
        input.instagramAccountId,
        input.pageId,
        input.accessToken,
        input.verifyToken,
        input.instagramUsername || null,
      ]
    );

    const result = await pool.query(
      `SELECT id FROM instagram_configs WHERE workspace_id = $1::uuid LIMIT 1`,
      [workspaceId]
    );

    return {
      configId: result.rows[0]?.id || id,
      status: 'connected',
      webhookUrl,
    };
  }

  async getConfig(workspaceId: string) {
    const result = await pool.query(
      `SELECT * FROM instagram_configs WHERE workspace_id = $1::uuid LIMIT 1`,
      [workspaceId]
    );

    return this.sanitizeConfig(result.rows[0]);
  }

  async getConfigByWorkspace(workspaceId: string) {
    const result = await pool.query(
      `SELECT * FROM instagram_configs WHERE workspace_id = $1::uuid LIMIT 1`,
      [workspaceId]
    );
    return result.rows[0] || null;
  }

  async getConfigByPageId(pageId: string) {
    const result = await pool.query(
      `SELECT * FROM instagram_configs WHERE page_id = $1 AND enabled = true LIMIT 1`,
      [pageId]
    );

    return result.rows[0] || null;
  }

  async updateConfig(workspaceId: string, input: UpdateInstagramInput) {
    const setClauses: string[] = [];
    const values: any[] = [];
    let index = 1;

    if (typeof input.enabled === 'boolean') {
      setClauses.push(`enabled = $${index++}`);
      values.push(input.enabled);
    }
    if (input.accessToken !== undefined) {
      setClauses.push(`access_token = $${index++}`);
      values.push(input.accessToken);
    }
    if (input.verifyToken !== undefined) {
      setClauses.push(`verify_token = $${index++}`);
      values.push(input.verifyToken);
    }
    if (input.instagramUsername !== undefined) {
      setClauses.push(`instagram_username = $${index++}`);
      values.push(input.instagramUsername || null);
    }

    if (setClauses.length === 0) {
      return this.getConfig(workspaceId);
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(workspaceId);

    const result = await pool.query(
      `UPDATE instagram_configs
       SET ${setClauses.join(', ')}
       WHERE workspace_id = $${index}::uuid
       RETURNING *`,
      values
    );

    return this.sanitizeConfig(result.rows[0]);
  }

  async deleteConfig(workspaceId: string) {
    const configRes = await pool.query(
      `SELECT id FROM instagram_configs WHERE workspace_id = $1::uuid LIMIT 1`,
      [workspaceId]
    );

    const configId = configRes.rows[0]?.id;
    if (configId) {
      await pool.query(`DELETE FROM instagram_messages WHERE workspace_id = $1::uuid`, [workspaceId]);
      await pool.query(`DELETE FROM instagram_conversations WHERE workspace_id = $1::uuid`, [workspaceId]);
      await pool.query(`DELETE FROM instagram_configs WHERE id = $1`, [configId]);
    }

    return { deleted: true };
  }

  async sendTestDM(workspaceId: string, input: TestInstagramInput) {
    const config = await this.getConfigByWorkspace(workspaceId);
    if (!config) {
      throw new Error('Instagram config not found');
    }

    const sent = await instagramService.sendDM(config.access_token, input.recipientId, input.message);
    return { sent: true, messageId: sent.messageId };
  }

  async listConversations(workspaceId: string, status: string, page: number, limit: number) {
    const offset = (Math.max(page, 1) - 1) * Math.max(limit, 1);

    const whereStatus = status && status !== 'all' ? `AND status = $2` : '';
    const params = status && status !== 'all'
      ? [workspaceId, status, limit, offset]
      : [workspaceId, limit, offset];

    const limitIndex = status && status !== 'all' ? 3 : 2;
    const offsetIndex = status && status !== 'all' ? 4 : 3;

    const result = await pool.query(
      `SELECT *
       FROM instagram_conversations
       WHERE workspace_id = $1::uuid ${whereStatus}
       ORDER BY COALESCE(last_message_at, created_at) DESC
       LIMIT $${limitIndex}
       OFFSET $${offsetIndex}`,
      params
    );

    return result.rows;
  }

  async listMessages(workspaceId: string, conversationId: string, limit: number) {
    const result = await pool.query(
      `SELECT *
       FROM instagram_messages
       WHERE workspace_id = $1::uuid AND conversation_id = $2
       ORDER BY created_at DESC
       LIMIT $3`,
      [workspaceId, conversationId, limit]
    );

    return result.rows;
  }

  async findOrCreateConversation(
    workspaceId: string,
    instagramConfigId: string,
    senderId: string,
    senderUsername: string | null
  ) {
    const existing = await pool.query(
      `SELECT *
       FROM instagram_conversations
       WHERE workspace_id = $1::uuid AND sender_id = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [workspaceId, senderId]
    );

    if (existing.rows[0]) {
      return existing.rows[0];
    }

    const id = randomUUID();
    const created = await pool.query(
      `INSERT INTO instagram_conversations
       (id, workspace_id, instagram_config_id, sender_id, sender_username, last_message_at, message_count, status)
       VALUES ($1, $2::uuid, $3, $4, $5, NOW(), 0, 'active')
       RETURNING *`,
      [id, workspaceId, instagramConfigId, senderId, senderUsername]
    );

    return created.rows[0];
  }

  async saveMessage(input: {
    workspaceId: string;
    conversationId: string;
    direction: 'inbound' | 'outbound';
    content?: string;
    instagramMessageId?: string;
    status?: string;
  }) {
    const id = randomUUID();

    const result = await pool.query(
      `INSERT INTO instagram_messages
       (id, conversation_id, workspace_id, direction, content, instagram_message_id, status)
       VALUES ($1, $2, $3::uuid, $4, $5, $6, $7)
       RETURNING *`,
      [
        id,
        input.conversationId,
        input.workspaceId,
        input.direction,
        input.content || null,
        input.instagramMessageId || null,
        input.status || 'sent',
      ]
    );

    return result.rows[0];
  }

  async bumpConversation(conversationId: string) {
    await pool.query(
      `UPDATE instagram_conversations
       SET message_count = message_count + 1,
           last_message_at = NOW()
       WHERE id = $1`,
      [conversationId]
    );
  }

  async getRecentMessages(conversationId: string, limit = 10) {
    const result = await pool.query(
      `SELECT *
       FROM instagram_messages
       WHERE conversation_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [conversationId, limit]
    );

    return result.rows.reverse();
  }
}

export const instagramModuleService = new InstagramModuleService();
