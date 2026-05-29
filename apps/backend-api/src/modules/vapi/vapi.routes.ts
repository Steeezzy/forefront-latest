import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pool } from '../../config/db.js';
import { vapiService } from '../../services/vapi.service.js';
import { createAppointment, isSlotAvailable } from '../../services/booking.service.js';
import { createCustomer, getCustomerByPhone, logInteraction } from '../../services/crm.service.js';
import { TicketService } from '../tickets/ticket.service.js';

const ticketService = new TicketService();
const UUID_REGEX = /^[0-9a-f-]{36}$/i;

function asObject(value: any): Record<string, any> {
  return value && typeof value === 'object' ? value : {};
}

function headerValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function extractBearer(value?: string) {
  if (!value) return '';
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : value.trim();
}

function verifyVapiRequest(request: FastifyRequest, reply: FastifyReply) {
  const expected = vapiService.getWebhookSecret();
  if (!expected) {
    return true;
  }

  const auth = extractBearer(headerValue(request.headers.authorization));
  const legacySecret = headerValue(request.headers['x-vapi-secret'] as any) || '';

  if (auth === expected || legacySecret === expected) {
    return true;
  }

  reply.code(401).send({ success: false, error: 'Invalid VAPI webhook secret' });
  return false;
}

function messageFromBody(body: any) {
  return asObject(body?.message || body);
}

function getCallId(message: Record<string, any>) {
  return message.call?.id || message.callId || message.call?.callId || null;
}

function getCustomerPhone(message: Record<string, any>, args: Record<string, any> = {}) {
  return (
    args.customer_phone ||
    args.phone ||
    message.customer?.number ||
    message.customer?.phone ||
    message.call?.customer?.number ||
    message.call?.customer?.phone ||
    message.call?.customer?.phoneNumber ||
    message.call?.phoneNumber?.customer?.number ||
    null
  );
}

function getPhoneNumber(message: Record<string, any>) {
  return (
    message.phoneNumber?.number ||
    message.call?.phoneNumber?.number ||
    message.call?.phoneNumberNumber ||
    message.call?.phoneNumber?.numberE164 ||
    null
  );
}

function getMetadata(message: Record<string, any>) {
  return {
    ...asObject(message.assistant?.metadata),
    ...asObject(message.call?.assistant?.metadata),
    ...asObject(message.call?.metadata),
    ...asObject(message.metadata),
  };
}

async function resolveContext(message: Record<string, any>, args: Record<string, any> = {}) {
  const metadata = getMetadata(message);
  const requestedWorkspaceId = args.workspace_id || args.workspaceId || metadata.workspaceId || metadata.workspace_id;
  const requestedVoiceAgentId = args.voice_agent_id || args.voiceAgentId || metadata.voiceAgentId || metadata.voice_agent_id;

  if (requestedWorkspaceId && UUID_REGEX.test(String(requestedWorkspaceId))) {
    return {
      workspaceId: String(requestedWorkspaceId),
      voiceAgentId: requestedVoiceAgentId && UUID_REGEX.test(String(requestedVoiceAgentId))
        ? String(requestedVoiceAgentId)
        : null,
      phoneNumberId: null,
    };
  }

  const assistantId = message.call?.assistantId || message.assistantId || message.assistant?.id;
  if (assistantId) {
    const agent = await pool.query(
      `SELECT id, workspace_id
       FROM voice_agents
       WHERE vapi_assistant_id = $1
       LIMIT 1`,
      [assistantId]
    );
    if (agent.rows[0]) {
      return {
        workspaceId: agent.rows[0].workspace_id,
        voiceAgentId: agent.rows[0].id,
        phoneNumberId: null,
      };
    }
  }

  const phoneNumberId = message.call?.phoneNumberId || message.phoneNumberId || message.phoneNumber?.id;
  const phoneNumber = getPhoneNumber(message);
  if (phoneNumberId || phoneNumber) {
    const params: any[] = [];
    const conditions: string[] = [];

    if (phoneNumberId) {
      params.push(phoneNumberId);
      conditions.push(`vapi_phone_number_id = $${params.length}`);
    }
    if (phoneNumber) {
      params.push(phoneNumber);
      conditions.push(`number = $${params.length}`);
    }

    const numberResult = await pool.query(
      `SELECT id, workspace_id, assigned_agent_id
       FROM phone_numbers
       WHERE ${conditions.join(' OR ')}
       LIMIT 1`,
      params
    );

    if (numberResult.rows[0]) {
      return {
        workspaceId: numberResult.rows[0].workspace_id,
        voiceAgentId: numberResult.rows[0].assigned_agent_id,
        phoneNumberId: numberResult.rows[0].id,
      };
    }
  }

  return { workspaceId: null, voiceAgentId: null, phoneNumberId: null };
}

