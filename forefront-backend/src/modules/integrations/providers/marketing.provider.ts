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

import { pool } from '../../../config/db.js';

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

// ============================================================
// Mailchimp
// ============================================================

export class MailchimpProvider {
  private apiKey: string;
  private server: string; // e.g. us21

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // Mailchimp API keys end with -usXX
    this.server = apiKey.split('-').pop() || 'us1';
  }

  private get baseUrl() {
    return `https://${this.server}.api.mailchimp.com/3.0`;
  }

  private get authHeader() {
    return 'Basic ' + Buffer.from(`anystring:${this.apiKey}`).toString('base64');
  }

  async getLists(): Promise<MailingList[]> {
    try {
      const response = await fetch(`${this.baseUrl}/lists?count=100`, {
        headers: { 'Authorization': this.authHeader },
      });
      if (!response.ok) return [];
      const data: any = await response.json();
      return (data.lists || []).map((l: any) => ({
        id: l.id,
        name: l.name,
        memberCount: l.stats?.member_count,
      }));
    } catch {
      return [];
    }
  }

  async addSubscriber(listId: string, subscriber: MarketingSubscriber): Promise<SubscribeResult> {
    try {
      const crypto = await import('crypto');
      const emailHash = crypto.createHash('md5').update(subscriber.email.toLowerCase()).digest('hex');

      const response = await fetch(`${this.baseUrl}/lists/${listId}/members/${emailHash}`, {
        method: 'PUT', // PUT = add or update
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: subscriber.email,
          status_if_new: 'subscribed',
          merge_fields: {
            FNAME: subscriber.firstName || subscriber.name?.split(' ')[0] || '',
            LNAME: subscriber.lastName || subscriber.name?.split(' ').slice(1).join(' ') || '',
            PHONE: subscriber.phone || '',
          },
          tags: subscriber.tags || ['questron-chat'],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Mailchimp error: ${response.status} - ${error}` };
      }

      const data: any = await response.json();
      return { success: true, externalId: data.id };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/ping`, {
        headers: { 'Authorization': this.authHeader },
      });
      if (!response.ok) return { success: false, error: `HTTP ${response.status}` };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

// ============================================================
// Klaviyo
// ============================================================

export class KlaviyoProvider {
  private apiKey: string;
  private baseUrl = 'https://a.klaviyo.com/api';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getLists(): Promise<MailingList[]> {
    try {
      const response = await fetch(`${this.baseUrl}/lists`, {
        headers: {
          'Authorization': `Klaviyo-API-Key ${this.apiKey}`,
          'revision': '2024-02-15',
          'Accept': 'application/json',
        },
      });
      if (!response.ok) return [];
      const data: any = await response.json();
      return (data.data || []).map((l: any) => ({
        id: l.id,
        name: l.attributes?.name,
      }));
    } catch {
      return [];
    }
  }

  async addSubscriber(listId: string, subscriber: MarketingSubscriber): Promise<SubscribeResult> {
    try {
      // Create/update profile
      const profileRes = await fetch(`${this.baseUrl}/profiles`, {
        method: 'POST',
        headers: {
          'Authorization': `Klaviyo-API-Key ${this.apiKey}`,
          'revision': '2024-02-15',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          data: {
            type: 'profile',
            attributes: {
              email: subscriber.email,
              first_name: subscriber.firstName || subscriber.name?.split(' ')[0] || '',
              last_name: subscriber.lastName || subscriber.name?.split(' ').slice(1).join(' ') || '',
              phone_number: subscriber.phone || '',
              properties: subscriber.customFields || {},
            }
          }
        }),
      });

      let profileId: string | undefined;
      if (profileRes.ok) {
        const profileData: any = await profileRes.json();
        profileId = profileData.data?.id;
      } else if (profileRes.status === 409) {
        // Profile exists, get the ID from the error response
        const errData: any = await profileRes.json();
        profileId = errData.errors?.[0]?.meta?.duplicate_profile_id;
      }

      if (!profileId) {
        return { success: false, error: 'Failed to create Klaviyo profile' };
      }

      // Subscribe to list
      await fetch(`${this.baseUrl}/lists/${listId}/relationships/profiles`, {
        method: 'POST',
        headers: {
          'Authorization': `Klaviyo-API-Key ${this.apiKey}`,
          'revision': '2024-02-15',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [{ type: 'profile', id: profileId }]
        }),
      });

      return { success: true, externalId: profileId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/lists?page[size]=1`, {
        headers: {
          'Authorization': `Klaviyo-API-Key ${this.apiKey}`,
          'revision': '2024-02-15',
        },
      });
      if (!response.ok) return { success: false, error: `HTTP ${response.status}` };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

// ============================================================
// ActiveCampaign
// ============================================================

export class ActiveCampaignProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, accountUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = `${accountUrl}/api/3`;
  }

  async getLists(): Promise<MailingList[]> {
    try {
      const response = await fetch(`${this.baseUrl}/lists?limit=100`, {
        headers: { 'Api-Token': this.apiKey },
      });
      if (!response.ok) return [];
      const data: any = await response.json();
      return (data.lists || []).map((l: any) => ({
        id: l.id,
        name: l.name,
      }));
    } catch {
      return [];
    }
  }

  async addSubscriber(listId: string, subscriber: MarketingSubscriber): Promise<SubscribeResult> {
    try {
      // Create or update contact
      const contactRes = await fetch(`${this.baseUrl}/contact/sync`, {
        method: 'POST',
        headers: {
          'Api-Token': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact: {
            email: subscriber.email,
            firstName: subscriber.firstName || subscriber.name?.split(' ')[0] || '',
            lastName: subscriber.lastName || subscriber.name?.split(' ').slice(1).join(' ') || '',
            phone: subscriber.phone || '',
          }
        }),
      });

      if (!contactRes.ok) {
        const error = await contactRes.text();
        return { success: false, error: `ActiveCampaign error: ${contactRes.status} - ${error}` };
      }

      const contactData: any = await contactRes.json();
      const contactId = contactData.contact?.id;

      if (!contactId) return { success: false, error: 'Failed to create ActiveCampaign contact' };

      // Add to list
      await fetch(`${this.baseUrl}/contactLists`, {
        method: 'POST',
        headers: {
          'Api-Token': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactList: {
            list: parseInt(listId),
            contact: parseInt(contactId),
            status: 1, // subscribed
          }
        }),
      });

      return { success: true, externalId: contactId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/users/me`, {
        headers: { 'Api-Token': this.apiKey },
      });
      if (!response.ok) return { success: false, error: `HTTP ${response.status}` };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

// ============================================================
// Omnisend
// ============================================================

export class OmnisendProvider {
  private apiKey: string;
  private baseUrl = 'https://api.omnisend.com/v3';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async addSubscriber(_listId: string, subscriber: MarketingSubscriber): Promise<SubscribeResult> {
    try {
      const response = await fetch(`${this.baseUrl}/contacts`, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifiers: [{
            type: 'email',
            id: subscriber.email,
            channels: { email: { status: 'subscribed' } },
          }],
          firstName: subscriber.firstName || subscriber.name?.split(' ')[0] || '',
          lastName: subscriber.lastName || subscriber.name?.split(' ').slice(1).join(' ') || '',
          phone: subscriber.phone || '',
          tags: subscriber.tags || ['questron-chat'],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Omnisend error: ${response.status} - ${error}` };
      }

      const data: any = await response.json();
      return { success: true, externalId: data.contactID };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/contacts?limit=1`, {
        headers: { 'X-API-KEY': this.apiKey },
      });
      if (!response.ok) return { success: false, error: `HTTP ${response.status}` };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

// ============================================================
// MailerLite
// ============================================================

export class MailerLiteProvider {
  private apiKey: string;
  private baseUrl = 'https://connect.mailerlite.com/api';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getLists(): Promise<MailingList[]> {
    try {
      const response = await fetch(`${this.baseUrl}/groups?limit=100`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) return [];
      const data: any = await response.json();
      return (data.data || []).map((g: any) => ({
        id: g.id,
        name: g.name,
        memberCount: g.active_count,
      }));
    } catch {
      return [];
    }
  }

  async addSubscriber(listId: string, subscriber: MarketingSubscriber): Promise<SubscribeResult> {
    try {
      // Create/update subscriber
      const response = await fetch(`${this.baseUrl}/subscribers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: subscriber.email,
          fields: {
            name: subscriber.name || '',
            last_name: subscriber.lastName || '',
            phone: subscriber.phone || '',
          },
          groups: [listId],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `MailerLite error: ${response.status} - ${error}` };
      }

      const data: any = await response.json();
      return { success: true, externalId: data.data?.id };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/subscribers?limit=1`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });
      if (!response.ok) return { success: false, error: `HTTP ${response.status}` };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

// ============================================================
// Brevo (formerly SendInBlue)
// ============================================================

export class BrevoProvider {
  private apiKey: string;
  private baseUrl = 'https://api.brevo.com/v3';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getLists(): Promise<MailingList[]> {
    try {
      const response = await fetch(`${this.baseUrl}/contacts/lists?limit=50`, {
        headers: { 'api-key': this.apiKey },
      });
      if (!response.ok) return [];
      const data: any = await response.json();
      return (data.lists || []).map((l: any) => ({
        id: String(l.id),
        name: l.name,
        memberCount: l.totalSubscribers,
      }));
    } catch {
      return [];
    }
  }

  async addSubscriber(listId: string, subscriber: MarketingSubscriber): Promise<SubscribeResult> {
    try {
      const response = await fetch(`${this.baseUrl}/contacts`, {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: subscriber.email,
          attributes: {
            FIRSTNAME: subscriber.firstName || subscriber.name?.split(' ')[0] || '',
            LASTNAME: subscriber.lastName || subscriber.name?.split(' ').slice(1).join(' ') || '',
            SMS: subscriber.phone || '',
          },
          listIds: [parseInt(listId)],
          updateEnabled: true,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Brevo error: ${response.status} - ${error}` };
      }

      const data: any = await response.json();
      return { success: true, externalId: data.id ? String(data.id) : undefined };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/account`, {
        headers: { 'api-key': this.apiKey },
      });
      if (!response.ok) return { success: false, error: `HTTP ${response.status}` };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

// ============================================================
// Marketing Sync Manager
// ============================================================

export class MarketingSyncManager {
  async subscribe(
    integrationId: string,
    workspaceId: string,
    integrationType: string,
    credentials: Record<string, any>,
    listId: string,
    subscriber: MarketingSubscriber
  ): Promise<SubscribeResult> {
    let provider: any;

    switch (integrationType) {
      case 'mailchimp':
        provider = new MailchimpProvider(credentials.apiKey);
        break;
      case 'klaviyo':
        provider = new KlaviyoProvider(credentials.apiKey);
        break;
      case 'activecampaign':
        provider = new ActiveCampaignProvider(credentials.apiKey, credentials.accountUrl);
        break;
      case 'omnisend':
        provider = new OmnisendProvider(credentials.apiKey);
        break;
      case 'mailerlite':
        provider = new MailerLiteProvider(credentials.apiKey);
        break;
      case 'brevo':
        provider = new BrevoProvider(credentials.apiKey);
        break;
      default:
        return { success: false, error: `Unknown marketing provider: ${integrationType}` };
    }

    const result = await provider.addSubscriber(listId, subscriber);

    // Save sync record
    if (result.success) {
      await pool.query(
        `INSERT INTO marketing_subscribers (integration_id, workspace_id, email, name, list_id, external_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'subscribed')
         ON CONFLICT DO NOTHING`,
        [integrationId, workspaceId, subscriber.email, subscriber.name, listId, result.externalId]
      );
    }

    return result;
  }

  async getLists(
    integrationType: string,
    credentials: Record<string, any>
  ): Promise<MailingList[]> {
    let provider: any;

    switch (integrationType) {
      case 'mailchimp':
        provider = new MailchimpProvider(credentials.apiKey);
        break;
      case 'klaviyo':
        provider = new KlaviyoProvider(credentials.apiKey);
        break;
      case 'activecampaign':
        provider = new ActiveCampaignProvider(credentials.apiKey, credentials.accountUrl);
        break;
      case 'mailerlite':
        provider = new MailerLiteProvider(credentials.apiKey);
        break;
      case 'brevo':
        provider = new BrevoProvider(credentials.apiKey);
        break;
      default:
        return [];
    }

    return provider.getLists?.() || [];
  }

  async testConnection(
    integrationType: string,
    credentials: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    let provider: any;

    switch (integrationType) {
      case 'mailchimp':
        provider = new MailchimpProvider(credentials.apiKey);
        break;
      case 'klaviyo':
        provider = new KlaviyoProvider(credentials.apiKey);
        break;
      case 'activecampaign':
        provider = new ActiveCampaignProvider(credentials.apiKey, credentials.accountUrl);
        break;
      case 'omnisend':
        provider = new OmnisendProvider(credentials.apiKey);
        break;
      case 'mailerlite':
        provider = new MailerLiteProvider(credentials.apiKey);
        break;
      case 'brevo':
        provider = new BrevoProvider(credentials.apiKey);
        break;
      default:
        return { success: false, error: `Unknown provider: ${integrationType}` };
    }

    return provider.testConnection();
  }
}
