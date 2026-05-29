import type { FastifyInstance } from 'fastify';
import { pool } from '../../config/db.js';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SUPPORTED_EXECUTION_MODES = new Set(['continue', 'stop_on_match']);
const SUPPORTED_STEP_FAILURE_POLICIES = new Set(['retry', 'skip', 'stop']);

function asRecord(value: any): Record<string, any> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value;
}

function normalizeServiceIdConditionValue(value: any) {
  if (Array.isArray(value)) {
    const normalizedValues = value
      .map((entry) => String(entry || '').trim())
      .filter(Boolean);

    if (normalizedValues.length === 0) {
      throw new Error('conditions.service_id array must contain at least one UUID');
    }

    for (const entry of normalizedValues) {
      if (!UUID_REGEX.test(entry)) {
        throw new Error('conditions.service_id must be a UUID or UUID array');
      }
    }

    return normalizedValues;
  }

  const normalized = String(value || '').trim();
  if (!UUID_REGEX.test(normalized)) {
    throw new Error('conditions.service_id must be a UUID or UUID array');
  }

  return normalized;
}

function normalizeRuleConditions(triggerType: string | null | undefined, raw: any) {
  const source = asRecord(raw);

  if (triggerType !== 'appointment_created') {
    return source;
  }

  const normalized: Record<string, any> = {};

  for (const [rawKey, rawValue] of Object.entries(source)) {
    const key = rawKey === 'serviceId' ? 'service_id' : rawKey;

    if (key !== 'service_id') {
      throw new Error(`Invalid condition key "${rawKey}". appointment_created only supports service_id.`);
    }

    normalized.service_id = normalizeServiceIdConditionValue(rawValue);
  }

  return normalized;
}

