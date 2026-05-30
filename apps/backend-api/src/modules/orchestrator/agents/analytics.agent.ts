import { pool } from '../../../config/db.js';
import type { AgentInput, AgentOutput } from '../orchestrator.service.js';

/**
 * AnalyticsAgent (Post-Call Processor)
 * 
 * Runs after every call/session ends.
 * Extracts structured data: entities, sentiment, outcome, action items.
 * Stores results in analytics_events table and updates agent metrics.
 */

export interface AnalyticsResult {
    entities: Record<string, string>;
    sentiment: string;
    outcome: string;
    actionItems: string[];
    duration: number;
}

export class AnalyticsAgent {
    private sarvamApiKey: string;
    private sarvamBaseUrl: string;

    constructor() {
        this.sarvamApiKey = process.env.SARVAM_API_KEY || '';
        this.sarvamBaseUrl = 'https://api.sarvam.ai/v1';
    }

    /**
     * Process a completed session — extracts analytics
     */
    async processSession(sessionId: string): Promise<AnalyticsResult> {
        // Get session data
        const sessionResult = await pool.query(
            'SELECT * FROM conversation_sessions WHERE id = $1',
            [sessionId]
        );

        if (sessionResult.rows.length === 0) {
            throw new Error(`Session ${sessionId} not found`);
        }

        const session = sessionResult.rows[0];
        const transcript = session.transcript || [];

        // Extract analytics
        const analytics = await this.extractAnalytics(transcript, session);

        // Store analytics event
        await pool.query(
            `INSERT INTO analytics_events (session_id, workspace_id, event_type, entities, sentiment, outcome, action_items)
             VALUES ($1, $2, 'session_complete', $3, $4, $5, $6)`,
            [
                sessionId,
                session.workspace_id,
                JSON.stringify(analytics.entities),
                analytics.sentiment,
                analytics.outcome,
                JSON.stringify(analytics.actionItems)
            ]
        );

        // Update session with sentiment
        await pool.query(
            'UPDATE conversation_sessions SET sentiment_score = $1, outcome = $2 WHERE id = $3',
            [this.sentimentToScore(analytics.sentiment), analytics.outcome, sessionId]
        );

        return analytics;
    }

    /**
     * Extract entities, sentiment, and outcome from transcript
     */
    private async extractAnalytics(transcript: any[], session: any): Promise<AnalyticsResult> {
        if (this.sarvamApiKey && transcript.length > 0) {
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
                                content: `Analyze this conversation and extract:
1. entities: any names, amounts, dates, order numbers mentioned (as key-value pairs)
2. sentiment: positive, negative, neutral, or mixed
3. outcome: resolved, escalated, abandoned, follow_up_needed
4. action_items: list of follow-up actions needed

Respond ONLY with valid JSON:
{"entities": {}, "sentiment": "", "outcome": "", "action_items": []}`
                            },
                            {
                                role: 'user',
                                content: `Transcript:\n${transcript.map((t: any) => `${t.role}: ${t.content}`).join('\n')}`
                            }
                        ],
                        temperature: 0.1,
                        max_tokens: 300,
                        response_format: { type: 'json_object' }
                    })
                });

                if (response.ok) {
                    const data: any = await response.json();
                    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
                    return {
                        entities: parsed.entities || {},
                        sentiment: parsed.sentiment || 'neutral',
                        outcome: parsed.outcome || session.outcome || 'completed',
                        actionItems: parsed.action_items || [],
                        duration: this.calculateDuration(session)
                    };
                }
            } catch (error: any) {
                console.error('Analytics extraction error:', error.message);
            }
        }

        // Fallback: basic analysis
        return this.basicAnalysis(transcript, session);
    }

    /**
     * Simple keyword-based analysis fallback
     */
    private basicAnalysis(transcript: any[], session: any): AnalyticsResult {
        const allText = transcript.map((t: any) => t.content || '').join(' ').toLowerCase();

        // Detect sentiment
        const positiveWords = ['thank', 'great', 'perfect', 'excellent', 'helpful', 'amazing'];
        const negativeWords = ['angry', 'frustrated', 'terrible', 'worst', 'useless', 'disappointed'];
        const posCount = positiveWords.filter(w => allText.includes(w)).length;
        const negCount = negativeWords.filter(w => allText.includes(w)).length;

        let sentiment = 'neutral';
        if (posCount > negCount) sentiment = 'positive';
        if (negCount > posCount) sentiment = 'negative';
        if (posCount > 0 && negCount > 0) sentiment = 'mixed';

        // Detect outcome
        let outcome = session.outcome || 'completed';
        if (allText.includes('escalat') || allText.includes('human') || allText.includes('transfer')) outcome = 'escalated';
        if (allText.includes('thank') && allText.includes('help')) outcome = 'resolved';

        return {
            entities: {},
            sentiment,
            outcome,
            actionItems: [],
            duration: this.calculateDuration(session)
        };
    }

    private calculateDuration(session: any): number {
        if (session.started_at && session.ended_at) {
            return Math.round((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 1000);
        }
        return 0;
    }

    private sentimentToScore(sentiment: string): number {
        switch (sentiment) {
            case 'positive': return 0.85;
            case 'neutral': return 0.5;
            case 'mixed': return 0.4;
            case 'negative': return 0.15;
            default: return 0.5;
        }
    }
}