async function logWebhookEvent(body: any, message: Record<string, any>) {
  const context = await resolveContext(message);
  const eventId = message.id || body?.id || null;
  const callId = getCallId(message);
  const type = String(message.type || 'unknown');

  const result = await pool.query(
    `INSERT INTO vapi_webhook_events (
       vapi_event_id,
       vapi_call_id,
       workspace_id,
       voice_agent_id,
       message_type,
       payload
     ) VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (vapi_event_id)
     WHERE vapi_event_id IS NOT NULL
     DO UPDATE SET
       payload = EXCLUDED.payload,
       received_at = NOW()
     RETURNING id`,
    [
      eventId,
      callId,
      context.workspaceId,
      context.voiceAgentId,
      type,
      JSON.stringify(body || {}),
    ]
  );

  return result.rows[0]?.id || null;
}

async function markWebhookEvent(id: string | null, status: string, error?: unknown) {
  if (!id) return;

  const message = error instanceof Error ? error.message : error ? String(error) : null;
  await pool.query(
    `UPDATE vapi_webhook_events
     SET processing_status = $2,
         processing_error = $3,
         processed_at = NOW()
     WHERE id = $1`,
    [id, status, message ? message.slice(0, 2000) : null]
  ).catch((dbError) => {
    console.error('[VAPI] Failed to mark webhook event:', dbError.message);
  });
}

async function resolveServiceDuration(workspaceId: string, args: Record<string, any>) {
  if (args.service_id && UUID_REGEX.test(String(args.service_id))) {
    const result = await pool.query(
      `SELECT duration
       FROM services
       WHERE workspace_id = $1 AND id = $2 AND COALESCE(is_active, true) = true
       LIMIT 1`,
      [workspaceId, args.service_id]
    );
    return result.rows[0]?.duration || null;
  }

  if (args.service) {
    const result = await pool.query(
      `SELECT duration
       FROM services
       WHERE workspace_id = $1
         AND COALESCE(is_active, true) = true
         AND lower(name) = lower($2)
       LIMIT 1`,
      [workspaceId, args.service]
    );
    return result.rows[0]?.duration || null;
  }

  return null;
}

async function ensureCustomer(workspaceId: string, message: Record<string, any>, args: Record<string, any>) {
  const phone = getCustomerPhone(message, args);
  if (!phone) {
    return null;
  }

  const existing = await getCustomerByPhone(String(phone), workspaceId);
  if (existing) {
    return existing;
  }

  try {
    return await createCustomer({
      workspace_id: workspaceId,
      phone: String(phone),
      name: args.customer_name || args.name || null,
      email: args.customer_email || args.email || null,
      tags: ['vapi'],
      lifecycle_stage: 'lead',
    });
  } catch {
    return await getCustomerByPhone(String(phone), workspaceId);
  }
}