function normalizeDelayUntilTimestamp(value: any, path: string) {
  if (value === undefined || value === null || String(value).trim() === '') {
    throw new Error(`${path} is required and must be an ISO timestamp`);
  }

  const parsed = new Date(String(value).trim());
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${path} must be a valid ISO timestamp`);
  }

  return parsed.toISOString();
}

function normalizeActionConfig(raw: any) {
  const source = asRecord(raw);
  const normalized: Record<string, any> = {
    ...source,
  };

  const normalizeStepFailurePolicy = (value: any, path: string) => {
    if (value === undefined || value === null || String(value).trim() === '') {
      return null;
    }

    const normalizedPolicy = String(value).trim().toLowerCase();
    if (!SUPPORTED_STEP_FAILURE_POLICIES.has(normalizedPolicy)) {
      throw new Error(`${path} must be one of: retry, skip, stop`);
    }

    return normalizedPolicy;
  };

  const normalizeStepCondition = (value: any, path: string) => {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new Error(`${path} must be an object`);
    }

    return value;
  };

  if (Object.prototype.hasOwnProperty.call(source, 'actions')) {
    if (!Array.isArray(source.actions) || source.actions.length === 0) {
      throw new Error('actionConfig.actions must be a non-empty array when provided');
    }

    normalized.actions = source.actions.map((rawStep: any, index: number) => {
      const step = asRecord(rawStep);
      const stepType = String(step.type || '').trim();

      if (!stepType) {
        throw new Error(`actionConfig.actions[${index}].type is required`);
      }

      if (stepType === 'delay') {
        const secondsRaw = step.seconds ?? step.delay_seconds ?? step.delaySeconds;
        const seconds = Number(secondsRaw);

        if (!Number.isFinite(seconds) || seconds < 0) {
          throw new Error(`actionConfig.actions[${index}].seconds must be a non-negative number`);
        }

        return {
          type: 'delay',
          seconds: Math.trunc(seconds),
        };
      }

      if (stepType === 'delay_until') {
        const timestamp = normalizeDelayUntilTimestamp(
          step.timestamp ?? step.delay_until ?? step.delayUntil,
          `actionConfig.actions[${index}].timestamp`
        );

        return {
          type: 'delay_until',
          timestamp,
        };
      }

      const mergedConfig: Record<string, any> = {
        ...asRecord(step.config),
      };

      for (const [rawKey, rawValue] of Object.entries(step)) {
        if (
          rawKey === 'type' ||
          rawKey === 'config' ||
          rawKey === 'seconds' ||
          rawKey === 'delay_seconds' ||
          rawKey === 'delaySeconds'
        ) {
          continue;
        }

        if (!Object.prototype.hasOwnProperty.call(mergedConfig, rawKey)) {
          mergedConfig[rawKey] = rawValue;
        }
      }

      const hasStepDelayInput =
        Object.prototype.hasOwnProperty.call(step, 'delay_seconds') ||
        Object.prototype.hasOwnProperty.call(step, 'delaySeconds') ||
        Object.prototype.hasOwnProperty.call(mergedConfig, 'delay_seconds') ||
        Object.prototype.hasOwnProperty.call(mergedConfig, 'delaySeconds');

      if (hasStepDelayInput) {
        const delayRaw =
          mergedConfig.delay_seconds ??
          mergedConfig.delaySeconds ??
          step.delay_seconds ??
          step.delaySeconds;
        const stepDelay = Number(delayRaw);

        if (!Number.isFinite(stepDelay) || stepDelay < 0) {
          throw new Error(`actionConfig.actions[${index}].delay_seconds must be a non-negative number`);
        }

        mergedConfig.delay_seconds = Math.trunc(stepDelay);
      }

      const stepFailurePolicy = normalizeStepFailurePolicy(
        mergedConfig.on_failure ?? mergedConfig.onFailure ?? step.on_failure ?? step.onFailure,
        `actionConfig.actions[${index}].on_failure`
      );
      if (stepFailurePolicy) {
        mergedConfig.on_failure = stepFailurePolicy;
      }

      const stepCondition = normalizeStepCondition(
        mergedConfig.condition ?? step.condition,
        `actionConfig.actions[${index}].condition`
      );
      if (stepCondition) {
        mergedConfig.condition = stepCondition;
      }

      delete mergedConfig.delaySeconds;
      delete mergedConfig.onFailure;

      return {
        type: stepType,
        config: mergedConfig,
      };
    });
  }

  const topLevelFailurePolicy = normalizeStepFailurePolicy(
    source.on_failure ?? source.onFailure,
    'actionConfig.on_failure'
  );
  if (topLevelFailurePolicy) {
    normalized.on_failure = topLevelFailurePolicy;
  }

  const topLevelCondition = normalizeStepCondition(source.condition, 'actionConfig.condition');
  if (topLevelCondition) {
    normalized.condition = topLevelCondition;
  }

  const hasDelayInput =
    Object.prototype.hasOwnProperty.call(source, 'delay_seconds') ||
    Object.prototype.hasOwnProperty.call(source, 'delaySeconds');

  const hasDelayUntilInput =
    Object.prototype.hasOwnProperty.call(source, 'delay_until') ||
    Object.prototype.hasOwnProperty.call(source, 'delayUntil');

  if (hasDelayInput && hasDelayUntilInput) {
    throw new Error('actionConfig cannot define both delay_seconds and delay_until');
  }

  if (hasDelayUntilInput) {
    normalized.delay_until = normalizeDelayUntilTimestamp(
      source.delay_until ?? source.delayUntil,
      'actionConfig.delay_until'
    );
  }

  if (!hasDelayInput) {
    delete normalized.delaySeconds;
    delete normalized.delayUntil;
    delete normalized.onFailure;
    return normalized;
  }

  const delayRaw = source.delay_seconds ?? source.delaySeconds;
  const delay = Number(delayRaw);

  if (!Number.isFinite(delay) || delay < 0) {
    throw new Error('actionConfig.delay_seconds must be a non-negative number');
  }

  normalized.delay_seconds = Math.trunc(delay);
  delete normalized.delaySeconds;
  delete normalized.delayUntil;
  delete normalized.onFailure;

  return normalized;
}

function normalizeExecutionMode(value: any, fallback: 'continue' | 'stop_on_match' = 'continue') {
  if (value === undefined || value === null || String(value).trim() === '') {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (!SUPPORTED_EXECUTION_MODES.has(normalized)) {
    throw new Error('executionMode must be one of: continue, stop_on_match');
  }

  return normalized as 'continue' | 'stop_on_match';
}

function resolveRuleActionType(
  actionType: any,
  actionConfig: Record<string, any>,
  fallback?: string | null
) {
  const normalizedActionType = String(actionType || '').trim();
  if (normalizedActionType) {
    return normalizedActionType;
  }

  if (Array.isArray(actionConfig.actions) && actionConfig.actions.length > 0) {
    return 'workflow_chain';
  }

  const normalizedFallback = String(fallback || '').trim();
  if (normalizedFallback) {
    return normalizedFallback;
  }

  throw new Error('actionType is required when actionConfig.actions is not provided');
}

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

  app.get('/workflow-runs/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { workspaceId } = request.query as any;

      if (!UUID_REGEX.test(String(id || '').trim())) {
        return reply.status(400).send({ error: 'Invalid workflow run id' });
      }

      const runResult = await pool.query(
        `SELECT wr.*,
                e.event_type,
                e.payload AS event_payload,
                e.created_at AS event_created_at,
                r.trigger_type,
                r.action_type AS rule_action_type,
                r.action_config AS rule_action_config,
                r.execution_mode AS rule_execution_mode
         FROM workflow_runs wr
         JOIN execution_events e ON e.id = wr.event_id
         JOIN automation_rules r ON r.id = wr.rule_id
         WHERE wr.id = $1::uuid
           AND ($2::text IS NULL OR wr.workspace_id = $2)
         LIMIT 1`,
        [id, workspaceId || null]
      );

      if (runResult.rows.length === 0) {
        return reply.status(404).send({ error: 'Workflow run not found' });
      }

      const run = runResult.rows[0];

      const [stepRefsResult, stepLogsResult, actionLogsResult] = await Promise.all([
        pool.query(
          `SELECT step_index,
                  action_type,
                  status,
                  queue_job_id,
                  delay_bucket_seconds,
                  scheduled_for,
                  executed_at,
                  cancelled_at,
                  error_message,
                  created_at,
                  updated_at
           FROM automation_job_refs
           WHERE workflow_run_id = $1::uuid
           ORDER BY step_index ASC`,
          [id]
        ),
        pool.query(
          `SELECT step_index,
                  action_type,
                  status,
                  input,
                  output,
                  error,
                  created_at
           FROM workflow_step_logs
           WHERE workflow_run_id = $1::uuid
           ORDER BY created_at ASC`,
          [id]
        ),
        pool.query(
          `SELECT id,
                  action_type,
                  status,
                  payload,
                  error_message,
                  created_at
           FROM automation_action_logs
           WHERE workspace_id = $1
             AND rule_id = $2::uuid
             AND COALESCE(payload->>'workflowRunId', '') = $3
           ORDER BY created_at ASC`,
          [run.workspace_id, run.rule_id, id]
        ),
      ]);

      return {
        success: true,
        data: {
          run,
          stepRefs: stepRefsResult.rows,
          stepLogs: stepLogsResult.rows,
          actionLogs: actionLogsResult.rows,
        },
      };
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
        conditions,
        actionType,
        actionConfig,
        scope,
        priority,
        cooldownSeconds,
        eventType,
        triggerEvent,
        isTerminal,
        executionMode,
      } = request.body as any;

      const rawConditions = conditions ?? conditionConfig ?? {};
      let normalizedConditions: Record<string, any>;
      try {
        normalizedConditions = normalizeRuleConditions(triggerType, rawConditions);
      } catch (validationError: any) {
        return reply.status(400).send({ error: validationError.message });
      }

      let normalizedActionConfig: Record<string, any>;
      try {
        normalizedActionConfig = normalizeActionConfig(actionConfig || {});
      } catch (validationError: any) {
        return reply.status(400).send({ error: validationError.message });
      }

      let normalizedExecutionMode: 'continue' | 'stop_on_match';
      try {
        normalizedExecutionMode = normalizeExecutionMode(executionMode, 'continue');
      } catch (validationError: any) {
        return reply.status(400).send({ error: validationError.message });
      }

      let resolvedActionType: string;
      try {
        resolvedActionType = resolveRuleActionType(actionType, normalizedActionConfig);
      } catch (validationError: any) {
        return reply.status(400).send({ error: validationError.message });
      }

      const resolvedIsTerminal =
        Object.prototype.hasOwnProperty.call(request.body || {}, 'isTerminal')
          ? Boolean(isTerminal)
          : normalizedExecutionMode === 'stop_on_match';

      const resolvedScope = resolveRuleScope({ scope, agentId, campaignId });
      const resolvedEventType =
        eventType ??
        triggerEvent ??
        (triggerType === 'appointment_created' ? 'appointment.created' : null);

      const result = await pool.query(
        `INSERT INTO automation_rules (
           workspace_id,
           agent_id,
           campaign_id,
           scope,
           trigger_type,
           condition_config,
           conditions,
           action_type,
           action_config,
           priority,
           cooldown_seconds,
           event_type,
           is_terminal,
           execution_mode
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING *`,
        [
          workspaceId,
          agentId || null,
          campaignId || null,
          resolvedScope,
          triggerType,
          JSON.stringify(normalizedConditions),
          JSON.stringify(normalizedConditions),
          resolvedActionType,
          JSON.stringify(normalizedActionConfig),
          priority ?? 100,
          cooldownSeconds ?? 0,
          resolvedEventType,
          resolvedIsTerminal,
          normalizedExecutionMode,
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
        conditions,
        actionType,
        actionConfig,
        isActive,
        agentId,
        campaignId,
        scope,
        priority,
        cooldownSeconds,
        eventType,
        triggerEvent,
        isTerminal,
        executionMode,
      } = request.body as any;

      const hasConditionInput =
        Object.prototype.hasOwnProperty.call(request.body || {}, 'conditions') ||
        Object.prototype.hasOwnProperty.call(request.body || {}, 'conditionConfig');

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
      const nextTriggerType = triggerType ?? current.trigger_type;
      const nextEventType =
        eventType ??
        triggerEvent ??
        (current.event_type ?? (nextTriggerType === 'appointment_created' ? 'appointment.created' : null));

      const baseConditionSource = hasConditionInput
        ? (conditions ?? conditionConfig ?? {})
        : (current.conditions ?? current.condition_config ?? {});
      let normalizedConditions: Record<string, any>;
      try {
        normalizedConditions = normalizeRuleConditions(nextTriggerType, baseConditionSource);
      } catch (validationError: any) {
        return reply.status(400).send({ error: validationError.message });
      }

      const baseActionConfig = actionConfig ?? current.action_config ?? {};
      let normalizedActionConfig: Record<string, any>;
      try {
        normalizedActionConfig = normalizeActionConfig(baseActionConfig);
      } catch (validationError: any) {
        return reply.status(400).send({ error: validationError.message });
      }

      let normalizedExecutionMode: 'continue' | 'stop_on_match';
      try {
        normalizedExecutionMode = normalizeExecutionMode(
          executionMode,
          (current.execution_mode || (current.is_terminal ? 'stop_on_match' : 'continue'))
        );
      } catch (validationError: any) {
        return reply.status(400).send({ error: validationError.message });
      }

      let resolvedActionType: string;
      try {
        resolvedActionType = resolveRuleActionType(
          actionType,
          normalizedActionConfig,
          current.action_type
        );
      } catch (validationError: any) {
        return reply.status(400).send({ error: validationError.message });
      }

      const resolvedIsTerminal =
        Object.prototype.hasOwnProperty.call(request.body || {}, 'isTerminal')
          ? Boolean(isTerminal)
          : normalizedExecutionMode === 'stop_on_match';

      const result = await pool.query(
        `UPDATE automation_rules
         SET trigger_type = $1,
             condition_config = $2,
             conditions = $3,
             action_type = $4,
             action_config = $5,
             is_active = $6,
             agent_id = $7,
             campaign_id = $8,
             scope = $9,
             priority = $10,
             cooldown_seconds = $11,
             event_type = $12,
             is_terminal = $13,
             execution_mode = $14,
             updated_at = NOW()
         WHERE id = $15
         RETURNING *`,
        [
          nextTriggerType,
          JSON.stringify(normalizedConditions),
          JSON.stringify(normalizedConditions),
          resolvedActionType,
          JSON.stringify(normalizedActionConfig),
          isActive ?? current.is_active,
          nextAgentId,
          nextCampaignId,
          nextScope,
          priority ?? current.priority ?? 100,
          cooldownSeconds ?? current.cooldown_seconds ?? 0,
          nextEventType,
          resolvedIsTerminal,
          normalizedExecutionMode,
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
