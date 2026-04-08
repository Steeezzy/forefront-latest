import { randomUUID } from 'node:crypto';
import { pool } from '../../config/db.js';
import { logAutomationAction } from './action-log.service.js';
import { appendWorkflowStepLog as appendWorkflowStepLogBuffered } from './workflow-step-log.service.js';
import { sendWorkspaceSms } from './sms.service.js';
import { markExecutionEventProcessed, publishExecutionEvent } from '../../services/execution-events.service.js';
import { automationActionsQueue, orchestratorQueue } from '../../queues/execution-queues.js';

type AutomationContext = {
  executionEventId?: string | null;
  workflowRunId?: string | null;
  workspaceId: string;
  agentId?: string | null;
  campaignId?: string | null;
  campaignContactId?: string | null;
  campaignJobId?: string | null;
  sessionId?: string | null;
  customerId?: string | null;
  customerPhone?: string | null;
  message: string;
  role?: string;
  sentimentScore?: number;
  callOutcome?: string;
  durationSeconds?: number;
  intent?: string | null;
  entities?: Record<string, any>;
  eventType?: string;
  payload?: Record<string, any>;
  actionStepIndex?: number;
  actionDelaySeconds?: number;
};

type ActionExecutionStatus = 'sent' | 'success' | 'failed' | 'needs_setup' | 'skipped';

type ActionExecutionResult = {
  status: ActionExecutionStatus;
  error: string | null;
};

type ResolvedRuleActionStep = {
  stepIndex: number;
  actionType: string;
  actionConfig: Record<string, any>;
  delaySeconds: number;
};

type WorkflowRunStatus = 'running' | 'completed' | 'failed' | 'cancelled';

type WorkflowStepStatus = 'scheduled' | 'executing' | 'executed' | 'failed' | 'skipped' | 'cancelled';

const SUPPORTED_STEP_FAILURE_POLICIES = new Set(['retry', 'skip', 'stop']);
const CUSTOMER_REPLY_EVENT_TYPES = [
  'customer.replied',
  'message.received',
  'chat.message.received',
  'whatsapp.message.received',
  'instagram.message.received',
  'facebook.message.received',
  'email.received',
  'call.turn.completed',
];

function parseJsonObject(value: any) {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  return typeof value === 'object' ? value : {};
}

function getNestedValue(source: any, path: string) {
  if (!source || typeof source !== 'object' || !path) {
    return undefined;
  }

  const segments = path.split('.').map((segment) => segment.trim()).filter(Boolean);
  if (segments.length === 0) {
    return undefined;
  }

  let current: any = source;
  for (const segment of segments) {
    if (!current || typeof current !== 'object') {
      return undefined;
    }

    current = current[segment];
  }

  return current;
}

function getScopeRank(scope?: string | null) {
  if (scope === 'campaign') return 0;
  if (scope === 'agent') return 1;
  return 2;
}

function evaluateConditions(conditions: Record<string, any>, payload: Record<string, any>) {
  if (!conditions || Object.keys(conditions).length === 0) return true;

  for (const key in conditions) {
    const expected = conditions[key];
    const actual = payload[key];

    if (Array.isArray(expected)) {
      if (!expected.includes(actual)) return false;
    } else {
      if (actual !== expected) return false;
    }
  }

  return true;
}

function normalizeDelaySeconds(value: any) {
  const delay = Number(value);
  if (!Number.isFinite(delay) || delay <= 0) {
    return 0;
  }

  return Math.trunc(delay);
}

function normalizeDelayUntilTimestamp(value: any) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return null;
  }

  const parsed = new Date(String(value).trim());
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function resolveDelayUntilSeconds(timestamp: string | null, nowMs: number) {
  if (!timestamp) {
    return 0;
  }

  const targetMs = new Date(timestamp).getTime();
  if (!Number.isFinite(targetMs)) {
    return 0;
  }

  const diffMs = targetMs - nowMs;
  if (diffMs <= 0) {
    return 0;
  }

  return Math.ceil(diffMs / 1000);
}

function resolveAppointmentIdFromPayload(payload?: Record<string, any>) {
  const appointmentId = payload?.appointment_id || payload?.appointmentId || null;
  if (!appointmentId) {
    return null;
  }

  return String(appointmentId);
}

function sanitizeActionStepConfig(step: Record<string, any>) {
  const fromConfig = parseJsonObject(step.config);
  const normalized: Record<string, any> = {
    ...fromConfig,
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

    if (!Object.prototype.hasOwnProperty.call(normalized, rawKey)) {
      normalized[rawKey] = rawValue;
    }
  }

  return normalized;
}

function resolveRuleActionSteps(rule: any): ResolvedRuleActionStep[] {
  const actionConfig = parseJsonObject(rule.action_config);
  const workflowSteps = Array.isArray(actionConfig.actions) ? actionConfig.actions : null;
  const nowMs = Date.now();

  if (!workflowSteps || workflowSteps.length === 0) {
    const fallbackActionType = String(rule.action_type || '').trim();
    if (!fallbackActionType) {
      return [];
    }

    const legacyDelay = normalizeDelaySeconds(actionConfig.delay_seconds ?? actionConfig.delaySeconds);
    const absoluteDelay = resolveDelayUntilSeconds(
      normalizeDelayUntilTimestamp(actionConfig.delay_until ?? actionConfig.delayUntil),
      nowMs
    );

    return [
      {
        stepIndex: 0,
        actionType: fallbackActionType,
        actionConfig,
        delaySeconds: Math.max(legacyDelay, absoluteDelay),
      },
    ];
  }

  const resolved: ResolvedRuleActionStep[] = [];
  let cumulativeDelay = 0;
  let actionStepIndex = 0;

  for (const rawStep of workflowSteps) {
    if (!rawStep || typeof rawStep !== 'object' || Array.isArray(rawStep)) {
      continue;
    }

    const step = rawStep as Record<string, any>;
    const stepType = String(step.type || '').trim();
    if (!stepType) {
      continue;
    }

    if (stepType === 'delay') {
      const delaySeconds = normalizeDelaySeconds(
        step.seconds ?? step.delay_seconds ?? step.delaySeconds
      );
      cumulativeDelay += delaySeconds;
      continue;
    }

    if (stepType === 'delay_until') {
      const timestamp = normalizeDelayUntilTimestamp(
        step.timestamp ?? step.delay_until ?? step.delayUntil
      );
      const absoluteDelaySeconds = resolveDelayUntilSeconds(timestamp, nowMs);
      cumulativeDelay = Math.max(cumulativeDelay, absoluteDelaySeconds);
      continue;
    }

    const stepConfig = sanitizeActionStepConfig(step);
    const stepDelaySeconds = normalizeDelaySeconds(
      stepConfig.delay_seconds ??
      stepConfig.delaySeconds ??
      step.delay_seconds ??
      step.delaySeconds
    );

    const stepDelayUntilTimestamp = normalizeDelayUntilTimestamp(
      stepConfig.delay_until ??
      stepConfig.delayUntil ??
      step.delay_until ??
      step.delayUntil
    );
    const stepAbsoluteDelaySeconds = resolveDelayUntilSeconds(stepDelayUntilTimestamp, nowMs);

    if (stepDelaySeconds > 0) {
      stepConfig.delay_seconds = stepDelaySeconds;
    }

    if (stepDelayUntilTimestamp) {
      stepConfig.delay_until = stepDelayUntilTimestamp;
    }

    delete stepConfig.delaySeconds;
    delete stepConfig.delayUntil;

    cumulativeDelay += stepDelaySeconds;
    cumulativeDelay = Math.max(cumulativeDelay, stepAbsoluteDelaySeconds);

    resolved.push({
      stepIndex: actionStepIndex,
      actionType: stepType,
      actionConfig: stepConfig,
      delaySeconds: cumulativeDelay,
    });
    actionStepIndex += 1;
  }

  if (resolved.length > 0) {
    return resolved;
  }

  const fallbackActionType = String(rule.action_type || '').trim();
  if (!fallbackActionType) {
    return [];
  }

  const legacyDelay = normalizeDelaySeconds(actionConfig.delay_seconds ?? actionConfig.delaySeconds);
  const absoluteDelay = resolveDelayUntilSeconds(
    normalizeDelayUntilTimestamp(actionConfig.delay_until ?? actionConfig.delayUntil),
    nowMs
  );

  return [
    {
      stepIndex: 0,
      actionType: fallbackActionType,
      actionConfig,
      delaySeconds: Math.max(legacyDelay, absoluteDelay),
    },
  ];
}

