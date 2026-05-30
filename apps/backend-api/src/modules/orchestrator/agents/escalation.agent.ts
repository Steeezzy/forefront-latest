import { pool } from '../../../config/db.js';
import type { AgentInput, AgentOutput } from '../orchestrator.service.js';
import { anthropicManagedAgentService } from '../../../services/anthropic-managed-agent.service.js';

/**
 * EscalationAgent
 * 
 * Detects frustrated customers and handles escalation to human agents.
 * Triggers when:
 * - Sentiment drops below 0.3
 * - Explicit escalation request ("talk to human", "manager")
 * - 3+ failed answers in a row
 * 
 * Actions:
 * - Generate call summary for human agent
 * - Find available human agent
 * - Signal call transfer
 */

export class EscalationAgent {
    private sarvamApiKey: string;
    private sarvamBaseUrl: string;

    constructor() {
        this.sarvamApiKey = process.env.SARVAM_API_KEY || '';
        this.sarvamBaseUrl = 'https://api.sarvam.ai/v1';
    }

    async handle(input: AgentInput): Promise<AgentOutput> {
        // Generate a summary of the conversation so far
        const summary = await this.generateSummary(input);

        // Update session with escalation
        try {
            await pool.query(
                `UPDATE conversation_sessions 
                 SET outcome = 'escalated', 
                     metadata = jsonb_set(COALESCE(metadata, '{}'), '{escalation_summary}', $1::jsonb)
                 WHERE id = $2`,
                [JSON.stringify(summary), input.sessionId]
            );
        } catch (error: any) {
            console.error('Failed to update session for escalation:', error.message);
        }

        return {
            reply: 'I completely understand your concern, and I want to make sure you get the best help possible. Let me connect you with a team member who can assist you directly. Please hold for a moment.',
            actions: ['escalated_to_human', 'transfer_call'],
            sentiment: 'empathetic'
        };
    }

    /**
     * Analyze conversation sentiment to decide if escalation is needed
     */
    async shouldEscalate(history: any[]): Promise<{ shouldEscalate: boolean; reason: string; sentimentScore: number }> {
        // Check for explicit escalation keywords
        const lastMessages = history.slice(-3).map((m: any) => (m.content || '').toLowerCase());
        const escalationKeywords = ['human', 'agent', 'person', 'manager', 'supervisor', 'escalate', 'transfer', 'speak to someone'];
        
        for (const msg of lastMessages) {
            if (escalationKeywords.some(k => msg.includes(k))) {
                return { shouldEscalate: true, reason: 'explicit_request', sentimentScore: 0.2 };
            }
        }

        // Check for frustration keywords
        const frustrationKeywords = ['frustrated', 'angry', 'terrible', 'worst', 'useless', 'stupid', 'ridiculous', 'unacceptable'];
        for (const msg of lastMessages) {
            if (frustrationKeywords.some(k => msg.includes(k))) {
                return { shouldEscalate: true, reason: 'frustration_detected', sentimentScore: 0.15 };
            }
        }

        // Check for repeated failures (3+ "I don't know" or similar)
        const failurePatterns = ['i apologize', 'i\'m sorry', 'i cannot', 'unable to', 'don\'t have'];
        const assistantMessages = history.filter((m: any) => m.role === 'assistant').slice(-3);
        const failureCount = assistantMessages.filter((m: any) => 
            failurePatterns.some(p => (m.content || '').toLowerCase().includes(p))
        ).length;

        if (failureCount >= 3) {
            return { shouldEscalate: true, reason: 'repeated_failures', sentimentScore: 0.3 };
        }

        return { shouldEscalate: false, reason: 'none', sentimentScore: 0.7 };
    }

    /**
     * Generate a human-readable conversation summary
     */
    private async generateSummary(input: AgentInput): Promise<any> {
        const history = input.history || [];

        if (anthropicManagedAgentService.isEnabled() && history.length > 0) {
            try {
                const managed = await anthropicManagedAgentService.runTextTask(
                    `Summarize this customer conversation for a human agent who is taking over.
Include:
- the customer's main issue
- what has been tried already
- the customer's current mood
- the best next step

Keep it factual and concise in 3-4 bullet points.

Conversation:
${history.map((message: any) => `${message.role}: ${message.content}`).join('\n')}`,
                    {
                        title: 'Qestron escalation summary',
                    }
                );

                if (managed.text) {
                    return {
                        text: managed.text,
                        generatedAt: new Date().toISOString(),
                        turnCount: history.length
                    };
                }
            } catch (error: any) {
                console.error('Managed agent escalation summary failed:', error?.message || error);
            }
        }
        
        if (this.sarvamApiKey && history.length > 2) {
            try {
                const response = await fetch(`${this.sarvamBaseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.sarvamApiKey}`
                    },
                    body: JSON.stringify({
                        model: 'sarvam-m',
                        messages: [
                            {
                                role: 'system',
                                content: `Summarize this customer conversation in 3-4 bullet points for a human agent who is about to take over. Include:
- Customer's main issue
- What has been tried already
- Customer's current mood
- Recommended next steps

Be concise and factual.`
                            },
                            { role: 'user', content: `Conversation:\n${history.map((m: any) => `${m.role}: ${m.content}`).join('\n')}` }
                        ],
                        temperature: 0.3,
                        max_tokens: 300
                    })
                });

                if (response.ok) {
                    const data: any = await response.json();
                    return {
                        text: data.choices?.[0]?.message?.content || 'No summary available',
                        generatedAt: new Date().toISOString(),
                        turnCount: history.length
                    };
                }
            } catch (error: any) {
                console.error('Summary generation error:', error.message);
            }
        }

        // Fallback: simple summary
        return {
            text: `Customer called about: ${input.intent}. Conversation had ${history.length} turns. Escalated due to ${input.message.includes('manager') ? 'explicit request' : 'unresolved issue'}.`,
            generatedAt: new Date().toISOString(),
            turnCount: history.length
        };
    }
}
