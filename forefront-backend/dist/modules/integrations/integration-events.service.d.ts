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
export interface EventPayload {
    workspaceId: string;
    contact?: {
        email?: string;
        name?: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
        company?: string;
        tags?: string[];
    };
    conversation?: {
        id?: string;
        channel?: string;
        rating?: number;
        ratingComment?: string;
        status?: string;
    };
    message?: {
        text?: string;
        sender?: string;
        senderType?: 'visitor' | 'agent' | 'bot';
    };
    ticket?: {
        id?: string;
        subject?: string;
        priority?: string;
        requesterName?: string;
        requesterEmail?: string;
    };
    agent?: {
        name?: string;
        email?: string;
    };
    customFields?: Record<string, any>;
}
export declare class IntegrationEventTrigger {
    /**
     * Fire event to all configured outbound integrations
     */
    fireEvent(eventType: string, payload: EventPayload): Promise<{
        zapier: {
            sent: number;
            failed: number;
        };
        slack: {
            sent: boolean;
            error?: string;
        };
        crmSync: {
            synced: boolean;
            error?: string;
        };
        marketingSync: {
            synced: boolean;
            error?: string;
        };
    }>;
    private fireZapierTrigger;
    private fireSlackNotification;
    private fireCrmAutoSync;
    private fireMarketingAutoSubscribe;
}
export declare const integrationEvents: IntegrationEventTrigger;
//# sourceMappingURL=integration-events.service.d.ts.map