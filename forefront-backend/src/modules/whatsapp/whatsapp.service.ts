import { randomUUID } from 'node:crypto';
import { pool } from '../../config/db.js';
import { whatsappService } from '../../services/whatsapp.service.js';

interface ConnectWhatsAppInput {
  phoneNumberId: string;
  accessToken: string;
  verifyToken: string;
  businessAccountId?: string;
}

interface UpdateWhatsAppConfigInput {
  enabled?: boolean;
  accessToken?: string;
  verifyToken?: string;
}

interface SendMessageInput {
  phone: string;
  message: string;
}

export class WhatsAppModuleService {
  private sanitizeConfig(config: any) {
    if (!config) return null;
    const masked = config.access_token
      ? `${config.access_token.slice(0, 6)}...${config.access_token.slice(-4)}`
      : null;

    return {
      ...config,
      access_token: undefined,
      masked_access_token: masked,
    };
  }

  async connect(workspaceId: string, input: ConnectWhatsAppInput) {
    const id = randomUUID();
    const webhookUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/webhooks/whatsapp`;

    await pool.query(
      `INSERT INTO whatsapp_configs
       (id, workspace_id, phone_number_id, access_token, verify_token, business_account_id, enabled, webhook_verified, updated_at)
       VALUES ($1, $2::uuid, $3, $4, $5, $6, true, false, NOW())
       ON CONFLICT (workspace_id)
       DO UPDATE SET
         phone_number_id = EXCLUDED.phone_number_id,
         access_token = EXCLUDED.access_token,
         verify_token = EXCLUDED.verify_token,
         business_account_id = EXCLUDED.business_account_id,
         enabled = true,
         updated_at = NOW()`,
      [
        id,
        workspaceId,
        input.phoneNumberId,
        input.accessToken,
        input.verifyToken,
        input.businessAccountId || null,
      ]
    );

    const result = await pool.query(
      `SELECT id FROM whatsapp_configs WHERE workspace_id = $1::uuid LIMIT 1`,
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
      `SELECT * FROM whatsapp_configs WHERE workspace_id = $1::uuid LIMIT 1`,
      [workspaceId]
    );

    return this.sanitizeConfig(result.rows[0]);
  }

  async getConfigByPhoneNumberId(phoneNumberId: string) {
    const result = await pool.query(
      `SELECT * FROM whatsapp_configs WHERE phone_number_id = $1 AND enabled = true LIMIT 1`,
      [phoneNumberId]
    );

    return result.rows[0] || null;
  }

  async updateConfig(workspaceId: string, input: UpdateWhatsAppConfigInput) {
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

    if (setClauses.length === 0) {
      return this.getConfig(workspaceId);
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(workspaceId);

    const result = await pool.query(
      `UPDATE whatsapp_configs
       SET ${setClauses.join(', ')}
       WHERE workspace_id = $${index}::uuid
       RETURNING *`,
      values
    );

    return this.sanitizeConfig(result.rows[0]);
  }

  async deleteConfig(workspaceId: string) {
    const configRes = await pool.query(
      `SELECT id FROM whatsapp_configs WHERE workspace_id = $1::uuid LIMIT 1`,
      [workspaceId]
    );

    const configId = configRes.rows[0]?.id;
    if (configId) {
      await pool.query(`DELETE FROM whatsapp_messages WHERE workspace_id = $1::uuid`, [workspaceId]);
      await pool.query(`DELETE FROM whatsapp_conversations WHERE workspace_id = $1::uuid`, [workspaceId]);
      await pool.query(`DELETE FROM whatsapp_configs WHERE id = $1`, [configId]);
    }

    return { deleted: true };
  }

  async sendTestMessage(workspaceId: string, input: SendMessageInput) {
    const config = await this.getConfigByWorkspace(workspaceId);
    if (!config) {
      throw new Error('WhatsApp config not found');
    }

    const sent = await whatsappService.sendMessage(
      config.phone_number_id,
      config.access_token,
      input.phone,
      input.message
    );

    return {
      sent: true,
      messageId: sent.messageId,
    };
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
       FROM whatsapp_conversations
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
       FROM whatsapp_messages
       WHERE workspace_id = $1::uuid AND conversation_id = $2
       ORDER BY created_at DESC
       LIMIT $3`,
      [workspaceId, conversationId, limit]
    );

    return result.rows;
  }

  async manualSend(workspaceId: string, input: SendMessageInput) {
    const config = await this.getConfigByWorkspace(workspaceId);
    if (!config) {
      throw new Error('WhatsApp config not found');
    }

    const conversation = await this.findOrCreateConversation(
      workspaceId,
      config.id,
      input.phone,
      null,
      null
    );

    const sent = await whatsappService.sendMessage(
      config.phone_number_id,
      config.access_token,
      input.phone,
      input.message
    );

    await this.saveMessage({
      workspaceId,
      conversationId: conversation.id,
      direction: 'outbound',
      messageType: 'text',
      content: input.message,
      whatsappMessageId: sent.messageId,
      status: sent.status,
    });

    await this.bumpConversation(conversation.id);

    return {
      sent: true,
      messageId: sent.messageId,
    };
  }

  async getConfigByWorkspace(workspaceId: string) {
    const result = await pool.query(
      `SELECT * FROM whatsapp_configs WHERE workspace_id = $1::uuid LIMIT 1`,
      [workspaceId]
    );
    return result.rows[0] || null;
  }

  async findOrCreateConversation(
    workspaceId: string,
    whatsappConfigId: string,
    customerPhone: string,
    customerName: string | null,
    customerWaId: string | null
  ) {
    const existing = await pool.query(
      `SELECT *
       FROM whatsapp_conversations
       WHERE workspace_id = $1::uuid AND customer_phone = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [workspaceId, customerPhone]
    );

    if (existing.rows[0]) {
      return existing.rows[0];
    }

    const id = randomUUID();
    const created = await pool.query(
      `INSERT INTO whatsapp_conversations
       (id, workspace_id, whatsapp_config_id, customer_phone, customer_name, customer_wa_id, last_message_at, message_count, status)
       VALUES ($1, $2::uuid, $3, $4, $5, $6, NOW(), 0, 'active')
       RETURNING *`,
      [id, workspaceId, whatsappConfigId, customerPhone, customerName, customerWaId]
    );

    return created.rows[0];
  }

  async saveMessage(input: {
    workspaceId: string;
    conversationId: string;
    direction: 'inbound' | 'outbound';
    messageType?: string;
    content?: string;
    mediaUrl?: string;
    whatsappMessageId?: string;
    status?: string;
  }) {
    const id = randomUUID();

    const result = await pool.query(
      `INSERT INTO whatsapp_messages
       (id, conversation_id, workspace_id, direction, message_type, content, media_url, whatsapp_message_id, status)
       VALUES ($1, $2, $3::uuid, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        id,
        input.conversationId,
        input.workspaceId,
        input.direction,
        input.messageType || 'text',
        input.content || null,
        input.mediaUrl || null,
        input.whatsappMessageId || null,
        input.status || 'sent',
      ]
    );

    return result.rows[0];
  }

  async bumpConversation(conversationId: string) {
    await pool.query(
      `UPDATE whatsapp_conversations
       SET message_count = message_count + 1,
           last_message_at = NOW()
       WHERE id = $1`,
      [conversationId]
    );
  }

  async getRecentMessages(conversationId: string, limit = 10) {
    const result = await pool.query(
      `SELECT *
       FROM whatsapp_messages
       WHERE conversation_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [conversationId, limit]
    );

    return result.rows.reverse();
  }
}

export const whatsappModuleService = new WhatsAppModuleService();
