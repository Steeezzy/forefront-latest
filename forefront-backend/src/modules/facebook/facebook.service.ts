import { randomUUID } from 'node:crypto';
import { pool } from '../../config/db.js';
import { facebookService } from '../../services/facebook.service.js';

interface ConnectFacebookInput {
  pageId: string;
  pageAccessToken: string;
  verifyToken: string;
  appSecret?: string;
  pageName?: string;
}

interface UpdateFacebookConfigInput {
  enabled?: boolean;
  pageAccessToken?: string;
  verifyToken?: string;
  appSecret?: string;
  pageName?: string;
}

interface TestFacebookMessageInput {
  recipientId: string;
  message: string;
}

export class FacebookModuleService {
  private sanitizeConfig(config: any) {
    if (!config) return null;

    return {
      ...config,
      page_access_token: undefined,
      masked_page_access_token: config.page_access_token
        ? `${config.page_access_token.slice(0, 6)}...${config.page_access_token.slice(-4)}`
        : null,
    };
  }

  async connect(workspaceId: string, input: ConnectFacebookInput) {
    const id = randomUUID();
    const webhookUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/webhooks/facebook`;

    await pool.query(
      `INSERT INTO facebook_configs
       (id, workspace_id, page_id, page_access_token, app_secret, verify_token, page_name, enabled, webhook_verified, updated_at)
       VALUES ($1, $2::uuid, $3, $4, $5, $6, $7, true, false, NOW())
       ON CONFLICT (workspace_id)
       DO UPDATE SET
         page_id = EXCLUDED.page_id,
         page_access_token = EXCLUDED.page_access_token,
         app_secret = EXCLUDED.app_secret,
         verify_token = EXCLUDED.verify_token,
         page_name = EXCLUDED.page_name,
         enabled = true,
         updated_at = NOW()`,
      [
        id,
        workspaceId,
        input.pageId,
        input.pageAccessToken,
        input.appSecret || null,
        input.verifyToken,
        input.pageName || null,
      ]
    );

    const result = await pool.query(
      `SELECT id FROM facebook_configs WHERE workspace_id = $1::uuid LIMIT 1`,
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
      `SELECT * FROM facebook_configs WHERE workspace_id = $1::uuid LIMIT 1`,
      [workspaceId]
    );

    return this.sanitizeConfig(result.rows[0]);
  }

  async getConfigByWorkspace(workspaceId: string) {
    const result = await pool.query(
      `SELECT * FROM facebook_configs WHERE workspace_id = $1::uuid LIMIT 1`,
      [workspaceId]
    );
    return result.rows[0] || null;
  }

  async getConfigByPageId(pageId: string) {
    const result = await pool.query(
      `SELECT * FROM facebook_configs WHERE page_id = $1 AND enabled = true LIMIT 1`,
      [pageId]
    );

    return result.rows[0] || null;
  }

  async updateConfig(workspaceId: string, input: UpdateFacebookConfigInput) {
    const setClauses: string[] = [];
    const values: any[] = [];
    let index = 1;

    if (typeof input.enabled === 'boolean') {
      setClauses.push(`enabled = $${index++}`);
      values.push(input.enabled);
    }
    if (input.pageAccessToken !== undefined) {
      setClauses.push(`page_access_token = $${index++}`);
      values.push(input.pageAccessToken);
    }
    if (input.verifyToken !== undefined) {
      setClauses.push(`verify_token = $${index++}`);
      values.push(input.verifyToken);
    }
    if (input.appSecret !== undefined) {
      setClauses.push(`app_secret = $${index++}`);
      values.push(input.appSecret || null);
    }
    if (input.pageName !== undefined) {
      setClauses.push(`page_name = $${index++}`);
      values.push(input.pageName || null);
    }

    if (setClauses.length === 0) {
      return this.getConfig(workspaceId);
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(workspaceId);

    const result = await pool.query(
      `UPDATE facebook_configs
       SET ${setClauses.join(', ')}
       WHERE workspace_id = $${index}::uuid
       RETURNING *`,
      values
    );

    return this.sanitizeConfig(result.rows[0]);
  }

  async deleteConfig(workspaceId: string) {
    const configRes = await pool.query(
      `SELECT id FROM facebook_configs WHERE workspace_id = $1::uuid LIMIT 1`,
      [workspaceId]
    );

    const configId = configRes.rows[0]?.id;
    if (configId) {
      await pool.query(`DELETE FROM facebook_messages WHERE workspace_id = $1::uuid`, [workspaceId]);
      await pool.query(`DELETE FROM facebook_conversations WHERE workspace_id = $1::uuid`, [workspaceId]);
      await pool.query(`DELETE FROM facebook_configs WHERE id = $1`, [configId]);
    }

    return { deleted: true };
  }

  async sendTestMessage(workspaceId: string, input: TestFacebookMessageInput) {
    const config = await this.getConfigByWorkspace(workspaceId);
    if (!config) {
      throw new Error('Facebook config not found');
    }

    const sent = await facebookService.sendMessage(
      config.page_access_token,
      input.recipientId,
      input.message
    );

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
       FROM facebook_conversations
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
       FROM facebook_messages
       WHERE workspace_id = $1::uuid AND conversation_id = $2
       ORDER BY created_at DESC
       LIMIT $3`,
      [workspaceId, conversationId, limit]
    );

    return result.rows;
  }

  async findOrCreateConversation(
    workspaceId: string,
    facebookConfigId: string,
    senderId: string,
    senderName: string | null
  ) {
    const existing = await pool.query(
      `SELECT *
       FROM facebook_conversations
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
      `INSERT INTO facebook_conversations
       (id, workspace_id, facebook_config_id, sender_id, sender_name, last_message_at, message_count, status)
       VALUES ($1, $2::uuid, $3, $4, $5, NOW(), 0, 'active')
       RETURNING *`,
      [id, workspaceId, facebookConfigId, senderId, senderName]
    );

    return created.rows[0];
  }

  async saveMessage(input: {
    workspaceId: string;
    conversationId: string;
    direction: 'inbound' | 'outbound';
    content?: string;
    facebookMessageId?: string;
    status?: string;
  }) {
    const id = randomUUID();

    const result = await pool.query(
      `INSERT INTO facebook_messages
       (id, conversation_id, workspace_id, direction, content, facebook_message_id, status)
       VALUES ($1, $2, $3::uuid, $4, $5, $6, $7)
       RETURNING *`,
      [
        id,
        input.conversationId,
        input.workspaceId,
        input.direction,
        input.content || null,
        input.facebookMessageId || null,
        input.status || 'sent',
      ]
    );

    return result.rows[0];
  }

  async bumpConversation(conversationId: string) {
    await pool.query(
      `UPDATE facebook_conversations
       SET message_count = message_count + 1,
           last_message_at = NOW()
       WHERE id = $1`,
      [conversationId]
    );
  }

  async getRecentMessages(conversationId: string, limit = 10) {
    const result = await pool.query(
      `SELECT *
       FROM facebook_messages
       WHERE conversation_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [conversationId, limit]
    );

    return result.rows.reverse();
  }
}

export const facebookModuleService = new FacebookModuleService();
