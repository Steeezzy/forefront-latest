import { pool } from '../../config/db.js';
import { IntentRouter, type IntentResult } from './intent-router.js';
import { BookingAgent } from './agents/booking.agent.js';
import { CRMAgent } from './agents/crm.agent.js';
import { SalesAgent } from './agents/sales.agent.js';
import { EscalationAgent } from './agents/escalation.agent.js';
import { enhancedRAGService } from '../chat/enhanced-rag.service.js';
import { defaultVoiceFarewell, shouldEndVoiceCallFromUserInput } from '../voice/call-termination.js';

/**
 * MultiAgentOrchestrator
 * 
 * Core orchestration engine that:
 * 1. Receives any customer message (voice, chat, whatsapp)
 * 2. Uses IntentRouter to classify intent
 * 3. Routes to the correct specialist agent
 * 4. Manages conversation memory across turns
 * 5. Tracks all routing decisions for analytics
 */

export interface OrchestratorInput {
    message: string;
    sessionId?: string;
    channel: 'voice' | 'chat' | 'whatsapp';
    customerId?: string;
    customerPhone?: string;
    agentId: string;
    workspaceId: string;
}

export interface OrchestratorResponse {
    reply: string;
    sessionId: string;
    intent: string;
    handledBy: string;
    confidence: number;
    metadata: {
        sources?: string[];
        actions?: string[];
        sentiment?: string;
    };
}

export interface ConversationTurn {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    agent?: string;
}

export interface OrchestratorWorkflowSpecialist {
    id: string;
    label: string;
    agentKey: string;
    objective?: string;
    triggerIntents?: string[];
    triggerKeywords?: string[];
    handoffLabel?: string;
    enabled?: boolean;
}

export interface OrchestratorWorkflowConfig {
    frontDesk?: {
        objective?: string;
        steps?: string[];
        responseStyle?: string;
        collectFields?: string[];
    };
    specialists?: OrchestratorWorkflowSpecialist[];
    router?: {
        fallbackAgent?: string;
        languageDetection?: boolean;
        hideInternalHandoffs?: boolean;
        confirmationStyle?: string;
    };
}

interface RuntimeAgentConfig {
    name?: string;
    systemPrompt?: string;
    firstMessage?: string;
    agentType?: string;
    workflowConfig?: OrchestratorWorkflowConfig | null;
}

export class MultiAgentOrchestrator {
    private intentRouter: IntentRouter;
    private sarvamApiKey: string;
    private sarvamBaseUrl: string;
    
    // Agent registry — will be populated as agents are built
    private agents: Map<string, (input: AgentInput) => Promise<AgentOutput>>;

    constructor() {
        this.intentRouter = new IntentRouter();
        this.sarvamApiKey = process.env.SARVAM_API_KEY || '';
        this.sarvamBaseUrl = 'https://api.sarvam.ai/v1';
        this.agents = new Map();

        // Register built-in agents
        this.agents.set('knowledge', this.knowledgeAgent.bind(this));
        this.agents.set('fallback', this.fallbackAgent.bind(this));

        // Register Specialist Agents
        const bookingAgent = new BookingAgent();
        const crmAgent = new CRMAgent();
        const salesAgent = new SalesAgent();
        const escalationAgent = new EscalationAgent();

        this.agents.set('booking', (input) => bookingAgent.handle(input));
        this.agents.set('crm', (input) => crmAgent.handle(input));
        this.agents.set('sales', (input) => salesAgent.handle(input));
        this.agents.set('escalation', (input) => escalationAgent.handle(input));
    }

    /**
     * Register a specialist agent
     */
    registerAgent(name: string, handler: (input: AgentInput) => Promise<AgentOutput>) {
        this.agents.set(name, handler);
    }

