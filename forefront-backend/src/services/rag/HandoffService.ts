/**
 * HandoffService — AI-to-human escalation management.
 *
 * Determines when to hand off conversations from Lyro to human agents
 * based on confidence, repeated failures, customer requests, sentiment,
 * and guardrail triggers.
 */

import { pool } from '../../config/db.js';
import { sarvamClient } from '../SarvamClient.js';
import type {
    HandoffEvent,
    HandoffTrigger,
    LyroResponse,
    LyroSession,
} from '../../types/rag.types.js';

// ─── Negative Sentiment Keywords ─────────────────────────────────────
const NEGATIVE_WORDS = new Set([
    'angry', 'frustrated', 'annoyed', 'terrible', 'awful', 'horrible', 'useless',
    'worst', 'hate', 'stupid', 'ridiculous', 'unacceptable', 'pathetic', 'scam',
    'furious', 'disgusting', 'incompetent', 'waste', 'garbage', 'disappointed',
]);

const HANDOFF_PHRASES = [
    'talk to human', 'real person', 'agent please', 'speak to someone',
    'talk to someone', 'human agent', 'real agent', 'live agent',
    'transfer me', 'escalate', 'supervisor', 'manager',
    'connect me to', 'talk to a person', 'want to talk',
];

export class HandoffService {

    /**
     * Evaluate whether a handoff should occur.
     */
    shouldHandoff(
        session: LyroSession,
        latestResponse: LyroResponse
    ): { handoff: boolean; trigger?: HandoffTrigger; reason?: string } {
        // 1. Low confidence
        if (latestResponse.confidence < 0.45) {
            return {
                handoff: true,
                trigger: 'low_confidence',
                reason: `AI confidence ${(latestResponse.confidence * 100).toFixed(0)}% is below threshold`,
            };
        }

        // 2. Repeated failures
        if (session.failed_attempts >= 3) {
            return {
                handoff: true,
                trigger: 'repeated_failure',
                reason: `${session.failed_attempts} consecutive low-confidence replies`,
            };
        }

        // 3. Guardrail triggered handoff
        if (latestResponse.guardrail_evaluation?.action === 'handoff') {
            return {
                handoff: true,
                trigger: 'guardrail_block',
                reason: `Guardrail rules triggered: ${latestResponse.guardrail_evaluation.triggered_rules.join(', ')}`,
            };
        }

        // 4. Customer explicitly asked for human
        const lastUserMsg = session.messages
            .filter((m) => m.role === 'user')
            .pop();
        if (lastUserMsg) {
            const lowerContent = lastUserMsg.content.toLowerCase();
            const askedForHuman = HANDOFF_PHRASES.some((phrase) => lowerContent.includes(phrase));
            if (askedForHuman) {
                return {
                    handoff: true,
                    trigger: 'customer_request',
                    reason: 'Customer requested to speak with a human agent',
                };
            }
        }

        // 5. Negative sentiment detection (keyword-based)
        if (lastUserMsg) {
            const words = lastUserMsg.content.toLowerCase().split(/\s+/);
            const negativeCount = words.filter((w) => NEGATIVE_WORDS.has(w)).length;
            const sentimentScore = negativeCount / Math.max(words.length, 1);
            if (sentimentScore > 0.15) {
                return {
                    handoff: true,
                    trigger: 'sentiment_negative',
                    reason: `Detected strong negative sentiment (${negativeCount} negative words)`,
                };
            }
        }

        return { handoff: false };
    }