function resolveStepFailurePolicy(actionConfig: Record<string, any>) {
  const normalizedPolicy = String(
    actionConfig.on_failure ?? actionConfig.onFailure ?? 'retry'
  ).trim().toLowerCase();

  if (!SUPPORTED_STEP_FAILURE_POLICIES.has(normalizedPolicy)) {
    return 'retry';
  }

  return normalizedPolicy as 'retry' | 'skip' | 'stop';
}

export class AutomationEngine {
  async evaluate(
    sessionId: string,
    currentTurn: {
      message: string;
      role: string;
      sentimentScore?: number;
      callOutcome?: string;
      durationSeconds?: number;
      intent?: string | null;
      entities?: Record<string, any>;
      eventType?: string;
    }
  ): Promise<void> {
    try {
      const sessionResult = await pool.query(
        'SELECT * FROM conversation_sessions WHERE id = $1',
        [sessionId]
      );

      if (sessionResult.rows.length === 0) return;
      const session = sessionResult.rows[0];
      const metadata = parseJsonObject(session.metadata);

      await publishExecutionEvent(pool, {
        workspaceId: session.workspace_id,
        sessionId: session.id,
        campaignId: metadata.campaignId || null,
        customerId: session.customer_id || null,
        eventType: currentTurn.eventType || 'call.turn.completed',
        eventSource: 'orchestrator',
        payload: {
          ...metadata,
          campaignId: metadata.campaignId || null,
          campaignContactId: metadata.campaignContactId || null,
          campaignJobId: metadata.campaignJobId || null,
          customerId: session.customer_id || null,
          customerPhone: session.customer_phone || null,
          message: currentTurn.message,
          role: currentTurn.role,
          sentimentScore: currentTurn.sentimentScore,
          callOutcome: currentTurn.callOutcome || session.outcome,
          durationSeconds: currentTurn.durationSeconds,
          intent: currentTurn.intent || session.intent,
          entities: currentTurn.entities || {},
        },
      });
    } catch (error: any) {
      console.error('Automation evaluation error:', error.message);
    }
  }

  async processExecutionEvent(eventId: string) {
    const eventResult = await pool.query(
      `SELECT *
       FROM execution_events
       WHERE id = $1
       LIMIT 1`,
      [eventId]
    );

    const event = eventResult.rows[0];
    if (!event || event.status === 'processed') {
      return;
    }

    try {
      const payload = parseJsonObject(event.payload);
      const appointmentId = resolveAppointmentIdFromPayload(payload);
      let session: any = null;
      if (event.session_id) {
        const sessionResult = await pool.query(
          `SELECT *
           FROM conversation_sessions
           WHERE id = $1
           LIMIT 1`,
          [event.session_id]
        );
        session = sessionResult.rows[0] || null;
      }

      const customerId =
        event.customer_id || session?.customer_id || payload.customerId || payload.customer_id || null;
      let customerPhone = session?.customer_phone || payload.customerPhone || payload.customer_phone || null;

      if (!customerPhone && customerId) {
        const customerResult = await pool.query(
          `SELECT phone
           FROM customers
           WHERE id = $1
             AND workspace_id = $2
           LIMIT 1`,
          [customerId, event.workspace_id]
        );

        customerPhone = customerResult.rows[0]?.phone || null;
      }

      if (event.event_type === 'appointment.cancelled' && appointmentId) {
        await this.cancelScheduledActionsForAppointment(event.workspace_id, appointmentId, event.id);
      }

      await this.evaluateContext({
        executionEventId: event.id,
        workspaceId: event.workspace_id,
        agentId: session?.agent_id || payload.agentId || null,
        campaignId: event.campaign_id || payload.campaignId || null,
        campaignContactId: event.campaign_contact_id || payload.campaignContactId || null,
        campaignJobId: payload.campaignJobId || null,
        sessionId: event.session_id || null,
        customerId,
        customerPhone,
        message: payload.message || payload.transcript || payload.callStatus || event.event_type,
        role: payload.role || 'system',
        sentimentScore: payload.sentimentScore,
        callOutcome: payload.callOutcome || payload.callStatus || session?.outcome,
        durationSeconds: payload.durationSeconds,
        intent: payload.intent || session?.intent || null,
        entities: payload.entities || {},
        eventType: event.event_type,
        payload,
      });

      await markExecutionEventProcessed(pool, eventId, 'processed');
    } catch (error: any) {
      console.error('[Automation] Event processing failed:', error.message);
      await markExecutionEventProcessed(pool, eventId, 'failed', error.message);
    }
  }

  private async evaluateContext(context: AutomationContext) {
    await this.ensureDefaultAppointmentSmsRule(context);

    const rules = await this.fetchRules(context);
    let stopFurtherExecution = false;

    for (const rule of rules) {
      if (stopFurtherExecution) {
        break;
      }

      if (await this.isCoolingDown(rule, context)) {
        continue;
      }

      if (!this.checkCondition(rule, context)) {
        continue;
      }

      await publishExecutionEvent(pool, {
        workspaceId: context.workspaceId,
        sessionId: context.sessionId || null,
        campaignId: context.campaignId || null,
        customerId: context.customerId || null,
        eventType: 'automation.rule.matched',
        eventSource: 'automation',
        payload: {
          ruleId: rule.id,
          scope: rule.scope,
          eventType: context.eventType,
          triggerType: rule.trigger_type,
        },
      });

      if (context.executionEventId) {
        await this.enqueueMatchedRuleAction(rule, context);
      } else {
        await this.executeAction(rule, context);
      }

      const executionMode = String(rule.execution_mode || '').toLowerCase();
      stopFurtherExecution = executionMode === 'stop_on_match' || Boolean(rule.is_terminal);
    }
  }

  private async getOrCreateWorkflowRun(
    workspaceId: string,
    eventId: string,
    ruleId: string
  ) {
    const result = await pool.query(
      `WITH upsert AS (
         INSERT INTO workflow_runs (
           workspace_id,
           event_id,
           rule_id,
           status,
           started_at
         ) VALUES ($1, $2::uuid, $3::uuid, 'running', NOW())
         ON CONFLICT (event_id, rule_id)
         DO UPDATE SET
           updated_at = NOW()
         WHERE workflow_runs.updated_at < NOW() - INTERVAL '1 second'
         RETURNING id
       )
       SELECT id FROM upsert
       UNION ALL
       SELECT id
       FROM workflow_runs
       WHERE event_id = $2::uuid
         AND rule_id = $3::uuid
       LIMIT 1`,
      [workspaceId, eventId, ruleId]
    );

    return String(result.rows[0].id);
  }

