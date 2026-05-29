import { randomUUID } from 'node:crypto';
import { customerService } from '../modules/customer/customer.service.js';
import {
  orchestratorQueue,
  type CampaignJobPayload,
  type VoicePostCallJobPayload,
} from '../queues/execution-queues.js';
import { chatResponse } from './llm.service.js';
import { publishExecutionEvent } from './execution-events.service.js';
import { analyzeStructuredCallResult } from './structured-agent.service.js';

type CampaignDb = {
  query: (text: string, params?: any[]) => Promise<{ rows: any[] }>;
};

type CampaignInput = {
  name: string;
  channel: 'sms' | 'call';
  messageTemplate: string;
  contacts: Array<{
    phone: string;
    name?: string;
    personalizationData?: Record<string, any>;
  }>;
  scheduledAt?: string | null;
};

type CampaignStats = {
  total: number;
  sent: number;
  delivered: number;
  responded: number;
  failed: number;
  pending: number;
  completionPercentage: number;
};

type CampaignJobContext = {
  campaign_job_id: string;
  campaign_id: string;
  campaign_contact_id: string;
  workspace_id: string;
  campaign_status: string;
  campaign_name: string;
  channel: 'sms' | 'call';
  message_template: string;
  scheduled_at?: string | null;
  voice_agent_id?: string | null;
  voice_agent_first_message?: string | null;
  voice_agent_name?: string | null;
  voice_agent_system_prompt?: string | null;
  workspace_timezone: string;
  workspace_business_name: string;
  workspace_language: string;
  workspace_greeting?: string | null;
  workspace_chatbot_personality?: string | null;
  workspace_knowledge_entries?: any;
  contact_id: string;
  contact_phone: string;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_external_id?: string | null;
  contact_metadata?: any;
  personalization_data?: any;
  attempts: number;
  max_attempts: number;
};

function isRetryableCallOutcome(status: string) {
  return ['busy', 'failed', 'no-answer', 'no_answer'].includes((status || '').toLowerCase());
}

const CAMPAIGN_RETRY_WINDOW_MS = 5 * 60 * 1000;

