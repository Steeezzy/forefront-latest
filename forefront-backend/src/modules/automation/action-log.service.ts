import { pool } from '../../config/db.js';

interface AutomationActionLogInput {
    workspaceId: string;
    agentId?: string | null;
    sessionId?: string | null;
    ruleId?: string | null;
    actionType: string;
    status: 'sent' | 'success' | 'failed' | 'needs_setup' | 'skipped';
    payload?: Record<string, unknown>;
    errorMessage?: string | null;
}

export async function logAutomationAction(input: AutomationActionLogInput): Promise<void> {
    try {
        await pool.query(
            `INSERT INTO automation_action_logs (
                workspace_id, agent_id, session_id, rule_id, action_type, status, payload, error_message
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                input.workspaceId,
                input.agentId || null,
                input.sessionId || null,
                input.ruleId || null,
                input.actionType,
                input.status,
                JSON.stringify(input.payload || {}),
                input.errorMessage || null,
            ]
        );
    } catch (error: any) {
        console.error('[Automation] Failed to persist action log:', error.message);
    }
}