  private async appendWorkflowStepLog(input: {
    workflowRunId: string;
    workspaceId: string;
    eventId: string;
    ruleId: string;
    stepIndex: number;
    actionType: string;
    status: WorkflowStepStatus;
    inputPayload?: Record<string, any>;
    outputPayload?: Record<string, any>;
    errorMessage?: string | null;
  }) {
    try {
      await appendWorkflowStepLogBuffered(input);
    } catch (error: any) {
      console.error('[Automation] Failed to append workflow_step_logs row:', error?.message || error);
    }
  }

  private async refreshWorkflowRunStatus(workflowRunId: string) {
    try {
      await pool.query(
        `WITH ref_stats AS (
           SELECT
             COUNT(*)::int AS total_count,
             COUNT(*) FILTER (WHERE status = 'scheduled')::int AS scheduled_count,
             COUNT(*) FILTER (WHERE status = 'failed')::int AS failed_count,
             COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled_count,
             COUNT(*) FILTER (WHERE status IN ('executed', 'skipped', 'cancelled'))::int AS terminal_count
           FROM automation_job_refs
           WHERE workflow_run_id = $1::uuid
         ),
         next_status AS (
           SELECT
             CASE
               WHEN total_count = 0 THEN 'failed'
               WHEN scheduled_count > 0 THEN 'running'
               WHEN failed_count > 0 THEN 'failed'
               WHEN cancelled_count = total_count THEN 'cancelled'
               WHEN terminal_count = total_count THEN 'completed'
               ELSE 'failed'
             END AS status
           FROM ref_stats
         )
         UPDATE workflow_runs wr
         SET status = ns.status,
             completed_at = CASE
               WHEN ns.status = 'running' THEN NULL
               ELSE COALESCE(wr.completed_at, NOW())
             END,
             updated_at = NOW()
         FROM next_status ns
         WHERE wr.id = $1::uuid
           AND (
             wr.status IS DISTINCT FROM ns.status
             OR (ns.status = 'running' AND wr.completed_at IS NOT NULL)
           )`,
        [workflowRunId]
      );
    } catch (error: any) {
      console.error('[Automation] Failed to refresh workflow run status:', error?.message || error);
    }
  }

  private async enqueueMatchedRuleAction(rule: any, context: AutomationContext) {
    if (!context.executionEventId) {
      return;
    }

    const actionSteps = resolveRuleActionSteps(rule);
    if (actionSteps.length === 0) {
      return;
    }

    const workflowRunId = await this.getOrCreateWorkflowRun(
      context.workspaceId,
      context.executionEventId,
      String(rule.id)
    );

    const sourceAppointmentId = resolveAppointmentIdFromPayload(context.payload);

    for (const step of actionSteps) {
      const queueJobId = `automation-action-${context.executionEventId}-${rule.id}-${step.stepIndex}-${step.delaySeconds}`;
      const scheduledFor = new Date(Date.now() + step.delaySeconds * 1000).toISOString();

      const shouldEnqueue = await this.registerScheduledActionRef({
        workflowRunId,
        workspaceId: context.workspaceId,
        eventId: context.executionEventId,
        ruleId: String(rule.id),
        stepIndex: step.stepIndex,
        queueJobId,
        actionType: step.actionType,
        delayBucketSeconds: step.delaySeconds,
        sourceEventType: context.eventType || null,
        sourceEntityType: sourceAppointmentId ? 'appointment' : null,
        sourceEntityId: sourceAppointmentId,
        scheduledFor,
      });

      if (!shouldEnqueue) {
        continue;
      }

      await this.appendWorkflowStepLog({
        workflowRunId,
        workspaceId: context.workspaceId,
        eventId: context.executionEventId,
        ruleId: String(rule.id),
        stepIndex: step.stepIndex,
        actionType: step.actionType,
        status: 'scheduled',
        inputPayload: {
          delayBucketSeconds: step.delaySeconds,
          scheduledFor,
          hasCondition: Boolean(step.actionConfig?.condition),
          onFailure: String(step.actionConfig?.on_failure || step.actionConfig?.onFailure || 'retry'),
        },
      });

      const queueOptions: Record<string, any> = {
        jobId: queueJobId,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      };

      if (step.delaySeconds > 0) {
        queueOptions.delay = step.delaySeconds * 1000;
      }

      const stepRule = {
        ...rule,
        action_type: step.actionType,
        action_config: step.actionConfig,
      };

      try {
        await automationActionsQueue.add(
          'execute-action',
          {
            jobType: 'execute_action',
            eventId: context.executionEventId,
            workflowRunId,
            rule: stepRule,
            context: {
              ...context,
              workflowRunId,
              actionStepIndex: step.stepIndex,
              actionDelaySeconds: step.delaySeconds,
            },
            actionDelaySeconds: step.delaySeconds,
            actionStepIndex: step.stepIndex,
          },
          queueOptions
        );
      } catch (error: any) {
        await this.markScheduledActionStatus(
          context.executionEventId,
          String(rule.id),
          step.stepIndex,
          step.delaySeconds,
          'failed',
          error?.message || 'Failed to enqueue delayed automation action',
          {
            workflowRunId,
            workspaceId: context.workspaceId,
            actionType: step.actionType,
            outputPayload: {
              reason: 'queue_enqueue_failed',
            },
          }
        );
        throw error;
      }
    }
  }

