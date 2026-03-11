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
import { pool } from '../../../config/db.js';
import { FieldMappingService } from '../field-mapping.service.js';
// ============================================================
// HubSpot
// ============================================================
export class HubSpotProvider {
    apiKey;
    baseUrl = 'https://api.hubapi.com';
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    async createOrUpdateContact(contact) {
        try {
            // HubSpot v3 Contacts API — create or update by email
            const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    properties: {
                        email: contact.email,
                        firstname: contact.firstName || contact.name?.split(' ')[0] || '',
                        lastname: contact.lastName || contact.name?.split(' ').slice(1).join(' ') || '',
                        phone: contact.phone || '',
                        company: contact.company || '',
                        hs_lead_status: 'NEW',
                        lifecyclestage: 'lead',
                        ...(contact.customFields || {}),
                    }
                }),
            });
            if (response.status === 409) {
                // Contact exists, update instead
                const existing = await this.searchContact(contact.email);
                if (existing) {
                    return await this.updateContact(existing.id, contact);
                }
            }
            if (!response.ok) {
                const error = await response.text();
                return { success: false, error: `HubSpot API error: ${response.status} - ${error}` };
            }
            const data = await response.json();
            return {
                success: true,
                externalId: data.id,
                externalUrl: `https://app.hubspot.com/contacts/${data.id}`,
            };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async searchContact(email) {
        try {
            const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts/search`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filterGroups: [{
                            filters: [{ propertyName: 'email', operator: 'EQ', value: email }]
                        }]
                }),
            });
            if (!response.ok)
                return null;
            const data = await response.json();
            return data.results?.[0] || null;
        }
        catch {
            return null;
        }
    }
    async updateContact(contactId, contact) {
        try {
            const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts/${contactId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    properties: {
                        firstname: contact.firstName || contact.name?.split(' ')[0] || '',
                        lastname: contact.lastName || contact.name?.split(' ').slice(1).join(' ') || '',
                        phone: contact.phone || '',
                        company: contact.company || '',
                    }
                }),
            });
            if (!response.ok) {
                return { success: false, error: `HubSpot update failed: ${response.status}` };
            }
            return {
                success: true,
                externalId: contactId,
                externalUrl: `https://app.hubspot.com/contacts/${contactId}`,
            };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async testConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts?limit=1`, {
                headers: { 'Authorization': `Bearer ${this.apiKey}` },
            });
            if (!response.ok)
                return { success: false, error: `HTTP ${response.status}` };
            return { success: true };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
}
// ============================================================
// Salesforce
// ============================================================
export class SalesforceProvider {
    accessToken;
    instanceUrl;
    constructor(accessToken, instanceUrl) {
        this.accessToken = accessToken;
        this.instanceUrl = instanceUrl;
    }
    async createOrUpdateContact(contact) {
        try {
            // Try to find existing contact by email
            const existing = await this.searchContact(contact.email);
            if (existing) {
                return await this.updateContact(existing.Id, contact);
            }
            // Create new contact
            const response = await fetch(`${this.instanceUrl}/services/data/v59.0/sobjects/Contact`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Email: contact.email,
                    FirstName: contact.firstName || contact.name?.split(' ')[0] || '',
                    LastName: contact.lastName || contact.name?.split(' ').slice(1).join(' ') || 'Unknown',
                    Phone: contact.phone || '',
                    LeadSource: 'Forefront Chat',
                }),
            });
            if (!response.ok) {
                const error = await response.text();
                return { success: false, error: `Salesforce error: ${response.status} - ${error}` };
            }
            const data = await response.json();
            return {
                success: true,
                externalId: data.id,
                externalUrl: `${this.instanceUrl}/${data.id}`,
            };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async searchContact(email) {
        try {
            const query = encodeURIComponent(`SELECT Id FROM Contact WHERE Email = '${email}' LIMIT 1`);
            const response = await fetch(`${this.instanceUrl}/services/data/v59.0/query?q=${query}`, {
                headers: { 'Authorization': `Bearer ${this.accessToken}` },
            });
            if (!response.ok)
                return null;
            const data = await response.json();
            return data.records?.[0] || null;
        }
        catch {
            return null;
        }
    }
    async updateContact(contactId, contact) {
        try {
            const response = await fetch(`${this.instanceUrl}/services/data/v59.0/sobjects/Contact/${contactId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    FirstName: contact.firstName || contact.name?.split(' ')[0] || '',
                    LastName: contact.lastName || contact.name?.split(' ').slice(1).join(' ') || '',
                    Phone: contact.phone || '',
                }),
            });
            if (!response.ok) {
                return { success: false, error: `Salesforce update failed: ${response.status}` };
            }
            return {
                success: true,
                externalId: contactId,
                externalUrl: `${this.instanceUrl}/${contactId}`,
            };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async testConnection() {
        try {
            const response = await fetch(`${this.instanceUrl}/services/data/v59.0/limits`, {
                headers: { 'Authorization': `Bearer ${this.accessToken}` },
            });
            if (!response.ok)
                return { success: false, error: `HTTP ${response.status}` };
            return { success: true };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
}
// ============================================================
// Pipedrive
// ============================================================
export class PipedriveProvider {
    apiToken;
    baseUrl = 'https://api.pipedrive.com/v1';
    constructor(apiToken) {
        this.apiToken = apiToken;
    }
    async createOrUpdateContact(contact) {
        try {
            // Search for existing person by email
            const searchRes = await fetch(`${this.baseUrl}/persons/search?term=${encodeURIComponent(contact.email)}&fields=email&api_token=${this.apiToken}`);
            const searchData = searchRes.ok ? await searchRes.json() : { data: { items: [] } };
            const existing = searchData.data?.items?.[0]?.item;
            if (existing) {
                return {
                    success: true,
                    externalId: String(existing.id),
                    externalUrl: `https://app.pipedrive.com/person/${existing.id}`,
                };
            }
            // Create new person
            const response = await fetch(`${this.baseUrl}/persons?api_token=${this.apiToken}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: contact.name || contact.email,
                    email: [{ value: contact.email, primary: true, label: 'work' }],
                    phone: contact.phone ? [{ value: contact.phone, primary: true, label: 'work' }] : undefined,
                    org_id: null,
                }),
            });
            if (!response.ok) {
                const error = await response.text();
                return { success: false, error: `Pipedrive error: ${response.status} - ${error}` };
            }
            const data = await response.json();
            // Also create a deal if configured
            return {
                success: true,
                externalId: String(data.data.id),
                externalUrl: `https://app.pipedrive.com/person/${data.data.id}`,
            };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async createDeal(personId, title) {
        try {
            const response = await fetch(`${this.baseUrl}/deals?api_token=${this.apiToken}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    person_id: parseInt(personId),
                    status: 'open',
                }),
            });
            if (!response.ok) {
                return { success: false, error: `Pipedrive deal creation failed` };
            }
            const data = await response.json();
            return {
                success: true,
                externalId: String(data.data.id),
                externalUrl: `https://app.pipedrive.com/deal/${data.data.id}`,
            };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async testConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/users/me?api_token=${this.apiToken}`);
            if (!response.ok)
                return { success: false, error: `HTTP ${response.status}` };
            return { success: true };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
}
// ============================================================
// Zoho CRM
// ============================================================
export class ZohoProvider {
    accessToken;
    baseUrl = 'https://www.zohoapis.com/crm/v5';
    constructor(accessToken) {
        this.accessToken = accessToken;
    }
    async createOrUpdateContact(contact) {
        try {
            const response = await fetch(`${this.baseUrl}/Contacts/upsert`, {
                method: 'POST',
                headers: {
                    'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data: [{
                            Email: contact.email,
                            First_Name: contact.firstName || contact.name?.split(' ')[0] || '',
                            Last_Name: contact.lastName || contact.name?.split(' ').slice(1).join(' ') || 'Unknown',
                            Phone: contact.phone || '',
                            Lead_Source: 'Forefront Chat',
                        }],
                    duplicate_check_fields: ['Email'],
                }),
            });
            if (!response.ok) {
                const error = await response.text();
                return { success: false, error: `Zoho error: ${response.status} - ${error}` };
            }
            const data = await response.json();
            const record = data.data?.[0];
            return {
                success: true,
                externalId: record?.details?.id,
                externalUrl: record?.details?.id ? `https://crm.zoho.com/crm/tab/Contacts/${record.details.id}` : undefined,
            };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async testConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/users?type=CurrentUser`, {
                headers: { 'Authorization': `Zoho-oauthtoken ${this.accessToken}` },
            });
            if (!response.ok)
                return { success: false, error: `HTTP ${response.status}` };
            return { success: true };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
}
// ============================================================
// Agile CRM
// ============================================================
export class AgileCrmProvider {
    email;
    apiKey;
    domain; // e.g. mycompany
    constructor(email, apiKey, domain) {
        this.email = email;
        this.apiKey = apiKey;
        this.domain = domain;
    }
    get baseUrl() {
        return `https://${this.domain}.agilecrm.com/dev/api`;
    }
    get authHeader() {
        return 'Basic ' + Buffer.from(`${this.email}:${this.apiKey}`).toString('base64');
    }
    async createOrUpdateContact(contact) {
        try {
            const response = await fetch(`${this.baseUrl}/contacts`, {
                method: 'POST',
                headers: {
                    'Authorization': this.authHeader,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    tags: contact.tags || ['forefront-chat'],
                    properties: [
                        { type: 'SYSTEM', name: 'email', value: contact.email },
                        { type: 'SYSTEM', name: 'first_name', value: contact.firstName || contact.name?.split(' ')[0] || '' },
                        { type: 'SYSTEM', name: 'last_name', value: contact.lastName || contact.name?.split(' ').slice(1).join(' ') || '' },
                        ...(contact.phone ? [{ type: 'SYSTEM', name: 'phone', value: contact.phone }] : []),
                        ...(contact.company ? [{ type: 'SYSTEM', name: 'company', value: contact.company }] : []),
                    ],
                    lead_source: 'Forefront Chat',
                }),
            });
            if (!response.ok) {
                const error = await response.text();
                return { success: false, error: `Agile CRM error: ${response.status} - ${error}` };
            }
            const data = await response.json();
            return {
                success: true,
                externalId: String(data.id),
                externalUrl: `https://${this.domain}.agilecrm.com/#contact/${data.id}`,
            };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async testConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/contacts?page_size=1`, {
                headers: { 'Authorization': this.authHeader, 'Accept': 'application/json' },
            });
            if (!response.ok)
                return { success: false, error: `HTTP ${response.status}` };
            return { success: true };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
}
// ============================================================
// Zendesk Sell
// ============================================================
export class ZendeskSellProvider {
    apiToken;
    baseUrl = 'https://api.getbase.com/v2';
    constructor(apiToken) {
        this.apiToken = apiToken;
    }
    async createOrUpdateContact(contact) {
        try {
            const response = await fetch(`${this.baseUrl}/leads`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data: {
                        first_name: contact.firstName || contact.name?.split(' ')[0] || '',
                        last_name: contact.lastName || contact.name?.split(' ').slice(1).join(' ') || 'Unknown',
                        email: contact.email,
                        phone: contact.phone || '',
                        organization_name: contact.company || '',
                        source_id: null, // Set up in Zendesk Sell
                        description: 'Created from Forefront Chat',
                    }
                }),
            });
            if (!response.ok) {
                const error = await response.text();
                return { success: false, error: `Zendesk Sell error: ${response.status} - ${error}` };
            }
            const data = await response.json();
            return {
                success: true,
                externalId: String(data.data.id),
            };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async testConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/users/self`, {
                headers: { 'Authorization': `Bearer ${this.apiToken}` },
            });
            if (!response.ok)
                return { success: false, error: `HTTP ${response.status}` };
            return { success: true };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
}
// ============================================================
// CRM Sync Manager — Orchestrates pushing contacts to any CRM
// ============================================================
export class CrmSyncManager {
    fieldMappingService = new FieldMappingService();
    async syncContact(integrationId, workspaceId, integrationType, credentials, contact) {
        let provider;
        switch (integrationType) {
            case 'hubspot':
                provider = new HubSpotProvider(credentials.apiKey || credentials.accessToken);
                break;
            case 'salesforce':
                provider = new SalesforceProvider(credentials.accessToken, credentials.instanceUrl);
                break;
            case 'pipedrive':
                provider = new PipedriveProvider(credentials.apiToken);
                break;
            case 'zoho':
                provider = new ZohoProvider(credentials.accessToken);
                break;
            case 'agile_crm':
                provider = new AgileCrmProvider(credentials.email, credentials.apiKey, credentials.domain);
                break;
            case 'zendesk_sell':
                provider = new ZendeskSellProvider(credentials.apiToken);
                break;
            default:
                return { success: false, error: `Unknown CRM type: ${integrationType}` };
        }
        // Apply workspace field mappings to transform contact data
        const sourceData = {
            visitor_email: contact.email,
            visitor_name: contact.name,
            first_name: contact.firstName || contact.name?.split(' ')[0],
            last_name: contact.lastName || contact.name?.split(' ').slice(1).join(' '),
            visitor_phone: contact.phone,
            company: contact.company,
            tags: contact.tags,
            ...(contact.customFields || {}),
        };
        try {
            const mappedFields = await this.fieldMappingService.applyMappings(workspaceId, integrationType, sourceData);
            // Merge mapped fields into customFields so the provider uses them
            const mappedContact = {
                ...contact,
                customFields: { ...(contact.customFields || {}), ...mappedFields },
            };
            const result = await provider.createOrUpdateContact(mappedContact);
            // Save sync record
            if (result.success) {
                await pool.query(`INSERT INTO crm_synced_contacts (integration_id, workspace_id, email, name, phone, company, external_id, external_url, synced_fields)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT DO NOTHING`, [integrationId, workspaceId, contact.email, contact.name, contact.phone, contact.company, result.externalId, result.externalUrl, JSON.stringify(mappedFields)]);
            }
            return result;
        }
        catch (err) {
            // If field mapping fails, fall back to raw contact sync
            console.error(`[CrmSync] Field mapping failed, falling back to raw sync: ${err.message}`);
            const result = await provider.createOrUpdateContact(contact);
            if (result.success) {
                await pool.query(`INSERT INTO crm_synced_contacts (integration_id, workspace_id, email, name, phone, company, external_id, external_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT DO NOTHING`, [integrationId, workspaceId, contact.email, contact.name, contact.phone, contact.company, result.externalId, result.externalUrl]);
            }
            return result;
        }
    }
    async testConnection(integrationType, credentials) {
        let provider;
        switch (integrationType) {
            case 'hubspot':
                provider = new HubSpotProvider(credentials.apiKey || credentials.accessToken);
                break;
            case 'salesforce':
                provider = new SalesforceProvider(credentials.accessToken, credentials.instanceUrl);
                break;
            case 'pipedrive':
                provider = new PipedriveProvider(credentials.apiToken);
                break;
            case 'zoho':
                provider = new ZohoProvider(credentials.accessToken);
                break;
            case 'agile_crm':
                provider = new AgileCrmProvider(credentials.email, credentials.apiKey, credentials.domain);
                break;
            case 'zendesk_sell':
                provider = new ZendeskSellProvider(credentials.apiToken);
                break;
            default:
                return { success: false, error: `Unknown CRM type: ${integrationType}` };
        }
        return provider.testConnection();
    }
}
//# sourceMappingURL=crm.provider.js.map