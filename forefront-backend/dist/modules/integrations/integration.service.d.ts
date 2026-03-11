export type IntegrationType = 'zapier' | 'google_analytics' | 'google_tag_manager' | 'facebook' | 'email' | 'instagram' | 'whatsapp' | 'agile_crm' | 'zendesk_sell' | 'pipedrive' | 'zoho' | 'hubspot' | 'salesforce' | 'bigcommerce' | 'adobe_commerce' | 'prestashop' | 'shopify' | 'woocommerce' | 'wordpress' | 'klaviyo' | 'mailchimp' | 'activecampaign' | 'omnisend' | 'mailerlite' | 'brevo' | 'judgeme' | 'zendesk' | 'slack';
export interface Integration {
    id: string;
    workspace_id: string;
    integration_type: IntegrationType;
    status: string;
    is_active: boolean;
    display_name: string | null;
    config: Record<string, any>;
    credentials: Record<string, any>;
    metadata: Record<string, any>;
    webhook_url: string | null;
    webhook_secret: string | null;
    connected_at: string | null;
    last_synced_at: string | null;
    error_message: string | null;
    created_at: string;
    updated_at: string;
}
export declare class IntegrationService {
    /**
     * Get all integrations for a workspace
     */
    getAll(workspaceId: string): Promise<Integration[]>;
    /**
     * Get a specific integration
     */
    get(workspaceId: string, type: IntegrationType): Promise<Integration | null>;
    /**
     * Connect (upsert) an integration
     */
    connect(workspaceId: string, type: IntegrationType, data: {
        displayName?: string;
        config?: Record<string, any>;
        credentials?: Record<string, any>;
        metadata?: Record<string, any>;
        webhookUrl?: string;
        webhookSecret?: string;
    }): Promise<Integration>;
    /**
     * Disconnect an integration
     */
    disconnect(workspaceId: string, type: IntegrationType): Promise<void>;
    /**
     * Update config or metadata
     */
    updateConfig(workspaceId: string, type: IntegrationType, config: Record<string, any>): Promise<Integration | null>;
    /**
     * Mark sync completed
     */
    markSynced(workspaceId: string, type: IntegrationType): Promise<void>;
    /**
     * Mark integration error
     */
    markError(workspaceId: string, type: IntegrationType, errorMessage: string): Promise<void>;
    createSyncLog(integrationId: string, syncType: string, direction?: string): Promise<any>;
    completeSyncLog(logId: string, recordsProcessed: number, recordsFailed?: number): Promise<void>;
    failSyncLog(logId: string, error: string): Promise<void>;
    logWebhookEvent(integrationId: string | null, integrationType: string, workspaceId: string, eventType: string, payload: Record<string, any>): Promise<void>;
}
//# sourceMappingURL=integration.service.d.ts.map