import type { FastifyInstance, FastifyRequest } from 'fastify';
import { pool } from '../config/db.js';
import { claudeService } from '../services/claude.service.js';
import { emailService } from '../services/email.service.js';
import { emailModuleService } from '../modules/email/email.service.js';
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

async function processIncomingEmail(payload: any, log: any) {
  const parsed = emailService.parseIncomingMessage(payload || {});
  if (!parsed.fromEmail || !parsed.messageText) {
    return;
  }

  let config = null as any;
  const workspaceIdFromPayload = payload?.workspaceId || payload?.workspace_id;

  if (workspaceIdFromPayload) {
    config = await emailModuleService.getConfigByWorkspace(String(workspaceIdFromPayload));
  }

  if (!config && parsed.toEmail) {
    config = await emailModuleService.getConfigByInboxEmail(parsed.toEmail);
  }

  if (!config || !config.enabled) {
    log.warn(`[EmailWebhook] No active config found for to=${parsed.toEmail}`);
    return;
  }

  const workspaceId = config.workspace_id as string;
  const conversation = await emailModuleService.findOrCreateConversation(
    workspaceId,
    config.id,
    parsed.fromEmail,
    parsed.fromName || null,
    parsed.subject || null,
    parsed.threadId || null
  );

  await emailModuleService.saveMessage({
    workspaceId,
    conversationId: conversation.id,
    direction: 'inbound',
    subject: parsed.subject,
    content: parsed.messageText,
    htmlContent: parsed.htmlBody,
    emailMessageId: parsed.messageId,
    status: 'received',
  });

  await emailModuleService.bumpConversation(conversation.id);

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
      'email_message',
      'custom',
    ]);

    if (allowedEvents.has(triggerEvent)) {
      const normalizedTrigger = triggerEvent === 'custom' ? 'new_conversation' : triggerEvent;
      await workflowEngine.processEvent(workspaceId, normalizedTrigger, conversation.id, {
        workspace_id: workspaceId,
        channel: 'email',
        from_email: parsed.fromEmail,
        subject: parsed.subject,
        message_text: parsed.messageText,
      });
    }
  }

  const historyRows = await emailModuleService.getRecentMessages(conversation.id, 10);
  const conversationHistory = historyRows.map((row: any) => ({
    role: row.direction === 'inbound' ? 'user' : 'assistant',
    content: row.content || '',
  }));

  const workspaceConfig = await buildWorkspaceConfig(workspaceId);
  const userText = parsed.subject
    ? `Subject: ${parsed.subject}\n\n${parsed.messageText}`
    : parsed.messageText;

  const aiReply = await claudeService.generateResponse(
    workspaceId,
    userText,
    conversationHistory,
    workspaceConfig
  );

  const replySubject = parsed.subject?.toLowerCase().startsWith('re:')
    ? parsed.subject
    : `Re: ${parsed.subject || 'Support request'}`;

  const sent = await emailService.sendMessage(
    config,
    parsed.fromEmail,
    replySubject,
    aiReply
  );

  await emailModuleService.saveMessage({
    workspaceId,
    conversationId: conversation.id,
    direction: 'outbound',
    subject: replySubject,
    content: aiReply,
    emailMessageId: sent.messageId,
    status: sent.status,
  });

  await emailModuleService.bumpConversation(conversation.id);
}

export async function emailWebhookRoutes(app: FastifyInstance) {
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
       FROM email_channel_configs
       WHERE verify_token = $1
       LIMIT 1`,
      [token]
    );

    if (!configRes.rows[0]) {
      return reply.code(403).send({ error: 'Verification failed' });
    }

    const verified = emailService.verifyWebhook(
      mode,
      token,
      configRes.rows[0].verify_token,
      challenge
    );

    if (!verified) {
      return reply.code(403).send({ error: 'Verification failed' });
    }

    await pool.query(
      `UPDATE email_channel_configs
       SET webhook_verified = true, updated_at = NOW()
       WHERE verify_token = $1`,
      [token]
    );

    return reply.code(200).send(verified);
  });

  app.post('/', async (request: FastifyRequest, reply) => {
    reply.code(200).send({ received: true });

    const payload = request.body;
    setImmediate(() => {
      processIncomingEmail(payload, request.log).catch((error) => {
        request.log.error(`[EmailWebhook] Processing error: ${error.message}`);
      });
    });
  });
}