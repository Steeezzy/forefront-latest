/**
 * FlowTriggerService — Evaluates real-time visitor events from the widget
 * and fires matching flows via FlowExecutionEngine.
 *
 * Handles frequency capping (per-visitor, per-session) via Redis to prevent
 * the same trigger from firing repeatedly.
 *
 * @example
 *   const trigger = new FlowTriggerService();
 *   await trigger.evaluateEvent('exit_intent', workspaceId, visitorSession);
 */
interface VisitorSession {
    visitor_id: string;
    session_id: string;
    workspace_id: string;
    browser?: string;
    os?: string;
    device_type?: string;
    language?: string;
    current_url?: string;
    referrer?: string;
    is_returning?: boolean;
    scroll_depth?: number;
    cart_total?: number;
    cart_items?: number;
    time_on_page_seconds?: number;
    conversation_id?: string;
    agent_id?: string;
}
type TriggerType = 'first_visit' | 'visitor_returns' | 'visitor_opens_page' | 'visitor_scrolls' | 'visitor_clicks_chat' | 'visitor_says' | 'mouse_leaves' | 'idle_visitor' | 'form_abandoned' | 'new_event' | 'schedule' | 'agent_no_respond' | 'agent_starts_flow' | 'from_another_flow';
export declare class FlowTriggerService {
    private engine;
    constructor();
    /**
     * Evaluate a trigger event and execute all matching active flows.
     * Returns the execution results for each triggered flow.
     */
    evaluateEvent(triggerType: TriggerType, session: VisitorSession): Promise<Array<{
        flow_id: string;
        execution_id: string;
        status: string;
    }>>;
    /**
     * Check trigger-specific conditions against session data.
     */
    private matchesTriggerConditions;
}
export declare const flowTriggerService: FlowTriggerService;
export {};
//# sourceMappingURL=FlowTriggerService.d.ts.map