  async executeQueuedAction(
    rule: any,
    contextData: Record<string, any>,
    eventId: string,
    options: { workflowRunId?: string; actionDelaySeconds?: number; actionStepIndex?: number } = {}
  ) {
    const actionStepIndex =
      Number.isFinite(Number(options.actionStepIndex)) && Number(options.actionStepIndex) >= 0
        ? Math.trunc(Number(options.actionStepIndex))
        : 0;

    const workflowRunIdInput =
      (typeof options.workflowRunId === 'string' && options.workflowRunId.trim().length > 0
        ? options.workflowRunId.trim()
        : null) ||
      (typeof contextData.workflowRunId === 'string' && contextData.workflowRunId.trim().length > 0
        ? contextData.workflowRunId.trim()
        : null);

    const context: AutomationContext = {
      ...(contextData as any),
      executionEventId: eventId,
      workflowRunId: workflowRunIdInput,
      actionStepIndex,
    };

    if (!context.workspaceId) {
      throw new Error('Queued automation action is missing workspaceId');
    }

    if (!rule?.id || !rule?.action_type) {
      throw new Error('Queued automation action is missing rule metadata');
    }

    if (!context.workflowRunId) {
      context.workflowRunId = await this.getOrCreateWorkflowRun(
        context.workspaceId,
        eventId,
        String(rule.id)
      );
    }

    const actionConfig = parseJsonObject(rule.action_config);
    const delayBucketSeconds = normalizeDelaySeconds(
      options.actionDelaySeconds ?? actionConfig.delay_seconds ?? actionConfig.delaySeconds
    );
    context.actionDelaySeconds = delayBucketSeconds;

    const currentScheduleStatus = await this.getScheduledActionStatus(
      eventId,
      String(rule.id),
      actionStepIndex,
      delayBucketSeconds,
      context.workflowRunId
    );

    if (
      currentScheduleStatus === 'cancelled' ||
      currentScheduleStatus === 'executed' ||
      currentScheduleStatus === 'skipped'
    ) {
      return;
    }

    if (actionStepIndex > 0) {
      const previousStepStatus = await this.getStepStatus(
        eventId,
        String(rule.id),
        actionStepIndex - 1,
        context.workflowRunId
      );

      if (!previousStepStatus || previousStepStatus === 'scheduled') {
        throw new Error(`Previous workflow step ${actionStepIndex - 1} has not completed yet`);
      }

      if (previousStepStatus === 'failed' || previousStepStatus === 'cancelled') {
        await this.markScheduledActionStatus(
          eventId,
          String(rule.id),
          actionStepIndex,
          delayBucketSeconds,
          'cancelled',
          `Cancelled because previous step ${actionStepIndex - 1} status is ${previousStepStatus}`,
          {
            workflowRunId: context.workflowRunId,
            workspaceId: context.workspaceId,
            actionType: String(rule.action_type),
            outputPayload: {
              reason: 'dependency_not_satisfied',
              previousStepStatus,
              previousStepIndex: actionStepIndex - 1,
            },
          }
        );
        return;
      }
    }

    const stepCondition = parseJsonObject(actionConfig.condition);
    if (Object.keys(stepCondition).length > 0) {
      const shouldExecute = await this.evaluateStepCondition(stepCondition, context);
      if (!shouldExecute) {
        await this.logAction(rule, context, 'skipped', {
          reason: 'Step condition not met',
          condition: stepCondition,
        });
        await this.markScheduledActionStatus(
          eventId,
          String(rule.id),
          actionStepIndex,
          delayBucketSeconds,
          'skipped',
          'Step condition not met',
          {
            workflowRunId: context.workflowRunId,
            workspaceId: context.workspaceId,
            actionType: String(rule.action_type),
            outputPayload: {
              reason: 'condition_not_met',
              condition: stepCondition,
            },
          }
        );
        return;
      }
    }

    const failurePolicy = resolveStepFailurePolicy(actionConfig);

    if (context.workflowRunId) {
      await this.appendWorkflowStepLog({
        workflowRunId: context.workflowRunId,
        workspaceId: context.workspaceId,
        eventId,
        ruleId: String(rule.id),
        stepIndex: actionStepIndex,
        actionType: String(rule.action_type),
        status: 'executing',
        inputPayload: {
          failurePolicy,
          delayBucketSeconds,
          hasCondition: Boolean(actionConfig?.condition),
        },
      });
    }

    const alreadySucceeded = await this.hasSuccessfulActionExecution(
      context.workspaceId,
      eventId,
      rule.id,
      rule.action_type,
      actionStepIndex
    );

    if (alreadySucceeded) {
      await this.markScheduledActionStatus(
        eventId,
        String(rule.id),
        actionStepIndex,
        delayBucketSeconds,
        'executed',
        undefined,
        {
          workflowRunId: context.workflowRunId,
          workspaceId: context.workspaceId,
          actionType: String(rule.action_type),
          outputPayload: {
            reason: 'idempotent_success_already_logged',
          },
        }
      );
      return;
    }

    const result = await this.executeAction(rule, context, {
      throwOnFailure: failurePolicy === 'retry',
    });

    if (result.status === 'failed') {
      if (failurePolicy === 'skip') {
        await this.markScheduledActionStatus(
          eventId,
          String(rule.id),
          actionStepIndex,
          delayBucketSeconds,
          'skipped',
          result.error || 'Step failed and was skipped by on_failure policy',
          {
            workflowRunId: context.workflowRunId,
            workspaceId: context.workspaceId,
            actionType: String(rule.action_type),
            outputPayload: {
              failurePolicy,
              resultStatus: result.status,
            },
          }
        );
        return;
      }

      await this.markScheduledActionStatus(
        eventId,
        String(rule.id),
        actionStepIndex,
        delayBucketSeconds,
        'failed',
        result.error,
        {
          workflowRunId: context.workflowRunId,
          workspaceId: context.workspaceId,
          actionType: String(rule.action_type),
          outputPayload: {
            failurePolicy,
            resultStatus: result.status,
          },
        }
      );

      if (failurePolicy === 'stop') {
        await this.cancelSubsequentStepsAfterFailure(
          eventId,
          String(rule.id),
          actionStepIndex,
          result.error || 'Workflow step failed with on_failure=stop',
          context.workflowRunId
        );
      }

      return;
    }

    await this.markScheduledActionStatus(
      eventId,
      String(rule.id),
      actionStepIndex,
      delayBucketSeconds,
      'executed',
      undefined,
      {
        workflowRunId: context.workflowRunId,
        workspaceId: context.workspaceId,
        actionType: String(rule.action_type),
        outputPayload: {
          resultStatus: result.status,
        },
      }
    );
  }

  private async hasCustomerReplySinceEvent(context: AutomationContext) {
    if (!context.executionEventId) {
      return false;
    }

    const sourceEventResult = await pool.query(
      `SELECT created_at
       FROM execution_events
       WHERE id = $1::uuid
       LIMIT 1`,
      [context.executionEventId]
    );

    const sourceCreatedAt = sourceEventResult.rows[0]?.created_at;
    if (!sourceCreatedAt) {
      return false;
    }

    if (context.customerId) {
      const customerReplyResult = await pool.query(
        `SELECT id
         FROM execution_events
         WHERE workspace_id = $1
           AND customer_id::text = $2
           AND created_at > $3
           AND event_type = ANY($4::text[])
           AND (
             event_type <> 'call.turn.completed'
             OR lower(COALESCE(payload->>'role', '')) IN ('user', 'visitor', 'customer')
           )
         LIMIT 1`,
        [context.workspaceId, String(context.customerId), sourceCreatedAt, CUSTOMER_REPLY_EVENT_TYPES]
      );

      if (customerReplyResult.rows.length > 0) {
        return true;
      }
    }

    if (context.sessionId) {
      const sessionReplyResult = await pool.query(
        `SELECT id
         FROM execution_events
         WHERE workspace_id = $1
           AND session_id::text = $2
           AND created_at > $3
           AND event_type = ANY($4::text[])
           AND (
             event_type <> 'call.turn.completed'
             OR lower(COALESCE(payload->>'role', '')) IN ('user', 'visitor', 'customer')
           )
         LIMIT 1`,
        [context.workspaceId, String(context.sessionId), sourceCreatedAt, CUSTOMER_REPLY_EVENT_TYPES]
      );

      if (sessionReplyResult.rows.length > 0) {
        return true;
      }
    }

    return false;
  }

  private async evaluateStepCondition(
    conditionConfig: Record<string, any>,
    context: AutomationContext
  ) {
    for (const [rawKey, expected] of Object.entries(conditionConfig)) {
      const key = String(rawKey || '').trim();
      if (!key) {
        continue;
      }

      if (key === 'customer_replied') {
        const actualReplied = await this.hasCustomerReplySinceEvent(context);
        const expectedReplied = Boolean(expected);
        if (actualReplied !== expectedReplied) {
          return false;
        }
        continue;
      }

      if (key === 'event_type') {
        if (!evaluateConditions({ event_type: expected }, { event_type: context.eventType || null })) {
          return false;
        }
        continue;
      }

      let actual: any;
      if (key.startsWith('payload.')) {
        actual = getNestedValue(context.payload, key.slice('payload.'.length));
      } else if (key.startsWith('entities.')) {
        actual = getNestedValue(context.entities, key.slice('entities.'.length));
      } else {
        actual =
          (context as Record<string, any>)[key] ??
          context.payload?.[key] ??
          context.entities?.[key];
      }

      if (!evaluateConditions({ [key]: expected }, { [key]: actual })) {
        return false;
      }
    }

    return true;
  }

