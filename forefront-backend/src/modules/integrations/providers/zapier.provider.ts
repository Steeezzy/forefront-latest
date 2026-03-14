/**
 * Zapier Integration Provider
 *
 * Tidio pattern: Flow editor "Send to Zapier" action node
 * - User configures Integration Key (API key for auth)
 * - User provides Zapier webhook URL from their Zap
 * - When a flow reaches "Send to Zapier" node, Questron fires
 *   a POST to the webhook URL with contact + conversation data
 *
 * Triggers supported:
 * - contact_created: New contact from chat
 * - conversation_started: New conversation opened
 * - conversation_rated: Visitor rated the conversation
 * - prechat_form_submitted: Pre-chat form completed
 * - message_received: New message from visitor
 * - tag_added: Tag added to conversation
 */

import { pool } from '../../../config/db.js';

export interface ZapierWebhookPayload {
  event: string;
  timestamp: string;
  data: {
    contact?: {
      email?: string;
      name?: string;
      phone?: string;
      tags?: string[];
    };
    conversation?: {
      id?: string;
      channel?: string;
      rating?: number;
      ratingComment?: string;
    };
    message?: {
      text?: string;
      sender?: string;
    };
    customFields?: Record<string, any>;
  };
}

export const ZAPIER_TRIGGER_EVENTS = [
  'contact_created',
  'conversation_started',
  'conversation_rated',
  'prechat_form_submitted',
  'message_received',
  'tag_added',
  'conversation_closed',
  'operator_replied',
] as const;

export type ZapierTriggerEvent = typeof ZAPIER_TRIGGER_EVENTS[number];

export class ZapierProvider {

  /**
   * Register a Zapier webhook URL for a specific event in a workspace
   */
  async registerWebhook(
    workspaceId: string,
    integrationId: string,
    webhookUrl: string,
    triggerEvent: ZapierTriggerEvent,
    flowId?: string
  ): Promise<string> {
    const result = await pool.query(
      `INSERT INTO zapier_webhooks (integration_id, workspace_id, webhook_url, trigger_event, flow_id, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT (integration_id, trigger_event) 
       DO UPDATE SET webhook_url = $3, flow_id = $5, is_active = true, updated_at = NOW()
       RETURNING id`,
      [integrationId, workspaceId, webhookUrl, triggerEvent, flowId]
    );
    return result.rows[0].id;
  }

  /**
   * Unregister a Zapier webhook
   */
  async unregisterWebhook(webhookId: string, workspaceId: string): Promise<void> {
    await pool.query(
      `UPDATE zapier_webhooks SET is_active = false WHERE id = $1 AND workspace_id = $2`,
      [webhookId, workspaceId]
    );
  }

  /**
   * Get all active webhooks for a workspace
   */
  async getWebhooks(workspaceId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT zw.*, i.status as integration_status
       FROM zapier_webhooks zw
       JOIN integrations i ON i.id = zw.integration_id
       WHERE zw.workspace_id = $1 AND zw.is_active = true
       ORDER BY zw.created_at DESC`,
      [workspaceId]
    );
    return result.rows;
  }

  /**
   * Fire a trigger event — sends POST to all matching Zapier webhook URLs
   */
  async fireTrigger(
    workspaceId: string,
    event: ZapierTriggerEvent,
    payload: ZapierWebhookPayload['data']
  ): Promise<{ sent: number; failed: number }> {
    // Find all active webhooks for this event
    const result = await pool.query(
      `SELECT zw.id, zw.webhook_url
       FROM zapier_webhooks zw
       JOIN integrations i ON i.id = zw.integration_id
       WHERE zw.workspace_id = $1 
         AND zw.trigger_event = $2 
         AND zw.is_active = true
         AND i.status = 'connected'`,
      [workspaceId, event]
    );

    if (result.rows.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const webhookPayload: ZapierWebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    };

    let sent = 0;
    let failed = 0;

    // Fire to all matching webhooks in parallel
    const promises = result.rows.map(async (row) => {
      try {
        const response = await fetch(row.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload),
          signal: AbortSignal.timeout(10000), // 10s timeout
        });

        // Log the fire
        await pool.query(
          `UPDATE zapier_webhooks SET last_triggered_at = NOW() WHERE id = $1`,
          [row.id]
        );

        if (response.ok) {
          sent++;
        } else {
          failed++;
          console.error(`Zapier webhook ${row.id} returned ${response.status}`);
        }
      } catch (err: any) {
        failed++;
        console.error(`Zapier webhook ${row.id} failed:`, err.message);
      }
    });

    await Promise.allSettled(promises);
    return { sent, failed };
  }

  /**
   * Test a webhook URL by sending a sample payload
   */
  async testWebhook(webhookUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'test',
          timestamp: new Date().toISOString(),
          data: {
            contact: {
              email: 'test@questron.chat',
              name: 'Test User',
            },
            message: {
              text: 'This is a test event from Questron',
              sender: 'system',
            },
          },
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return { success: false, error: `Webhook returned ${response.status}` };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Get the integration key for authenticating Zapier → Questron webhooks
   * (for inbound triggers from Zapier)
   */
  async generateIntegrationKey(workspaceId: string): Promise<string> {
    const crypto = await import('crypto');
    const key = `ff_zapier_${crypto.randomBytes(24).toString('hex')}`;
    return key;
  }
}
