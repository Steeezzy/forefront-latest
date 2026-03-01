/**
 * Channel Routes — Settings per channel + Email connection management.
 *
 * Endpoints:
 *   GET    /api/channels/settings                       → All channel settings
 *   GET    /api/channels/:channel/settings              → Single channel settings
 *   PUT    /api/channels/:channel/settings              → Update channel settings
 *
 *   GET    /api/channels/email/connections               → List email connections
 *   POST   /api/channels/email/connect-gmail             → Start Gmail OAuth
 *   GET    /api/channels/email/oauth/callback            → Gmail OAuth callback
 *   POST   /api/channels/email/connect-smtp              → Connect SMTP/IMAP
 *   DELETE /api/channels/email/connections/:id            → Disconnect email
 *
 *   POST   /api/channels/conversations/:id/takeover      → Agent takes over
 *   POST   /api/channels/conversations/:id/release       → Release to AI
 *
 *   GET    /api/channels/auto-reply/logs                  → Auto-reply analytics
 */

import { FastifyInstance } from 'fastify';
import { channelSettingsService, type ChannelType } from '../../services/channels/ChannelSettingsService.js';
import { emailChannelService } from '../../services/channels/EmailChannelService.js';
import { pool } from '../../config/db.js';
import { authenticate } from '../auth/auth.middleware.js';

const VALID_CHANNELS: ChannelType[] = ['whatsapp', 'instagram', 'messenger', 'email', 'web'];