  private async hasSuccessfulActionExecution(
    workspaceId: string,
    eventId: string,
    ruleId: string,
    actionType: string,
    stepIndex: number
  ) {
    const result = await pool.query(
      `SELECT id
       FROM automation_action_logs
       WHERE workspace_id = $1
         AND rule_id = $2
         AND action_type = $3
         AND status IN ('sent', 'success')
         AND payload->>'executionEventId' = $4
         AND payload->>'actionStepIndex' = $5
       LIMIT 1`,
      [workspaceId, ruleId, actionType, eventId, String(stepIndex)]
    );

    return result.rows.length > 0;
  }

  private async registerScheduledActionRef(input: {
    workflowRunId?: string | null;
    workspaceId: string;
    eventId: string;
    ruleId: string;
    stepIndex: number;
    queueJobId: string;
    actionType: string;
    delayBucketSeconds: number;
    sourceEventType?: string | null;
    sourceEntityType?: string | null;
    sourceEntityId?: string | null;
    scheduledFor?: string | null;
  }) {
    const result = await pool.query(
      `INSERT INTO automation_job_refs (
         workflow_run_id,
         workspace_id,
         event_id,
         rule_id,
         step_index,
         queue_job_id,
         action_type,
         delay_bucket_seconds,
         source_event_type,
         source_entity_type,
         source_entity_id,
         scheduled_for,
         status
       ) VALUES ($1::uuid, $2, $3::uuid, $4::uuid, $5, $6, $7, $8, $9, $10, $11, $12::timestamptz, 'scheduled')
       ON CONFLICT (event_id, rule_id, step_index, delay_bucket_seconds)
       DO NOTHING`,
      [
        input.workflowRunId || null,
        input.workspaceId,
        input.eventId,
        input.ruleId,
        input.stepIndex,
        input.queueJobId,
        input.actionType,
        input.delayBucketSeconds,
        input.sourceEventType || null,
        input.sourceEntityType || null,
        input.sourceEntityId || null,
        input.scheduledFor || null,
      ]
    );

    return result.rowCount > 0;
  }

  private async getScheduledActionStatus(
    eventId: string,
    ruleId: string,
    stepIndex: number,
    delayBucketSeconds: number,
    workflowRunId?: string | null
  ) {
    const result = await pool.query(
      `SELECT status
       FROM automation_job_refs
       WHERE event_id = $1::uuid
         AND rule_id = $2::uuid
         AND step_index = $3
         AND delay_bucket_seconds = $4
         AND ($5::uuid IS NULL OR workflow_run_id = $5::uuid)
       LIMIT 1`,
      [eventId, ruleId, stepIndex, delayBucketSeconds, workflowRunId || null]
    );

    return result.rows[0]?.status || null;
  }

  private async getStepStatus(
    eventId: string,
    ruleId: string,
    stepIndex: number,
    workflowRunId?: string | null
  ) {
    const result = await pool.query(
      `SELECT status
       FROM automation_job_refs
       WHERE event_id = $1::uuid
         AND rule_id = $2::uuid
         AND step_index = $3
         AND ($4::uuid IS NULL OR workflow_run_id = $4::uuid)
       ORDER BY created_at DESC
       LIMIT 1`,
      [eventId, ruleId, stepIndex, workflowRunId || null]
    );

    return result.rows[0]?.status || null;
  }

  private async cancelSubsequentStepsAfterFailure(
    eventId: string,
    ruleId: string,
    failedStepIndex: number,
    reason: string,
    workflowRunId?: string | null
  ) {
    const refsResult = await pool.query(
      `SELECT id, queue_job_id, delay_bucket_seconds, step_index, workflow_run_id, workspace_id, action_type
       FROM automation_job_refs
       WHERE event_id = $1::uuid
         AND rule_id = $2::uuid
         AND step_index > $3
         AND ($4::uuid IS NULL OR workflow_run_id = $4::uuid)
         AND status = 'scheduled'`,
      [eventId, ruleId, failedStepIndex, workflowRunId || null]
    );

    for (const row of refsResult.rows) {
      try {
        const queuedJob = await automationActionsQueue.getJob(String(row.queue_job_id));
        if (queuedJob) {
          const state = await queuedJob.getState();
          if (state === 'delayed' || state === 'waiting' || state === 'waiting-children') {
            await queuedJob.remove();
          }
        }
      } catch (error: any) {
        console.error('[Automation] Failed to remove downstream step job from queue:', error?.message || error);
      }

      await this.markScheduledActionStatus(
        eventId,
        ruleId,
        Number(row.step_index || 0),
        Number(row.delay_bucket_seconds || 0),
        'cancelled',
        reason,
        {
          workflowRunId: row.workflow_run_id || workflowRunId || null,
          workspaceId: row.workspace_id || null,
          actionType: row.action_type || null,
          outputPayload: {
            reason,
            cancelledByStep: failedStepIndex,
          },
        }
      );
    }
  }

