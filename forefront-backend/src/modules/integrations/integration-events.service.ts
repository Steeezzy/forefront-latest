/**
 * Integration Event Trigger Service
 *
 * Central event bus that fires outbound triggers to:
 * - Zapier webhooks
 * - Slack notifications
 * - CRM auto-sync (when configured)
 * - Marketing auto-subscribe (when configured)
 *
 * Called from conversation/ticket/contact lifecycle hooks.
 */

import { pool } from '../../config/db.js';
import { ZapierProvider, ZapierTriggerEvent } from './providers/zapier.provider.js';
import { SlackNotificationService, SlackEventType } from './providers/slack.provider.js';
import { CrmSyncManager, CrmContact } from './providers/crm.provider.js';
import { MarketingSyncManager, MarketingSubscriber } from './providers/marketing.provider.js';
import { IntegrationService } from './integration.service.js';

const zapierProvider = new ZapierProvider();
const slackService = new SlackNotificationService();
const crmSync = new CrmSyncManager();
const marketingSync = new MarketingSyncManager();
const integrationService = new IntegrationService();

// Define CRM types for type checking
const CRM_TYPES = ['hubspot', 'salesforce', 'pipedrive', 'zoho', 'agile_crm', 'zendesk_sell'] as const;
const MARKETING_TYPES = ['mailchimp', 'klaviyo', 'activecampaign', 'omnisend', 'mailerlite', 'brevo'] as const;

export interface EventPayload {
  workspaceId: string;
  // Contact info (if available)
  contact?: {
    email?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    company?: string;
    tags?: string[];
  };
  // Conversation info
  conversation?: {
    id?: string;
    channel?: string;
    rating?: number;
    ratingComment?: string;
    status?: string;
  };
  // Message info
  message?: {
    text?: string;
    sender?: string;
    senderType?: 'visitor' | 'agent' | 'bot';
  };
  // Ticket info
  ticket?: {
    id?: string;
    subject?: string;
    priority?: string;
    requesterName?: string;
    requesterEmail?: string;
  };
  // Agent info
  agent?: {
    name?: string;
    email?: string;
  };
  // Custom data
  customFields?: Record<string, any>;
}

export class IntegrationEventTrigger {
  /**
   * Fire event to all configured outbound integrations
   */
  async fireEvent(eventType: string, payload: EventPayload): Promise<{
    zapier: { sent: number; failed: number };
    slack: { sent: boolean; error?: string };
    crmSync: { synced: boolean; error?: string };
    marketingSync: { synced: boolean; error?: string };
  }> {
    const { workspaceId } = payload;

    // Run all triggers in parallel
    const [zapierResult, slackResult, crmResult, marketingResult] = await Promise.allSettled([
      this.fireZapierTrigger(workspaceId, eventType, payload),
      this.fireSlackNotification(workspaceId, eventType, payload),
      this.fireCrmAutoSync(workspaceId, eventType, payload),
      this.fireMarketingAutoSubscribe(workspaceId, eventType, payload),
    ]);

    return {
      zapier: zapierResult.status === 'fulfilled' ? zapierResult.value : { sent: 0, failed: 0 },
      slack: slackResult.status === 'fulfilled' ? slackResult.value : { sent: false, error: 'Failed' },
      crmSync: crmResult.status === 'fulfilled' ? crmResult.value : { synced: false, error: 'Failed' },
      marketingSync: marketingResult.status === 'fulfilled' ? marketingResult.value : { synced: false, error: 'Failed' },
    };
  }

  // ─── Zapier ────────────────────────────────────────────────

  private async fireZapierTrigger(
    workspaceId: string,
    eventType: string,
    payload: EventPayload
  ): Promise<{ sent: number; failed: number }> {
    // Map generic events to Zapier trigger events
    const eventMap: Record<string, ZapierTriggerEvent> = {
      'conversation.created': 'conversation_started',
      'conversation.started': 'conversation_started',
      'conversation.closed': 'conversation_closed',
      'conversation.rated': 'conversation_rated',
      'message.received': 'message_received',
      'contact.created': 'contact_created',
      'prechat.submitted': 'prechat_form_submitted',
      'tag.added': 'tag_added',
      'agent.replied': 'operator_replied',
    };

    const zapierEvent = eventMap[eventType];
    if (!zapierEvent) return { sent: 0, failed: 0 };

    try {
      return await zapierProvider.fireTrigger(workspaceId, zapierEvent, {
        contact: payload.contact,
        conversation: payload.conversation,
        message: payload.message,
        customFields: payload.customFields,
      });
    } catch (err) {
      console.error(`[IntegrationEventTrigger] Zapier trigger failed for ${eventType}:`, err);
      return { sent: 0, failed: 0 };
    }
  }

  // ─── Slack ─────────────────────────────────────────────────