async function handleSingleToolCall(name: string, args: Record<string, any>, message: Record<string, any>) {
  const context = await resolveContext(message, args);
  if (!context.workspaceId) {
    throw new Error('Unable to resolve workspace for VAPI tool call');
  }

  switch (name) {
    case 'check_appointment_availability': {
      if (!args.date) {
        throw new Error('date is required');
      }
      const duration = await resolveServiceDuration(context.workspaceId, args);
      const available = await isSlotAvailable(context.workspaceId, args.date, duration);
      return {
        available,
        workspace_id: context.workspaceId,
        requested_date: args.date,
        service: args.service || null,
        service_id: args.service_id || null,
      };
    }

    case 'create_appointment': {
      if (!args.date) {
        throw new Error('date is required');
      }
      const customer = await ensureCustomer(context.workspaceId, message, args);
      const appointment = await createAppointment({
        workspace_id: context.workspaceId,
        customer_id: customer?.id || null,
        service_id: args.service_id || null,
        service: args.service || 'General Appointment',
        date: args.date,
        notes: args.notes || 'Created by VAPI voice agent',
        status: 'scheduled',
      });
      return { appointment, customer };
    }

    case 'lookup_customer': {
      const phone = args.phone || getCustomerPhone(message, args);
      if (!phone) {
        throw new Error('phone is required');
      }
      const [customer, memoryProfile] = await Promise.all([
        getCustomerByPhone(String(phone), context.workspaceId),
        pool.query(
          `SELECT *
           FROM customer_profiles
           WHERE workspace_id = $1 AND phone = $2
           ORDER BY updated_at DESC
           LIMIT 1`,
          [context.workspaceId, String(phone)]
        ).then((result) => result.rows[0] || null).catch(() => null),
      ]);
      return { customer, memory_profile: memoryProfile };
    }

    case 'create_support_ticket': {
      const ticket = await ticketService.createTicket({
        workspace_id: context.workspaceId,
        subject: String(args.subject || 'Voice call follow-up'),
        description: args.description || 'Created from VAPI voice call.',
        priority: args.priority || 'normal',
        source: 'api',
        requester_name: args.requester_name || args.customer_name || undefined,
        requester_email: args.requester_email || args.customer_email || undefined,
        tags: ['vapi', 'voice'],
        custom_fields: {
          source: 'vapi',
          call_id: getCallId(message),
        },
      });
      return { ticket };
    }

    case 'log_interaction': {
      const customer = args.customer_id
        ? { id: args.customer_id }
        : await ensureCustomer(context.workspaceId, message, args);
      const interaction = await logInteraction({
        workspace_id: context.workspaceId,
        customer_id: customer?.id || null,
        channel: 'voice',
        message: args.message || '',
        response: args.response || '',
        intent: args.intent || 'vapi_tool_call',
        metadata: {
          source: 'vapi',
          call_id: getCallId(message),
        },
      });
      return { interaction };
    }

    default:
      throw new Error(`Unsupported VAPI tool: ${name}`);
  }
}

function extractToolCalls(message: Record<string, any>) {
  const calls = Array.isArray(message.toolCallList)
    ? message.toolCallList
    : Array.isArray(message.toolWithToolCallList)
      ? message.toolWithToolCallList.map((item: any) => ({
          id: item.toolCall?.id,
          name: item.name || item.toolCall?.name,
          parameters: item.toolCall?.parameters || item.toolCall?.arguments || {},
        }))
      : [];

  return calls.map((call: any) => ({
    id: call.id || call.toolCallId || call.toolCall?.id,
    name: call.name || call.function?.name || call.toolCall?.name,
    parameters: call.parameters || call.arguments || call.function?.arguments || call.toolCall?.parameters || {},
  }));
}

async function handleToolCalls(body: any) {
  const message = messageFromBody(body);
  const toolCalls = extractToolCalls(message);

  const results = [];
  for (const call of toolCalls) {
    try {
      const parameters = typeof call.parameters === 'string'
        ? JSON.parse(call.parameters)
        : asObject(call.parameters);
      const result = await handleSingleToolCall(String(call.name || ''), parameters, message);
      results.push({
        name: call.name,
        toolCallId: call.id,
        result: JSON.stringify({ success: true, data: result }),
      });
    } catch (error: any) {
      results.push({
        name: call.name,
        toolCallId: call.id,
        result: JSON.stringify({ success: false, error: error.message }),
      });
    }
  }

  return { results };
}

async function handleAssistantRequest(message: Record<string, any>) {
  const context = await resolveContext(message);
  if (!context.voiceAgentId) {
    return { error: 'This phone number is not assigned to a Qestron voice agent.' };
  }

  const result = await pool.query(
    `SELECT vapi_assistant_id
     FROM voice_agents
     WHERE id = $1
       AND workspace_id = $2
     LIMIT 1`,
    [context.voiceAgentId, context.workspaceId]
  );

  const assistantId = result.rows[0]?.vapi_assistant_id;
  if (!assistantId) {
    return { error: 'Qestron voice agent is not synced to VAPI yet.' };
  }

  return { assistantId };
}

