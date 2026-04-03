import { pool } from '../../config/db.js';
import { logAutomationAction } from './action-log.service.js';
import { sendWorkspaceSms } from './sms.service.js';

/**
 * AutomationEngine
 * 
 * Evaluates rules against live conversation state.
 * Trigger types:
 * - sentiment_drops: triggers when sentiment score < threshold
 * - keyword_detected: triggers when keyword is found in transcript
 * - call_duration: triggers when call exceeds seconds threshold
 * - intent_detected: triggers when the session intent matches a configured intent
 * - multiple_failures: triggers if agent can't answer 3x
 * 
 * Action types:
 * - escalate_to_human
 * - send_sms
 * - create_ticket
 * - tag_customer
 * - transfer_to_agent
 */

export class AutomationEngine {
    constructor() {}

    /**
     * Evaluate rules for a session turn
     */
    async evaluate(
        sessionId: string,
        currentTurn: {
            message: string;
            role: string;
            sentimentScore?: number;
            callOutcome?: string;
            durationSeconds?: number;
        }
    ): Promise<void> {
        try {
            // Get session data
            const sessionResult = await pool.query(
                'SELECT * FROM conversation_sessions WHERE id = $1',
                [sessionId]
            );

            if (sessionResult.rows.length === 0) return;
            const session = sessionResult.rows[0];

            // Fetch active rules for this workspace/agent
            const rulesResult = await pool.query(
                `SELECT * FROM automation_rules 
                 WHERE workspace_id = $1 AND is_active = true 
                 AND (agent_id IS NULL OR agent_id = $2)`,
                [session.workspace_id, session.agent_id]
            );

            for (const rule of rulesResult.rows) {
                const triggered = this.checkCondition(rule, currentTurn, session);
                if (triggered) {
                    await this.executeAction(rule, session);
                }
            }
        } catch (error: any) {
            console.error('Automation evaluation error:', error.message);
        }
    }

    /**
     * Check if condition matches trigger specs
     */
    private checkCondition(rule: any, turn: any, session: any): boolean {
        const config = rule.condition_config || {};

        switch (rule.trigger_type) {
            case 'sentiment_drops':
                return (turn.sentimentScore || 1) < (config.threshold || 0.3);
            
            case 'keyword_detected':
                const keyword = (config.keyword || '').toLowerCase();
                return turn.message.toLowerCase().includes(keyword);
            
            case 'duration_exceeded':
                if (typeof turn.durationSeconds === 'number') {
                    return turn.durationSeconds > (config.duration || 300);
                }
                if (session.started_at) {
                    const duration = (new Date().getTime() - new Date(session.started_at).getTime()) / 1000;
                    return duration > (config.duration || 300);
                }
                return false;

            case 'intent_detected':
                return (session.intent || '').toLowerCase() === (config.intent || '').toLowerCase();

            case 'call_outcome':
                return (turn.callOutcome || session.outcome || '').toLowerCase() === (config.outcome || '').toLowerCase();

            default:
                return false;
        }
    }