  private async markScheduledActionStatus(
    eventId: string,
    ruleId: string,
    stepIndex: number,
    delayBucketSeconds: number,
    status: 'executed' | 'failed' | 'skipped' | 'cancelled',
    errorMessage?: string | null,
    trace?: {
      workflowRunId?: string | null;
      workspaceId?: string | null;
      actionType?: string | null;
      inputPayload?: Record<string, any>;
      outputPayload?: Record<string, any>;
    }
  ) {
    const workflowRunId = trace?.workflowRunId || null;
    const traceErrorMessage =
      status === 'failed' || status === 'skipped' || status === 'cancelled'
        ? errorMessage || null
        : null;

    let updateResult: { rowCount: number | null; rows: any[] } = { rowCount: 0, rows: [] };

    if (status === 'executed') {
      updateResult = await pool.query(
        `UPDATE automation_job_refs
         SET status = 'executed',
             executed_at = COALESCE(executed_at, NOW()),
             error_message = NULL,
             updated_at = NOW()
         WHERE event_id = $1::uuid
           AND rule_id = $2::uuid
           AND step_index = $3
           AND delay_bucket_seconds = $4
           AND ($5::uuid IS NULL OR workflow_run_id = $5::uuid)
           AND status = 'scheduled'
         RETURNING workflow_run_id, workspace_id, action_type`,
        [eventId, ruleId, stepIndex, delayBucketSeconds, workflowRunId]
      );
    } else if (status === 'skipped') {
      updateResult = await pool.query(
        `UPDATE automation_job_refs
         SET status = 'skipped',
             error_message = $5,
             updated_at = NOW()
         WHERE event_id = $1::uuid
           AND rule_id = $2::uuid
           AND step_index = $3
           AND delay_bucket_seconds = $4
           AND ($6::uuid IS NULL OR workflow_run_id = $6::uuid)
           AND status = 'scheduled'
         RETURNING workflow_run_id, workspace_id, action_type`,
        [eventId, ruleId, stepIndex, delayBucketSeconds, errorMessage || null, workflowRunId]
      );
    } else if (status === 'cancelled') {
      updateResult = await pool.query(
        `UPDATE automation_job_refs
         SET status = 'cancelled',
             cancelled_at = COALESCE(cancelled_at, NOW()),
             error_message = $5,
             updated_at = NOW()
         WHERE event_id = $1::uuid
           AND rule_id = $2::uuid
           AND step_index = $3
           AND delay_bucket_seconds = $4
           AND ($6::uuid IS NULL OR workflow_run_id = $6::uuid)
           AND status = 'scheduled'
         RETURNING workflow_run_id, workspace_id, action_type`,
        [eventId, ruleId, stepIndex, delayBucketSeconds, errorMessage || null, workflowRunId]
      );
    } else {
      updateResult = await pool.query(
        `UPDATE automation_job_refs
         SET status = 'failed',
             error_message = $5,
             updated_at = NOW()
         WHERE event_id = $1::uuid
           AND rule_id = $2::uuid
           AND step_index = $3
           AND delay_bucket_seconds = $4
           AND ($6::uuid IS NULL OR workflow_run_id = $6::uuid)
           AND status = 'scheduled'
         RETURNING workflow_run_id, workspace_id, action_type`,
        [eventId, ruleId, stepIndex, delayBucketSeconds, errorMessage || null, workflowRunId]
      );
    }

    const updatedRow = updateResult.rows[0] || null;
    const updatedCount = Number(updateResult.rowCount || 0);
    const resolvedWorkflowRunId = updatedRow?.workflow_run_id || workflowRunId;
    const resolvedWorkspaceId = trace?.workspaceId || updatedRow?.workspace_id || null;
    const resolvedActionType = trace?.actionType || updatedRow?.action_type || null;

    if (
      updatedCount > 0 &&
      resolvedWorkflowRunId &&
      resolvedWorkspaceId &&
      resolvedActionType
    ) {
      await this.appendWorkflowStepLog({
        workflowRunId: resolvedWorkflowRunId,
        workspaceId: resolvedWorkspaceId,
        eventId,
        ruleId,
        stepIndex,
        actionType: resolvedActionType,
        status,
        inputPayload: trace?.inputPayload,
        outputPayload: trace?.outputPayload,
        errorMessage: traceErrorMessage,
      });
    }

    if (resolvedWorkflowRunId && updatedCount > 0) {
      await this.refreshWorkflowRunStatus(resolvedWorkflowRunId);
    }
  }

  private async cancelScheduledActionsForAppointment(
    workspaceId: string,
    appointmentId: string,
    cancellationEventId: string
  ) {
    const refsResult = await pool.query(
      `SELECT id, queue_job_id, workflow_run_id, event_id, rule_id, step_index, action_type
       FROM automation_job_refs
       WHERE workspace_id = $1
         AND source_entity_type = 'appointment'
         AND source_entity_id = $2
         AND status = 'scheduled'`,
      [workspaceId, appointmentId]
    );

    if (refsResult.rows.length === 0) {
      return;
    }

    let cancelledCount = 0;
    let removedFromQueueCount = 0;
    const affectedWorkflowRunIds = new Set<string>();

    for (const row of refsResult.rows) {
      let removed = false;

      try {
        const queuedJob = await automationActionsQueue.getJob(String(row.queue_job_id));
        if (queuedJob) {
          const state = await queuedJob.getState();
          if (state === 'delayed' || state === 'waiting' || state === 'waiting-children') {
            await queuedJob.remove();
            removed = true;
          }
        }
      } catch (error: any) {
        console.error('[Automation] Failed to remove delayed action from queue:', error?.message || error);
      }

      const updateResult = await pool.query(
        `UPDATE automation_job_refs
         SET status = 'cancelled',
             cancelled_at = NOW(),
             cancellation_event_id = $2::uuid,
             updated_at = NOW()
         WHERE id = $1
           AND status = 'scheduled'`,
        [row.id, cancellationEventId]
      );

      if (updateResult.rowCount > 0) {
        cancelledCount += 1;
        if (removed) {
          removedFromQueueCount += 1;
        }

        if (row.workflow_run_id) {
          const workflowRunId = String(row.workflow_run_id);
          affectedWorkflowRunIds.add(workflowRunId);
          await this.appendWorkflowStepLog({
            workflowRunId,
            workspaceId,
            eventId: String(row.event_id),
            ruleId: String(row.rule_id),
            stepIndex: Number(row.step_index || 0),
            actionType: String(row.action_type || 'unknown'),
            status: 'cancelled',
            outputPayload: {
              reason: 'appointment_cancelled',
              cancellationEventId,
              appointmentId,
            },
            errorMessage: 'Cancelled due appointment cancellation event',
          });
        }
      }
    }

    for (const workflowRunId of affectedWorkflowRunIds) {
      await this.refreshWorkflowRunStatus(workflowRunId);
    }

    await publishExecutionEvent(pool, {
      workspaceId,
      eventType: 'automation.jobs.cancelled',
      eventSource: 'automation',
      dedupeKey: `automation-jobs-cancelled-${cancellationEventId}`,
      payload: {
        sourceEntityType: 'appointment',
        sourceEntityId: appointmentId,
        cancellationEventId,
        cancelledCount,
        removedFromQueueCount,
      },
    });
  }

