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
import { pool } from '../../config/db.js';
export class WorkflowEngine {
    /**
     * Evaluate and execute all active workflows for a given trigger event.
     * Called by the system when events occur (new conversation, conversation idle, etc.)
     */
    async processEvent(workspaceId, triggerEvent, targetId, // conversation_id or ticket_id
    eventData = {}) {
        // Fetch active workflows matching this trigger
        const result = await pool.query(`SELECT * FROM workflows
       WHERE workspace_id = $1 AND trigger_event = $2 AND is_active = true
       ORDER BY created_at ASC`, [workspaceId, triggerEvent]);
        for (const workflow of result.rows) {
            try {
                const conditions = workflow.conditions || {};
                const actions = workflow.actions || [];
                const config = workflow.config || {};
                // Check if conditions match
                const matches = await this.evaluateConditions(conditions, targetId, eventData);
                if (!matches) {
                    await this.logExecution(workflow.id, 'skipped', targetId, eventData);
                    continue;
                }
                // Execute actions
                const executedActions = [];
                for (const action of actions) {
                    const result = await this.executeAction(action, targetId, eventData, config);
                    executedActions.push({ ...action, result });
                }
                // Update workflow stats
                await pool.query(`UPDATE workflows SET run_count = run_count + 1, last_run_at = CURRENT_TIMESTAMP WHERE id = $1`, [workflow.id]);
                await this.logExecution(workflow.id, 'completed', targetId, eventData, executedActions);
            }
            catch (error) {
                console.error(`[Workflow ${workflow.id}] Error:`, error.message);
                await this.logExecution(workflow.id, 'failed', targetId, eventData, [], error.message);
            }
        }
    }
    /**
     * Evaluate whether the conditions match the current target (conversation/ticket).
     */
    async evaluateConditions(conditions, targetId, eventData) {
        // If no conditions, always match
        if (Object.keys(conditions).length === 0)
            return true;
        // Try to fetch the conversation or ticket
        const convo = await pool.query(`SELECT * FROM conversations WHERE id = $1`, [targetId]).catch(() => ({ rows: [] }));
        const ticket = await pool.query(`SELECT * FROM tickets WHERE id = $1`, [targetId]).catch(() => ({ rows: [] }));
        const target = convo.rows[0] || ticket.rows[0] || eventData;
        if (conditions.channel && target.channel !== conditions.channel)
            return false;
        if (conditions.status && target.status !== conditions.status)
            return false;
        if (conditions.priority && target.priority !== conditions.priority)
            return false;
        if (conditions.source && target.source !== conditions.source)
            return false;
        if (conditions.tags_contain && conditions.tags_contain.length > 0) {
            const tags = target.tags || [];
            if (!conditions.tags_contain.some((t) => tags.includes(t)))
                return false;
        }
        if (conditions.tags_exclude && conditions.tags_exclude.length > 0) {
            const tags = target.tags || [];
            if (conditions.tags_exclude.some((t) => tags.includes(t)))
                return false;
        }
        return true;
    }
    /**
     * Execute a single workflow action on the target.
     */
    async executeAction(action, targetId, eventData, config) {
        switch (action.type) {
            case 'change_status': {
                // Try conversations first, then tickets
                await pool.query(`UPDATE conversations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [action.value, targetId]).catch(() => null);
                await pool.query(`UPDATE tickets SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [action.value, targetId]).catch(() => null);
                return { success: true, message: `Status changed to ${action.value}` };
            }
            case 'add_tag': {
                await pool.query(`UPDATE conversations SET tags = array_append(tags, $1) WHERE id = $2 AND NOT ($1 = ANY(tags))`, [action.value, targetId]).catch(() => null);
                await pool.query(`UPDATE tickets SET tags = array_append(tags, $1) WHERE id = $2 AND NOT ($1 = ANY(tags))`, [action.value, targetId]).catch(() => null);
                return { success: true, message: `Tag "${action.value}" added` };
            }
            case 'remove_tag': {
                await pool.query(`UPDATE conversations SET tags = array_remove(tags, $1) WHERE id = $2`, [action.value, targetId]).catch(() => null);
                await pool.query(`UPDATE tickets SET tags = array_remove(tags, $1) WHERE id = $2`, [action.value, targetId]).catch(() => null);
                return { success: true, message: `Tag "${action.value}" removed` };
            }
            case 'assign_agent': {
                const agentId = action.value || await this.getLeastBusyAgent(eventData.workspace_id);
                if (!agentId) {
                    return { success: false, message: 'No available agent found' };
                }
                await pool.query(`UPDATE conversations SET assigned_to = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [agentId, targetId]).catch(() => null);
                await pool.query(`UPDATE tickets SET assigned_to = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [agentId, targetId]).catch(() => null);
                return { success: true, message: `Assigned to agent ${agentId}` };
            }
            case 'send_reply': {
                const template = action.template || config.reply_template || 'Thank you for contacting us. We will get back to you shortly.';
                // Insert as a system/bot message into the conversation
                await pool.query(`INSERT INTO messages (conversation_id, sender_type, sender_id, content)
           VALUES ($1, 'bot', 'system', $2)`, [targetId, template]).catch(() => null);
                return { success: true, message: `Auto-reply sent` };
            }
            case 'add_note': {
                // Add internal note to ticket
                await pool.query(`INSERT INTO ticket_comments (ticket_id, author_type, author_name, content, is_internal)
           VALUES ($1, 'system', 'Workflow Automation', $2, true)`, [targetId, action.value || 'Automated workflow action']).catch(() => null);
                return { success: true, message: `Internal note added` };
            }
            default:
                return { success: false, message: `Unknown action type: ${action.type}` };
        }
    }
    /**
     * Round-robin assignment: find the agent with the fewest active conversations.
     */
    async getLeastBusyAgent(workspaceId) {
        if (!workspaceId)
            return null;
        const result = await pool.query(`SELECT u.id, COUNT(c.id) AS active_count
       FROM users u
       LEFT JOIN conversations c ON c.assigned_to = u.id AND c.status = 'open'
       WHERE u.workspace_id = $1
       GROUP BY u.id
       ORDER BY active_count ASC
       LIMIT 1`, [workspaceId]);
        return result.rows[0]?.id || null;
    }
    /**
     * Log execution for audit and analytics.
     */
    async logExecution(workflowId, status, targetId, triggerData, actionsExecuted = [], errorMessage) {
        await pool.query(`INSERT INTO workflow_executions (workflow_id, trigger_data, actions_executed, status, error_message, target_id)
       VALUES ($1, $2, $3, $4, $5, $6)`, [
            workflowId,
            JSON.stringify(triggerData),
            JSON.stringify(actionsExecuted),
            status,
            errorMessage || null,
            targetId,
        ]).catch((err) => console.error('[WorkflowEngine] Log error:', err.message));
    }
    // ─── Pre-built Workflow Templates ─────────────────────────────────
    /**
     * Get list of available pre-built workflow templates.
     */
    getTemplates() {
        return [
            {
                id: 'auto_assign',
                name: 'Assign conversations automatically',
                description: 'Distributes incoming live chats equally among active, online agents using round-robin load balancing.',
                type: 'auto_assign',
                trigger_event: 'new_conversation',
                conditions: {},
                actions: [{ type: 'assign_agent', value: null }], // null = least busy
                config: { assignment_method: 'round_robin' },
            },
            {
                id: 'auto_solve_conversation',
                name: 'Solve conversations automatically',
                description: 'Automatically changes a live chat status to "solved" after a specified time if the agent has replied but the customer abandoned the chat.',
                type: 'auto_solve_conversation',
                trigger_event: 'conversation_idle',
                conditions: { has_agent_reply: true },
                actions: [
                    { type: 'change_status', value: 'closed' },
                    { type: 'add_tag', value: 'auto-solved' },
                ],
                config: { idle_minutes: 30 },
            },
            {
                id: 'auto_reply_ticket',
                name: 'Send automatic ticket reply',
                description: 'Automatically sends a predefined reply to the customer when a new support ticket enters the queue.',
                type: 'auto_reply_ticket',
                trigger_event: 'new_ticket',
                conditions: {},
                actions: [
                    { type: 'send_reply', template: 'Thank you for reaching out! We have received your request and will get back to you within 24 hours.' },
                ],
                config: {},
            },
            {
                id: 'auto_solve_ticket',
                name: 'Solve tickets automatically',
                description: 'Closes an email ticket after a specified number of days without a customer reply, optionally sending a follow-up email.',
                type: 'auto_solve_ticket',
                trigger_event: 'ticket_idle',
                conditions: {},
                actions: [
                    { type: 'change_status', value: 'closed' },
                    { type: 'add_note', value: 'Auto-closed due to inactivity' },
                ],
                config: { idle_days: 3, follow_up_email: true },
            },
        ];
    }
}
export const workflowEngine = new WorkflowEngine();
//# sourceMappingURL=WorkflowEngine.js.map