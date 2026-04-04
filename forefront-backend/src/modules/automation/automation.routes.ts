import type { FastifyInstance } from 'fastify';
import { pool } from '../../config/db.js';

function resolveRuleScope(input: { scope?: string; agentId?: string | null; campaignId?: string | null }) {
  if (input.scope) {
    return input.scope;
  }
  if (input.campaignId) {
    return 'campaign';
  }
  if (input.agentId) {
    return 'agent';
  }
  return 'workspace';
}

export default async function automationRoutes(app: FastifyInstance) {
  app.get('/rules', async (request, reply) => {
    try {
      const { workspaceId, agentId, campaignId } = request.query as any;

      let query = `SELECT r.*, va.name AS agent_name
                   FROM automation_rules r
                   LEFT JOIN voice_agents va ON va.id = r.agent_id
                   WHERE r.workspace_id = $1`;
      const params: any[] = [workspaceId];

      if (agentId) {
        params.push(agentId);
        query += ` AND (r.agent_id = $${params.length} OR COALESCE(r.scope, 'workspace') = 'workspace')`;
      }

      if (campaignId) {
        params.push(campaignId);
        query += ` AND (r.campaign_id = $${params.length} OR COALESCE(r.scope, 'workspace') IN ('workspace', 'agent'))`;
      }

      query += ' ORDER BY COALESCE(r.priority, 100) ASC, r.created_at DESC';

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
      const {
        workspaceId,
        agentId,
        campaignId,
        triggerType,
        conditionConfig,
        actionType,
        actionConfig,
        scope,
        priority,
        cooldownSeconds,
        eventType,
        isTerminal,
      } = request.body as any;

      const resolvedScope = resolveRuleScope({ scope, agentId, campaignId });

      const result = await pool.query(
        `INSERT INTO automation_rules (
           workspace_id,
           agent_id,
           campaign_id,
           scope,
           trigger_type,
           condition_config,
           action_type,
           action_config,
           priority,
           cooldown_seconds,
           event_type,
           is_terminal
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          workspaceId,
          agentId || null,
          campaignId || null,
          resolvedScope,
          triggerType,
          JSON.stringify(conditionConfig || {}),
          actionType,
          JSON.stringify(actionConfig || {}),
          priority ?? 100,
          cooldownSeconds ?? 0,
          eventType || null,
          Boolean(isTerminal),
        ]
      );

      return { success: true, data: result.rows[0] };
    } catch (e: any) {
      reply.status(500).send({ error: e.message });
    }
  });

  app.put('/rules/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const {
        triggerType,
        conditionConfig,
        actionType,
        actionConfig,
        isActive,
        agentId,
        campaignId,
        scope,
        priority,
        cooldownSeconds,
        eventType,
        isTerminal,
      } = request.body as any;

      const existing = await pool.query(
        'SELECT * FROM automation_rules WHERE id = $1 LIMIT 1',
        [id]
      );

      if (existing.rows.length === 0) {
        return reply.status(404).send({ error: 'Rule not found' });
      }

      const current = existing.rows[0];
      const nextAgentId = agentId === undefined ? current.agent_id : (agentId || null);
      const nextCampaignId = campaignId === undefined ? current.campaign_id : (campaignId || null);
      const nextScope = resolveRuleScope({
        scope: scope ?? current.scope,
        agentId: nextAgentId,
        campaignId: nextCampaignId,
      });

      const result = await pool.query(
        `UPDATE automation_rules
         SET trigger_type = $1,
             condition_config = $2,
             action_type = $3,
             action_config = $4,
             is_active = $5,
             agent_id = $6,
             campaign_id = $7,
             scope = $8,
             priority = $9,
             cooldown_seconds = $10,
             event_type = $11,
             is_terminal = $12,
             updated_at = NOW()
         WHERE id = $13
         RETURNING *`,
        [
          triggerType ?? current.trigger_type,
          JSON.stringify(conditionConfig ?? current.condition_config ?? {}),
          actionType ?? current.action_type,
          JSON.stringify(actionConfig ?? current.action_config ?? {}),
          isActive ?? current.is_active,
          nextAgentId,
          nextCampaignId,
          nextScope,
          priority ?? current.priority ?? 100,
          cooldownSeconds ?? current.cooldown_seconds ?? 0,
          eventType === undefined ? current.event_type : (eventType || null),
          isTerminal ?? current.is_terminal ?? false,
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