    /**
     * Main entry point — handles any incoming customer message
     */
    async handle(input: OrchestratorInput): Promise<OrchestratorResponse> {
        // 1. Get or create session
        const session = await this.getOrCreateSession(input);
        const sessionId = session.id;
        const history = session.transcript || [];
        const runtimeAgent = await this.getRuntimeAgentConfig(input.agentId);
        const workflowConfig = runtimeAgent?.workflowConfig || null;

        // Voice-specific call ending signal based on user interaction.
        if (input.channel === 'voice' && shouldEndVoiceCallFromUserInput(input.message)) {
            const farewell = defaultVoiceFarewell();

            await this.updateMemory(sessionId, [
                { role: 'user', content: input.message, timestamp: new Date().toISOString() },
                { role: 'assistant', content: farewell, timestamp: new Date().toISOString(), agent: 'system' }
            ]);

            await pool.query(
                'UPDATE conversation_sessions SET intent = $1 WHERE id = $2',
                ['end_call', sessionId]
            );

            return {
                reply: farewell,
                sessionId,
                intent: 'end_call',
                handledBy: 'system',
                confidence: 1,
                metadata: {
                    actions: ['end_call'],
                    sentiment: 'neutral'
                }
            };
        }

        // 2. Classify intent
        const intentResult = await this.routeIntent(input.message, history, workflowConfig);
        const specialist = this.resolveWorkflowSpecialist(workflowConfig, intentResult.recommendedAgent, intentResult.intent);

        // 3. Route to specialist agent
        const agentName = specialist?.agentKey || intentResult.recommendedAgent;
        const agentHandler = this.agents.get(agentName) || this.agents.get('fallback')!;

        // 4. Log routing
        await this.intentRouter.logRouting(
            sessionId,
            'orchestrator',
            agentName,
            intentResult.reasoning,
            intentResult.confidence
        );

        // 5. Call agent
        const agentOutput = await agentHandler({
            message: input.message,
            sessionId,
            agentId: input.agentId,
            workspaceId: input.workspaceId,
            history,
            intent: intentResult.intent,
            customerPhone: input.customerPhone,
            workflowConfig,
            specialistPrompt: specialist?.objective,
            specialistLabel: specialist?.label,
            primaryPrompt: runtimeAgent?.systemPrompt,
            assistantName: runtimeAgent?.name,
        });

        // 6. Update memory
        await this.updateMemory(sessionId, [
            { role: 'user', content: input.message, timestamp: new Date().toISOString() },
            { role: 'assistant', content: agentOutput.reply, timestamp: new Date().toISOString(), agent: agentName }
        ]);

        // 7. Update session intent
        await pool.query(
            'UPDATE conversation_sessions SET intent = $1 WHERE id = $2',
            [intentResult.intent, sessionId]
        );

        // 8. Evaluate Automation Rules (Post-Turn)
        try {
            const { AutomationEngine } = await import('../automation/automation.service.js');
            const automation = new AutomationEngine();
            await automation.evaluate(sessionId, {
                message: input.message,
                role: 'user',
                sentimentScore: agentOutput.sentiment === 'positive' ? 0.8 : agentOutput.sentiment === 'negative' ? 0.2 : 0.5
            });
        } catch (e) {
            console.error('Automation runtime evaluation skipped:', e);
        }

        return {
            reply: agentOutput.reply,
            sessionId,
            intent: intentResult.intent,
            handledBy: agentName,
            confidence: intentResult.confidence,
            metadata: {
                sources: agentOutput.sources,
                actions: agentOutput.actions,
                sentiment: agentOutput.sentiment
            }
        };
    }

    private async getRuntimeAgentConfig(agentId: string): Promise<RuntimeAgentConfig | null> {
        if (!agentId || !/^[0-9a-f-]{36}$/i.test(agentId)) {
            return null;
        }

        try {
            const result = await pool.query(
                `SELECT name, system_prompt, first_message, agent_type, template_meta
                 FROM voice_agents
                 WHERE id = $1`,
                [agentId]
            );

            if (result.rows.length === 0) {
                return null;
            }

            const row = result.rows[0];
            const templateMeta = row.template_meta || {};

            return {
                name: row.name,
                systemPrompt: row.system_prompt,
                firstMessage: row.first_message,
                agentType: row.agent_type,
                workflowConfig: templateMeta.workflow || null,
            };
        } catch (error: any) {
            console.error('Failed to load runtime agent config:', error.message);
            return null;
        }
    }

