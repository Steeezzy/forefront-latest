import type { FastifyInstance, FastifyRequest } from 'fastify';
import { pool } from '../config/db.js';
import { claudeService } from '../services/claude.service.js';
import { whatsappService } from '../services/whatsapp.service.js';
import { whatsappModuleService } from '../modules/whatsapp/whatsapp.service.js';
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

async function processIncomingWhatsAppEvent(payload: any, log: any) {
  const entries = Array.isArray(payload?.entry) ? payload.entry : [];

  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];

    for (const change of changes) {
      const value = change?.value || {};

      // Ignore delivery/read status callbacks.
      if (Array.isArray(value?.statuses) && value.statuses.length > 0) {
        continue;
      }

      const phoneNumberId = value?.metadata?.phone_number_id;
      const messages = Array.isArray(value?.messages) ? value.messages : [];

      if (!phoneNumberId || messages.length === 0) {
        continue;
      }

      const config = await whatsappModuleService.getConfigByPhoneNumberId(phoneNumberId);
      if (!config) {
        log.warn(`[WhatsAppWebhook] No config found for phone_number_id=${phoneNumberId}`);
        continue;
      }

      const workspaceId = config.workspace_id as string;

      for (const message of messages) {
        const parsed = whatsappService.parseIncomingMessage({
          entry: [{ changes: [{ value: { ...value, messages: [message], contacts: value.contacts || [] } }] }],
        });

        if (!parsed.senderPhone || !parsed.messageId) {
          continue;
        }

        const conversation = await whatsappModuleService.findOrCreateConversation(
          workspaceId,
          config.id,
          parsed.senderPhone,
          parsed.senderName || null,
          parsed.senderPhone || null
        );

        await whatsappModuleService.saveMessage({
          workspaceId,
          conversationId: conversation.id,
          direction: 'inbound',
          messageType: parsed.messageType,
          content: parsed.messageText || undefined,
          mediaUrl: parsed.mediaUrl,
          whatsappMessageId: parsed.messageId,
          status: 'received',
        });

        await whatsappModuleService.bumpConversation(conversation.id);

        await whatsappService.markAsRead(config.phone_number_id, config.access_token, parsed.messageId);

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
            'whatsapp_message',
            'custom',
          ]);

          if (allowedEvents.has(triggerEvent)) {
            const normalizedTrigger = triggerEvent === 'custom' ? 'new_conversation' : triggerEvent;
            await workflowEngine.processEvent(workspaceId, normalizedTrigger, conversation.id, {
              workspace_id: workspaceId,
              channel: 'whatsapp',
              sender_phone: parsed.senderPhone,
              message_text: parsed.messageText,
              message_type: parsed.messageType,
            });
          }
        }

        const historyRows = await whatsappModuleService.getRecentMessages(conversation.id, 10);
        const conversationHistory = historyRows.map((row: any) => ({
          role: row.direction === 'inbound' ? 'user' : 'assistant',
          content: row.content || '',
        }));

        const workspaceConfig = await buildWorkspaceConfig(workspaceId);

        let customerInfoText = '';
        try {
          const profileRes = await pool.query(
            `SELECT name, phone, email, preferences
             FROM customer_profiles
             WHERE workspace_id = $1::uuid
               AND (phone = $2 OR phone = $3)
             ORDER BY updated_at DESC
             LIMIT 1`,
            [workspaceId, parsed.senderPhone, `+${parsed.senderPhone}`]
          );

          if (profileRes.rows[0]) {
            const profile = profileRes.rows[0];
            customerInfoText = `Customer profile:\nName: ${profile.name || 'Unknown'}\nPhone: ${profile.phone || parsed.senderPhone}\nEmail: ${profile.email || 'N/A'}\nPreferences: ${JSON.stringify(profile.preferences || {})}`;
          }
        } catch {
          customerInfoText = '';
        }

        const userText = parsed.messageText || '[Non-text message received]';
        const combinedUserInput = customerInfoText ? `${customerInfoText}\n\nIncoming message:\n${userText}` : userText;

        const aiReply = await claudeService.generateResponse(
          workspaceId,
          combinedUserInput,
          conversationHistory,
          workspaceConfig
        );

        const sent = await whatsappService.sendMessage(
          config.phone_number_id,
          config.access_token,
          parsed.senderPhone,
          aiReply
        );

        await whatsappModuleService.saveMessage({
          workspaceId,
          conversationId: conversation.id,
          direction: 'outbound',
          messageType: 'text',
          content: aiReply,
          whatsappMessageId: sent.messageId,
          status: sent.status,
        });

        await whatsappModuleService.bumpConversation(conversation.id);
      }
    }
  }
}

export async function whatsappWebhookRoutes(app: FastifyInstance) {
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
       FROM whatsapp_configs
       WHERE verify_token = $1
       LIMIT 1`,
      [token]
    );

    if (!configRes.rows[0]) {
      return reply.code(403).send({ error: 'Verification failed' });
    }

    const verified = await whatsappService.verifyWebhook(
      mode,
      token,
      configRes.rows[0].verify_token,
      challenge
    );

    if (!verified) {
      return reply.code(403).send({ error: 'Verification failed' });
    }

    await pool.query(
      `UPDATE whatsapp_configs
       SET webhook_verified = true, updated_at = NOW()
       WHERE verify_token = $1`,
      [token]
    );

    return reply.code(200).send(verified);
  });

  app.post('/', async (request: FastifyRequest, reply) => {
    // Return 200 immediately so Meta doesn't retry due to timeout.
    reply.code(200).send({ received: true });

    const payload = request.body;
    setImmediate(() => {
      processIncomingWhatsAppEvent(payload, request.log).catch((error) => {
        request.log.error(`[WhatsAppWebhook] Processing error: ${error.message}`);
      });
    });
  });
}