  private async ensureDefaultAppointmentSmsRule(context: AutomationContext) {
    if (context.eventType !== 'appointment.created') {
      return;
    }

    const lockKey = `automation-default-appointment-rule:${context.workspaceId}`;
    await pool.query('SELECT pg_advisory_lock(hashtext($1))', [lockKey]);

    try {
      const existing = await pool.query(
        `SELECT id
         FROM automation_rules
         WHERE workspace_id = $1
           AND COALESCE(scope, 'workspace') = 'workspace'
           AND trigger_type = 'appointment_created'
           AND action_type = 'send_sms'
           AND COALESCE(event_type, 'appointment.created') = 'appointment.created'
           AND is_active = true
         LIMIT 1`,
        [context.workspaceId]
      );

      if (existing.rows.length > 0) {
        return;
      }

      await pool.query(
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
           is_active,
           priority,
           cooldown_seconds,
           event_type,
           is_terminal
         ) VALUES ($1, NULL, NULL, 'workspace', 'appointment_created', $2, $3, 'send_sms', $4, true, 100, 0, 'appointment.created', false)`,
        [
          context.workspaceId,
          JSON.stringify({}),
          JSON.stringify({}),
          JSON.stringify({
            message: 'Your appointment for {{service}} is confirmed on {{date}}.',
            source: 'system_default',
          }),
        ]
      );
    } finally {
      await pool.query('SELECT pg_advisory_unlock(hashtext($1))', [lockKey]);
    }
  }

  private async fetchRules(context: AutomationContext) {
    const result = await pool.query(
      `SELECT *
       FROM automation_rules
       WHERE workspace_id = $1
         AND is_active = true
         AND (
           COALESCE(scope, CASE
             WHEN campaign_id IS NOT NULL THEN 'campaign'
             WHEN agent_id IS NOT NULL THEN 'agent'
             ELSE 'workspace'
           END) = 'workspace'
           OR (
             COALESCE(scope, CASE
               WHEN campaign_id IS NOT NULL THEN 'campaign'
               WHEN agent_id IS NOT NULL THEN 'agent'
               ELSE 'workspace'
             END) = 'agent'
             AND agent_id = $2
           )
           OR (
             COALESCE(scope, CASE
               WHEN campaign_id IS NOT NULL THEN 'campaign'
               WHEN agent_id IS NOT NULL THEN 'agent'
               ELSE 'workspace'
             END) = 'campaign'
             AND campaign_id = $3
           )
         )`,
      [context.workspaceId, context.agentId || null, context.campaignId || null]
    );

    return result.rows.sort((left, right) => {
      const scopeDiff = getScopeRank(left.scope) - getScopeRank(right.scope);
      if (scopeDiff !== 0) return scopeDiff;
      return Number(left.priority || 100) - Number(right.priority || 100);
    });
  }

  private async isCoolingDown(rule: any, context: AutomationContext) {
    const cooldownSeconds = Number(rule.cooldown_seconds || 0);
    if (cooldownSeconds <= 0) {
      return false;
    }

    const result = await pool.query(
      `SELECT id
       FROM automation_action_logs
       WHERE rule_id = $1
         AND workspace_id = $2
         AND COALESCE(session_id, '00000000-0000-0000-0000-000000000000') =
             COALESCE($3::uuid, '00000000-0000-0000-0000-000000000000')
         AND created_at >= NOW() - ($4 || ' seconds')::interval
       LIMIT 1`,
      [rule.id, context.workspaceId, context.sessionId || null, String(cooldownSeconds)]
    );

    return result.rows.length > 0;
  }

  private checkCondition(rule: any, context: AutomationContext): boolean {
    const config = parseJsonObject(rule.condition_config);
    const explicitConditions = parseJsonObject(rule.conditions);
    const resolvedConditions = Object.keys(explicitConditions).length > 0
      ? explicitConditions
      : config;

    const conditionPayload: Record<string, any> = {
      event_type: context.eventType || '',
      service_id: context.payload?.service_id || context.entities?.service_id || null,
    };

    const eventType = context.eventType || '';
    const ruleEventType = rule.event_type || null;

    if (ruleEventType && ruleEventType !== eventType) {
      return false;
    }

    switch (rule.trigger_type) {
      case 'sentiment_drops':
        return (context.sentimentScore ?? 1) < (config.threshold || 0.3);

      case 'keyword_detected':
        return context.message.toLowerCase().includes(String(config.keyword || '').toLowerCase());

      case 'duration_exceeded':
        return Number(context.durationSeconds || 0) > Number(config.duration || 300);

      case 'intent_detected':
        return (context.intent || '').toLowerCase() === String(config.intent || '').toLowerCase();

      case 'call_outcome':
        return (context.callOutcome || '').toLowerCase() === String(config.outcome || '').toLowerCase();

      case 'campaign_status':
        return (context.payload?.campaignStatus || '').toLowerCase() === String(config.status || '').toLowerCase();

      case 'call_connected':
        return eventType === 'call.started';

      case 'appointment_created': {
        if (eventType !== 'appointment.created') {
          return false;
        }

        const appointmentConditions: Record<string, any> = {};
        for (const [rawKey, rawValue] of Object.entries(resolvedConditions || {})) {
          const key = rawKey === 'serviceId' ? 'service_id' : rawKey;
          if (key !== 'service_id') {
            return false;
          }

          appointmentConditions.service_id = rawValue;
        }

        return evaluateConditions(appointmentConditions, conditionPayload);
      }

      default:
        return false;
    }
  }

  private renderMessageTemplate(template: string, context: AutomationContext) {
    const replacements: Record<string, any> = {
      ...(context.payload || {}),
      ...(context.entities || {}),
      customerPhone: context.customerPhone || '',
      customerId: context.customerId || '',
      eventType: context.eventType || '',
    };

    const rendered = template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
      const value = replacements[key];
      return value === undefined || value === null ? '' : String(value);
    });

    const trimmed = rendered.trim();
    return trimmed.length > 0 ? trimmed : 'Alert';
  }

  private shouldRetryFailedAction(actionType: string, errorMessage?: string | null) {
    const message = String(errorMessage || '').toLowerCase();
    if (!message) {
      return true;
    }

    if (
      message.includes('customer phone number is unavailable') ||
      message.includes('twilio credentials') ||
      message.includes('not configured for this workspace') ||
      message.includes('customer tag is empty')
    ) {
      return false;
    }

    // Keep generic failures retryable; queue retries handle transient provider/DB failures.
    return true;
  }

  private async executeAction(
    rule: any,
    context: AutomationContext,
    options: { throwOnFailure?: boolean } = {}
  ): Promise<ActionExecutionResult> {
    const config = parseJsonObject(rule.action_config);
    const executionMode = context.executionEventId ? 'queued' : 'inline';

    let actionStatus: 'sent' | 'success' | 'failed' | 'needs_setup' | 'skipped' = 'success';
    let actionError: string | null = null;

    try {
      switch (rule.action_type) {
        case 'create_ticket': {
          await pool.query(
            `INSERT INTO support_tickets (workspace_id, session_id, customer_id, subject, description, status)
             VALUES ($1, $2, $3, $4, $5, 'open')`,
            [
              context.workspaceId,
              context.sessionId || null,
              context.customerId || null,
              config.subject || 'Automated Rule Ticket',
              config.description || context.message || 'Created by automation rule',
            ]
          );
          actionStatus = 'success';
          await this.logAction(rule, context, actionStatus, {
            subject: config.subject || 'Automated Rule Ticket',
            executionMode,
          });
          break;
        }

        case 'escalate_to_human': {
          if (context.sessionId) {
            await pool.query(
              `UPDATE conversation_sessions
               SET outcome = 'escalated'
               WHERE id = $1`,
              [context.sessionId]
            );
          }

          actionStatus = 'success';
          await this.logAction(rule, context, actionStatus, {
            outcome: 'escalated',
            executionMode,
          });
          break;
        }

        case 'send_sms': {
          const smsBody = this.renderMessageTemplate(config.message || 'Alert', context);
          const smsResult = await sendWorkspaceSms({
            workspaceId: context.workspaceId,
            to: context.customerPhone,
            body: smsBody,
          });

          actionStatus = smsResult.status;
          actionError = smsResult.error || null;
          await this.logAction(rule, context, actionStatus, {
            to: context.customerPhone,
            from: smsResult.from,
            provider: smsResult.provider,
            sid: smsResult.sid,
            message: smsBody,
            executionMode,
          }, actionError);
          break;
        }

        case 'tag_customer': {
          const tagResult = await this.tagCustomer(context, config.tag || 'automation');
          actionStatus = tagResult.status;
          actionError = tagResult.error || null;
          await this.logAction(rule, context, actionStatus, {
            customerId: tagResult.customerId,
            phone: context.customerPhone,
            tag: config.tag || 'automation',
            executionMode,
          }, actionError);
          break;
        }

        case 'schedule_callback': {
          await this.scheduleCallback(context, config);
          actionStatus = 'success';
          await this.logAction(rule, context, actionStatus, {
            scheduledFor: config.scheduledFor || config.delaySeconds || 3600,
            executionMode,
          });
          break;
        }

        case 'update_campaign_disposition': {
          if (context.campaignContactId) {
            await pool.query(
              `UPDATE campaign_contacts
               SET outcome = $2,
                   response = CASE WHEN $3 <> '' THEN $3 ELSE response END
               WHERE id = $1`,
              [
                context.campaignContactId,
                config.outcome || context.callOutcome || 'updated',
                config.response || context.message || '',
              ]
            );
          }

          actionStatus = 'success';
          await this.logAction(rule, context, actionStatus, {
            campaignContactId: context.campaignContactId || null,
            outcome: config.outcome || context.callOutcome || 'updated',
            executionMode,
          });
          break;
        }

        case 'enqueue_follow_up_job': {
          const campaignJobId = context.campaignJobId;
          const campaignId = context.campaignId;
          const campaignContactId = context.campaignContactId;

          if (!campaignJobId || !campaignId || !campaignContactId) {
            actionStatus = 'skipped';
            await this.logAction(rule, context, actionStatus, {
              reason: 'Missing campaign context for follow-up job',
              executionMode,
            });
            break;
          }

          const currentJob = await pool.query(
            `SELECT workspace_id, channel
             FROM campaign_jobs
             WHERE id = $1
             LIMIT 1`,
            [campaignJobId]
          );

          if (currentJob.rows.length === 0) {
            actionStatus = 'skipped';
            await this.logAction(rule, context, actionStatus, {
              reason: 'Campaign job not found',
              executionMode,
            });
            break;
          }

          const nextJobId = randomUUID();
          const delaySeconds = Number(config.delaySeconds || 86400);

          await pool.query(
            `INSERT INTO campaign_jobs (
               id,
               campaign_id,
               campaign_contact_id,
               workspace_id,
               channel,
               status,
               scheduled_for,
               execution_context
             ) VALUES ($1, $2, $3, $4, $5, 'queued', NOW() + ($6 || ' seconds')::interval, $7)`,
            [
              nextJobId,
              campaignId,
              campaignContactId,
              currentJob.rows[0].workspace_id,
              currentJob.rows[0].channel,
              String(delaySeconds),
              JSON.stringify({
                source: 'automation_follow_up',
                parentCampaignJobId: campaignJobId,
              }),
            ]
          );

          const queueJob = await orchestratorQueue.add(
            'execute',
            {
              workspaceId: currentJob.rows[0].workspace_id,
              jobType: 'campaign_dispatch',
              campaignJob: {
                campaignJobId: nextJobId,
                campaignId,
                customerId: campaignContactId,
                workspaceId: currentJob.rows[0].workspace_id,
                channel: currentJob.rows[0].channel,
              },
            },
            {
              jobId: `campaign-job-${nextJobId}`,
              delay: delaySeconds * 1000,
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 300000,
              },
            }
          );

          try {
            await pool.query(
              `UPDATE campaign_jobs
               SET queue_job_id = $2,
                   updated_at = NOW()
               WHERE id = $1`,
              [nextJobId, String(queueJob.id || '')]
            );
          } catch {
            // queue_job_id column may not exist until reliability migration is applied.
          }

          actionStatus = 'success';
          await this.logAction(rule, context, actionStatus, {
            campaignJobId: nextJobId,
            delaySeconds,
            executionMode,
          });
          break;
        }

        default: {
          actionStatus = 'skipped';
          await this.logAction(rule, context, actionStatus, {
            reason: 'Unsupported action type',
            executionMode,
          });
          break;
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown automation execution failure';
      console.error(`[Automation] Execution failed for rule ${rule.id}:`, errorMessage);

      actionStatus = 'failed';
      actionError = errorMessage;
      await this.logAction(rule, context, actionStatus, {
        actionConfig: config,
        executionMode,
      }, errorMessage);

      if (options.throwOnFailure && this.shouldRetryFailedAction(rule.action_type, actionError)) {
        throw error;
      }

      return {
        status: actionStatus,
        error: actionError,
      };
    }

    try {
      await publishExecutionEvent(pool, {
        workspaceId: context.workspaceId,
        sessionId: context.sessionId || null,
        campaignId: context.campaignId || null,
        customerId: context.customerId || null,
        eventType: 'automation.action.executed',
        eventSource: 'automation',
        payload: {
          ruleId: rule.id,
          actionType: rule.action_type,
          status: actionStatus,
          error: actionError,
          executionMode,
          executionEventId: context.executionEventId || null,
          workflowRunId: context.workflowRunId || null,
          actionStepIndex: context.actionStepIndex ?? 0,
          actionDelaySeconds: context.actionDelaySeconds ?? 0,
        },
      });
    } catch (eventError: any) {
      console.error(
        `[Automation] Failed to publish action execution event for rule ${rule.id}:`,
        eventError?.message || eventError
      );
    }

    if (
      options.throwOnFailure &&
      actionStatus === 'failed' &&
      this.shouldRetryFailedAction(rule.action_type, actionError)
    ) {
      throw new Error(actionError || `Automation action ${rule.action_type} failed`);
    }

    return {
      status: actionStatus,
      error: actionError,
    };
  }

  private async scheduleCallback(context: AutomationContext, config: Record<string, any>) {
    const scheduledFor = config.scheduledFor
      ? new Date(config.scheduledFor)
      : new Date(Date.now() + Number(config.delaySeconds || 3600) * 1000);

    if (context.customerPhone) {
      await pool.query(
        `UPDATE customer_profiles
         SET next_action = 'follow_up',
             next_action_date = $2,
             updated_at = NOW()
         WHERE workspace_id = $1 AND phone = $3`,
        [context.workspaceId, scheduledFor.toISOString(), context.customerPhone]
      );
    }
  }

  private async tagCustomer(
    context: AutomationContext,
    tag: string
  ): Promise<{ status: 'success' | 'failed'; customerId?: string; error?: string }> {
    const normalizedTag = `${tag || ''}`.trim();
    if (!normalizedTag) {
      return { status: 'failed', error: 'Customer tag is empty.' };
    }

    try {
      if (context.customerId) {
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
          [context.customerId, normalizedTag]
        );

        if (result.rows.length > 0) {
          return { status: 'success', customerId: result.rows[0].id };
        }
      }

      if (!context.customerPhone) {
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
        [context.workspaceId, context.customerPhone, normalizedTag]
      );

      if (result.rows.length === 0) {
        return { status: 'failed', error: 'Customer tagging did not return a record.' };
      }

      return { status: 'success', customerId: result.rows[0].id };
    } catch (error: any) {
      return { status: 'failed', error: error.message };
    }
  }

  private async logAction(
    rule: any,
    context: AutomationContext,
    status: 'sent' | 'success' | 'failed' | 'needs_setup' | 'skipped',
    payload?: Record<string, unknown>,
    errorMessage?: string | null
  ) {
    const actionConfig = parseJsonObject(rule.action_config);
    const actionDelaySeconds =
      context.actionDelaySeconds !== undefined
        ? normalizeDelaySeconds(context.actionDelaySeconds)
        : normalizeDelaySeconds(actionConfig.delay_seconds ?? actionConfig.delaySeconds);
    const actionStepIndex =
      Number.isFinite(Number(context.actionStepIndex)) && Number(context.actionStepIndex) >= 0
        ? Math.trunc(Number(context.actionStepIndex))
        : 0;

    await logAutomationAction({
      workspaceId: context.workspaceId,
      agentId: context.agentId || null,
      sessionId: context.sessionId || null,
      ruleId: rule.id,
      actionType: rule.action_type,
      status,
      payload: {
        ...payload,
        scope: rule.scope,
        campaignId: context.campaignId || null,
        eventType: context.eventType || null,
        executionEventId: context.executionEventId || null,
        workflowRunId: context.workflowRunId || null,
        actionStepIndex,
        actionDelaySeconds,
      },
      errorMessage: errorMessage || null,
    });
  }
}

export const automationEngine = new AutomationEngine();
