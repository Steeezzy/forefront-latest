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
import { pool } from '../../config/db.js';
import { redis } from '../../config/redis.js';
import { FlowExecutionEngine } from './FlowExecutionEngine.js';
export class FlowTriggerService {
    engine;
    constructor() {
        this.engine = new FlowExecutionEngine();
    }
    /**
     * Evaluate a trigger event and execute all matching active flows.
     * Returns the execution results for each triggered flow.
     */
    async evaluateEvent(triggerType, session) {
        // 1. Find all active flows with this trigger type for the workspace
        const flowsResult = await pool.query(`SELECT id, name, nodes, edges, variables
       FROM flows
       WHERE agent_id IN (
         SELECT id FROM agents WHERE workspace_id = $1
       )
       AND trigger_type = $2
       AND is_active = true`, [session.workspace_id, triggerType]);
        if (flowsResult.rows.length === 0)
            return [];
        const results = [];
        for (const flow of flowsResult.rows) {
            // 2. Frequency capping: check if this trigger already fired for this visitor/session
            const cappingKey = `flow_trigger:${flow.id}:${session.visitor_id}`;
            const alreadyFired = await redis.get(cappingKey).catch(() => null);
            if (alreadyFired) {
                continue; // Skip — already triggered for this visitor recently
            }
            // 3. Check trigger-specific conditions from the trigger node config
            const nodes = flow.nodes || [];
            const triggerNode = nodes.find((n) => n.type === 'flow_trigger');
            if (triggerNode) {
                const config = triggerNode.data?.config || {};
                if (!this.matchesTriggerConditions(config, session, triggerType)) {
                    continue; // Conditions don't match
                }
            }
            // 4. Execute the flow
            try {
                const triggerData = {
                    trigger_type: triggerType,
                    visitor_id: session.visitor_id,
                    session_id: session.session_id,
                    browser: session.browser,
                    os: session.os,
                    device_type: session.device_type,
                    language: session.language,
                    current_url: session.current_url,
                    referrer: session.referrer,
                    is_returning: session.is_returning,
                    scroll_depth: session.scroll_depth,
                    cart_total: session.cart_total,
                    cart_items: session.cart_items,
                    time_on_page_seconds: session.time_on_page_seconds,
                };
                const execution = await this.engine.execute(flow.id, triggerData, {
                    agent_id: session.agent_id || 'system',
                    conversation_id: session.conversation_id,
                    visitor_id: session.visitor_id,
                });
                results.push({
                    flow_id: flow.id,
                    execution_id: execution.execution_id,
                    status: execution.status,
                });
                // 5. Set frequency cap (1 hour for per-visitor, or configurable)
                const capDuration = triggerNode?.data?.config?.cap_duration_seconds || 3600;
                await redis.setex(cappingKey, capDuration, '1').catch(() => { });
            }
            catch (error) {
                console.error(`[FlowTrigger] Error executing flow ${flow.id}:`, error.message);
                results.push({
                    flow_id: flow.id,
                    execution_id: 'error',
                    status: 'failed',
                });
            }
        }
        return results;
    }
    /**
     * Check trigger-specific conditions against session data.
     */
    matchesTriggerConditions(config, session, triggerType) {
        // URL matching (for visitor_opens_page)
        if (config.url_pattern && session.current_url) {
            const pattern = config.url_pattern;
            if (config.url_match_type === 'exact') {
                if (session.current_url !== pattern)
                    return false;
            }
            else if (config.url_match_type === 'contains') {
                if (!session.current_url.includes(pattern))
                    return false;
            }
            else if (config.url_match_type === 'starts_with') {
                if (!session.current_url.startsWith(pattern))
                    return false;
            }
        }
        // Scroll depth (for visitor_scrolls)
        if (triggerType === 'visitor_scrolls' && config.min_scroll_depth) {
            if ((session.scroll_depth || 0) < config.min_scroll_depth)
                return false;
        }
        // Idle time (for idle_visitor)
        if (triggerType === 'idle_visitor' && config.idle_seconds) {
            if ((session.time_on_page_seconds || 0) < config.idle_seconds)
                return false;
        }
        // Keyword matching (for visitor_says)
        if (triggerType === 'visitor_says' && config.keywords) {
            const keywords = config.keywords;
            const visitorMessage = session.conversation_id || ''; // will be passed via session
            if (!keywords.some((kw) => visitorMessage.toLowerCase().includes(kw.toLowerCase()))) {
                return false;
            }
        }
        // Device type filter
        if (config.device_filter && session.device_type) {
            if (config.device_filter !== session.device_type)
                return false;
        }
        // Browser language filter
        if (config.language_filter && session.language) {
            if (!session.language.startsWith(config.language_filter))
                return false;
        }
        return true;
    }
}
export const flowTriggerService = new FlowTriggerService();
//# sourceMappingURL=FlowTriggerService.js.map