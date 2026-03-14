/**
 * Zendesk (Customer Support) Integration Provider
 *
 * Creates Zendesk tickets from chat conversations.
 * Syncs contact info between Questron and Zendesk.
 */

export interface ZendeskTicket {
  subject: string;
  description: string;
  requesterEmail: string;
  requesterName?: string;
  priority?: 'urgent' | 'high' | 'normal' | 'low';
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface ZendeskTicketResult {
  success: boolean;
  ticketId?: string;
  ticketUrl?: string;
  error?: string;
}

export class ZendeskProvider {
  private subdomain: string;
  private email: string;
  private apiToken: string;

  constructor(subdomain: string, email: string, apiToken: string) {
    this.subdomain = subdomain;
    this.email = email;
    this.apiToken = apiToken;
  }

  private get baseUrl() {
    return `https://${this.subdomain}.zendesk.com/api/v2`;
  }

  private get authHeader() {
    return 'Basic ' + Buffer.from(`${this.email}/token:${this.apiToken}`).toString('base64');
  }

  async createTicket(ticket: ZendeskTicket): Promise<ZendeskTicketResult> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets.json`, {
        method: 'POST',
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticket: {
            subject: ticket.subject,
            description: ticket.description,
            requester: {
              name: ticket.requesterName || ticket.requesterEmail,
              email: ticket.requesterEmail,
            },
            priority: ticket.priority || 'normal',
            tags: [...(ticket.tags || []), 'questron-chat'],
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Zendesk error: ${response.status} - ${error}` };
      }

      const data: any = await response.json();
      return {
        success: true,
        ticketId: String(data.ticket?.id),
        ticketUrl: `https://${this.subdomain}.zendesk.com/agent/tickets/${data.ticket?.id}`,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async getTicket(ticketId: string): Promise<any | null> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/${ticketId}.json`, {
        headers: { 'Authorization': this.authHeader },
      });
      if (!response.ok) return null;
      const data: any = await response.json();
      return data.ticket;
    } catch {
      return null;
    }
  }

  async searchTicketsByEmail(email: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/search.json?query=type:ticket requester:${encodeURIComponent(email)}&sort_by=created_at&sort_order=desc`,
        { headers: { 'Authorization': this.authHeader } }
      );
      if (!response.ok) return [];
      const data: any = await response.json();
      return data.results || [];
    } catch {
      return [];
    }
  }

  async addCommentToTicket(ticketId: string, comment: string, isPublic = false): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/${ticketId}.json`, {
        method: 'PUT',
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticket: {
            comment: {
              body: comment,
              public: isPublic,
            },
          },
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/users/me.json`, {
        headers: { 'Authorization': this.authHeader },
      });
      if (!response.ok) return { success: false, error: `HTTP ${response.status}` };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

/**
 * Judge.me (Review Collection) Integration Provider
 *
 * Judge.me is a product review platform for e-commerce.
 * Integration allows:
 * - Triggering review requests via chat
 * - Displaying review status in agent panel
 */

export class JudgeMeProvider {
  private apiToken: string;
  private shopDomain: string;
  private baseUrl = 'https://judge.me/api/v1';

  constructor(apiToken: string, shopDomain: string) {
    this.apiToken = apiToken;
    this.shopDomain = shopDomain;
  }

  async getReviews(productId?: string, page = 1): Promise<any[]> {
    try {
      let url = `${this.baseUrl}/reviews?api_token=${this.apiToken}&shop_domain=${this.shopDomain}&page=${page}`;
      if (productId) {
        url += `&product_id=${productId}`;
      }
      const response = await fetch(url);
      if (!response.ok) return [];
      const data: any = await response.json();
      return data.reviews || [];
    } catch {
      return [];
    }
  }

  async getReviewsByEmail(email: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/reviews?api_token=${this.apiToken}&shop_domain=${this.shopDomain}&reviewer_email=${encodeURIComponent(email)}`,
      );
      if (!response.ok) return [];
      const data: any = await response.json();
      return data.reviews || [];
    } catch {
      return [];
    }
  }

  async requestReview(orderData: {
    email: string;
    name: string;
    orderId: string;
    productId: string;
    productTitle: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/reviews/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_token: this.apiToken,
          shop_domain: this.shopDomain,
          email: orderData.email,
          name: orderData.name,
          order_id: orderData.orderId,
          id: orderData.productId,
          title: orderData.productTitle,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Judge.me error: ${response.status} - ${error}` };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/reviews?api_token=${this.apiToken}&shop_domain=${this.shopDomain}&per_page=1`,
      );
      if (!response.ok) return { success: false, error: `HTTP ${response.status}` };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
