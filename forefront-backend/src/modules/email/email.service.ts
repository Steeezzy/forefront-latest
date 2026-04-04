import { randomUUID } from 'node:crypto';
import { pool } from '../../config/db.js';
import { emailService } from '../../services/email.service.js';

interface ConnectEmailInput {
  provider?: string;
  inboxEmail: string;
  displayName?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  imapHost?: string;
  imapPort?: number;
  imapUsername?: string;
  imapPassword?: string;
  webhookSecret?: string;
  verifyToken: string;
}

interface UpdateEmailConfigInput {
  enabled?: boolean;
  displayName?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  imapHost?: string;
  imapPort?: number;
  imapUsername?: string;
  imapPassword?: string;
  webhookSecret?: string;
  verifyToken?: string;
}

interface TestEmailInput {
  toEmail: string;
  subject: string;
  message: string;
}

export class EmailModuleService {
  private maskSecret(value?: string | null) {
    if (!value) return null;
    if (value.length <= 6) return '***';
    return `${value.slice(0, 3)}...${value.slice(-2)}`;
  }

  private sanitizeConfig(config: any) {
    if (!config) return null;

    return {
      ...config,
      smtp_password: undefined,
      imap_password: undefined,
      webhook_secret: undefined,
      verify_token: undefined,
      masked_smtp_password: this.maskSecret(config.smtp_password),
      masked_imap_password: this.maskSecret(config.imap_password),
      masked_webhook_secret: this.maskSecret(config.webhook_secret),
    };
  }

  async connect(workspaceId: string, input: ConnectEmailInput) {
    const id = randomUUID();
    const webhookUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/webhooks/email`;

    await pool.query(
      `INSERT INTO email_channel_configs
       (id, workspace_id, provider, inbox_email, display_name, smtp_host, smtp_port, smtp_username, smtp_password,
        imap_host, imap_port, imap_username, imap_password, webhook_secret, verify_token, enabled, webhook_verified, updated_at)
       VALUES ($1, $2::uuid, $3, $4, $5, $6, $7, $8, $9,
               $10, $11, $12, $13, $14, $15, true, false, NOW())
       ON CONFLICT (workspace_id)
       DO UPDATE SET
         provider = EXCLUDED.provider,
         inbox_email = EXCLUDED.inbox_email,
         display_name = EXCLUDED.display_name,
         smtp_host = EXCLUDED.smtp_host,
         smtp_port = EXCLUDED.smtp_port,
         smtp_username = EXCLUDED.smtp_username,
         smtp_password = EXCLUDED.smtp_password,
         imap_host = EXCLUDED.imap_host,
         imap_port = EXCLUDED.imap_port,
         imap_username = EXCLUDED.imap_username,
         imap_password = EXCLUDED.imap_password,
         webhook_secret = EXCLUDED.webhook_secret,
         verify_token = EXCLUDED.verify_token,
         enabled = true,
         updated_at = NOW()`,
      [
        id,
        workspaceId,
        input.provider || 'smtp',
        input.inboxEmail,
        input.displayName || null,
        input.smtpHost || null,
        input.smtpPort || null,
        input.smtpUsername || null,
        input.smtpPassword || null,
        input.imapHost || null,
        input.imapPort || null,
        input.imapUsername || null,
        input.imapPassword || null,
        input.webhookSecret || null,
        input.verifyToken,
      ]
    );

    const result = await pool.query(
      `SELECT id FROM email_channel_configs WHERE workspace_id = $1::uuid LIMIT 1`,
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
      `SELECT * FROM email_channel_configs WHERE workspace_id = $1::uuid LIMIT 1`,
      [workspaceId]
    );

    return this.sanitizeConfig(result.rows[0]);
  }

  async getConfigByWorkspace(workspaceId: string) {
    const result = await pool.query(
      `SELECT * FROM email_channel_configs WHERE workspace_id = $1::uuid LIMIT 1`,
      [workspaceId]
    );

    return result.rows[0] || null;
  }

  async getConfigByInboxEmail(inboxEmail: string) {
    const result = await pool.query(
      `SELECT *
       FROM email_channel_configs
       WHERE LOWER(inbox_email) = LOWER($1) AND enabled = true
       LIMIT 1`,
      [inboxEmail]
    );

    return result.rows[0] || null;
  }

  async updateConfig(workspaceId: string, input: UpdateEmailConfigInput) {
    const setClauses: string[] = [];
    const values: any[] = [];
    let index = 1;

    const pushField = (field: string, value: unknown) => {
      setClauses.push(`${field} = $${index++}`);
      values.push(value);
    };

    if (typeof input.enabled === 'boolean') pushField('enabled', input.enabled);
    if (input.displayName !== undefined) pushField('display_name', input.displayName || null);
    if (input.smtpHost !== undefined) pushField('smtp_host', input.smtpHost || null);
    if (input.smtpPort !== undefined) pushField('smtp_port', input.smtpPort || null);
    if (input.smtpUsername !== undefined) pushField('smtp_username', input.smtpUsername || null);
    if (input.smtpPassword !== undefined) pushField('smtp_password', input.smtpPassword || null);
    if (input.imapHost !== undefined) pushField('imap_host', input.imapHost || null);
    if (input.imapPort !== undefined) pushField('imap_port', input.imapPort || null);
    if (input.imapUsername !== undefined) pushField('imap_username', input.imapUsername || null);
    if (input.imapPassword !== undefined) pushField('imap_password', input.imapPassword || null);
    if (input.webhookSecret !== undefined) pushField('webhook_secret', input.webhookSecret || null);
    if (input.verifyToken !== undefined) pushField('verify_token', input.verifyToken || null);

    if (setClauses.length === 0) {
      return this.getConfig(workspaceId);
    }

    setClauses.push('updated_at = NOW()');
    values.push(workspaceId);

    const result = await pool.query(
      `UPDATE email_channel_configs
       SET ${setClauses.join(', ')}
       WHERE workspace_id = $${index}::uuid
       RETURNING *`,
      values
    );

    return this.sanitizeConfig(result.rows[0]);
  }

  async deleteConfig(workspaceId: string) {
    const configRes = await pool.query(
      `SELECT id FROM email_channel_configs WHERE workspace_id = $1::uuid LIMIT 1`,
      [workspaceId]
    );

    const configId = configRes.rows[0]?.id;
    if (configId) {
      await pool.query(`DELETE FROM email_channel_messages WHERE workspace_id = $1::uuid`, [workspaceId]);
      await pool.query(`DELETE FROM email_channel_conversations WHERE workspace_id = $1::uuid`, [workspaceId]);
      await pool.query(`DELETE FROM email_channel_configs WHERE id = $1`, [configId]);
    }

    return { deleted: true };
  }

  async sendTestEmail(workspaceId: string, input: TestEmailInput) {
    const config = await this.getConfigByWorkspace(workspaceId);
    if (!config) {
      throw new Error('Email config not found');
    }

    const threadId = `manual-${randomUUID()}`;
    const conversation = await this.findOrCreateConversation(
      workspaceId,
      config.id,
      input.toEmail,
      null,
      input.subject,
      threadId
    );

    const sent = await emailService.sendMessage(config, input.toEmail, input.subject, input.message);

    await this.saveMessage({
      workspaceId,
      conversationId: conversation.id,
      direction: 'outbound',
      subject: input.subject,
      content: input.message,
      emailMessageId: sent.messageId,
      status: sent.status,
    });

    await this.bumpConversation(conversation.id);

    return {
      sent: true,
      messageId: sent.messageId,
      status: sent.status,
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
       FROM email_channel_conversations
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
       FROM email_channel_messages
       WHERE workspace_id = $1::uuid AND conversation_id = $2
       ORDER BY created_at DESC
       LIMIT $3`,
      [workspaceId, conversationId, limit]
    );

