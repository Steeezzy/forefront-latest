/**
 * Zendesk (Customer Support) Integration Provider
 *
 * Creates Zendesk tickets from chat conversations.
 * Syncs contact info between Forefront and Zendesk.
 */
export class ZendeskProvider {
    subdomain;
    email;
    apiToken;
    constructor(subdomain, email, apiToken) {
        this.subdomain = subdomain;
        this.email = email;
        this.apiToken = apiToken;
    }
    get baseUrl() {
        return `https://${this.subdomain}.zendesk.com/api/v2`;
    }
    get authHeader() {
        return 'Basic ' + Buffer.from(`${this.email}/token:${this.apiToken}`).toString('base64');
    }
    async createTicket(ticket) {
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
                        tags: [...(ticket.tags || []), 'forefront-chat'],
                    },
                }),
            });
            if (!response.ok) {
                const error = await response.text();
                return { success: false, error: `Zendesk error: ${response.status} - ${error}` };
            }
            const data = await response.json();
            return {
                success: true,
                ticketId: String(data.ticket?.id),
                ticketUrl: `https://${this.subdomain}.zendesk.com/agent/tickets/${data.ticket?.id}`,
            };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async getTicket(ticketId) {
        try {
            const response = await fetch(`${this.baseUrl}/tickets/${ticketId}.json`, {
                headers: { 'Authorization': this.authHeader },
            });
            if (!response.ok)
                return null;
            const data = await response.json();
            return data.ticket;
        }
        catch {
            return null;
        }
    }
    async searchTicketsByEmail(email) {
        try {
            const response = await fetch(`${this.baseUrl}/search.json?query=type:ticket requester:${encodeURIComponent(email)}&sort_by=created_at&sort_order=desc`, { headers: { 'Authorization': this.authHeader } });
            if (!response.ok)
                return [];
            const data = await response.json();
            return data.results || [];
        }
        catch {
            return [];
        }
    }
    async addCommentToTicket(ticketId, comment, isPublic = false) {
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
        }
        catch {
            return false;
        }
    }
    async testConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/users/me.json`, {
                headers: { 'Authorization': this.authHeader },
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
/**
 * Judge.me (Review Collection) Integration Provider
 *
 * Judge.me is a product review platform for e-commerce.
 * Integration allows:
 * - Triggering review requests via chat
 * - Displaying review status in agent panel
 */
export class JudgeMeProvider {
    apiToken;
    shopDomain;
    baseUrl = 'https://judge.me/api/v1';
    constructor(apiToken, shopDomain) {
        this.apiToken = apiToken;
        this.shopDomain = shopDomain;
    }
    async getReviews(productId, page = 1) {
        try {
            let url = `${this.baseUrl}/reviews?api_token=${this.apiToken}&shop_domain=${this.shopDomain}&page=${page}`;
            if (productId) {
                url += `&product_id=${productId}`;
            }
            const response = await fetch(url);
            if (!response.ok)
                return [];
            const data = await response.json();
            return data.reviews || [];
        }
        catch {
            return [];
        }
    }
    async getReviewsByEmail(email) {
        try {
            const response = await fetch(`${this.baseUrl}/reviews?api_token=${this.apiToken}&shop_domain=${this.shopDomain}&reviewer_email=${encodeURIComponent(email)}`);
            if (!response.ok)
                return [];
            const data = await response.json();
            return data.reviews || [];
        }
        catch {
            return [];
        }
    }
    async requestReview(orderData) {
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
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async testConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/reviews?api_token=${this.apiToken}&shop_domain=${this.shopDomain}&per_page=1`);
            if (!response.ok)
                return { success: false, error: `HTTP ${response.status}` };
            return { success: true };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
}
//# sourceMappingURL=support.provider.js.map