  private async fireSlackNotification(
    workspaceId: string,
    eventType: string,
    payload: EventPayload
  ): Promise<{ sent: boolean; error?: string }> {
    // Map generic events to Slack event types
    const eventMap: Record<string, SlackEventType> = {
      'conversation.created': 'new_conversation',
      'conversation.started': 'new_conversation',
      'conversation.closed': 'conversation_closed',
      'conversation.rated': 'conversation_rated',
      'ticket.created': 'new_ticket',
      'message.offline': 'offline_message',
      'visitor.returned': 'visitor_returned',
    };

    const slackEvent = eventMap[eventType];
    if (!slackEvent) return { sent: false };

    try {
      // Build event data from payload
      const eventData: Record<string, any> = {};

      if (payload.contact) {
        eventData.visitorName = payload.contact.name || payload.contact.email || 'Visitor';
        eventData.visitorEmail = payload.contact.email;
      }
      if (payload.conversation) {
        eventData.conversationId = payload.conversation.id;
        eventData.channel = payload.conversation.channel;
        eventData.rating = payload.conversation.rating;
        eventData.comment = payload.conversation.ratingComment;
      }
      if (payload.message) {
        eventData.message = payload.message.text;
      }
      if (payload.ticket) {
        eventData.ticketId = payload.ticket.id;
        eventData.subject = payload.ticket.subject;
        eventData.priority = payload.ticket.priority;
        eventData.requesterName = payload.ticket.requesterName;
        eventData.requesterEmail = payload.ticket.requesterEmail;
      }
      if (payload.agent) {
        eventData.agentName = payload.agent.name;
      }

      return await slackService.notify(workspaceId, slackEvent, eventData);
    } catch (err) {
      console.error(`[IntegrationEventTrigger] Slack notification failed for ${eventType}:`, err);
      return { sent: false, error: 'Internal error' };
    }
  }

  // ─── CRM Auto-Sync ────────────────────────────────────────

  private async fireCrmAutoSync(
    workspaceId: string,
    eventType: string,
    payload: EventPayload
  ): Promise<{ synced: boolean; error?: string }> {
    // Only auto-sync on contact-related events
    const syncEvents = ['contact.created', 'prechat.submitted', 'conversation.created'];
    if (!syncEvents.includes(eventType)) return { synced: false };

    if (!payload.contact?.email) return { synced: false };

    try {
      // Check if any CRM is connected with auto-sync enabled
      const integrations = await integrationService.getAll(workspaceId);
      const connectedCrm = integrations.find(
        (i: any) => CRM_TYPES.includes(i.integration_type) &&
          i.status === 'connected' &&
          i.config?.autoSync !== false
      );

      if (!connectedCrm) return { synced: false };

      const contact: CrmContact = {
        email: payload.contact.email,
        name: payload.contact.name,
        firstName: payload.contact.firstName,
        lastName: payload.contact.lastName,
        phone: payload.contact.phone,
        company: payload.contact.company,
        tags: payload.contact.tags,
      };

      const result = await crmSync.syncContact(
        connectedCrm.id,
        workspaceId,
        connectedCrm.integration_type,
        connectedCrm.credentials,
        contact
      );

      return { synced: result.success, error: result.error };
    } catch (err: any) {
      console.error(`[IntegrationEventTrigger] CRM auto-sync failed:`, err);
      return { synced: false, error: err.message };
    }
  }

  // ─── Marketing Auto-Subscribe ──────────────────────────────

  private async fireMarketingAutoSubscribe(
    workspaceId: string,
    eventType: string,
    payload: EventPayload
  ): Promise<{ synced: boolean; error?: string }> {
    // Only auto-subscribe on prechat form submissions with email consent
    const subscribeEvents = ['prechat.submitted', 'contact.created'];
    if (!subscribeEvents.includes(eventType)) return { synced: false };

    if (!payload.contact?.email) return { synced: false };
    if (payload.customFields?.marketingConsent === false) return { synced: false };

    try {
      // Check if any marketing provider is connected with auto-subscribe
      const integrations = await integrationService.getAll(workspaceId);
      const connectedMarketing = integrations.find(
        (i: any) => MARKETING_TYPES.includes(i.integration_type) &&
          i.status === 'connected' &&
          i.config?.autoSubscribe === true
      );

      if (!connectedMarketing) return { synced: false };

      const listId = connectedMarketing.config?.defaultListId;
      if (!listId) return { synced: false, error: 'No default list configured' };

      const subscriber: MarketingSubscriber = {
        email: payload.contact.email,
        name: payload.contact.name,
        firstName: payload.contact.firstName,
        lastName: payload.contact.lastName,
        phone: payload.contact.phone,
        tags: ['questron-chat', 'auto-subscribed'],
      };

      const result = await marketingSync.subscribe(
        connectedMarketing.id,
        workspaceId,
        connectedMarketing.integration_type,
        connectedMarketing.credentials,
        listId,
        subscriber
      );

      return { synced: result.success, error: result.error };
    } catch (err: any) {
      console.error(`[IntegrationEventTrigger] Marketing auto-subscribe failed:`, err);
      return { synced: false, error: err.message };
    }
  }
}

// Singleton instance
export const integrationEvents = new IntegrationEventTrigger();
