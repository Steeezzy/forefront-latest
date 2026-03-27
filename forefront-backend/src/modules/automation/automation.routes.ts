import type { FastifyInstance } from 'fastify';
import { pool } from '../../config/db.js';

export default async function automationRoutes(app: FastifyInstance) {
    
    app.get('/rules', async (request, reply) => {
        try {
            const { workspaceId, agentId } = request.query as any;

            let query = `SELECT r.*, va.name AS agent_name
                         FROM automation_rules r
                         LEFT JOIN voice_agents va ON va.id = r.agent_id
                         WHERE r.workspace_id = $1`;
            const params: any[] = [workspaceId];

            if (agentId) {
                query += ' AND r.agent_id = $2';
                params.push(agentId);
1            }

            query += ' ORDER BY r.created_at DESC';

            const result = await pool.query(query, params);
            return { success: true, data: result.rows };
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    app.get('/logs', async (request, reply) => {
        try {
            const { workspaceId, limit } = request.query as any;
            const result = await pool.query(
                `SELECT l.*, va.name AS agent_name
                 FROM automation_action_logs l
                 LEFT JOIN voice_agents va ON va.id = l.agent_id
                 WHERE l.workspace_id = $1
                 ORDER BY l.created_at DESC
                 LIMIT $2`,
                [workspaceId, parseInt(limit) || 50]
            );

            return { success: true, data: result.rows };
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    app.post('/rules', async (request, reply) => {
        try {
            const { workspaceId, agentId, triggerType, conditionConfig, actionType, actionConfig } = request.body as any;

            const result = await pool.query(
                `INSERT INTO automation_rules (workspace_id, agent_id, trigger_type, condition_config, action_type, action_config)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [workspaceId, agentId || null, triggerType, JSON.stringify(conditionConfig), actionType, JSON.stringify(actionConfig)]
            );

            return { success: true, data: result.rows[0] };
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    app.put('/rules/:id', async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const { triggerType, conditionConfig, actionType, actionConfig, isActive, agentId } = request.body as any;

            const existing = await pool.query(
                'SELECT * FROM automation_rules WHERE id = $1 LIMIT 1',
                [id]
            );

            if (existing.rows.length === 0) {
                return reply.status(404).send({ error: 'Rule not found' });
            }

            const current = existing.rows[0];

            const result = await pool.query(
                `UPDATE automation_rules 
                 SET trigger_type = $1,
                     condition_config = $2,
                     action_type = $3,
                     action_config = $4,
                     is_active = $5,
                     agent_id = $6,
                     updated_at = NOW()
                 WHERE id = $7 RETURNING *`,
                [
                    triggerType ?? current.trigger_type,
                    JSON.stringify(conditionConfig ?? current.condition_config ?? {}),
                    actionType ?? current.action_type,
                    JSON.stringify(actionConfig ?? current.action_config ?? {}),
                    isActive ?? current.is_active,
                    agentId === undefined ? current.agent_id : (agentId || null),
                    id,
                ]
            );

            return { success: true, data: result.rows[0] };
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    app.delete('/rules/:id', async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            await pool.query('DELETE FROM automation_rules WHERE id = $1', [id]);
            return { success: true };
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });
}
