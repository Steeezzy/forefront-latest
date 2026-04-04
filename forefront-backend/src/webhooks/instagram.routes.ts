import type { FastifyInstance, FastifyRequest } from 'fastify';
import { pool } from '../config/db.js';
import { claudeService } from '../services/claude.service.js';
import { instagramService } from '../services/instagram.service.js';
import { instagramModuleService } from '../modules/instagram/instagram.service.js';
import { WorkflowEngine } from '../services/workflow/WorkflowEngine.js';

const workflowEngine = new WorkflowEngine();

async function buildWorkspaceConfig(workspaceId: string) {
  const workspaceRes = await pool.query(
    `SELECT * FROM workspaces WHERE id = $1::uuid LIMIT 1`,
    [workspaceId]
  );

  const workspace = workspaceRes.rows[0] || {};

  let knowledgeEntries: Array<{ question: string; answer: string }> = [];
  try {
    const kbRes = await pool.query(
      `SELECT ks.type, ks.content
       FROM knowledge_sources ks
       JOIN agents a ON a.id = ks.agent_id
       WHERE a.workspace_id = $1::uuid
       ORDER BY ks.created_at DESC
       LIMIT 5`,
      [workspaceId]
    );

    knowledgeEntries = kbRes.rows.map((row: any, index: number) => ({
      question: `Knowledge ${index + 1} (${row.type || 'entry'})`,
      answer: String(row.content || '').slice(0, 800),
    }));
  } catch {
    knowledgeEntries = [];
  }

  return {
    ...workspace,
    knowledge_entries: knowledgeEntries,
  };
}

async function processIncomingInstagram(payload: any, log: any) {
  const entries = Array.isArray(payload?.entry) ? payload.entry : [];

  for (const entry of entries) {
    const messagingEvents = Array.isArray(entry?.messaging) ? entry.messaging : [];

    for (const event of messagingEvents) {
      if (!event?.message || event?.message?.is_echo) {
        continue;
      }

      const pageId = event?.recipient?.id || entry?.id;
      if (!pageId) {
        continue;
      }

      const config = await instagramModuleService.getConfigByPageId(pageId);
      if (!config) {
        log.warn(`[InstagramWebhook] No config found for page_id=${pageId}`);
        continue;
      }

      const workspaceId = config.workspace_id as string;
      const parsed = instagramService.parseIncomingMessage({ entry: [{ messaging: [event] }] });

      if (!parsed.senderId || !parsed.messageId) {
        continue;
      }

      const conversation = await instagramModuleService.findOrCreateConversation(
        workspaceId,
        config.id,
        parsed.senderId,
        parsed.senderUsername || null
      );

      await instagramModuleService.saveMessage({
        workspaceId,
        conversationId: conversation.id,
        direction: 'inbound',
        content: parsed.messageText || undefined,
        instagramMessageId: parsed.messageId,
        status: 'received',
      });

      await instagramModuleService.bumpConversation(conversation.id);

      const activeWorkflowRes = await pool.query(
        `SELECT id, trigger_event
         FROM workflows
         WHERE workspace_id = $1::uuid AND is_active = true
         ORDER BY updated_at DESC
         LIMIT 1`,
        [workspaceId]
      );

      const activeWorkflow = activeWorkflowRes.rows[0];
      if (activeWorkflow) {
        const triggerEvent = activeWorkflow.trigger_event || 'new_conversation';
        const allowedEvents = new Set([
          'new_conversation',
          'conversation_idle',
          'agent_reply',
          'ticket_reply',
          'visitor_says',
          'instagram_message',
          'custom',
        ]);

        if (allowedEvents.has(triggerEvent)) {
          const normalizedTrigger = triggerEvent === 'custom' ? 'new_conversation' : triggerEvent;
          await workflowEngine.processEvent(workspaceId, normalizedTrigger, conversation.id, {
            workspace_id: workspaceId,
            channel: 'instagram',
            sender_id: parsed.senderId,
            message_text: parsed.messageText,
          });
        }
      }

      const historyRows = await instagramModuleService.getRecentMessages(conversation.id, 10);
      const conversationHistory = historyRows.map((row: any) => ({
        role: row.direction === 'inbound' ? 'user' : 'assistant',
        content: row.content || '',
      }));

      const workspaceConfig = await buildWorkspaceConfig(workspaceId);
      const userText = parsed.messageText || '[Non-text message received]';

      const aiReply = await claudeService.generateResponse(
        workspaceId,
        userText,
        conversationHistory,
        workspaceConfig
      );

      const sent = await instagramService.sendDM(
        config.access_token,
        parsed.senderId,
        aiReply
      );

      await instagramModuleService.saveMessage({
        workspaceId,
        conversationId: conversation.id,
        direction: 'outbound',
        content: aiReply,
        instagramMessageId: sent.messageId,
        status: 'sent',
      });

      await instagramModuleService.bumpConversation(conversation.id);
    }
  }
}

export async function instagramWebhookRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const query = request.query as {
      'hub.mode'?: string;
      'hub.verify_token'?: string;
      'hub.challenge'?: string;
    };

    const mode = query['hub.mode'] || '';
    const token = query['hub.verify_token'] || '';
    const challenge = query['hub.challenge'] || '';

    if (!mode || !token || !challenge) {
      return reply.code(400).send({ error: 'Missing verification query params' });
    }

    const configRes = await pool.query(
      `SELECT verify_token
       FROM instagram_configs
       WHERE verify_token = $1
       LIMIT 1`,
      [token]
    );

    if (!configRes.rows[0]) {
      return reply.code(403).send({ error: 'Verification failed' });
    }

    if (mode !== 'subscribe' || token !== configRes.rows[0].verify_token) {
      return reply.code(403).send({ error: 'Verification failed' });
    }

    await pool.query(
      `UPDATE instagram_configs
       SET webhook_verified = true, updated_at = NOW()
       WHERE verify_token = $1`,
      [token]
    );

    return reply.code(200).send(challenge);
  });

  app.post('/', async (request: FastifyRequest, reply) => {
    reply.code(200).send({ received: true });

    const payload = request.body;
    setImmediate(() => {
      processIncomingInstagram(payload, request.log).catch((error) => {
        request.log.error(`[InstagramWebhook] Processing error: ${error.message}`);
      });
    });
  });
}
