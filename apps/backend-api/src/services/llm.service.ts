import { anthropicManagedAgentService } from './anthropic-managed-agent.service.js';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const PRIMARY_MODEL = 'qwen/qwen3.6-plus:free';
const FALLBACK_MODEL = 'qwen/qwen3-235b-a22b';
const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface Tool {
  name: string;
  description: string;
  input_schema: Record<string, any>;
}

export interface LLMToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

export interface LLMResponse {
  content: string | null;
  tool_calls: LLMToolCall[] | null;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

function normalizeContent(content: unknown): string | null {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    const text = content
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        if (item && typeof item === 'object' && 'text' in item) {
          return String((item as { text?: unknown }).text || '');
        }

        return '';
      })
      .join('');

    return text || null;
  }

  return null;
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

async function callOpenRouter(
  model: string,
  systemPrompt: string,
  messages: Message[],
  tools?: Tool[],
  maxTokens: number = 4096
): Promise<LLMResponse> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is missing');
  }

  const body: Record<string, any> = {
    model,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
  };

  if (tools && tools.length > 0) {
    body.tools = tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.input_schema,
      },
    }));
    body.tool_choice = 'auto';
  }

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.BACKEND_URL || 'http://localhost:3001',
      'X-Title': 'Questron',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter ${model} failed: ${response.status} - ${errorText}`);
  }

  const data: any = await response.json();
  const choice = data?.choices?.[0];

  if (!choice) {
    throw new Error('No response choice from model');
  }

  return {
    content: normalizeContent(choice.message?.content),
    tool_calls: choice.message?.tool_calls || null,
    usage: {
      prompt_tokens: data?.usage?.prompt_tokens || 0,
      completion_tokens: data?.usage?.completion_tokens || 0,
      total_tokens: data?.usage?.total_tokens || 0,
    },
  };
}

export async function generateResponse(
  systemPrompt: string,
  messages: Message[],
  tools?: Tool[],
  maxTokens?: number
): Promise<LLMResponse> {
  try {
    return await callOpenRouter(
      PRIMARY_MODEL,
      systemPrompt,
      messages,
      tools,
      maxTokens
    );
  } catch (error: any) {
    console.error(`Primary model ${PRIMARY_MODEL} failed:`, error.message);

    try {
      console.log(`Falling back to ${FALLBACK_MODEL}`);
      return await callOpenRouter(
        FALLBACK_MODEL,
        systemPrompt,
        messages,
        tools,
        maxTokens
      );
    } catch (fallbackError: any) {
      console.error(`Fallback model ${FALLBACK_MODEL} also failed:`, fallbackError.message);
      throw fallbackError;
    }
  }
}

export async function chatResponse(
  systemPrompt: string,
  messages: Message[]
): Promise<string> {
  const result = await generateResponse(systemPrompt, messages, undefined, 2048);
  return result.content || "I'm sorry, I couldn't process that. Could you try again?";
}

export async function agenticResponse(
  systemPrompt: string,
  messages: Message[],
  tools: Tool[]
): Promise<LLMResponse> {
  return await generateResponse(systemPrompt, messages, tools, 4096);
}

export async function classifyLead(
  description: string,
  serviceType: string
): Promise<{
  urgency: string;
  category: string;
  score: number;
  reasoning: string;
}> {
  if (anthropicManagedAgentService.isEnabled()) {
    try {
      const managed = await anthropicManagedAgentService.runJsonTask(
        `Analyze the lead and return only JSON.
Schema:
{
  "urgency": "low|medium|high|emergency",
  "category": "string",
  "score": 0-100,
  "reasoning": "string"
}
Rules:
- Emergency: not working, broken, no heat, no AC, extreme temps
- High: urgent, ASAP, soon, comfort issues
- Medium: scheduled, non-critical, planning
- Low: general inquiry, questions, future consideration

Input:
${JSON.stringify({ serviceType, description }, null, 2)}`,
        {
          urgency: 'medium',
          category: serviceType,
          score: 50,
          reasoning: 'Could not parse classification',
        },
        {
          title: 'Qestron lead classification',
        }
      );

      return {
        urgency: managed.value.urgency || 'medium',
        category: managed.value.category || serviceType,
        score: Number.isFinite(Number(managed.value.score)) ? Number(managed.value.score) : 50,
        reasoning: managed.value.reasoning || 'Could not parse classification',
      };
    } catch (error: any) {
      console.error('Managed agent lead classification failed:', error?.message || error);
    }
  }

  const result = await generateResponse(
    `You are a lead classifier. Analyze the lead and return ONLY valid JSON.
