/**
 * Email Marketing Integration Providers
 *
 * Supports: Mailchimp, Klaviyo, ActiveCampaign, Omnisend, MailerLite, Brevo
 *
 * Each provider follows the same pattern:
 * 1. Connect via API key
 * 2. Select mailing list
 * 3. Push subscriber data from pre-chat surveys / conversations → provider
 */
export interface MarketingSubscriber {
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    tags?: string[];
    customFields?: Record<string, any>;
}
export interface SubscribeResult {
    success: boolean;
    externalId?: string;
    error?: string;
}
export interface MailingList {
    id: string;
    name: string;
    memberCount?: number;
}
export declare class MailchimpProvider {
    private apiKey;
    private server;
    constructor(apiKey: string);
    private get baseUrl();
    private get authHeader();
    getLists(): Promise<MailingList[]>;
    addSubscriber(listId: string, subscriber: MarketingSubscriber): Promise<SubscribeResult>;
    testConnection(): Promise<{
        success: boolean;
        error?: string;
    }>;
}
export declare class KlaviyoProvider {
    private apiKey;
    private baseUrl;
    constructor(apiKey: string);
    getLists(): Promise<MailingList[]>;
    addSubscriber(listId: string, subscriber: MarketingSubscriber): Promise<SubscribeResult>;
    testConnection(): Promise<{
        success: boolean;
        error?: string;
    }>;
}
export declare class ActiveCampaignProvider {
    private apiKey;
    private baseUrl;
    constructor(apiKey: string, accountUrl: string);
    getLists(): Promise<MailingList[]>;
    addSubscriber(listId: string, subscriber: MarketingSubscriber): Promise<SubscribeResult>;
    testConnection(): Promise<{
        success: boolean;
        error?: string;
    }>;
}
export declare class OmnisendProvider {
    private apiKey;
    private baseUrl;
    constructor(apiKey: string);
    addSubscriber(_listId: string, subscriber: MarketingSubscriber): Promise<SubscribeResult>;
    testConnection(): Promise<{
        success: boolean;
        error?: string;
    }>;
}
export declare class MailerLiteProvider {
    private apiKey;
    private baseUrl;
    constructor(apiKey: string);
    getLists(): Promise<MailingList[]>;
    addSubscriber(listId: string, subscriber: MarketingSubscriber): Promise<SubscribeResult>;
    testConnection(): Promise<{
        success: boolean;
        error?: string;
    }>;
}
export declare class BrevoProvider {
    private apiKey;
    private baseUrl;
    constructor(apiKey: string);
    getLists(): Promise<MailingList[]>;
    addSubscriber(listId: string, subscriber: MarketingSubscriber): Promise<SubscribeResult>;
    testConnection(): Promise<{
        success: boolean;
        error?: string;
    }>;
}
export declare class MarketingSyncManager {
    subscribe(integrationId: string, workspaceId: string, integrationType: string, credentials: Record<string, any>, listId: string, subscriber: MarketingSubscriber): Promise<SubscribeResult>;
    getLists(integrationType: string, credentials: Record<string, any>): Promise<MailingList[]>;
    testConnection(integrationType: string, credentials: Record<string, any>): Promise<{
        success: boolean;
        error?: string;
    }>;
}
//# sourceMappingURL=marketing.provider.d.ts.map