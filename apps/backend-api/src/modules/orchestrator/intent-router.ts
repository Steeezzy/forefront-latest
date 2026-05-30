import { pool } from '../../config/db.js';
import { stripThinkingTags } from '../../utils/strip-thinking.js';
import { anthropicManagedAgentService } from '../../services/anthropic-managed-agent.service.js';

/**
 * IntentRouter Agent
 * 
 * Classifies customer messages into intents using Sarvam-M.
 * Returns: intent, confidence, and recommended specialist agent.
 * 
 * Intents: billing | support | booking | sales | complaint | faq | smalltalk | escalate
 */

export interface IntentResult {
    intent: string;
    confidence: number;
    recommendedAgent: string;
    reasoning: string;
}

const INTENT_TO_AGENT: Record<string, string> = {
    'billing': 'crm',
    'support': 'knowledge',
    'booking': 'booking',
    'sales': 'sales',
    'complaint': 'escalation',
    'faq': 'knowledge',
    'smalltalk': 'knowledge',
    'escalate': 'escalation',
    'order_status': 'crm',
    'cancellation': 'crm',
    'feedback': 'analytics'
};

const CLASSIFICATION_PROMPT = `You are an intent classifier for a business AI phone system.

Classify the customer message into ONE of these intents:
- billing: payment, invoice, subscription, charges, refund
- support: technical issue, bug, not working, help with product
- booking: appointment, schedule, book, reserve, availability
- sales: pricing, demo, buy, upgrade, new product, interested
- complaint: angry, frustrated, terrible, worst, escalate, manager
- faq: general question, how does, what is, information
- smalltalk: greeting, bye, thanks, how are you
- order_status: where is my order, tracking, delivery
- cancellation: cancel, stop, discontinue, end subscription
- escalate: talk to human, real person, supervisor, manager

Respond ONLY with valid JSON:
{"intent": "...", "confidence": 0.0-1.0, "reasoning": "one line explanation"}`;

export class IntentRouter {
    private sarvamApiKey: string;
    private sarvamBaseUrl: string;

    constructor() {
        this.sarvamApiKey = process.env.SARVAM_API_KEY || '';
        this.sarvamBaseUrl = 'https://api.sarvam.ai/v1';
    }