Schema: {
  "urgency": "low|medium|high|emergency",
  "category": "string",
  "score": 0-100,
  "reasoning": "string"
}
Rules:
- Emergency: not working, broken, no heat, no AC, extreme temps
- High: urgent, ASAP, soon, comfort issues
- Medium: scheduled, non-critical, planning
- Low: general inquiry, questions, future consideration`,
    [
      {
        role: 'user',
        content: `Service Type: ${serviceType}\nDescription: ${description}`,
      },
    ],
    undefined,
    1024
  );

  return parseJson(result.content || '{}', {
    urgency: 'medium',
    category: serviceType,
    score: 50,
    reasoning: 'Could not parse classification',
  });
}

export async function analyzeCustomer(
  customerData: Record<string, any>,
  interactionHistory: string[]
): Promise<{
  sentiment: string;
  risk_score: number;
  next_action: string;
  next_action_date: string;
  notes: string;
}> {
  if (anthropicManagedAgentService.isEnabled()) {
    try {
      const managed = await anthropicManagedAgentService.runJsonTask(
        `Analyze the customer data and interaction history and return only JSON:
{
  "sentiment": "positive|neutral|negative",
  "risk_score": 0-100,
  "next_action": "string describing what to do next",
  "next_action_date": "ISO date string for when to act",
  "notes": "brief analysis notes"
}

Input:
${JSON.stringify({ customerData, interactionHistory }, null, 2)}`,
        {
          sentiment: 'neutral',
          risk_score: 50,
          next_action: 'follow_up',
          next_action_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Could not parse analysis',
        },
        {
          title: 'Qestron customer analysis',
        }
      );

      return {
        sentiment: managed.value.sentiment || 'neutral',
        risk_score: Number.isFinite(Number(managed.value.risk_score)) ? Number(managed.value.risk_score) : 50,
        next_action: managed.value.next_action || 'follow_up',
        next_action_date: managed.value.next_action_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        notes: managed.value.notes || 'Could not parse analysis',
      };
    } catch (error: any) {
      console.error('Managed agent customer analysis failed:', error?.message || error);
    }
  }

  const result = await generateResponse(
    `You are a customer relationship analyst.
Analyze the customer data and interaction history.
Return ONLY valid JSON:
{
  "sentiment": "positive|neutral|negative",
  "risk_score": 0-100,
  "next_action": "string describing what to do next",
  "next_action_date": "ISO date string for when to act",
  "notes": "brief analysis notes"
}`,
    [
      {
        role: 'user',
        content: `Customer Data: ${JSON.stringify(customerData)}\nInteraction History: ${interactionHistory.join('\n')}`,
      },
    ],
    undefined,
    1024
  );

  return parseJson(result.content || '{}', {
    sentiment: 'neutral',
    risk_score: 50,
    next_action: 'follow_up',
    next_action_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Could not parse analysis',
  });
}

export async function generateInsights(
  businessData: Record<string, any>
): Promise<{
  summary: string;
  insights: Array<{ type: string; title: string; detail: string }>;
  recommendations: Array<{ action: string; impact: string; effort: string }>;
}> {
  if (anthropicManagedAgentService.isEnabled()) {
    try {
      const managed = await anthropicManagedAgentService.runJsonTask(
        `Analyze the weekly business data and return only JSON.
Schema:
{
  "summary": "brief week summary",
  "insights": [{"type":"opportunity|warning|success","title":"string","detail":"string"}],
  "recommendations": [{"action":"string","impact":"string","effort":"low|medium|high"}]
}

