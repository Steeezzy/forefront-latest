import { generateResponse } from './llm.service.js';
import { anthropicManagedAgentService } from './anthropic-managed-agent.service.js';

export interface StructuredAgentResult {
  replyText: string;
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  actions: string[];
  shouldEndCall: boolean;
  tags: string[];
  summary: string;
  disposition: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  rawContent: string;
  parseError?: string | null;
}

const FALLBACK_RESULT: StructuredAgentResult = {
  replyText: '',
  intent: 'unknown',
  confidence: 0,
  entities: {},
  actions: [],
  shouldEndCall: false,
  tags: [],
  summary: 'Structured analysis unavailable.',
  disposition: 'unknown',
  sentiment: 'neutral',
  rawContent: '',
  parseError: null,
};

function extractJsonBlock(content: string) {
  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  return content.slice(firstBrace, lastBrace + 1);
}

function normalizeResult(parsed: Record<string, any>, rawContent: string, fallbackReplyText = ''): StructuredAgentResult {
  const sentiment = ['positive', 'neutral', 'negative'].includes(parsed.sentiment)
    ? parsed.sentiment
    : 'neutral';

  return {
    replyText: typeof parsed.replyText === 'string' ? parsed.replyText : fallbackReplyText,
    intent: typeof parsed.intent === 'string' && parsed.intent.trim() ? parsed.intent.trim() : 'unknown',
    confidence: Number.isFinite(parsed.confidence) ? Number(parsed.confidence) : 0,
    entities: parsed.entities && typeof parsed.entities === 'object' ? parsed.entities : {},
    actions: Array.isArray(parsed.actions) ? parsed.actions.map(String) : [],
    shouldEndCall: Boolean(parsed.shouldEndCall),
    tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
    summary: typeof parsed.summary === 'string' && parsed.summary.trim()
      ? parsed.summary.trim()
      : 'Structured analysis unavailable.',
    disposition: typeof parsed.disposition === 'string' && parsed.disposition.trim()
      ? parsed.disposition.trim()
      : 'unknown',
    sentiment,
    rawContent,
    parseError: null,
  };
}

export async function analyzeStructuredCallResult(input: {
  workspaceName?: string | null;
  agentName?: string | null;
  transcript: string;
  fallbackReplyText?: string;
}) {
  if (anthropicManagedAgentService.isEnabled()) {
    try {
      const managed = await anthropicManagedAgentService.runJsonTask<Record<string, any>>(
        `Analyze the outbound business call transcript and return only JSON.
Schema:
{
  "replyText": "string",
  "intent": "string",
  "confidence": 0.0,
  "entities": {},
  "actions": ["string"],
  "shouldEndCall": false,
  "tags": ["string"],
  "summary": "short summary",
  "disposition": "completed|busy|failed|callback_requested|interested|not_interested|voicemail|unknown",
  "sentiment": "positive|neutral|negative"
}
Rules:
- Infer the strongest intent and disposition from the full transcript.
- Use low confidence when the transcript is short or ambiguous.
- Keep actions machine-friendly.
Input:
${JSON.stringify({
  workspaceName: input.workspaceName || null,
  agentName: input.agentName || null,
  transcript: input.transcript,
}, null, 2)}`,
        {},
        {
          title: 'Qestron structured call analysis',
        }
      );

      return normalizeResult(managed.value, managed.rawText, input.fallbackReplyText || '');
    } catch (error: any) {
      console.error('Managed agent structured call analysis failed:', error?.message || error);
    }
  }

  const systemPrompt = `You are an execution analysis agent for outbound business calls.
Return ONLY valid JSON.
Schema:
{
  "replyText": "string",
  "intent": "string",
  "confidence": 0.0,
  "entities": {},
  "actions": ["string"],
  "shouldEndCall": false,
  "tags": ["string"],
  "summary": "short summary",
  "disposition": "completed|busy|failed|callback_requested|interested|not_interested|voicemail|unknown",
  "sentiment": "positive|neutral|negative"
}
Rules:
- Never return prose outside JSON.
- Infer the strongest intent and disposition from the full transcript.
- Use low confidence when the transcript is short or ambiguous.
- Keep actions machine-friendly, like "schedule_callback" or "send_followup_sms".`;

  const response = await generateResponse(
    systemPrompt,
    [
      {
        role: 'user',
        content: JSON.stringify({
          workspaceName: input.workspaceName || null,
          agentName: input.agentName || null,
          transcript: input.transcript,
        }),
      },
    ],
    undefined,
    1200
  );

  const rawContent = response.content || '';
  const jsonBlock = extractJsonBlock(rawContent);

  if (!jsonBlock) {
    return {
      ...FALLBACK_RESULT,
      replyText: input.fallbackReplyText || '',
      rawContent,
      parseError: 'No JSON object found in model output.',
    };
  }

  try {
    const parsed = JSON.parse(jsonBlock);
    return normalizeResult(parsed, rawContent, input.fallbackReplyText || '');
  } catch (error: any) {
    return {
      ...FALLBACK_RESULT,
      replyText: input.fallbackReplyText || '',
      rawContent,
      parseError: error.message,
    };
  }
}
