/**
 * Slack Integration Provider
 *
 * Sends real-time notifications to Slack channels for:
 * - New conversations
 * - New tickets
 * - Conversation ratings
 * - Offline messages
 * - Agent mentions
 *
 * Uses Slack Web API (Bot Token) or Incoming Webhooks.
 */

import { pool } from '../../../config/db.js';

export interface SlackNotification {
  channel?: string;
  text: string;
  blocks?: SlackBlock[];
  thread_ts?: string;
}

export interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  fields?: Array<{ type: string; text: string }>;
  elements?: any[];
  accessory?: any;
}

export type SlackEventType =
  | 'new_conversation'
  | 'new_ticket'
  | 'conversation_rated'
  | 'offline_message'
  | 'agent_mention'
  | 'conversation_closed'
  | 'visitor_returned';

export interface SlackConfig {
  botToken?: string;
  webhookUrl?: string;
  channelId?: string;
  notifyNewConversation: boolean;
  notifyNewTicket: boolean;
  notifyConversationRated: boolean;
  notifyOfflineMessage: boolean;
  notifyAgentMention: boolean;
}

export class SlackProvider {
  private botToken?: string;
  private webhookUrl?: string;
  private defaultChannelId?: string;

  constructor(config: Partial<SlackConfig>) {
    this.botToken = config.botToken;
    this.webhookUrl = config.webhookUrl;
    this.defaultChannelId = config.channelId;
  }

  // ─── Core Send Methods ─────────────────────────────────────

  /**
   * Send a message via Bot Token (preferred - supports threads, reactions, etc.)
   */
  async sendMessage(notification: SlackNotification): Promise<{ success: boolean; ts?: string; error?: string }> {
    if (this.botToken) {
      return this.sendViaApi(notification);
    }
    if (this.webhookUrl) {
      return this.sendViaWebhook(notification);
    }
    return { success: false, error: 'No Slack credentials configured' };
  }

