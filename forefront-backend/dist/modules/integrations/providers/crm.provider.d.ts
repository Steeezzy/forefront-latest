/**
 * CRM Integration Providers
 *
 * Supports: HubSpot, Salesforce, Pipedrive, Zoho, Agile CRM, Zendesk Sell
 *
 * Each CRM follows the same pattern:
 * 1. Connect via OAuth or API key
 * 2. Push contacts from Forefront conversations → CRM
 * 3. Optionally sync back (CRM → Forefront)
 */
export interface CrmContact {
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    company?: string;
    source?: string;
    tags?: string[];
    customFields?: Record<string, any>;
}
export interface CrmSyncResult {
    success: boolean;
    externalId?: string;
    externalUrl?: string;
    error?: string;
}
export declare class HubSpotProvider {
    private apiKey;
    private baseUrl;
    constructor(apiKey: string);
    createOrUpdateContact(contact: CrmContact): Promise<CrmSyncResult>;
    private searchContact;
    private updateContact;
    testConnection(): Promise<{
        success: boolean;
        error?: string;
        accountInfo?: any;
    }>;
}
export declare class SalesforceProvider {
    private accessToken;
    private instanceUrl;
    constructor(accessToken: string, instanceUrl: string);
    createOrUpdateContact(contact: CrmContact): Promise<CrmSyncResult>;
    private searchContact;
    private updateContact;
    testConnection(): Promise<{
        success: boolean;
        error?: string;
    }>;
}
export declare class PipedriveProvider {
    private apiToken;
    private baseUrl;
    constructor(apiToken: string);
    createOrUpdateContact(contact: CrmContact): Promise<CrmSyncResult>;
    createDeal(personId: string, title: string): Promise<CrmSyncResult>;
    testConnection(): Promise<{
        success: boolean;
        error?: string;
    }>;
}
export declare class ZohoProvider {
    private accessToken;
    private baseUrl;
    constructor(accessToken: string);
    createOrUpdateContact(contact: CrmContact): Promise<CrmSyncResult>;
    testConnection(): Promise<{
        success: boolean;
        error?: string;
    }>;
}
export declare class AgileCrmProvider {
    private email;
    private apiKey;
    private domain;
    constructor(email: string, apiKey: string, domain: string);
    private get baseUrl();
    private get authHeader();
    createOrUpdateContact(contact: CrmContact): Promise<CrmSyncResult>;
    testConnection(): Promise<{
        success: boolean;
        error?: string;
    }>;
}
export declare class ZendeskSellProvider {
    private apiToken;
    private baseUrl;
    constructor(apiToken: string);
    createOrUpdateContact(contact: CrmContact): Promise<CrmSyncResult>;
    testConnection(): Promise<{
        success: boolean;
        error?: string;
    }>;
}
export declare class CrmSyncManager {
    private fieldMappingService;
    syncContact(integrationId: string, workspaceId: string, integrationType: string, credentials: Record<string, any>, contact: CrmContact): Promise<CrmSyncResult>;
    testConnection(integrationType: string, credentials: Record<string, any>): Promise<{
        success: boolean;
        error?: string;
    }>;
}
//# sourceMappingURL=crm.provider.d.ts.map