export class CampaignService {
  async createCampaign(db: CampaignDb, workspaceId: string, data: CampaignInput) {
    const campaignId = randomUUID();
    const contacts = Array.isArray(data.contacts) ? data.contacts : [];

    await db.query('BEGIN');

    try {
      await db.query(
        `INSERT INTO campaigns (
          id,
          workspace_id,
          name,
          channel,
          message_template,
          status,
          total_contacts,
          scheduled_at,
          type
        ) VALUES ($1, $2, $3, $4, $5, 'draft', $6, $7, $8)`,
        [
          campaignId,
          workspaceId,
          data.name,
          data.channel,
          data.messageTemplate,
          contacts.length,
          data.scheduledAt || null,
          data.channel,
        ]
      );

      if (contacts.length > 0) {
        const values: any[] = [];
        const placeholders: string[] = [];

        contacts.forEach((contact, index) => {
          const offset = index * 5;
          placeholders.push(
            `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`
          );
          values.push(
            randomUUID(),
            campaignId,
            contact.phone,
            contact.name || null,
            JSON.stringify(contact.personalizationData || {})
          );
        });

        await db.query(
          `INSERT INTO campaign_contacts (
            id,
            campaign_id,
            phone,
            name,
            personalization_data
          ) VALUES ${placeholders.join(', ')}`,
          values
        );
      }

      await db.query('COMMIT');
      return { campaignId };
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }

  async startCampaign(db: CampaignDb, campaignId: string) {
    return this.queueCampaignLaunch(db, campaignId);
  }

  async pauseCampaign(db: CampaignDb, campaignId: string) {
    await db.query(
      `UPDATE campaigns
       SET status = 'paused'
       WHERE id = $1`,
      [campaignId]
    );
  }

  async resumeCampaign(db: CampaignDb, campaignId: string) {
    await db.query(
      `UPDATE campaigns
       SET status = 'queued'
       WHERE id = $1`,
      [campaignId]
    );

    const jobRows = await db.query(
      `SELECT id
       FROM campaign_jobs
       WHERE campaign_id = $1
         AND status IN ('queued', 'retry_scheduled')`,
      [campaignId]
    );

    for (const row of jobRows.rows) {
      await this.enqueueCampaignDispatch({
        campaignJobId: row.id,
        campaignId,
        customerId: '',
        workspaceId: '',
        channel: 'call',
      }, 0, db);
    }
  }

  async queueCampaignLaunch(db: CampaignDb, campaignId: string) {
    const campaignResult = await db.query(
      `SELECT *
       FROM campaigns
       WHERE id = $1
       LIMIT 1`,
      [campaignId]
    );

    const campaign = campaignResult.rows[0];
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const contactsResult = await db.query(
      `SELECT *
       FROM campaign_contacts
       WHERE campaign_id = $1
       ORDER BY created_at ASC NULLS LAST, id ASC`,
      [campaignId]
    );

    const existingJobsResult = await db.query(
      `SELECT campaign_contact_id
       FROM campaign_jobs
       WHERE campaign_id = $1`,
      [campaignId]
    );

    const existingJobContacts = new Set(existingJobsResult.rows.map((row) => row.campaign_contact_id));
    const seenPhones = new Set<string>();
    const delayMs = this.getDelayUntilScheduled(campaign.scheduled_at);
    let queuedJobs = 0;
    const queuePayloads: CampaignJobPayload[] = [];
    const eventPayloads: Array<{
      campaignContactId: string;
      campaignJobId: string;
      channel: 'sms' | 'call';
    }> = [];

    await db.query('BEGIN');

    try {
      await db.query(
        `UPDATE campaigns
         SET status = 'queued',
             started_at = COALESCE(started_at, NOW())
         WHERE id = $1`,
        [campaignId]
      );

      for (const contact of contactsResult.rows) {
        const normalizedPhone = this.normalizePhone(contact.phone);
        if (!normalizedPhone) {
          await db.query(
            `UPDATE campaign_contacts
             SET status = 'failed',
                 outcome = 'invalid_phone'
             WHERE id = $1`,
            [contact.id]
          );
          continue;
        }

        if (seenPhones.has(normalizedPhone)) {
          await db.query(
            `UPDATE campaign_contacts
             SET status = 'failed',
                 outcome = 'duplicate_phone'
             WHERE id = $1`,
            [contact.id]
          );
          continue;
        }

        seenPhones.add(normalizedPhone);

        if (existingJobContacts.has(contact.id)) {
          continue;
        }

        const jobId = randomUUID();
        await db.query(
          `INSERT INTO campaign_jobs (
             id,
             campaign_id,
             campaign_contact_id,
             workspace_id,
             channel,
             status,
             scheduled_for,
             execution_context
           ) VALUES ($1, $2, $3, $4, $5, 'queued', NOW() + ($6 || ' milliseconds')::interval, $7)`,
          [
            jobId,
            campaignId,
            contact.id,
            campaign.workspace_id,
            campaign.channel || (campaign.voice_agent_id ? 'call' : 'sms'),
            String(delayMs),
            JSON.stringify({
              campaignName: campaign.name,
              scheduledAt: campaign.scheduled_at || null,
              contactPhone: normalizedPhone,
            }),
          ]
        );
        queuePayloads.push({
          campaignJobId: jobId,
          campaignId,
          customerId: contact.id,
          workspaceId: campaign.workspace_id,
          channel: campaign.channel || (campaign.voice_agent_id ? 'call' : 'sms'),
        });
        eventPayloads.push({
          campaignContactId: contact.id,
          campaignJobId: jobId,
          channel: campaign.channel || (campaign.voice_agent_id ? 'call' : 'sms'),
        });

        queuedJobs += 1;
      }

      await db.query('COMMIT');
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

    for (const payload of queuePayloads) {
      await this.enqueueCampaignDispatch(payload, delayMs, db);
    }

    for (const event of eventPayloads) {
      await publishExecutionEvent(db, {
        workspaceId: campaign.workspace_id,
        campaignId,
        campaignContactId: event.campaignContactId,
        eventType: 'campaign.job.queued',
        eventSource: 'campaign.launch',
        payload: {
          campaignJobId: event.campaignJobId,
          channel: event.channel,
          scheduledAt: campaign.scheduled_at || null,
        },
      });
    }

    await publishExecutionEvent(db, {
      workspaceId: campaign.workspace_id,
      campaignId,
      eventType: 'campaign_launched',
      eventSource: 'campaign.launch',
      payload: {
        campaignName: campaign.name,
        queuedJobs,
        totalContacts: contactsResult.rows.length,
      },
    });

    await this.syncCampaignStatus(db, campaignId);
    return { campaignId, queuedJobs };
  }

  async processCampaignJob(
    db: CampaignDb,
    payload: CampaignJobPayload,
    twilioService: any
  ) {
    const jobContext = await this.loadCampaignJobContext(db, payload.campaignJobId);
    if (!jobContext) {
      return;
    }

    if (['paused', 'completed', 'failed', 'partially_completed'].includes(jobContext.campaign_status)) {
      return;
    }

    const processingResult = await db.query(
      `UPDATE campaign_jobs
       SET status = 'processing',
           started_at = COALESCE(started_at, NOW()),
           error_message = NULL,
           updated_at = NOW()
       WHERE id = $1
         AND status IN ('queued', 'retry_scheduled', 'processing')
       RETURNING *`,
      [payload.campaignJobId]
    );

    if (processingResult.rows.length === 0) {
      return;
    }

    const localHour = this.getLocalHour(jobContext.workspace_timezone || 'UTC');
    if (localHour < 8 || localHour > 21) {
      const nextRun = this.getNextAllowedSendTime(jobContext.workspace_timezone || 'UTC');
      await db.query(
        `UPDATE campaign_jobs
         SET status = 'retry_scheduled',
             next_retry_at = $2,
             scheduled_for = $2,
             updated_at = NOW()
         WHERE id = $1`,
        [payload.campaignJobId, nextRun.toISOString()]
      );

      await this.enqueueCampaignDispatch(payload, Math.max(nextRun.getTime() - Date.now(), 0), db);
      await this.syncCampaignStatus(db, jobContext.campaign_id);
      return;
    }

    const message = await this.personalizeMessage(
      {
        channel: jobContext.channel,
        message_template: jobContext.message_template || jobContext.voice_agent_first_message || '',
        workspace_business_name: jobContext.workspace_business_name,
      },
      {
        id: jobContext.contact_id,
        phone: jobContext.contact_phone,
        name: jobContext.contact_name,
        personalization_data: jobContext.personalization_data,
      }
    );

    try {
      if (jobContext.channel === 'sms') {
        const smsResult = await twilioService.sendSMS(jobContext.contact_phone, message);

        await db.query(
          `UPDATE campaign_contacts
           SET status = 'sent',
               sent_at = NOW(),
               twilio_sid = $1,
               outcome = 'sent'
           WHERE id = $2`,
          [smsResult.sid, jobContext.contact_id]
        );

        await db.query(
          `UPDATE campaign_jobs
           SET status = 'completed',
               twilio_sid = $2,
               error_message = NULL,
               failure_type = NULL,
               next_retry_at = NULL,
               completed_at = NOW(),
               updated_at = NOW()
           WHERE id = $1`,
          [payload.campaignJobId, smsResult.sid]
        );

        await publishExecutionEvent(db, {
          workspaceId: jobContext.workspace_id,
          campaignId: jobContext.campaign_id,
          campaignContactId: jobContext.contact_id,
          eventType: 'campaign.job.completed',
          eventSource: 'campaign.dispatch',
          payload: {
            campaignJobId: payload.campaignJobId,
            channel: 'sms',
            sid: smsResult.sid,
            message,
          },
        });
      } else {
        const callSid = await twilioService.makeOutboundCall(
          jobContext.contact_phone,
          this.buildCallTwimlUrl(
            {
              id: jobContext.campaign_id,
              voice_agent_id: jobContext.voice_agent_id,
            },
            { id: jobContext.contact_id },
            message,
            payload.campaignJobId
          )
        );

        await db.query(
          `UPDATE campaign_contacts
           SET status = 'sent',
               sent_at = NOW(),
               twilio_sid = $1,
               called_at = NOW(),
               outcome = 'queued'
           WHERE id = $2`,
          [callSid, jobContext.contact_id]
        );

        await db.query(
          `UPDATE campaign_jobs
           SET status = 'processing',
               twilio_sid = $2,
               error_message = NULL,
               failure_type = NULL,
               next_retry_at = NULL,
               updated_at = NOW()
           WHERE id = $1`,
          [payload.campaignJobId, callSid]
        );

        await publishExecutionEvent(db, {
          workspaceId: jobContext.workspace_id,
          campaignId: jobContext.campaign_id,
          campaignContactId: jobContext.contact_id,
          eventType: 'call.started',
          eventSource: 'campaign.dispatch',
          dedupeKey: `call-started:${callSid}`,
          payload: {
            campaignJobId: payload.campaignJobId,
            callSid,
            channel: 'call',
            customerPhone: jobContext.contact_phone,
          },
        });
      }
    } catch (error: any) {
      const nextAttempt = Number(jobContext.attempts || 0) + 1;
      const failureType = this.classifyFailure(error);
      if (nextAttempt < jobContext.max_attempts) {
        const retryAt = new Date(Date.now() + CAMPAIGN_RETRY_WINDOW_MS);
        await db.query(
          `UPDATE campaign_jobs
           SET status = 'retry_scheduled',
               scheduled_for = $2,
               next_retry_at = $2,
               attempts = $4,
               error_message = $3,
               failure_type = $5,
               updated_at = NOW()
           WHERE id = $1`,
          [payload.campaignJobId, retryAt.toISOString(), error.message, nextAttempt, failureType]
        );

        await this.enqueueCampaignDispatch(payload, retryAt.getTime() - Date.now(), db);
      } else {
        await db.query(
          `UPDATE campaign_jobs
           SET status = 'failed',
               completed_at = NOW(),
               attempts = $3,
               error_message = $2,
               failure_type = $4,
               next_retry_at = NULL,
               updated_at = NOW()
           WHERE id = $1`,
          [payload.campaignJobId, error.message, nextAttempt, failureType]
        );

        await db.query(
          `UPDATE campaign_contacts
           SET status = 'failed',
               called_at = NOW(),
               outcome = 'failed'
           WHERE id = $1`,
          [jobContext.contact_id]
        );

        await publishExecutionEvent(db, {
          workspaceId: jobContext.workspace_id,
          campaignId: jobContext.campaign_id,
          campaignContactId: jobContext.contact_id,
          eventType: 'campaign.job.failed',
          eventSource: 'campaign.dispatch',
          payload: {
            campaignJobId: payload.campaignJobId,
            error: error.message,
            failure_type: failureType,
          },
        });

        await this.recordDeadLetterJob(db, {
          campaignJobId: payload.campaignJobId,
          workspaceId: jobContext.workspace_id,
          payload,
          errorMessage: error.message,
          attemptsMade: nextAttempt,
        });
      }
    }

    await this.syncCampaignStatus(db, jobContext.campaign_id);
  }

  async processCompletedCallJob(db: CampaignDb, payload: VoicePostCallJobPayload) {
    const structured = await analyzeStructuredCallResult({
      workspaceName: payload.workspaceConfig?.business_name || null,
      agentName: payload.workspaceConfig?.voice_agent_name || null,
      transcript: payload.transcript || payload.callStatus,
    });

    const customerSignals = this.deriveCustomerSignals(
      payload.transcript,
      payload.callStatus,
      payload.durationSeconds,
      structured
    );

    await db.query(
      `INSERT INTO calls (
         workspace_id,
         direction,
         caller_phone,
         duration,
         outcome,
         transcript,
         language_detected,
         template_used,
         sentiment
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        payload.workspaceId,
        payload.direction || 'outbound',
        payload.caller || null,
        payload.durationSeconds,
        payload.callStatus,
        payload.transcript,
        payload.language || null,
        payload.templateUsed || null,
        structured.sentiment,
      ]
    );

    if (payload.sessionId) {
      await db.query(
        `UPDATE conversation_sessions
         SET transcript = $1,
             intent = $2,
             outcome = $3,
             sentiment_score = $4,
             ended_at = NOW(),
             metadata = COALESCE(metadata, '{}'::jsonb) || $5::jsonb
         WHERE id = $6`,
        [
          JSON.stringify(payload.history || []),
          structured.intent || null,
          payload.callStatus,
          structured.sentiment === 'positive' ? 0.8 : structured.sentiment === 'negative' ? 0.2 : 0.5,
          JSON.stringify({
            callSid: payload.callSid,
            durationSeconds: payload.durationSeconds,
            structuredResult: structured,
            campaignId: payload.campaignId || null,
            campaignContactId: payload.campaignContactId || null,
            campaignJobId: payload.campaignJobId || null,
          }),
          payload.sessionId,
        ]
      );
    }

    if (payload.campaignContactId) {
      await db.query(
        `UPDATE campaign_contacts
         SET outcome = $1,
             response = CASE WHEN $3 <> '' THEN $3 ELSE response END,
             status = CASE WHEN $1 IN ('failed', 'busy', 'no-answer', 'no_answer') THEN 'failed' ELSE status END
         WHERE id = $2`,
        [payload.callStatus, payload.campaignContactId, payload.transcript || '']
      );
    }

    if (payload.customerId) {
      await db.query(
        `UPDATE customers
         SET last_contact_at = NOW(),
             total_calls = total_calls + 1,
             lead_score = GREATEST(0, COALESCE(lead_score, 0) + $2),
             tags = ARRAY(
               SELECT DISTINCT tag
               FROM unnest(COALESCE(tags, '{}'::text[]) || $3::text[]) AS tag
             ),
             metadata = COALESCE(metadata, '{}'::jsonb) || $4::jsonb,
             updated_at = NOW()
         WHERE id = $1`,
        [
          payload.customerId,
          customerSignals.leadScoreDelta,
          customerSignals.tags,
          JSON.stringify({
            last_call_outcome: payload.callStatus,
            last_call_duration_seconds: payload.durationSeconds,
            structured_intent: structured.intent,
            customer_profile_sync: 'pending',
          }),
        ]
      );
    }

    if (payload.caller) {
      try {
        const profile = await customerService.findOrCreateProfile(
          payload.workspaceId,
          payload.caller,
          payload.customerName || undefined
        );
        const interaction = await customerService.logInteraction(
          payload.workspaceId,
          profile.id,
          {
            channel: 'voice',
            summary: structured.summary,
            sentiment: structured.sentiment,
            outcome: structured.disposition || payload.callStatus,
            raw_transcript: payload.transcript,
          }
        );

        await customerService.analyzeInteraction(profile.id, interaction.id);

        if (payload.customerId) {
          await db.query(
            `UPDATE customers
             SET metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb,
                 updated_at = NOW()
             WHERE id = $1`,
            [
              payload.customerId,
              JSON.stringify({
                customer_profile_id: profile.id,
              }),
            ]
          );
        }
      } catch (error) {
        console.error('[CampaignService] Customer profile sync failed:', error);
      }
    }

    if (payload.campaignJobId) {
      const jobResult = await db.query(
        `SELECT attempts, max_attempts
         FROM campaign_jobs
         WHERE id = $1
         LIMIT 1`,
        [payload.campaignJobId]
      );

      const job = jobResult.rows[0];
      if (job && isRetryableCallOutcome(payload.callStatus) && Number(job.attempts || 0) < Number(job.max_attempts || 3)) {
        const nextAttempt = Number(job.attempts || 0) + 1;
        const retryAt = new Date(Date.now() + CAMPAIGN_RETRY_WINDOW_MS);
        await db.query(
          `UPDATE campaign_jobs
           SET status = 'retry_scheduled',
               scheduled_for = $2,
               next_retry_at = $2,
               attempts = $4,
               error_message = $3,
               failure_type = $5,
               updated_at = NOW()
           WHERE id = $1`,
          [
            payload.campaignJobId,
            retryAt.toISOString(),
            payload.callStatus,
            nextAttempt,
            this.classifyFailure(payload.callStatus),
          ]
        );

        await this.enqueueCampaignDispatch(
          {
            campaignJobId: payload.campaignJobId,
            campaignId: payload.campaignId || '',
            customerId: payload.campaignContactId || '',
            workspaceId: payload.workspaceId,
            channel: 'call',
          },
          retryAt.getTime() - Date.now(),
          db
        );
      } else {
        await db.query(
          `UPDATE campaign_jobs
           SET status = CASE WHEN $2 IN ('failed', 'busy', 'no-answer', 'no_answer') THEN 'failed' ELSE 'completed' END,
               error_message = CASE WHEN $2 IN ('failed', 'busy', 'no-answer', 'no_answer') THEN $2 ELSE NULL END,
               failure_type = CASE WHEN $2 IN ('failed', 'busy', 'no-answer', 'no_answer') THEN 'external_api_error' ELSE NULL END,
               next_retry_at = NULL,
               completed_at = NOW(),
               updated_at = NOW()
           WHERE id = $1`,
          [payload.campaignJobId, payload.callStatus]
        );

        if (payload.callStatus && isRetryableCallOutcome(payload.callStatus)) {
          await this.recordDeadLetterJob(db, {
            campaignJobId: payload.campaignJobId,
            workspaceId: payload.workspaceId,
            payload,
            errorMessage: payload.callStatus,
            attemptsMade: Number(job?.attempts || 0),
          });
        }
      }
    }

    await publishExecutionEvent(db, {
      workspaceId: payload.workspaceId,
      sessionId: payload.sessionId || null,
      campaignId: payload.campaignId || null,
      campaignContactId: payload.campaignContactId || null,
      customerId: payload.customerId || null,
      eventType: 'call.completed',
      eventSource: 'voice.post_call',
      dedupeKey: `call-completed:${payload.callSid}`,
      payload: {
        callSid: payload.callSid,
        callStatus: payload.callStatus,
        durationSeconds: payload.durationSeconds,
        structuredResult: structured,
      },
    });

    if (structured.intent && structured.intent !== 'unknown') {
      await publishExecutionEvent(db, {
        workspaceId: payload.workspaceId,
        sessionId: payload.sessionId || null,
        campaignId: payload.campaignId || null,
        campaignContactId: payload.campaignContactId || null,
        customerId: payload.customerId || null,
        eventType: 'intent.detected',
        eventSource: 'voice.post_call',
        dedupeKey: `intent:${payload.callSid}:${structured.intent}`,
        payload: {
          intent: structured.intent,
          confidence: structured.confidence,
          entities: structured.entities,
          tags: structured.tags,
          disposition: structured.disposition,
        },
      });
    }

    if (payload.campaignId) {
      await this.syncCampaignStatus(db, payload.campaignId);
    }
  }

  async getCampaignStats(db: CampaignDb, campaignId: string): Promise<CampaignStats> {
    const countsResult = await db.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'sent')::int AS sent,
         COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
         COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
         COUNT(*) FILTER (WHERE response IS NOT NULL)::int AS responded
       FROM campaign_contacts
       WHERE campaign_id = $1`,
      [campaignId]
    );

    const campaignResult = await db.query(
      `SELECT delivered, responded
       FROM campaigns
       WHERE id = $1
       LIMIT 1`,
      [campaignId]
    );

    const counts = countsResult.rows[0] || {};
    const campaign = campaignResult.rows[0] || {};
    const total = Number(counts.total || 0);
    const sent = Number(counts.sent || 0);
    const failed = Number(counts.failed || 0);
    const pending = Number(counts.pending || 0);
    const responded = Math.max(
      Number(counts.responded || 0),
      Number(campaign.responded || 0)
    );
    const delivered = Number(campaign.delivered || 0);
    const completionPercentage = total === 0
      ? 0
      : Number((((sent + failed) / total) * 100).toFixed(2));

    return {
      total,
      sent,
      delivered,
      responded,
      failed,
      pending,
      completionPercentage,
    };
  }

  async getResponses(db: CampaignDb, campaignId: string) {
    const result = await db.query(
      `SELECT *
       FROM campaign_contacts
       WHERE campaign_id = $1 AND response IS NOT NULL
       ORDER BY sent_at DESC NULLS LAST, created_at DESC NULLS LAST`,
      [campaignId]
    );

    return result.rows;
  }

  async processNextBatch(db: CampaignDb, campaignId: string, twilioService: any) {
    const campaignResult = await db.query(
      `SELECT
         c.*,
         COALESCE(w.timezone, 'UTC') AS workspace_timezone,
         COALESCE(w.business_name, w.name, 'our business') AS workspace_business_name,
         va.first_message AS voice_agent_first_message
       FROM campaigns c
       JOIN workspaces w ON w.id = c.workspace_id
       LEFT JOIN voice_agents va ON va.id = c.voice_agent_id
       WHERE c.id = $1
       LIMIT 1`,
      [campaignId]
    );

    const campaign = campaignResult.rows[0];
    if (!campaign || !['active', 'running'].includes(campaign.status)) {
      return;
    }

    const resolvedChannel = campaign.channel || (campaign.voice_agent_id ? 'call' : 'sms');
    const resolvedTemplate =
      campaign.message_template ||
      campaign.voice_agent_first_message ||
      'Hello {{name}}, this is a quick follow-up from {{business}}.';

    const localHour = this.getLocalHour(campaign.workspace_timezone || 'UTC');
    if (localHour < 8 || localHour > 21) {
      return;
    }

    const contactsResult = await db.query(
      `SELECT *
       FROM campaign_contacts
       WHERE campaign_id = $1 AND status = 'pending'
       ORDER BY created_at ASC NULLS LAST, id ASC
       LIMIT 10`,
      [campaignId]
    );

    if (contactsResult.rows.length === 0) {
      await db.query(
        `UPDATE campaigns
         SET status = 'completed', completed_at = NOW()
         WHERE id = $1`,
        [campaignId]
      );
      return;
    }

    for (const contact of contactsResult.rows) {
      try {
        const message = await this.personalizeMessage({
          ...campaign,
          channel: resolvedChannel,
          message_template: resolvedTemplate,
        }, contact);
        let sid: string | null = null;

        if (resolvedChannel === 'sms') {
          const result = await twilioService.sendSMS(contact.phone, message);
          sid = result.sid;
        } else if (resolvedChannel === 'call') {
          sid = await twilioService.makeOutboundCall(
            contact.phone,
            this.buildCallTwimlUrl(campaign, contact, message)
          );
        } else {
          throw new Error(`Unsupported campaign channel: ${campaign.channel}`);
        }

        await db.query(
          `UPDATE campaign_contacts
           SET status = 'sent',
               sent_at = NOW(),
               twilio_sid = $1,
               called_at = NOW(),
               outcome = 'sent'
           WHERE id = $2`,
          [sid, contact.id]
        );

        await db.query(
          `UPDATE campaigns
           SET sent = sent + 1,
               calls_made = calls_made + CASE WHEN $2 = 'call' THEN 1 ELSE 0 END
           WHERE id = $1`,
          [campaignId, resolvedChannel]
        );
      } catch (error) {
        console.error(`[CampaignService] Failed to process contact ${contact.id}:`, error);

        await db.query(
          `UPDATE campaign_contacts
           SET status = 'failed',
               called_at = NOW(),
               outcome = 'failed'
           WHERE id = $1`,
          [contact.id]
        );

        await db.query(
          `UPDATE campaigns
           SET failed = failed + 1
           WHERE id = $1`,
          [campaignId]
        );
      }

      await this.sleep(6000);
    }

    const remainingResult = await db.query(
      `SELECT COUNT(*)::int AS pending_count
       FROM campaign_contacts
       WHERE campaign_id = $1 AND status = 'pending'`,
      [campaignId]
    );

    if ((remainingResult.rows[0]?.pending_count || 0) === 0) {
      await db.query(
        `UPDATE campaigns
         SET status = 'completed', completed_at = NOW()
         WHERE id = $1`,
        [campaignId]
      );
    }
  }

  private async loadCampaignJobContext(db: CampaignDb, campaignJobId: string): Promise<CampaignJobContext | null> {
    const result = await db.query(
      `SELECT
         cj.id AS campaign_job_id,
         cj.campaign_id,
         cj.campaign_contact_id,
         cj.workspace_id,
         COALESCE(cj.attempts, cj.attempt_count, 0) AS attempts,
         COALESCE(cj.max_attempts, 3) AS max_attempts,
         c.status AS campaign_status,
         c.name AS campaign_name,
         COALESCE(c.channel, CASE WHEN c.voice_agent_id IS NOT NULL THEN 'call' ELSE 'sms' END) AS channel,
         COALESCE(NULLIF(c.message_template, ''), va.first_message, 'Hello {{name}}, this is {{business}}.') AS message_template,
         c.scheduled_at,
         c.voice_agent_id,
         va.first_message AS voice_agent_first_message,
         va.name AS voice_agent_name,
         va.system_prompt AS voice_agent_system_prompt,
         COALESCE(w.timezone, 'UTC') AS workspace_timezone,
         COALESCE(w.business_name, w.name, 'our business') AS workspace_business_name,
         COALESCE(w.language, 'en-IN') AS workspace_language,
         w.greeting AS workspace_greeting,
         w.chatbot_personality AS workspace_chatbot_personality,
         w.knowledge_entries AS workspace_knowledge_entries,
         cc.id AS contact_id,
         cc.phone AS contact_phone,
         cc.name AS contact_name,
         cc.email AS contact_email,
         cc.external_id AS contact_external_id,
         cc.metadata AS contact_metadata,
         cc.personalization_data
       FROM campaign_jobs cj
       JOIN campaigns c ON c.id = cj.campaign_id
       JOIN campaign_contacts cc ON cc.id = cj.campaign_contact_id
       JOIN workspaces w ON w.id = c.workspace_id
       LEFT JOIN voice_agents va ON va.id = c.voice_agent_id
       WHERE cj.id = $1
       LIMIT 1`,
      [campaignJobId]
    );

    return result.rows[0] || null;
  }

  private async enqueueCampaignDispatch(
    payload: CampaignJobPayload,
    delayMs: number = 0,
    db?: CampaignDb
  ) {
    const queuedJob = await orchestratorQueue.add(
      'execute',
      {
        jobType: 'campaign_dispatch',
        workspaceId: payload.workspaceId,
        campaignJob: payload,
      },
      {
        jobId: `campaign-job-${payload.campaignJobId}`,
        delay: Math.max(delayMs, 0),
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: CAMPAIGN_RETRY_WINDOW_MS,
        },
      }
    );

    if (db) {
      try {
        await db.query(
          `UPDATE campaign_jobs
           SET queue_job_id = $2,
               updated_at = NOW()
           WHERE id = $1`,
          [payload.campaignJobId, String(queuedJob.id || '')]
        );
      } catch {
        // queue_job_id column may not exist until reliability migration is applied.
      }
    }
  }

  private async personalizeMessage(campaign: any, contact: any): Promise<string> {
    const personalizationData = this.normalizePersonalizationData(contact.personalization_data);
    const interpolated = this.interpolateTemplate(campaign.message_template || '', {
      name: contact.name || 'there',
      phone: contact.phone,
      business: campaign.workspace_business_name || 'our business',
      ...personalizationData,
    });

    try {
      const personalized = await chatResponse(
        'You personalize outbound campaign copy. Keep the message concise, preserve the original intent, do not invent offers, and return only the final message.',
        [
          {
            role: 'user',
            content: JSON.stringify({
              channel: campaign.channel,
              business: campaign.workspace_business_name || 'our business',
              template: campaign.message_template || '',
              interpolatedMessage: interpolated,
              recipient: {
                name: contact.name || null,
                phone: contact.phone,
                personalizationData,
              },
            }),
          },
        ]
      );

      return personalized || interpolated;
    } catch (error) {
      console.error('[CampaignService] AI personalization failed, using interpolated template:', error);
      return interpolated;
    }
  }

  private async syncCampaignStatus(db: CampaignDb, campaignId: string) {
    const jobCountsResult = await db.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
         COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
         COUNT(*) FILTER (WHERE status IN ('queued', 'retry_scheduled'))::int AS queued,
         COUNT(*) FILTER (WHERE status = 'processing')::int AS running
       FROM campaign_jobs
       WHERE campaign_id = $1`,
      [campaignId]
    );

    const contactCountsResult = await db.query(
      `SELECT
         COUNT(*)::int AS total_contacts,
         COUNT(*) FILTER (WHERE status = 'sent')::int AS sent,
         COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
         COUNT(*) FILTER (WHERE response IS NOT NULL OR outcome = 'completed')::int AS responded,
         COUNT(*) FILTER (WHERE outcome = 'completed')::int AS calls_answered
       FROM campaign_contacts
       WHERE campaign_id = $1`,
      [campaignId]
    );

    const jobCounts = jobCountsResult.rows[0] || {};
    const contactCounts = contactCountsResult.rows[0] || {};
    const total = Number(jobCounts.total || 0);
    const completed = Number(jobCounts.completed || 0);
    const failed = Number(jobCounts.failed || 0);
    const queued = Number(jobCounts.queued || 0);
    const running = Number(jobCounts.running || 0);

    let status = 'draft';
    if (total === 0) {
      status = 'draft';
    } else if (running > 0) {
      status = 'running';
    } else if (queued > 0) {
      status = 'queued';
    } else if (completed === total) {
      status = 'completed';
    } else if (failed === total) {
      status = 'failed';
    } else if (completed + failed === total) {
      status = 'partially_completed';
    }

    await db.query(
      `UPDATE campaigns
       SET status = $2::text,
           total_contacts = $3,
           sent = $4,
           failed = $5,
           responded = $6,
           calls_answered = $7,
           completed_at = CASE WHEN $2::text IN ('completed', 'failed', 'partially_completed') THEN NOW() ELSE completed_at END
       WHERE id = $1`,
      [
        campaignId,
        status,
        Number(contactCounts.total_contacts || 0),
        Number(contactCounts.sent || 0),
        Number(contactCounts.failed || 0),
        Number(contactCounts.responded || 0),
        Number(contactCounts.calls_answered || 0),
      ]
    );
  }

  private deriveCustomerSignals(
    transcript: string,
    callStatus: string,
    durationSeconds: number,
    structuredResult: Awaited<ReturnType<typeof analyzeStructuredCallResult>>
  ) {
    const lowered = (transcript || '').toLowerCase();
    const tags = new Set<string>(['campaign_voice']);
    let leadScoreDelta = 0;

    if (callStatus === 'completed' && durationSeconds > 10) {
      tags.add('answered_call');
      leadScoreDelta += 5;
    }

    if (structuredResult.intent && structuredResult.intent !== 'unknown') {
      tags.add(structuredResult.intent);
    }

    for (const tag of structuredResult.tags) {
      tags.add(tag);
    }

    if (/\b(interested|book|appointment|demo|quote|pricing|callback|schedule)\b/.test(lowered)) {
      tags.add('interested');
      leadScoreDelta += 15;
    }

    if (/\b(not interested|stop|unsubscribe|remove me|do not call)\b/.test(lowered)) {
      tags.add('do_not_call_review');
      leadScoreDelta -= 10;
    }

    if (/\b(complaint|issue|problem|refund|cancel)\b/.test(lowered)) {
      tags.add('support_needed');
    }

    return {
      tags: Array.from(tags),
      leadScoreDelta,
    };
  }

  private interpolateTemplate(template: string, data: Record<string, any>) {
    return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, key: string) => {
      const value = data[key];
      return value === undefined || value === null ? '' : String(value);
    }).trim();
  }

  private normalizePersonalizationData(value: any): Record<string, any> {
    if (!value) {
      return {};
    }

    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return {};
      }
    }

    if (typeof value === 'object') {
      return value;
    }

    return {};
  }

  private normalizePhone(phone?: string | null) {
    const normalized = `${phone || ''}`.replace(/[^\d+]/g, '').trim();
    return normalized.length >= 6 ? normalized : '';
  }

  private buildCallTwimlUrl(campaign: any, contact: any, message: string, campaignJobId?: string) {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:8000';

    if (campaign.voice_agent_id) {
      const query = new URLSearchParams();
      if (campaignJobId) {
        query.set('jobId', campaignJobId);
      }
      const suffix = query.toString() ? `?${query.toString()}` : '';
      return `${baseUrl}/api/webhooks/twilio/voice/campaign/${campaign.id}/contact/${contact.id}${suffix}`;
    }

    const params = new URLSearchParams({
      'Message[0]': message,
    });

    return `https://twimlets.com/message?${params.toString()}`;
  }

  private getLocalHour(timezone: string) {
    const hour = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: timezone,
    }).format(new Date());