    private extractJsonObject(raw: string): string {
        if (!raw) return '{}';

        // Some models prepend reasoning in <think> blocks or markdown fences.
        const withoutThink = stripThinkingTags(raw);
        const withoutFences = withoutThink
            .replace(/^```(?:json)?\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();

        const firstBrace = withoutFences.indexOf('{');
        const lastBrace = withoutFences.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace > firstBrace) {
            return withoutFences.slice(firstBrace, lastBrace + 1);
        }

        return withoutFences || '{}';
    }

    private safeParseClassification(content: string): { intent?: string; confidence?: number; reasoning?: string } | null {
        try {
            return JSON.parse(this.extractJsonObject(content));
        } catch {
            return null;
        }
    }

    async classify(message: string, conversationHistory: any[] = []): Promise<IntentResult> {
        if (anthropicManagedAgentService.isEnabled()) {
            try {
                const managed = await anthropicManagedAgentService.runJsonTask<{
                    intent?: string;
                    confidence?: number;
                    reasoning?: string;
                }>(
                    `Classify the customer message into one intent and return only JSON.
Allowed intents:
- billing
- support
- booking
- sales
- complaint
- faq
- smalltalk
- order_status
- cancellation
- escalate

Schema:
{
  "intent": "one of the allowed intents",
  "confidence": 0.0,
  "reasoning": "one short line"
}

Conversation history:
${JSON.stringify(conversationHistory.slice(-4), null, 2)}

Current message:
${JSON.stringify(message)}`,
                    {
                        intent: 'faq',
                        confidence: 0.3,
                        reasoning: 'Defaulted to FAQ.',
                    },
                    {
                        title: 'Qestron intent classification',
                    }
                );

                const intent = managed.value.intent || 'faq';
                const confidence = Math.min(1, Math.max(0, Number(managed.value.confidence ?? 0.5)));

                return {
                    intent,
                    confidence,
                    recommendedAgent: INTENT_TO_AGENT[intent] || 'knowledge',
                    reasoning: managed.value.reasoning || 'Managed agent classification',
                };
            } catch (error: any) {
                console.error('Managed agent intent classification failed:', error?.message || error);
            }
        }

        try {
            // Build messages for Sarvam-M
            const messages = [
                { role: 'system', content: CLASSIFICATION_PROMPT },
                ...conversationHistory.slice(-4).map((m: any) => ({
                    role: m.role || 'user',
                    content: m.content || m.text || ''
                })),
                { role: 'user', content: `Classify this message: "${message}"` }
            ];

            if (!this.sarvamApiKey) {
                // Fallback: keyword-based classification
                return this.keywordClassify(message);
            }

            const response = await fetch(`${this.sarvamBaseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.sarvamApiKey}`
                },
                body: JSON.stringify({
                    model: 'sarvam-m',
                    messages,
                    temperature: 0.1,
                    max_tokens: 200,
                    response_format: { type: 'json_object' }
                })
            });

            if (!response.ok) {
                console.warn('Sarvam intent classification failed, falling back to keywords');
                return this.keywordClassify(message);
            }

            const data: any = await response.json();
            const content = data.choices?.[0]?.message?.content || '{}';
            const parsed = this.safeParseClassification(content);
            if (!parsed) {
                return this.keywordClassify(message);
            }

            const intent = parsed.intent || 'faq';
            const confidence = Math.min(1, Math.max(0, parsed.confidence || 0.5));

            return {
                intent,
                confidence,
                recommendedAgent: INTENT_TO_AGENT[intent] || 'knowledge',
                reasoning: parsed.reasoning || 'AI classification'
            };
        } catch (error: any) {
            console.error('Intent classification error:', error.message);
            return this.keywordClassify(message);
        }
    }

    /**
     * Fallback keyword-based classifier (no API needed)
     */
    private keywordClassify(message: string): IntentResult {
        const lower = message.toLowerCase();

        const patterns: Array<{ keywords: string[]; intent: string; agent: string }> = [
            { keywords: ['pay', 'bill', 'invoice', 'charge', 'refund', 'subscription', 'pricing'], intent: 'billing', agent: 'crm' },
            { keywords: ['book', 'appointment', 'schedule', 'reserve', 'slot', 'available', 'calendar'], intent: 'booking', agent: 'booking' },
            { keywords: ['buy', 'purchase', 'demo', 'upgrade', 'plan', 'offer', 'deal', 'interested'], intent: 'sales', agent: 'sales' },
            { keywords: ['angry', 'frustrated', 'terrible', 'worst', 'unacceptable', 'ridiculous'], intent: 'complaint', agent: 'escalation' },
            { keywords: ['human', 'agent', 'person', 'manager', 'supervisor', 'escalate', 'transfer'], intent: 'escalate', agent: 'escalation' },
            { keywords: ['order', 'tracking', 'delivery', 'shipped', 'where is', 'status'], intent: 'order_status', agent: 'crm' },
            { keywords: ['cancel', 'stop', 'discontinue', 'end', 'unsubscribe'], intent: 'cancellation', agent: 'crm' },
            { keywords: ['not working', 'bug', 'error', 'broken', 'issue', 'problem', 'fix'], intent: 'support', agent: 'knowledge' },
            { keywords: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'thanks', 'bye'], intent: 'smalltalk', agent: 'knowledge' },
        ];

        for (const pattern of patterns) {
            const matchCount = pattern.keywords.filter(k => lower.includes(k)).length;
            if (matchCount > 0) {
                return {
                    intent: pattern.intent,
                    confidence: Math.min(0.9, 0.5 + matchCount * 0.15),
                    recommendedAgent: pattern.agent,
                    reasoning: `Keyword match: ${pattern.keywords.filter(k => lower.includes(k)).join(', ')}`
                };
            }
        }

        return {
            intent: 'faq',
            confidence: 0.3,
            recommendedAgent: 'knowledge',
            reasoning: 'No clear intent detected, defaulting to FAQ/knowledge'
        };
    }

    /**
     * Log the routing decision for audit trail
     */
    async logRouting(sessionId: string, fromAgent: string, toAgent: string, reason: string, confidence: number): Promise<void> {
        try {
            await pool.query(
                `INSERT INTO agent_routing_log (session_id, from_agent, to_agent, reason, confidence)
                 VALUES ($1, $2, $3, $4, $5)`,
                [sessionId, fromAgent, toAgent, reason, confidence]
            );
        } catch (error: any) {
            console.error('Failed to log routing:', error.message);
        }
    }
}