function getEventDate(value: any) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function getDurationSeconds(message: Record<string, any>) {
  const call = asObject(message.call);
  const candidates = [
    message.durationSeconds,
    message.duration,
    call.durationSeconds,
    call.duration,
    call.endedAt && call.startedAt
      ? Math.round((new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000)
      : null,
  ];

  for (const candidate of candidates) {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.trunc(parsed);
    }
  }

  return 0;
}

async function upsertCallLog(message: Record<string, any>) {
  const callId = getCallId(message);
  if (!callId) {
    return;
  }

  const context = await resolveContext(message);
  const call = asObject(message.call);
  const artifact = asObject(message.artifact);
  const recording = asObject(artifact.recording);
  const durationSeconds = getDurationSeconds(message);
  const durationMinutes = durationSeconds > 0 ? Math.ceil(durationSeconds / 60) : 0;
  const customerPhone = getCustomerPhone(message);

  const existing = await pool.query(
    `SELECT duration_minutes FROM vapi_call_logs WHERE vapi_call_id = $1 LIMIT 1`,
    [callId]
  );
  const previousMinutes = Number(existing.rows[0]?.duration_minutes || 0);

  await pool.query(
    `INSERT INTO vapi_call_logs (
       vapi_call_id,
       workspace_id,
       voice_agent_id,
       phone_number_id,
       customer_phone,
       direction,
       status,
       ended_reason,
       started_at,
       ended_at,
       duration_seconds,
       duration_minutes,
       transcript,
       summary,
       recording_url,
       analysis,
       raw_payload
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
     ON CONFLICT (vapi_call_id)
     DO UPDATE SET
       workspace_id = COALESCE(EXCLUDED.workspace_id, vapi_call_logs.workspace_id),
       voice_agent_id = COALESCE(EXCLUDED.voice_agent_id, vapi_call_logs.voice_agent_id),
       phone_number_id = COALESCE(EXCLUDED.phone_number_id, vapi_call_logs.phone_number_id),
       customer_phone = COALESCE(EXCLUDED.customer_phone, vapi_call_logs.customer_phone),
       direction = COALESCE(EXCLUDED.direction, vapi_call_logs.direction),
       status = COALESCE(EXCLUDED.status, vapi_call_logs.status),
       ended_reason = COALESCE(EXCLUDED.ended_reason, vapi_call_logs.ended_reason),
       started_at = COALESCE(EXCLUDED.started_at, vapi_call_logs.started_at),
       ended_at = COALESCE(EXCLUDED.ended_at, vapi_call_logs.ended_at),
       duration_seconds = GREATEST(vapi_call_logs.duration_seconds, EXCLUDED.duration_seconds),
       duration_minutes = GREATEST(vapi_call_logs.duration_minutes, EXCLUDED.duration_minutes),
       transcript = COALESCE(EXCLUDED.transcript, vapi_call_logs.transcript),
       summary = COALESCE(EXCLUDED.summary, vapi_call_logs.summary),
       recording_url = COALESCE(EXCLUDED.recording_url, vapi_call_logs.recording_url),
       analysis = COALESCE(EXCLUDED.analysis, vapi_call_logs.analysis),
       raw_payload = EXCLUDED.raw_payload,
       updated_at = NOW()`,
    [
      callId,
      context.workspaceId,
      context.voiceAgentId,
      context.phoneNumberId,
      customerPhone,
      call.direction || message.direction || null,
      message.status || call.status || null,
      message.endedReason || call.endedReason || null,
      getEventDate(call.startedAt || message.startedAt),
      getEventDate(call.endedAt || message.endedAt),
      durationSeconds,
      durationMinutes,
      artifact.transcript || message.transcript || null,
      message.summary || call.summary || null,
      recording.url || artifact.recordingUrl || message.recordingUrl || null,
      JSON.stringify(message.analysis || call.analysis || {}),
      JSON.stringify(message),
    ]
  );

  const deltaMinutes = Math.max(0, durationMinutes - previousMinutes);
  if (context.workspaceId && deltaMinutes > 0) {
    const endedAt = getEventDate(call.endedAt || message.endedAt) || new Date().toISOString();
    await pool.query(
      `INSERT INTO workspace_voice_usage (
         workspace_id,
         month_start,
         voice_minutes_used,
         call_count
       ) VALUES ($1, date_trunc('month', $2::timestamptz)::date, $3, 1)
       ON CONFLICT (workspace_id, month_start)
       DO UPDATE SET
         voice_minutes_used = workspace_voice_usage.voice_minutes_used + EXCLUDED.voice_minutes_used,
         call_count = workspace_voice_usage.call_count + 1,
         updated_at = NOW()`,
      [context.workspaceId, endedAt, deltaMinutes]
    );
  }

  if (context.workspaceId && message.type === 'end-of-call-report') {
    await logMemoryInteraction(context.workspaceId, customerPhone, message).catch((error) => {
      console.error('[VAPI] Failed to log memory interaction:', error.message);
    });
  }
}