    /**
     * Execute action mapped by rule match
     */
    private async executeAction(rule: any, session: any): Promise<void> {
        const config = rule.action_config || {};
        console.log(`[Automation] Rule Triggered: ${rule.id} | Action: ${rule.action_type}`);

        try {
            switch (rule.action_type) {
                case 'create_ticket':
                    await pool.query(
                        `INSERT INTO support_tickets (workspace_id, session_id, subject, status)
                         VALUES ($1, $2, $3, 'open')`,
                        [session.workspace_id, session.id, config.subject || 'Automated Rule Ticket']
                    );
                    await logAutomationAction({
                        workspaceId: session.workspace_id,
                        agentId: session.agent_id,
                        sessionId: session.id,
                        ruleId: rule.id,
                        actionType: rule.action_type,
                        status: 'success',
                        payload: { subject: config.subject || 'Automated Rule Ticket' },
                    });
                    break;
                
                case 'escalate_to_human':
                    await pool.query(
                        `UPDATE conversation_sessions 
                         SET outcome = 'escalated'
                         WHERE id = $1`,
                        [session.id]
                    );
                    await logAutomationAction({
                        workspaceId: session.workspace_id,
                        agentId: session.agent_id,
                        sessionId: session.id,
                        ruleId: rule.id,
                        actionType: rule.action_type,
                        status: 'success',
                        payload: { outcome: 'escalated' },
                    });
                    break;

                case 'send_sms':
                    const smsResult = await sendWorkspaceSms({
                        workspaceId: session.workspace_id,
                        to: session.customer_phone,
                        body: config.message || 'Alert',
                    });

                    await logAutomationAction({
                        workspaceId: session.workspace_id,
                        agentId: session.agent_id,
                        sessionId: session.id,
                        ruleId: rule.id,
                        actionType: rule.action_type,
                        status: smsResult.status,
                        payload: {
                            to: session.customer_phone,
                            from: smsResult.from,
                            provider: smsResult.provider,
                            sid: smsResult.sid,
                            message: config.message || 'Alert',
                        },
                        errorMessage: smsResult.error || null,
                    });

                    if (smsResult.status === 'sent') {
                        console.log(`[Automation] SMS sent to ${session.customer_phone} via ${smsResult.provider}`);
                    } else {
                        console.warn(`[Automation] SMS not sent for session ${session.id}: ${smsResult.error || smsResult.status}`);
                    }
                    break;

                case 'tag_customer':
                    const tagResult = await this.tagCustomer(session, config.tag || 'automation');
                    await logAutomationAction({
                        workspaceId: session.workspace_id,
                        agentId: session.agent_id,
                        sessionId: session.id,
                        ruleId: rule.id,
                        actionType: rule.action_type,
                        status: tagResult.status,
                        payload: {
                            customerId: tagResult.customerId,
                            phone: session.customer_phone,
                            tag: config.tag || 'automation',
                        },
                        errorMessage: tagResult.error || null,
                    });
                    break;

                default:
                    await logAutomationAction({
                        workspaceId: session.workspace_id,
                        agentId: session.agent_id,
                        sessionId: session.id,
                        ruleId: rule.id,
                        actionType: rule.action_type,
                        status: 'skipped',
                        payload: { reason: 'Unsupported action type' },
                    });
                    break;
            }
        } catch (error: any) {
             console.error(`[Automation] Execution failed for rule ${rule.id}:`, error.message);
             await logAutomationAction({
                workspaceId: session.workspace_id,
                agentId: session.agent_id,
                sessionId: session.id,
                ruleId: rule.id,
                actionType: rule.action_type,
                status: 'failed',
                payload: { actionConfig: config },
                errorMessage: error.message,
             });
        }
    }

    private async tagCustomer(session: any, tag: string): Promise<{ status: 'success' | 'failed'; customerId?: string; error?: string }> {
        const normalizedTag = `${tag || ''}`.trim();
        if (!normalizedTag) {
            return { status: 'failed', error: 'Customer tag is empty.' };
        }

        try {
            if (session.customer_id) {
                const result = await pool.query(
                    `UPDATE customers
                     SET tags = CASE
                            WHEN $2 = ANY(tags) THEN tags
                            ELSE array_append(tags, $2)
                         END,
                         updated_at = NOW(),
                         last_contact_at = NOW()
                     WHERE id = $1
                     RETURNING id`,
                    [session.customer_id, normalizedTag]
                );

                if (result.rows.length > 0) {
                    return { status: 'success', customerId: result.rows[0].id };
                }
            }

            if (!session.customer_phone) {
                return { status: 'failed', error: 'Customer phone number is unavailable for tagging.' };
            }

            const result = await pool.query(
                `INSERT INTO customers (workspace_id, phone, name, tags, last_contact_at, total_calls)
                 VALUES ($1, $2, 'Unknown', ARRAY[$3]::text[], NOW(), 1)
                 ON CONFLICT (workspace_id, phone)
                 DO UPDATE SET
                    tags = CASE
                        WHEN $3 = ANY(customers.tags) THEN customers.tags
                        ELSE array_append(customers.tags, $3)
                    END,
                    updated_at = NOW(),
                    last_contact_at = NOW(),
                    total_calls = customers.total_calls + 1
                 RETURNING id`,
                [session.workspace_id, session.customer_phone, normalizedTag]
            );

            if (result.rows.length === 0) {
                return { status: 'failed', error: 'Customer tagging did not return a record.' };
            }

            return { status: 'success', customerId: result.rows[0].id };
        } catch (error: any) {
            return { status: 'failed', error: error.message };
        }
    }
}