Input:
${JSON.stringify(businessData, null, 2)}`,
        {
          summary: 'Analysis unavailable',
          insights: [],
          recommendations: [],
        },
        {
          title: 'Qestron business insights',
        }
      );

      return {
        summary: managed.value.summary || 'Analysis unavailable',
        insights: Array.isArray(managed.value.insights) ? managed.value.insights : [],
        recommendations: Array.isArray(managed.value.recommendations) ? managed.value.recommendations : [],
      };
    } catch (error: any) {
      console.error('Managed agent business insights failed:', error?.message || error);
    }
  }

  const result = await generateResponse(
    `You are a business intelligence analyst.
Analyze the weekly business data and generate insights.
Return ONLY valid JSON:
{
  "summary": "brief week summary",
  "insights": [{"type":"opportunity|warning|success","title":"string","detail":"string"}],
  "recommendations": [{"action":"string","impact":"string","effort":"low|medium|high"}]
}`,
    [
      {
        role: 'user',
        content: JSON.stringify(businessData),
      },
    ],
    undefined,
    2048
  );

  return parseJson(result.content || '{}', {
    summary: 'Analysis unavailable',
    insights: [],
    recommendations: [],
  });
}

export async function translateText(
  text: string,
  targetLanguage: string
): Promise<string> {
  const result = await generateResponse(
    'You are a professional translator. Translate the message to the target language. Return ONLY the translation, nothing else.',
    [
      {
        role: 'user',
        content: `Translate to ${targetLanguage}:\n\n${text}`,
      },
    ],
    undefined,
    1024
  );

  return result.content || text;
}

export function toAnthropicFormat(response: LLMResponse) {
  const toolContent = (response.tool_calls || []).map((toolCall) => ({
    type: 'tool_use',
    id: toolCall.id,
    name: toolCall.function.name,
    input: parseJson(toolCall.function.arguments || '{}', {}),
  }));

  return {
    id: `qwen-${Date.now()}`,
    type: 'message',
    role: 'assistant',
    content: toolContent.length > 0
      ? toolContent
      : [
          {
            type: 'text',
            text: response.content || '',
          },
        ],
    usage: {
      input_tokens: response.usage.prompt_tokens,
      output_tokens: response.usage.completion_tokens,
    },
  };
}

export interface StructuredIntentOutput {
  intent: string;
  entities: Record<string, any>;
}

function extractFirstJsonObject(raw: string) {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return raw.slice(start, end + 1);
}

export async function getStructuredIntentOutput(input: {
  workspaceId: string;
  message: string;
  context?: Record<string, any>;
}) : Promise<StructuredIntentOutput> {
  if (anthropicManagedAgentService.isEnabled()) {
    try {
      const managed = await anthropicManagedAgentService.runJsonTask<StructuredIntentOutput>(
        `Extract workspace automation intent from the request and return only JSON.
Schema:
{
  "intent": "string",
  "entities": {
    "date": "optional date string",
    "service": "optional service string"
  }
}
Rules:
- Keep intent in snake_case.
- If the request is ambiguous or unsupported, use "unknown" and {}.
- Only include entities you can infer from the message or context.
Input:
${JSON.stringify({
  workspace_id: input.workspaceId,
  message: input.message,
  context: input.context || {},
}, null, 2)}`,
        {
          intent: 'unknown',
          entities: {},
        },
        {
          title: 'Qestron structured intent extraction',
        }
      );

      return {
        intent: managed.value.intent || 'unknown',
        entities: managed.value.entities || {},
      };
    } catch (error: any) {
      console.error('Managed agent structured intent extraction failed:', error?.message || error);
    }
  }

  const result = await generateResponse(
    `You are an intent extraction engine for workspace automation.
Return ONLY valid JSON in this schema:
{
  "intent": "string",
  "entities": {
    "date": "optional date string",
    "service": "optional service string"
  }
}
Rules:
- No markdown
- No explanation
- Keep intent in snake_case
- If unknown, use intent = "unknown" and entities = {}`,
    [
      {
        role: 'user',
        content: JSON.stringify({
          workspace_id: input.workspaceId,
          message: input.message,
          context: input.context || {},
        }),
      },
    ],
    undefined,
    1024
  );

  const content = result.content || '{}';
  const jsonText = extractFirstJsonObject(content) || '{}';
  const parsed = parseJson<StructuredIntentOutput>(jsonText, {
    intent: 'unknown',
    entities: {},
  });

  return {
    intent: parsed.intent || 'unknown',
    entities: parsed.entities || {},
  };
}
