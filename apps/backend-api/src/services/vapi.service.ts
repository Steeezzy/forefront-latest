import { env } from '../config/env.js';
import { pool } from '../config/db.js';

const DEFAULT_SERVER_MESSAGES = [
  'assistant.started',
  'status-update',
  'transcript',
  'conversation-update',
  'tool-calls',
  'end-of-call-report',
  'hang',
];

function parseJsonObject(value: any): Record<string, any> {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  if (typeof value === 'object') return value;
  return {};
}

function clampName(value: string, fallback: string) {
  const normalized = String(value || fallback).trim() || fallback;
  return normalized.slice(0, 40);
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.trunc(parsed);
}

function withOptionalCredential(url: string) {
  return {
    url,
    ...(env.VAPI_SERVER_CREDENTIAL_ID ? { credentialId: env.VAPI_SERVER_CREDENTIAL_ID } : {}),
  };
}

function buildQestronTools(toolsUrl: string) {
  const server = withOptionalCredential(toolsUrl);

  return [
    {
      type: 'function',
      function: {
        name: 'check_appointment_availability',
        description: 'Check whether a requested appointment slot is available in Qestron.',
        parameters: {
          type: 'object',
          properties: {
            workspace_id: { type: 'string' },
            date: { type: 'string', description: 'Requested appointment date/time as ISO 8601.' },
            service: { type: 'string' },
            service_id: { type: 'string' },
          },
          required: ['date'],
        },
      },
      server,
    },
    {
      type: 'function',
      function: {
        name: 'create_appointment',
        description: 'Create a Qestron appointment after confirming the user wants the slot.',
        parameters: {
          type: 'object',
          properties: {
            workspace_id: { type: 'string' },
            customer_name: { type: 'string' },
            customer_phone: { type: 'string' },
            customer_email: { type: 'string' },
            service: { type: 'string' },
            service_id: { type: 'string' },
            date: { type: 'string', description: 'Appointment date/time as ISO 8601.' },
            notes: { type: 'string' },
          },
          required: ['date'],
        },
      },
      server,
    },
    {
      type: 'function',
      function: {
        name: 'lookup_customer',
        description: 'Look up a customer profile in Qestron using a phone number.',
        parameters: {
          type: 'object',
          properties: {
            workspace_id: { type: 'string' },
            phone: { type: 'string' },
          },
          required: ['phone'],
        },
      },
      server,
    },
    {
      type: 'function',
      function: {
        name: 'create_support_ticket',
        description: 'Create a support ticket in Qestron when the caller needs staff follow-up.',
        parameters: {
          type: 'object',
          properties: {
            workspace_id: { type: 'string' },
            subject: { type: 'string' },
            description: { type: 'string' },
            priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'] },
            requester_name: { type: 'string' },
            requester_email: { type: 'string' },
          },
          required: ['subject'],
        },
      },
      server,
    },
    {
      type: 'function',
      function: {
        name: 'log_interaction',
        description: 'Log a call interaction or important call note into Qestron CRM.',
        parameters: {
          type: 'object',
          properties: {
            workspace_id: { type: 'string' },
            customer_id: { type: 'string' },
            message: { type: 'string' },
            response: { type: 'string' },
            intent: { type: 'string' },
          },
          required: ['message'],
        },
      },
      server,
    },
  ];
}

export class VapiService {
  isConfigured() {
    return Boolean(env.VAPI_MASTER_KEY);
  }

  getWebhookSecret() {
    return env.VAPI_WEBHOOK_SECRET || '';
  }

  private getWebhookUrl() {
    return `${env.BACKEND_URL.replace(/\/$/, '')}/api/webhooks/vapi`;
  }