    private async routeIntent(message: string, history: any[], workflowConfig?: OrchestratorWorkflowConfig | null): Promise<IntentResult> {
        const keywordRoute = this.findWorkflowKeywordRoute(message, workflowConfig);
        if (keywordRoute) {
            return keywordRoute;
        }

        const classified = await this.intentRouter.classify(message, history);
        if (!workflowConfig?.specialists?.length) {
            return classified;
        }

        const enabledSpecialists = workflowConfig.specialists.filter((specialist) => specialist.enabled !== false);
        const directMatch = enabledSpecialists.find((specialist) => specialist.agentKey === classified.recommendedAgent);
        if (directMatch) {
            return classified;
        }

        const intentMatch = enabledSpecialists.find((specialist) => (specialist.triggerIntents || []).includes(classified.intent));
        if (intentMatch) {
            return {
                ...classified,
                recommendedAgent: intentMatch.agentKey,
                reasoning: `Workflow intent map to ${intentMatch.label}. ${classified.reasoning}`,
            };
        }

        const fallbackAgent = workflowConfig.router?.fallbackAgent;
        const fallbackSpecialist = enabledSpecialists.find((specialist) => specialist.agentKey === fallbackAgent) || enabledSpecialists[0];
        if (fallbackSpecialist) {
            return {
                ...classified,
                recommendedAgent: fallbackSpecialist.agentKey,
                reasoning: `Workflow fallback to ${fallbackSpecialist.label}. ${classified.reasoning}`,
            };
        }

        return classified;
    }

    private findWorkflowKeywordRoute(message: string, workflowConfig?: OrchestratorWorkflowConfig | null): IntentResult | null {
        if (!workflowConfig?.specialists?.length) {
            return null;
        }

        const lower = message.toLowerCase();
        for (const specialist of workflowConfig.specialists) {
            if (specialist.enabled === false) continue;
            const matchedKeyword = (specialist.triggerKeywords || []).find((keyword) => lower.includes(keyword.toLowerCase()));
            if (!matchedKeyword) continue;

            return {
                intent: specialist.triggerIntents?.[0] || specialist.id,
                confidence: 0.96,
                recommendedAgent: specialist.agentKey,
                reasoning: `Workflow keyword route matched "${matchedKeyword}" for ${specialist.label}`,
            };
        }

        return null;
    }

    private resolveWorkflowSpecialist(
        workflowConfig: OrchestratorWorkflowConfig | null | undefined,
        recommendedAgent: string,
        intent: string
    ): OrchestratorWorkflowSpecialist | null {
        if (!workflowConfig?.specialists?.length) {
            return null;
        }

        return workflowConfig.specialists.find((specialist) =>
            specialist.enabled !== false && (
                specialist.agentKey === recommendedAgent ||
                (specialist.triggerIntents || []).includes(intent)
            )
        ) || null;
    }

