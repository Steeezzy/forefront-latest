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
export interface SlackNotification {
    channel?: string;
    text: string;
    blocks?: SlackBlock[];
    thread_ts?: string;
}
export interface SlackBlock {
    type: string;
    text?: {
        type: string;
        text: string;
        emoji?: boolean;
    };
    fields?: Array<{
        type: string;
        text: string;
    }>;
    elements?: any[];
    accessory?: any;
}
export type SlackEventType = 'new_conversation' | 'new_ticket' | 'conversation_rated' | 'offline_message' | 'agent_mention' | 'conversation_closed' | 'visitor_returned';
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
export declare class SlackProvider {
    private botToken?;
    private webhookUrl?;
    private defaultChannelId?;
    constructor(config: Partial<SlackConfig>);
    /**
     * Send a message via Bot Token (preferred - supports threads, reactions, etc.)
     */
    sendMessage(notification: SlackNotification): Promise<{
        success: boolean;
        ts?: string;
        error?: string;
    }>;
    private sendViaApi;
    private sendViaWebhook;
    /**
     * Notify about a new conversation
     */
    notifyNewConversation(data: {
        visitorName: string;
        visitorEmail?: string;
        message: string;
        conversationId: string;
        channel: string;
        panelUrl: string;
    }): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Notify about a new ticket
     */
    notifyNewTicket(data: {
        subject: string;
        requesterName: string;
        requesterEmail: string;
        priority: string;
        ticketId: string;
        panelUrl: string;
    }): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Notify about a conversation rating
     */
    notifyConversationRated(data: {
        visitorName: string;
        rating: number;
        comment?: string;
        agentName?: string;
        conversationId: string;
    }): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Notify about an offline message
     */
    notifyOfflineMessage(data: {
        visitorName: string;
        visitorEmail?: string;
        message: string;
        panelUrl: string;
    }): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * List available Slack channels
     */
    listChannels(): Promise<Array<{
        id: string;
        name: string;
    }>>;
    /**
     * Test the Slack connection
     */
    testConnection(): Promise<{
        success: boolean;
        error?: string;
        teamName?: string;
    }>;
}
export declare class SlackNotificationService {
    /**
     * Send a notification for a workspace event, checking preferences
     */
    notify(workspaceId: string, eventType: SlackEventType, eventData: Record<string, any>): Promise<{
        sent: boolean;
        error?: string;
    }>;
    /**
     * Send a test notification to verify Slack integration
     */
    sendTestNotification(workspaceId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
}
//# sourceMappingURL=slack.provider.d.ts.map