    /**
     * Create a handoff event and auto-assign to an available agent.
     */
    async createHandoffEvent(params: {
        conversation_id: string;
        workspace_id: string;
        trigger: HandoffTrigger;
        trigger_detail?: string;
        session: LyroSession;
    }): Promise<HandoffEvent> {
        // Generate AI summary of the conversation (last 10 messages)
        const recentMessages = params.session.messages.slice(-10);
        const aiSummary = await this.generateSummary(recentMessages);

        // Find least-loaded available agent
        const agent = await this.findAvailableAgent(params.workspace_id);

        const result = await pool.query(
            `INSERT INTO handoff_events
         (conversation_id, workspace_id, trigger, trigger_detail, ai_summary,
          suggested_response, priority, assigned_agent_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending')
       RETURNING *`,
            [
                params.conversation_id,
                params.workspace_id,
                params.trigger,
                params.trigger_detail || null,
                aiSummary,
                null, // suggested_response can be added later
                params.trigger === 'sentiment_negative' ? 'high' : 'normal',
                agent?.id || null,
            ]
        );

        return result.rows[0];
    }

    /**
     * Agent accepts a handoff.
     */
    async acceptHandoff(handoffId: string, agentId: string): Promise<HandoffEvent> {
        const result = await pool.query(
            `UPDATE handoff_events
       SET status = 'accepted', assigned_agent_id = $1, accepted_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND status = 'pending'
       RETURNING *`,
            [agentId, handoffId]
        );
        if (result.rows.length === 0) throw new Error('Handoff not found or already accepted');
        return result.rows[0];
    }

    /**
     * Resolve a handoff event.
     */
    async resolveHandoff(handoffId: string): Promise<HandoffEvent> {
        const result = await pool.query(
            `UPDATE handoff_events
       SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
            [handoffId]
        );
        if (result.rows.length === 0) throw new Error('Handoff not found');
        return result.rows[0];
    }

    /**
     * Get pending handoffs for a workspace.
     */
    async getPendingHandoffs(workspaceId: string): Promise<HandoffEvent[]> {
        const result = await pool.query(
            `SELECT * FROM handoff_events
       WHERE workspace_id = $1 AND status = 'pending'
       ORDER BY created_at ASC`,
            [workspaceId]
        );
        return result.rows;
    }

    /**
     * Get handoffs for a specific conversation.
     */
    async getHandoffsByConversation(conversationId: string): Promise<HandoffEvent[]> {
        const result = await pool.query(
            `SELECT * FROM handoff_events WHERE conversation_id = $1 ORDER BY created_at DESC`,
            [conversationId]
        );
        return result.rows;
    }

    /**
     * Generate a 3-sentence summary of recent messages using Sarvam AI.
     */
    private async generateSummary(
        messages: Array<{ role: string; content: string }>
    ): Promise<string> {
        try {
            const transcript = messages
                .map((m) => `${m.role === 'user' ? 'Customer' : 'AI'}: ${m.content}`)
                .join('\n');

            const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.SARVAM_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'sarvam-m',
                    messages: [
                        { role: 'system', content: 'You are an AI assistant. Summarize the following customer support conversation briefly, highlighting the main unresolved issue that requires human agent intervention. Be concise (max 3 sentences).' },
                        { role: 'user', content: transcript }
                    ],
                    max_tokens: 300,
                    temperature: 0.3
                })
            }).then(res => res.json()) as any;

            return response.choices?.[0]?.message?.content || 'Unable to generate summary.';
        } catch (error) {
            // Fallback: just use last messages
            const lastMsg = messages[messages.length - 1];
            return `Customer conversation with ${messages.length} messages. Last message: "${lastMsg?.content?.slice(0, 200)}"`;
        }
    }

    /**
     * Find the least-loaded online agent in the workspace.
     */
    private async findAvailableAgent(workspaceId: string): Promise<{ id: string } | null> {
        const result = await pool.query(
            `SELECT u.id
       FROM workspace_members wm
       JOIN users u ON wm.user_id = u.id
       LEFT JOIN agent_status a ON a.agent_id = u.id AND a.is_online = true
       LEFT JOIN conversations c ON c.assigned_to = u.id AND c.status = 'open'
       WHERE wm.workspace_id = $1
       GROUP BY u.id
       ORDER BY COUNT(c.id) ASC
       LIMIT 1`,
            [workspaceId]
        );
        return result.rows[0] || null;
    }
}

export const handoffService = new HandoffService();
