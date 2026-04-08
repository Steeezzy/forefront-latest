import { pool } from '../../config/db.js';

export interface ProvisionAutomationRuleBlueprint {
    name?: string;
    triggerType: string;
    conditionConfig?: Record<string, unknown>;
    actionType: string;
    actionConfig?: Record<string, unknown>;
}

interface ProvisionAutomationInput {
    workspaceId: string;
    agentId: string;
    rules?: ProvisionAutomationRuleBlueprint[];
}

export async function provisionAutomationBlueprint(input: ProvisionAutomationInput): Promise<number> {
    const rules = input.rules || [];

    if (!input.workspaceId || !input.agentId || rules.length === 0) {
        return 0;
    }

    let created = 0;

    for (const rule of rules) {
        const existing = await pool.query(
            `SELECT id
             FROM automation_rules
             WHERE workspace_id = $1 AND agent_id = $2 AND trigger_type = $3 AND action_type = $4
             LIMIT 1`,
            [input.workspaceId, input.agentId, rule.triggerType, rule.actionType]
        );

        if (existing.rows.length > 0) {
            continue;
        }

        await pool.query(
            `INSERT INTO automation_rules (workspace_id, agent_id, trigger_type, condition_config, conditions, action_type, action_config)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                input.workspaceId,
                input.agentId,
                rule.triggerType,
                JSON.stringify(rule.conditionConfig || {}),
                JSON.stringify(rule.conditionConfig || {}),
                rule.actionType,
                JSON.stringify({
                    ...(rule.actionConfig || {}),
                    blueprint_name: rule.name || null,
                    source: 'template_provisioning',
                }),
            ]
        );

        created += 1;
    }

    return created;
}