    return result.rows;
  }

  async findOrCreateConversation(
    workspaceId: string,
    emailConfigId: string,
    customerEmail: string,
    customerName: string | null,
    subject: string | null,
    threadId?: string | null
  ) {
    if (threadId) {
      const byThread = await pool.query(
        `SELECT *
         FROM email_channel_conversations
         WHERE workspace_id = $1::uuid AND thread_id = $2
         ORDER BY created_at DESC
         LIMIT 1`,
        [workspaceId, threadId]
      );

      if (byThread.rows[0]) {
        return byThread.rows[0];
      }
    }

    const existing = await pool.query(
      `SELECT *
       FROM email_channel_conversations
       WHERE workspace_id = $1::uuid AND LOWER(customer_email) = LOWER($2)
       ORDER BY created_at DESC
       LIMIT 1`,
      [workspaceId, customerEmail]
    );

    if (existing.rows[0]) {
      return existing.rows[0];
    }

    const id = randomUUID();
    const created = await pool.query(
      `INSERT INTO email_channel_conversations
       (id, workspace_id, email_config_id, customer_email, customer_name, subject, thread_id, last_message_at, message_count, status)
       VALUES ($1, $2::uuid, $3, $4, $5, $6, $7, NOW(), 0, 'active')
       RETURNING *`,
      [
        id,
        workspaceId,
        emailConfigId,
        customerEmail,
        customerName,
        subject,
        threadId || `thread-${randomUUID()}`,
      ]
    );

    return created.rows[0];
  }

  async saveMessage(input: {
    workspaceId: string;
    conversationId: string;
    direction: 'inbound' | 'outbound';
    subject?: string;
    content?: string;
    htmlContent?: string;
    emailMessageId?: string;
    status?: string;
  }) {
    const id = randomUUID();

    const result = await pool.query(
      `INSERT INTO email_channel_messages
       (id, conversation_id, workspace_id, direction, subject, content, html_content, email_message_id, status)
       VALUES ($1, $2, $3::uuid, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        id,
        input.conversationId,
        input.workspaceId,
        input.direction,
        input.subject || null,
        input.content || null,
        input.htmlContent || null,
        input.emailMessageId || null,
        input.status || 'queued',
      ]
    );

    return result.rows[0];
  }

  async bumpConversation(conversationId: string) {
    await pool.query(
      `UPDATE email_channel_conversations
       SET message_count = message_count + 1,
           last_message_at = NOW()
       WHERE id = $1`,
      [conversationId]
    );
  }

  async getRecentMessages(conversationId: string, limit = 10) {
    const result = await pool.query(
      `SELECT *
       FROM email_channel_messages
       WHERE conversation_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [conversationId, limit]
    );

    return result.rows.reverse();
  }
}

export const emailModuleService = new EmailModuleService();