export async function channelRoutes(fastify: FastifyInstance) {

  // ─── Public: Gmail OAuth callback (no auth — redirect from Google) ──

  fastify.get('/email/oauth/callback', async (req, reply) => {
    const { code, state } = req.query as { code: string; state: string };
    if (!code || !state) return reply.code(400).send({ error: 'Missing code or state' });

    try {
      const connection = await emailChannelService.handleGmailCallback(code, state);
      // Start polling for this new connection
      emailChannelService.startPollingForConnection(connection);
      // Redirect to frontend settings page
      return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings/channels?email_connected=true`);
    } catch (e: any) {
      return reply.code(500).send({ error: e.message });
    }
  });


  // ─── Protected Routes ──────────────────────────────────────────────

  fastify.register(async function protectedApi(api) {
    api.addHook('preHandler', authenticate);

    // ──── Channel Settings ─────────────────────────────────────────

    // Get all channel settings
    api.get('/settings', async (req, reply) => {
      const workspaceId = (req as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'No workspace' });

      const settings = await channelSettingsService.getAll(workspaceId);
      return reply.send({ data: settings });
    });

    // Get single channel settings
    api.get('/:channel/settings', async (req, reply) => {
      const workspaceId = (req as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'No workspace' });

      const { channel } = req.params as { channel: string };
      if (!VALID_CHANNELS.includes(channel as ChannelType)) {
        return reply.code(400).send({ error: `Invalid channel: ${channel}` });
      }

      const settings = await channelSettingsService.get(workspaceId, channel as ChannelType);
      return reply.send({ data: settings });
    });

    // Update channel settings
    api.put('/:channel/settings', async (req, reply) => {
      const workspaceId = (req as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'No workspace' });

      const { channel } = req.params as { channel: string };
      if (!VALID_CHANNELS.includes(channel as ChannelType)) {
        return reply.code(400).send({ error: `Invalid channel: ${channel}` });
      }

      const data = req.body as Record<string, any>;
      const updated = await channelSettingsService.update(workspaceId, channel as ChannelType, data);
      return reply.send({ data: updated });
    });


    // ──── Email Connections ────────────────────────────────────────

    // List email connections
    api.get('/email/connections', async (req, reply) => {
      const workspaceId = (req as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'No workspace' });

      const conns = await emailChannelService.getConnections(workspaceId);
      return reply.send({ data: conns });
    });

    // Start Gmail OAuth flow
    api.post('/email/connect-gmail', async (req, reply) => {
      const workspaceId = (req as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'No workspace' });

      const url = emailChannelService.getGmailAuthUrl(workspaceId);
      return reply.send({ url });
    });

    // Connect SMTP/IMAP
    api.post('/email/connect-smtp', async (req, reply) => {
      const workspaceId = (req as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'No workspace' });

      const body = req.body as {
        emailAddress: string; imapHost: string; imapPort: number;
        smtpHost: string; smtpPort: number; username: string;
        password: string; useSsl: boolean;
      };

      if (!body.emailAddress || !body.imapHost || !body.smtpHost) {
        return reply.code(400).send({ error: 'Missing required fields' });
      }

      try {
        const conn = await emailChannelService.connectSmtpImap({ workspaceId, ...body });
        return reply.send({ data: conn });
      } catch (e: any) {
        return reply.code(500).send({ error: e.message });
      }
    });

    // Disconnect email
    api.delete('/email/connections/:id', async (req, reply) => {
      const workspaceId = (req as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'No workspace' });

      const { id } = req.params as { id: string };
      await emailChannelService.disconnect(id, workspaceId);
      return reply.send({ success: true });
    });


    // ──── Agent Takeover ───────────────────────────────────────────

    // Agent takes over a conversation (pauses auto-reply)
    api.post('/conversations/:id/takeover', async (req, reply) => {
      const workspaceId = (req as any).user?.workspaceId;
      const userId = (req as any).user?.userId || (req as any).user?.id;
      if (!workspaceId) return reply.code(401).send({ error: 'No workspace' });

      const { id } = req.params as { id: string };

      await pool.query(
        `UPDATE conversations SET
          agent_takeover = true, agent_takeover_at = NOW(),
          agent_takeover_by = $1, auto_reply_paused = true,
          status = 'open', updated_at = NOW()
         WHERE id = $2 AND workspace_id = $3`,
        [userId, id, workspaceId]
      );

      // Add system message
      await pool.query(
        `INSERT INTO messages (conversation_id, sender_type, content, message_type)
         VALUES ($1, 'system', 'An agent has taken over this conversation. Auto-reply is paused.', 'text')`,
        [id]
      );

      return reply.send({ success: true });
    });

    // Release conversation back to AI auto-reply
    api.post('/conversations/:id/release', async (req, reply) => {
      const workspaceId = (req as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'No workspace' });

      const { id } = req.params as { id: string };

      await pool.query(
        `UPDATE conversations SET
          agent_takeover = false, auto_reply_paused = false,
          updated_at = NOW()
         WHERE id = $1 AND workspace_id = $2`,
        [id, workspaceId]
      );

      await pool.query(
        `INSERT INTO messages (conversation_id, sender_type, content, message_type)
         VALUES ($1, 'system', 'Auto-reply has been re-enabled for this conversation.', 'text')`,
        [id]
      );

      return reply.send({ success: true });
    });


    // ──── Auto-Reply Logs (Analytics) ──────────────────────────────

    api.get('/auto-reply/logs', async (req, reply) => {
      const workspaceId = (req as any).user?.workspaceId;
      if (!workspaceId) return reply.code(401).send({ error: 'No workspace' });

      const { channel, limit = '50', offset = '0', escalated } = req.query as {
        channel?: string; limit?: string; offset?: string; escalated?: string;
      };

      let sql = `SELECT * FROM auto_reply_logs WHERE workspace_id = $1`;
      const params: any[] = [workspaceId];
      let idx = 2;

      if (channel) {
        sql += ` AND channel = $${idx++}`;
        params.push(channel);
      }

      if (escalated === 'true') {
        sql += ` AND was_escalated = true`;
      }

      sql += ` ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
      params.push(parseInt(limit), parseInt(offset));

      const result = await pool.query(sql, params);

      // Get totals
      const countResult = await pool.query(
        `SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE was_escalated = true) as escalated,
          AVG(confidence) FILTER (WHERE confidence IS NOT NULL) as avg_confidence,
          AVG(reply_delay_ms) as avg_delay_ms
         FROM auto_reply_logs WHERE workspace_id = $1`,
        [workspaceId]
      );

      return reply.send({
        data: result.rows,
        stats: countResult.rows[0],
      });
    });

  });
}