  private async sendViaApi(notification: SlackNotification): Promise<{ success: boolean; ts?: string; error?: string }> {
    try {
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: notification.channel || this.defaultChannelId,
          text: notification.text,
          blocks: notification.blocks,
          thread_ts: notification.thread_ts,
          unfurl_links: false,
        }),
      });

      const data: any = await response.json();
      if (!data.ok) {
        return { success: false, error: data.error || 'Slack API error' };
      }
      return { success: true, ts: data.ts };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  private async sendViaWebhook(notification: SlackNotification): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(this.webhookUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: notification.text,
          blocks: notification.blocks,
        }),
      });

      if (!response.ok) {
        return { success: false, error: `Webhook returned ${response.status}` };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // ─── Notification Templates ────────────────────────────────

  /**
   * Notify about a new conversation
   */
  async notifyNewConversation(data: {
    visitorName: string;
    visitorEmail?: string;
    message: string;
    conversationId: string;
    channel: string;
    panelUrl: string;
  }): Promise<{ success: boolean; error?: string }> {
    const blocks: SlackBlock[] = [
      {
        type: 'header',
        text: { type: 'plain_text', text: '💬 New Conversation', emoji: true },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Visitor:*\n${data.visitorName}` },
          { type: 'mrkdwn', text: `*Channel:*\n${data.channel}` },
        ],
      },
      ...(data.visitorEmail ? [{
        type: 'section' as const,
        fields: [
          { type: 'mrkdwn' as const, text: `*Email:*\n${data.visitorEmail}` },
        ],
      }] : []),
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `> ${data.message.substring(0, 300)}${data.message.length > 300 ? '...' : ''}` },
      },
      {
        type: 'actions',
        elements: [{
          type: 'button',
          text: { type: 'plain_text', text: 'Open in Panel', emoji: true },
          url: data.panelUrl,
          style: 'primary',
        }],
      },
      { type: 'divider' },
    ];

    return this.sendMessage({
      text: `New conversation from ${data.visitorName}: ${data.message.substring(0, 100)}`,
      blocks,
    });
  }

  /**
   * Notify about a new ticket
   */
  async notifyNewTicket(data: {
    subject: string;
    requesterName: string;
    requesterEmail: string;
    priority: string;
    ticketId: string;
    panelUrl: string;
  }): Promise<{ success: boolean; error?: string }> {
    const priorityEmoji: Record<string, string> = {
      urgent: '🔴',
      high: '🟠',
      normal: '🟡',
      low: '🟢',
    };

    const blocks: SlackBlock[] = [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🎫 New Ticket', emoji: true },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Subject:*\n${data.subject}` },
          { type: 'mrkdwn', text: `*Priority:*\n${priorityEmoji[data.priority] || '⚪'} ${data.priority}` },
        ],
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*From:*\n${data.requesterName}` },
          { type: 'mrkdwn', text: `*Email:*\n${data.requesterEmail}` },
        ],
      },
      {
        type: 'actions',
        elements: [{
          type: 'button',
          text: { type: 'plain_text', text: 'View Ticket', emoji: true },
          url: data.panelUrl,
          style: 'primary',
        }],
      },
      { type: 'divider' },
    ];

    return this.sendMessage({
      text: `New ticket #${data.ticketId}: ${data.subject} (${data.priority})`,
      blocks,
    });
  }

  /**
   * Notify about a conversation rating
   */
  async notifyConversationRated(data: {
    visitorName: string;
    rating: number;
    comment?: string;
    agentName?: string;
    conversationId: string;
  }): Promise<{ success: boolean; error?: string }> {
    const ratingStars = '⭐'.repeat(Math.min(data.rating, 5));

    const blocks: SlackBlock[] = [
      {
        type: 'header',
        text: { type: 'plain_text', text: '⭐ Conversation Rated', emoji: true },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Visitor:*\n${data.visitorName}` },
          { type: 'mrkdwn', text: `*Rating:*\n${ratingStars} (${data.rating}/5)` },
        ],
      },
      ...(data.agentName ? [{
        type: 'section' as const,
        fields: [{ type: 'mrkdwn' as const, text: `*Agent:*\n${data.agentName}` }],
      }] : []),
      ...(data.comment ? [{
        type: 'section' as const,
        text: { type: 'mrkdwn' as const, text: `*Comment:*\n> ${data.comment}` },
      }] : []),
      { type: 'divider' },
    ];

    return this.sendMessage({
      text: `${data.visitorName} rated ${ratingStars} (${data.rating}/5)${data.comment ? `: "${data.comment}"` : ''}`,
      blocks,
    });
  }

  /**
   * Notify about an offline message
   */
  async notifyOfflineMessage(data: {
    visitorName: string;
    visitorEmail?: string;
    message: string;
    panelUrl: string;
  }): Promise<{ success: boolean; error?: string }> {
    const blocks: SlackBlock[] = [
      {
        type: 'header',
        text: { type: 'plain_text', text: '📨 Offline Message', emoji: true },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*From:*\n${data.visitorName}` },
          ...(data.visitorEmail ? [{ type: 'mrkdwn', text: `*Email:*\n${data.visitorEmail}` }] : []),
        ],
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `> ${data.message.substring(0, 500)}` },
      },
      {
        type: 'actions',
        elements: [{
          type: 'button',
          text: { type: 'plain_text', text: 'Reply', emoji: true },
          url: data.panelUrl,
          style: 'primary',
        }],
      },
      { type: 'divider' },
    ];

    return this.sendMessage({
      text: `Offline message from ${data.visitorName}: ${data.message.substring(0, 100)}`,
      blocks,
    });
  }

  // ─── Channel Management ────────────────────────────────────

  /**
   * List available Slack channels
   */
  async listChannels(): Promise<Array<{ id: string; name: string }>> {
    if (!this.botToken) return [];

    try {
      const response = await fetch('https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=200', {
        headers: { 'Authorization': `Bearer ${this.botToken}` },
      });
      const data: any = await response.json();
      if (!data.ok) return [];
      return (data.channels || []).map((c: any) => ({ id: c.id, name: c.name }));
    } catch {
      return [];
    }
  }

  /**
   * Test the Slack connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string; teamName?: string }> {
    if (this.botToken) {
      try {
        const response = await fetch('https://slack.com/api/auth.test', {
          headers: { 'Authorization': `Bearer ${this.botToken}` },
        });
        const data: any = await response.json();
        if (!data.ok) return { success: false, error: data.error };
        return { success: true, teamName: data.team };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    if (this.webhookUrl) {
      try {
        const response = await fetch(this.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: '✅ Forefront Agent connected successfully!' }),
        });
        if (!response.ok) return { success: false, error: `Webhook returned ${response.status}` };
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    return { success: false, error: 'No Slack credentials provided' };
  }
}

// ============================================================
// Slack Notification Service — Orchestrates sending notifications
// ============================================================

export class SlackNotificationService {
  /**
   * Send a notification for a workspace event, checking preferences
   */
  async notify(
    workspaceId: string,
    eventType: SlackEventType,
    eventData: Record<string, any>
  ): Promise<{ sent: boolean; error?: string }> {
    // Get Slack integration
    const result = await pool.query(
      `SELECT id, credentials, config, status FROM integrations
       WHERE workspace_id = $1 AND integration_type = 'slack' AND status = 'connected'`,
      [workspaceId]
    );

    if (result.rows.length === 0) {
      return { sent: false, error: 'Slack not connected' };
    }

    const integration = result.rows[0];
    const config: SlackConfig = {
      ...integration.config,
      ...integration.credentials,
    };

    // Check notification preferences
    const prefMap: Record<SlackEventType, keyof SlackConfig> = {
      new_conversation: 'notifyNewConversation',
      new_ticket: 'notifyNewTicket',
      conversation_rated: 'notifyConversationRated',
      offline_message: 'notifyOfflineMessage',
      agent_mention: 'notifyAgentMention',
      conversation_closed: 'notifyNewConversation', // bundled with conversations
      visitor_returned: 'notifyNewConversation',     // bundled with conversations
    };

    const prefKey = prefMap[eventType];
    if (prefKey && config[prefKey] === false) {
      return { sent: false, error: 'Notification type disabled' };
    }

    const provider = new SlackProvider(config);
    const panelBaseUrl = process.env.PANEL_URL || 'https://app.forefront.chat';

    let sendResult: { success: boolean; error?: string };

    switch (eventType) {
      case 'new_conversation':
        sendResult = await provider.notifyNewConversation({
          visitorName: eventData.visitorName || 'Visitor',
          visitorEmail: eventData.visitorEmail,
          message: eventData.message || '',
          conversationId: eventData.conversationId,
          channel: eventData.channel || 'Live Chat',
          panelUrl: `${panelBaseUrl}/panel/inbox?id=${eventData.conversationId}`,
        });
        break;

      case 'new_ticket':
        sendResult = await provider.notifyNewTicket({
          subject: eventData.subject || 'New Ticket',
          requesterName: eventData.requesterName || 'Unknown',
          requesterEmail: eventData.requesterEmail || '',
          priority: eventData.priority || 'normal',
          ticketId: eventData.ticketId,
          panelUrl: `${panelBaseUrl}/panel/tickets?id=${eventData.ticketId}`,
        });
        break;

      case 'conversation_rated':
        sendResult = await provider.notifyConversationRated({
          visitorName: eventData.visitorName || 'Visitor',
          rating: eventData.rating,
          comment: eventData.comment,
          agentName: eventData.agentName,
          conversationId: eventData.conversationId,
        });
        break;

      case 'offline_message':
        sendResult = await provider.notifyOfflineMessage({
          visitorName: eventData.visitorName || 'Visitor',
          visitorEmail: eventData.visitorEmail,
          message: eventData.message || '',
          panelUrl: `${panelBaseUrl}/panel/inbox`,
        });
        break;

      default:
        sendResult = await provider.sendMessage({
          text: `[${eventType}] ${JSON.stringify(eventData).substring(0, 300)}`,
        });
    }

    return { sent: sendResult.success, error: sendResult.error };
  }

  /**
   * Send a test notification to verify Slack integration
   */
  async sendTestNotification(workspaceId: string): Promise<{ success: boolean; error?: string }> {
    const result = await pool.query(
      `SELECT credentials, config FROM integrations
       WHERE workspace_id = $1 AND integration_type = 'slack' AND status = 'connected'`,
      [workspaceId]
    );

    if (result.rows.length === 0) {
      return { success: false, error: 'Slack not connected' };
    }

    const config = { ...result.rows[0].config, ...result.rows[0].credentials };
    const provider = new SlackProvider(config);

    return provider.sendMessage({
      text: '🎉 Test notification from Forefront Agent! Your Slack integration is working.',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '🎉 *Test Notification*\n\nYour Slack integration with Forefront Agent is working correctly! You will receive notifications here for new conversations, tickets, and ratings.',
          },
        },
        { type: 'divider' },
      ],
    });
  }
}