async function logMemoryInteraction(workspaceId: string, customerPhone: string | null, message: Record<string, any>) {
  const artifact = asObject(message.artifact);
  const transcript = artifact.transcript || message.transcript || '';
  let profileId: string | null = null;

  if (customerPhone) {
    const existing = await pool.query(
      `SELECT id FROM customer_profiles
       WHERE workspace_id = $1 AND phone = $2
       ORDER BY updated_at DESC
       LIMIT 1`,
      [workspaceId, customerPhone]
    );

    if (existing.rows[0]) {
      profileId = existing.rows[0].id;
      await pool.query(
        `UPDATE customer_profiles
         SET total_interactions = COALESCE(total_interactions, 0) + 1,
             last_interaction = NOW(),
             updated_at = NOW()
         WHERE id = $1`,
        [profileId]
      );
    } else {
      const created = await pool.query(
        `INSERT INTO customer_profiles (
           workspace_id,
           phone,
           total_interactions,
           last_interaction,
           tags
         ) VALUES ($1, $2, 1, NOW(), $3)
         RETURNING id`,
        [workspaceId, customerPhone, JSON.stringify(['vapi'])]
      );
      profileId = created.rows[0]?.id || null;
    }
  }

  await pool.query(
    `INSERT INTO interaction_logs (
       customer_profile_id,
       workspace_id,
       channel,
       summary,
       sentiment,
       outcome,
       raw_transcript,
       ai_analysis,
       processed_by_ai
     ) VALUES ($1,$2,'voice',$3,$4,$5,$6,$7,false)`,
    [
      profileId,
      workspaceId,
      message.summary || null,
      message.analysis?.sentiment || null,
      message.endedReason || null,
      transcript || null,
      JSON.stringify({
        source: 'vapi',
        call_id: getCallId(message),
        analysis: message.analysis || {},
      }),
    ]
  );
}

export async function vapiRoutes(app: FastifyInstance) {
  app.get('/api/vapi/health', async () => ({
    success: true,
    data: {
      configured: vapiService.isConfigured(),
      webhook_secret_configured: Boolean(vapiService.getWebhookSecret()),
    },
  }));

  app.post('/api/vapi/voice-agents/:id/sync', async (request: any, reply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await vapiService.syncAssistantForVoiceAgent(id);
      return reply.send({ success: true, data: result });
    } catch (error: any) {
      await vapiService.markVoiceAgentSyncFailed((request.params as any).id, error);
      return reply.code(400).send({ success: false, error: error.message });
    }
  });

  app.post('/api/vapi/tools', async (request, reply) => {
    if (!verifyVapiRequest(request, reply)) return;

    try {
      const response = await handleToolCalls(request.body);
      return reply.send(response);
    } catch (error: any) {
      return reply.code(400).send({ success: false, error: error.message });
    }
  });

  app.post('/api/webhooks/vapi', async (request, reply) => {
    if (!verifyVapiRequest(request, reply)) return;

    const body = request.body as any;
    const message = messageFromBody(body);
    const eventId = await logWebhookEvent(body, message);

    try {
      if (message.type === 'tool-calls') {
        const response = await handleToolCalls(body);
        await markWebhookEvent(eventId, 'processed');
        return reply.send(response);
      }

      if (message.type === 'assistant-request') {
        const response = await handleAssistantRequest(message);
        await markWebhookEvent(eventId, response.error ? 'failed' : 'processed', response.error);
        return reply.send(response);
      }

      await upsertCallLog(message);
      await markWebhookEvent(eventId, 'processed');
      return reply.send({ success: true, received: true });
    } catch (error: any) {
      await markWebhookEvent(eventId, 'failed', error);
      return reply.code(500).send({ success: false, error: error.message });
    }
  });
}
