/**
 * Zapier Integration Provider
 *
 * Tidio pattern: Flow editor "Send to Zapier" action node
 * - User configures Integration Key (API key for auth)
 * - User provides Zapier webhook URL from their Zap
 * - When a flow reaches "Send to Zapier" node, Forefront fires
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
export declare const ZAPIER_TRIGGER_EVENTS: readonly ["contact_created", "conversation_started", "conversation_rated", "prechat_form_submitted", "message_received", "tag_added", "conversation_closed", "operator_replied"];
export type ZapierTriggerEvent = typeof ZAPIER_TRIGGER_EVENTS[number];
export declare class ZapierProvider {
    /**
     * Register a Zapier webhook URL for a specific event in a workspace
     */
    registerWebhook(workspaceId: string, integrationId: string, webhookUrl: string, triggerEvent: ZapierTriggerEvent, flowId?: string): Promise<string>;
    /**
     * Unregister a Zapier webhook
     */
    unregisterWebhook(webhookId: string, workspaceId: string): Promise<void>;
    /**
     * Get all active webhooks for a workspace
     */
    getWebhooks(workspaceId: string): Promise<any[]>;
    /**
     * Fire a trigger event — sends POST to all matching Zapier webhook URLs
     */
    fireTrigger(workspaceId: string, event: ZapierTriggerEvent, payload: ZapierWebhookPayload['data']): Promise<{
        sent: number;
        failed: number;
    }>;
    /**
     * Test a webhook URL by sending a sample payload
     */
    testWebhook(webhookUrl: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Get the integration key for authenticating Zapier → Forefront webhooks
     * (for inbound triggers from Zapier)
     */
    generateIntegrationKey(workspaceId: string): Promise<string>;
}
//# sourceMappingURL=zapier.provider.d.ts.map