    /**
     * Get or create a conversation session
     */
    private async getOrCreateSession(input: OrchestratorInput): Promise<any> {
        const isUuid = (value?: string) => !!value && /^[0-9a-f-]{36}$/i.test(value);

        if (isUuid(input.sessionId)) {
            const result = await pool.query(
                'SELECT * FROM conversation_sessions WHERE id = $1',
                [input.sessionId]
            );
            if (result.rows.length > 0) return result.rows[0];
        }

        const normalizedAgentId = isUuid(input.agentId) ? input.agentId : null;

        // Create new session
        const result = await pool.query(
            `INSERT INTO conversation_sessions 
             (agent_id, workspace_id, customer_id, customer_phone, channel)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [normalizedAgentId, input.workspaceId, input.customerId, input.customerPhone, input.channel]
        );
        return result.rows[0];
    }

    /**
     * Append turns to session transcript
     */
    private async updateMemory(sessionId: string, turns: ConversationTurn[]): Promise<void> {
        try {
            const result = await pool.query(
                'SELECT transcript FROM conversation_sessions WHERE id = $1',
                [sessionId]
            );
            
            const existing = result.rows[0]?.transcript || [];
            const updated = [...existing, ...turns];

            await pool.query(
                'UPDATE conversation_sessions SET transcript = $1 WHERE id = $2',
                [JSON.stringify(updated), sessionId]
            );
        } catch (error: any) {
            console.error('Failed to update memory:', error.message);
        }
    }

    /**
     * End a session (called when call/chat ends)
     */
    async endSession(sessionId: string, outcome: string): Promise<void> {
        await pool.query(
            'UPDATE conversation_sessions SET ended_at = NOW(), outcome = $1 WHERE id = $2',
            [outcome, sessionId]
        );
    }

    /**
     * Built-in Knowledge Agent — wraps existing RAG pipeline
     */
    private async knowledgeAgent(input: AgentInput): Promise<AgentOutput> {
        try {
            const ragResult = await enhancedRAGService.resolveAIResponse(
                input.workspaceId,
                input.sessionId,
                input.message,
                { enableEscalation: true }
            );

            return {
                reply: ragResult.content,
                sources: ragResult.sources,
                actions: ragResult.shouldEscalate ? ['escalate_suggested'] : [],
                sentiment: ragResult.shouldEscalate ? 'neutral' : 'positive'
            };
        } catch (error: any) {
            console.error('Knowledge agent RAG error:', error.message);
            return {
                reply: 'I\'m having trouble processing your request. Let me transfer you to someone who can help.',
                sources: [],
                actions: ['escalate_error'],
                sentiment: 'neutral'
            };
        }
    }

    /**
     * Fallback agent — used when no specialist matches
     */
    private async fallbackAgent(input: AgentInput): Promise<AgentOutput> {
        return {
            reply: input.workflowConfig?.router?.confirmationStyle
                ? `${input.workflowConfig.router.confirmationStyle} Let me bring in the right team member to help further.`
                : 'I understand your concern. Let me connect you with the right team member who can assist you better.',
            sources: [],
            actions: ['transfer_to_human'],
            sentiment: 'neutral'
        };
    }
}

// Shared types
export interface AgentInput {
    message: string;
    sessionId: string;
    agentId: string;
    workspaceId: string;
    history: any[];
    intent: string;
    customerPhone?: string;
    workflowConfig?: OrchestratorWorkflowConfig | null;
    specialistPrompt?: string;
    specialistLabel?: string;
    primaryPrompt?: string;
    assistantName?: string;
}

export interface AgentOutput {
    reply: string;
    sources?: string[];
    actions?: string[];
    sentiment?: string;
}

// Backward-compatible adapter used by voice socket flows.
export class OrchestratorService extends MultiAgentOrchestrator {
    async processVoiceTurn(input: {
        agentId: string;
        workspaceId: string;
        userMessage: string;
        sessionId: string;
        agentType?: string;
        callDirection?: 'inbound' | 'outbound' | 'webcall';
        customerPhone?: string;
    }): Promise<{ message: string; intent: string; handledBy: string; confidence: number; shouldEndCall: boolean }> {
        const result = await this.handle({
            message: input.userMessage,
            sessionId: input.sessionId,
            channel: 'voice',
            customerPhone: input.customerPhone,
            agentId: input.agentId,
            workspaceId: input.workspaceId,
        });

        const actions = result.metadata?.actions || [];
        const shouldEndCall = actions.includes('end_call') || result.intent === 'end_call';

        return {
            message: result.reply,
            intent: result.intent,
            handledBy: result.handledBy,
            confidence: result.confidence,
            shouldEndCall,
        };
    }
}