    return Number(hour);
  }

  private getDelayUntilScheduled(scheduledAt?: string | null) {
    if (!scheduledAt) {
      return 0;
    }

    const scheduledDate = new Date(scheduledAt);
    if (Number.isNaN(scheduledDate.getTime())) {
      return 0;
    }

    return Math.max(scheduledDate.getTime() - Date.now(), 0);
  }

  private getNextAllowedSendTime(timezone: string) {
    const now = new Date();
    const localNow = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const nextLocal = new Date(localNow);

    if (localNow.getHours() < 8) {
      nextLocal.setHours(8, 0, 0, 0);
    } else {
      nextLocal.setDate(nextLocal.getDate() + 1);
      nextLocal.setHours(8, 0, 0, 0);
    }

    return new Date(now.getTime() + (nextLocal.getTime() - localNow.getTime()));
  }

  private classifyFailure(error: any): 'network_error' | 'ai_error' | 'invalid_input' | 'external_api_error' | 'unknown' {
    const message = `${error?.message || error || ''}`.toLowerCase();

    if (!message) {
      return 'unknown';
    }

    if (message.includes('invalid') || message.includes('validation') || message.includes('required')) {
      return 'invalid_input';
    }

    if (message.includes('openai') || message.includes('llm') || message.includes('model') || message.includes('ai')) {
      return 'ai_error';
    }

    if (message.includes('twilio') || message.includes('api') || message.includes('http')) {
      return 'external_api_error';
    }

    if (message.includes('timeout') || message.includes('network') || message.includes('econn') || message.includes('socket')) {
      return 'network_error';
    }

    return 'unknown';
  }

  private async recordDeadLetterJob(
    db: CampaignDb,
    input: {
      campaignJobId: string;
      workspaceId: string;
      payload: Record<string, any>;
      errorMessage: string;
      attemptsMade?: number;
    }
  ) {
    try {
      await db.query(
        `INSERT INTO dead_letter_jobs (
           campaign_job_id,
           workspace_id,
           payload,
           error_message,
           failed_at,
           original_queue,
           original_job_id,
           original_job_name,
           failed_reason,
           attempts_made,
           status,
           created_at
         ) VALUES ($1, $2, $3, $4, NOW(), 'orchestrator', $5, 'campaign_dispatch', $4, $6, 'dead', NOW())`,
        [
          input.campaignJobId,
          input.workspaceId,
          JSON.stringify(input.payload || {}),
          input.errorMessage,
          input.campaignJobId,
          Number(input.attemptsMade || 0),
        ]
      );
    } catch {
      // Fallback for environments where extended dead-letter columns are not present yet.
      await db.query(
        `INSERT INTO dead_letter_jobs (
           original_queue,
           original_job_id,
           original_job_name,
           workspace_id,
           payload,
           failed_reason,
           attempts_made,
           status,
           created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'dead', NOW())`,
        [
          'orchestrator',
          input.campaignJobId,
          'campaign_dispatch',
          input.workspaceId,
          JSON.stringify(input.payload || {}),
          input.errorMessage,
          Number(input.attemptsMade || 0),
        ]
      );
    }
  }

  private async sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const campaignService = new CampaignService();
