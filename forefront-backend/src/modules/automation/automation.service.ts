import { randomUUID } from 'node:crypto';
import { pool } from '../../config/db.js';
import { logAutomationAction } from './action-log.service.js';
import { sendWorkspaceSms } from './sms.service.js';
import { markExecutionEventProcessed, publishExecutionEvent } from '../../services/execution-events.service.js';
import { orchestratorQueue } from '../../queues/execution-queues.js';

type AutomationContext = {
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
};

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

function getScopeRank(scope?: string | null) {
  if (scope === 'campaign') return 0;
  if (scope === 'agent') return 1;
  return 2;
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

      await this.evaluateContext({
        workspaceId: session.workspace_id,
        agentId: session.agent_id,
        campaignId: metadata.campaignId || null,
        campaignContactId: metadata.campaignContactId || null,
        campaignJobId: metadata.campaignJobId || null,
        sessionId: session.id,
        customerId: session.customer_id,
        customerPhone: session.customer_phone,
        message: currentTurn.message,
        role: currentTurn.role,
        sentimentScore: currentTurn.sentimentScore,
        callOutcome: currentTurn.callOutcome || session.outcome,
        durationSeconds: currentTurn.durationSeconds,
        intent: currentTurn.intent || session.intent,
        entities: currentTurn.entities || {},
        eventType: currentTurn.eventType || 'call.turn.completed',
        payload: metadata,
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

      await this.evaluateContext({
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

      await this.executeAction(rule, context);
      stopFurtherExecution = Boolean(rule.is_terminal);
    }
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
           action_type,
           action_config,
           is_active,
           priority,
           cooldown_seconds,
           event_type,
           is_terminal
         ) VALUES ($1, NULL, NULL, 'workspace', 'appointment_created', $2, 'send_sms', $3, true, 100, 0, 'appointment.created', false)`,
        [
          context.workspaceId,
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

      case 'appointment_created':
        return eventType === 'appointment.created';

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

  private async executeAction(rule: any, context: AutomationContext): Promise<void> {
    const config = parseJsonObject(rule.action_config);

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
          await this.logAction(rule, context, 'success', {
            subject: config.subject || 'Automated Rule Ticket',
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
          await this.logAction(rule, context, 'success', { outcome: 'escalated' });
          break;
        }

        case 'send_sms': {
          const smsBody = this.renderMessageTemplate(config.message || 'Alert', context);
          const smsResult = await sendWorkspaceSms({
            workspaceId: context.workspaceId,
            to: context.customerPhone,
            body: smsBody,
          });

          await this.logAction(rule, context, smsResult.status, {
            to: context.customerPhone,
            from: smsResult.from,
            provider: smsResult.provider,
            sid: smsResult.sid,
            message: smsBody,
          }, smsResult.error || null);
          break;
        }

        case 'tag_customer': {
          const tagResult = await this.tagCustomer(context, config.tag || 'automation');
          await this.logAction(rule, context, tagResult.status, {
            customerId: tagResult.customerId,
            phone: context.customerPhone,
            tag: config.tag || 'automation',
          }, tagResult.error || null);
          break;
        }

        case 'schedule_callback': {
          await this.scheduleCallback(context, config);
          await this.logAction(rule, context, 'success', {
            scheduledFor: config.scheduledFor || config.delaySeconds || 3600,
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

          await this.logAction(rule, context, 'success', {
            campaignContactId: context.campaignContactId || null,
            outcome: config.outcome || context.callOutcome || 'updated',
          });
          break;
        }

        case 'enqueue_follow_up_job': {
          const campaignJobId = context.campaignJobId;
          const campaignId = context.campaignId;
          const campaignContactId = context.campaignContactId;

          if (!campaignJobId || !campaignId || !campaignContactId) {
            await this.logAction(rule, context, 'skipped', {
              reason: 'Missing campaign context for follow-up job',
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
            await this.logAction(rule, context, 'skipped', {
              reason: 'Campaign job not found',
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

          await this.logAction(rule, context, 'success', {
            campaignJobId: nextJobId,
            delaySeconds,
          });
          break;
        }

        default: {
          await this.logAction(rule, context, 'skipped', {
            reason: 'Unsupported action type',
          });
          break;
        }
      }

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
        },
      });
    } catch (error: any) {
      console.error(`[Automation] Execution failed for rule ${rule.id}:`, error.message);
      await this.logAction(rule, context, 'failed', {
        actionConfig: config,
      }, error.message);
    }
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
      },
      errorMessage: errorMessage || null,
    });
  }
}

export const automationEngine = new AutomationEngine();
