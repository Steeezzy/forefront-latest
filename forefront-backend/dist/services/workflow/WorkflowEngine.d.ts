/**
 * WorkflowEngine — Non-conversational backend automation processor.
 *
 * Unlike Flows (customer-facing decision trees), Workflows are internal
 * automations that help agents with repetitive tasks:
 * - Auto-assign conversations (load balancing)
 * - Auto-solve stale conversations
 * - Auto-reply to tickets
 * - Auto-solve idle tickets
 * - Custom rule-based automations
 *
 * @class WorkflowEngine
 */
export declare class WorkflowEngine {
    /**
     * Evaluate and execute all active workflows for a given trigger event.
     * Called by the system when events occur (new conversation, conversation idle, etc.)
     */
    processEvent(workspaceId: string, triggerEvent: string, targetId: string, // conversation_id or ticket_id
    eventData?: Record<string, any>): Promise<void>;
    /**
     * Evaluate whether the conditions match the current target (conversation/ticket).
     */
    private evaluateConditions;
    /**
     * Execute a single workflow action on the target.
     */
    private executeAction;
    /**
     * Round-robin assignment: find the agent with the fewest active conversations.
     */
    private getLeastBusyAgent;
    /**
     * Log execution for audit and analytics.
     */
    private logExecution;
    /**
     * Get list of available pre-built workflow templates.
     */
    getTemplates(): ({
        id: string;
        name: string;
        description: string;
        type: string;
        trigger_event: string;
        conditions: {
            has_agent_reply?: undefined;
        };
        actions: {
            type: string;
            value: any;
        }[];
        config: {
            assignment_method: string;
            idle_minutes?: undefined;
            idle_days?: undefined;
            follow_up_email?: undefined;
        };
    } | {
        id: string;
        name: string;
        description: string;
        type: string;
        trigger_event: string;
        conditions: {
            has_agent_reply: boolean;
        };
        actions: {
            type: string;
            value: string;
        }[];
        config: {
            idle_minutes: number;
            assignment_method?: undefined;
            idle_days?: undefined;
            follow_up_email?: undefined;
        };
    } | {
        id: string;
        name: string;
        description: string;
        type: string;
        trigger_event: string;
        conditions: {
            has_agent_reply?: undefined;
        };
        actions: {
            type: string;
            template: string;
        }[];
        config: {
            assignment_method?: undefined;
            idle_minutes?: undefined;
            idle_days?: undefined;
            follow_up_email?: undefined;
        };
    } | {
        id: string;
        name: string;
        description: string;
        type: string;
        trigger_event: string;
        conditions: {
            has_agent_reply?: undefined;
        };
        actions: {
            type: string;
            value: string;
        }[];
        config: {
            idle_days: number;
            follow_up_email: boolean;
            assignment_method?: undefined;
            idle_minutes?: undefined;
        };
    })[];
}
export declare const workflowEngine: WorkflowEngine;
//# sourceMappingURL=WorkflowEngine.d.ts.map