  private getToolsUrl() {
    return `${env.BACKEND_URL.replace(/\/$/, '')}/api/vapi/tools`;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    if (!env.VAPI_MASTER_KEY) {
      throw new Error('VAPI_MASTER_KEY is not configured');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    try {
      const response = await fetch(`${env.VAPI_API_BASE_URL.replace(/\/$/, '')}${path}`, {
        ...init,
        headers: {
          'Authorization': `Bearer ${env.VAPI_MASTER_KEY}`,
          'Content-Type': 'application/json',
          ...(init.headers || {}),
        },
        signal: controller.signal,
      });

      const text = await response.text();
      const payload = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(`VAPI ${init.method || 'GET'} ${path} failed: ${response.status} ${text}`);
      }

      return payload as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  buildAssistantPayload(agent: any) {
    const vapiConfig = parseJsonObject(agent.vapi_config);
    const modelConfig = parseJsonObject(vapiConfig.model);
    const transcriberConfig = parseJsonObject(vapiConfig.transcriber);
    const voiceConfig = parseJsonObject(vapiConfig.voice);

    const model = {
      provider: modelConfig.provider || env.VAPI_DEFAULT_MODEL_PROVIDER,
      model: modelConfig.model || env.VAPI_DEFAULT_MODEL_NAME,
      messages: [
        {
          role: 'system',
          content: agent.system_prompt || 'You are Qestron, a concise and helpful business voice assistant.',
        },
      ],
      tools: buildQestronTools(this.getToolsUrl()),
      ...modelConfig.overrides,
    };

    const transcriber = {
      provider: transcriberConfig.provider || env.VAPI_DEFAULT_TRANSCRIBER_PROVIDER,
      language: transcriberConfig.language || agent.language || env.VAPI_DEFAULT_TRANSCRIBER_LANGUAGE,
      ...transcriberConfig.overrides,
    };

    const payload: Record<string, any> = {
      name: clampName(agent.name, `Qestron ${agent.id}`),
      firstMessage: agent.first_message || 'Hello, how can I help you today?',
      model,
      transcriber,
      server: withOptionalCredential(this.getWebhookUrl()),
      serverMessages: vapiConfig.serverMessages || DEFAULT_SERVER_MESSAGES,
      maxDurationSeconds: parsePositiveInt(vapiConfig.maxDurationSeconds, parsePositiveInt(env.VAPI_DEFAULT_MAX_DURATION_SECONDS, 600)),
      metadata: {
        workspaceId: agent.workspace_id,
        voiceAgentId: agent.id,
        source: 'qestron',
        templateId: agent.template_id || null,
      },
    };

    const configuredVoiceId = voiceConfig.voiceId || env.VAPI_DEFAULT_VOICE_ID;
    if (configuredVoiceId || voiceConfig.provider) {
      payload.voice = {
        provider: voiceConfig.provider || env.VAPI_DEFAULT_VOICE_PROVIDER,
        ...(configuredVoiceId ? { voiceId: configuredVoiceId } : {}),
        ...voiceConfig.overrides,
      };
    }

    return payload;
  }

  async syncAssistantForVoiceAgent(voiceAgentId: string) {
    if (!this.isConfigured()) {
      return { skipped: true, reason: 'VAPI_MASTER_KEY is not configured' };
    }

    const result = await pool.query(
      `SELECT va.*, w.name AS workspace_name
       FROM voice_agents va
       LEFT JOIN workspaces w ON w.id = va.workspace_id
       WHERE va.id = $1
       LIMIT 1`,
      [voiceAgentId]
    );

    const agent = result.rows[0];
    if (!agent) {
      throw new Error('Voice agent not found');
    }

    const payload = this.buildAssistantPayload(agent);
    const response = agent.vapi_assistant_id
      ? await this.request<any>(`/assistant/${agent.vapi_assistant_id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      : await this.request<any>('/assistant', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

    await pool.query(
      `UPDATE voice_agents
       SET vapi_assistant_id = $2,
           vapi_sync_status = 'synced',
           vapi_sync_error = NULL,
           vapi_last_synced_at = NOW()
       WHERE id = $1`,
      [voiceAgentId, response.id || agent.vapi_assistant_id]
    );

    return {
      skipped: false,
      assistantId: response.id || agent.vapi_assistant_id,
      payload,
      response,
    };
  }

  async markVoiceAgentSyncFailed(voiceAgentId: string, error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    await pool.query(
      `UPDATE voice_agents
       SET vapi_sync_status = 'failed',
           vapi_sync_error = $2,
           vapi_last_synced_at = NOW()
       WHERE id = $1`,
      [voiceAgentId, message.slice(0, 2000)]
    ).catch((dbError) => {
      console.error('[VAPI] Failed to mark voice agent sync failure:', dbError.message);
    });
  }

  syncAssistantForVoiceAgentInBackground(voiceAgentId: string) {
    if (!this.isConfigured()) {
      return;
    }

    this.syncAssistantForVoiceAgent(voiceAgentId)
      .catch(async (error) => {
        console.error('[VAPI] Assistant sync failed:', error.message);
        await this.markVoiceAgentSyncFailed(voiceAgentId, error);
      });
  }
}

export const vapiService = new VapiService();
