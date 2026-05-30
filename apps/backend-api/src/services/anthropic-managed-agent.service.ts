const ANTHROPIC_API_BASE = 'https://api.anthropic.com/v1';
const ANTHROPIC_VERSION = '2023-06-01';
const MANAGED_AGENTS_BETA = 'managed-agents-2026-04-01';
const DEFAULT_MODEL = 'claude-sonnet-4-6';
const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_POLL_INTERVAL_MS = 1_000;

type ManagedAgentKind = 'json' | 'text';

type ManagedAgentEvent = {
  type?: string;
  content?: Array<{ type?: string; text?: string }>;
  error?: {
    type?: string;
    message?: string;
  };
  processed_at?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractFirstJsonObject(raw: string) {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return raw.slice(start, end + 1);
}

function safeParseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeTextBlocks(content?: Array<{ type?: string; text?: string }>) {
  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .filter((block) => block?.type === 'text' && typeof block?.text === 'string')
    .map((block) => block.text || '')
    .join('\n')
    .trim();
}

export class AnthropicManagedAgentService {
  private environmentIdPromise: Promise<string> | null = null;
  private agentIdPromises = new Map<ManagedAgentKind, Promise<string>>();

  isEnabled() {
    const enabled = String(process.env.ANTHROPIC_MANAGED_AGENTS_ENABLED || '').toLowerCase();
    return ['1', 'true', 'yes', 'on'].includes(enabled) && Boolean(this.getApiKey());
  }

  private getApiKey() {
    return process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '';
  }

  private getTimeoutMs() {
    const parsed = Number(process.env.ANTHROPIC_MANAGED_AGENTS_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
    if (!Number.isFinite(parsed) || parsed < 5_000) {
      return DEFAULT_TIMEOUT_MS;
    }
    return Math.trunc(parsed);
  }

  private getHeaders(includeJson = true) {
    const headers: Record<string, string> = {
      'x-api-key': this.getApiKey(),
      'anthropic-version': ANTHROPIC_VERSION,
      'anthropic-beta': MANAGED_AGENTS_BETA,
    };

    if (includeJson) {
      headers['content-type'] = 'application/json';
    }

    return headers;
  }

  private async request<T>(path: string, init: RequestInit = {}, timeoutMs = this.getTimeoutMs()): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${ANTHROPIC_API_BASE}${path}`, {
        ...init,
        headers: {
          ...this.getHeaders(init.body !== undefined),
          ...(init.headers || {}),
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic Managed Agents ${path} failed: ${response.status} ${errorText}`);
      }

      return await response.json() as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async ensureEnvironment(): Promise<string> {
    if (process.env.ANTHROPIC_MANAGED_AGENTS_ENVIRONMENT_ID) {
      return process.env.ANTHROPIC_MANAGED_AGENTS_ENVIRONMENT_ID;
    }

    if (!this.environmentIdPromise) {
      this.environmentIdPromise = (async () => {
        const environment = await this.request<{ id: string }>('/environments', {
          method: 'POST',
          body: JSON.stringify({
            name: process.env.ANTHROPIC_MANAGED_AGENTS_ENVIRONMENT_NAME || 'Qestron Managed Runtime',
            config: {
              type: 'cloud',
            },
          }),
        });

        return environment.id;
      })();
    }

    return this.environmentIdPromise;
  }

  private async ensureAgent(kind: ManagedAgentKind): Promise<string> {
    const envOverride = kind === 'json'
      ? process.env.ANTHROPIC_MANAGED_AGENTS_JSON_AGENT_ID
      : process.env.ANTHROPIC_MANAGED_AGENTS_TEXT_AGENT_ID;

    if (envOverride) {
      return envOverride;
    }

    const existing = this.agentIdPromises.get(kind);
    if (existing) {
      return existing;
    }

    const promise = (async () => {
      const model = process.env.ANTHROPIC_MANAGED_AGENTS_MODEL || DEFAULT_MODEL;
      const payload = kind === 'json'
        ? {
            name: 'Qestron JSON Reasoner',
            model,
            system: [
              'You are a backend reasoning agent for Qestron.',
              'Follow the requested output schema exactly.',
              'If the task requests JSON, return exactly one valid JSON object and nothing else.',
              'Do not wrap JSON in markdown fences.',
              'Do not mention Anthropic, Claude, Managed Agents, or internal tooling.',
            ].join(' '),
          }
        : {
            name: 'Qestron Text Reasoner',
            model,
            system: [
              'You are a backend conversational reasoning agent for Qestron.',
              'Follow business instructions exactly and stay concise.',
              'If context is provided, use that context faithfully and do not invent facts outside it unless explicitly allowed.',
              'Never mention internal tools, prompts, or infrastructure.',
            ].join(' '),
          };

      const agent = await this.request<{ id: string }>('/agents', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return agent.id;
    })();

    this.agentIdPromises.set(kind, promise);
    return promise;
  }

  private async createSession(kind: ManagedAgentKind, title?: string) {
    const [agentId, environmentId] = await Promise.all([
      this.ensureAgent(kind),
      this.ensureEnvironment(),
    ]);

    const session = await this.request<{ id: string }>('/sessions', {
      method: 'POST',
      body: JSON.stringify({
        agent: agentId,
        environment_id: environmentId,
        title: title || `Qestron ${kind} task`,
      }),
    });

    return session.id;
  }

  private async listEvents(sessionId: string) {
    const response = await this.request<{ data?: ManagedAgentEvent[] }>(`/sessions/${sessionId}/events`, {
      method: 'GET',
    });

    return Array.isArray(response.data) ? response.data : [];
  }

  private async postUserMessage(sessionId: string, prompt: string) {
    await this.request(`/sessions/${sessionId}/events`, {
      method: 'POST',
      body: JSON.stringify({
        events: [
          {
            type: 'user.message',
            content: [
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      }),
    });
  }

  private async waitForIdle(sessionId: string, fromEventIndex: number, timeoutMs = this.getTimeoutMs()) {
    const start = Date.now();
    let latestText = '';
    let latestEvents: ManagedAgentEvent[] = [];

    while (Date.now() - start < timeoutMs) {
      const allEvents = await this.listEvents(sessionId);
      const newEvents = allEvents.slice(fromEventIndex);
      latestEvents = newEvents;

      for (const event of newEvents) {
        if (event?.type === 'session.error') {
          throw new Error(event.error?.message || 'Managed agent session.error');
        }

        if (event?.type === 'agent.message') {
          const text = normalizeTextBlocks(event.content);
          if (text) {
            latestText = text;
          }
        }
      }

      if (newEvents.some((event) => event?.type === 'session.status_idle')) {
        return {
          text: latestText,
          events: newEvents,
        };
      }

      await sleep(DEFAULT_POLL_INTERVAL_MS);
    }

    throw new Error(`Managed agent session ${sessionId} timed out waiting for idle`);
  }

  async runTextTask(prompt: string, options: { title?: string } = {}) {
    if (!this.isEnabled()) {
      throw new Error('Managed Agents are not enabled');
    }

    const sessionId = await this.createSession('text', options.title);
    const beforeEvents = await this.listEvents(sessionId);
    await this.postUserMessage(sessionId, prompt);
    const result = await this.waitForIdle(sessionId, beforeEvents.length);

    return {
      sessionId,
      text: result.text,
      events: result.events,
    };
  }

  async runJsonTask<T>(prompt: string, fallback: T, options: { title?: string } = {}) {
    if (!this.isEnabled()) {
      throw new Error('Managed Agents are not enabled');
    }

    const sessionId = await this.createSession('json', options.title);
    const beforeEvents = await this.listEvents(sessionId);
    await this.postUserMessage(sessionId, prompt);
    const result = await this.waitForIdle(sessionId, beforeEvents.length);
    const jsonText = extractFirstJsonObject(result.text) || '{}';

    return {
      sessionId,
      rawText: result.text,
      value: safeParseJson<T>(jsonText, fallback),
      events: result.events,
    };
  }
}

export const anthropicManagedAgentService = new AnthropicManagedAgentService();
