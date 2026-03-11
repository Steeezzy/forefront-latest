/**
 * HandoffService — AI-to-human escalation management.
 *
 * Determines when to hand off conversations from Lyro to human agents
 * based on confidence, repeated failures, customer requests, sentiment,
 * and guardrail triggers.
 */
import type { HandoffEvent, HandoffTrigger, LyroResponse, LyroSession } from '../../types/rag.types.js';
export declare class HandoffService {
    /**
     * Evaluate whether a handoff should occur.
     */
    shouldHandoff(session: LyroSession, latestResponse: LyroResponse): {
        handoff: boolean;
        trigger?: HandoffTrigger;
        reason?: string;
    };
    /**
     * Create a handoff event and auto-assign to an available agent.
     */
    createHandoffEvent(params: {
        conversation_id: string;
        workspace_id: string;
        trigger: HandoffTrigger;
        trigger_detail?: string;
        session: LyroSession;
    }): Promise<HandoffEvent>;
    /**
     * Agent accepts a handoff.
     */
    acceptHandoff(handoffId: string, agentId: string): Promise<HandoffEvent>;
    /**
     * Resolve a handoff event.
     */
    resolveHandoff(handoffId: string): Promise<HandoffEvent>;
    /**
     * Get pending handoffs for a workspace.
     */
    getPendingHandoffs(workspaceId: string): Promise<HandoffEvent[]>;
    /**
     * Get handoffs for a specific conversation.
     */
    getHandoffsByConversation(conversationId: string): Promise<HandoffEvent[]>;
    /**
     * Generate a 3-sentence summary of recent messages using Sarvam AI.
     */
    private generateSummary;
    /**
     * Find the least-loaded online agent in the workspace.
     */
    private findAvailableAgent;
}
export declare const handoffService: HandoffService;
//# sourceMappingURL=HandoffService.d.ts.map