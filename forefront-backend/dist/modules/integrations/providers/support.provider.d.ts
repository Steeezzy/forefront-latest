/**
 * Zendesk (Customer Support) Integration Provider
 *
 * Creates Zendesk tickets from chat conversations.
 * Syncs contact info between Forefront and Zendesk.
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
export declare class ZendeskProvider {
    private subdomain;
    private email;
    private apiToken;
    constructor(subdomain: string, email: string, apiToken: string);
    private get baseUrl();
    private get authHeader();
    createTicket(ticket: ZendeskTicket): Promise<ZendeskTicketResult>;
    getTicket(ticketId: string): Promise<any | null>;
    searchTicketsByEmail(email: string): Promise<any[]>;
    addCommentToTicket(ticketId: string, comment: string, isPublic?: boolean): Promise<boolean>;
    testConnection(): Promise<{
        success: boolean;
        error?: string;
    }>;
}
/**
 * Judge.me (Review Collection) Integration Provider
 *
 * Judge.me is a product review platform for e-commerce.
 * Integration allows:
 * - Triggering review requests via chat
 * - Displaying review status in agent panel
 */
export declare class JudgeMeProvider {
    private apiToken;
    private shopDomain;
    private baseUrl;
    constructor(apiToken: string, shopDomain: string);
    getReviews(productId?: string, page?: number): Promise<any[]>;
    getReviewsByEmail(email: string): Promise<any[]>;
    requestReview(orderData: {
        email: string;
        name: string;
        orderId: string;
        productId: string;
        productTitle: string;
    }): Promise<{
        success: boolean;
        error?: string;
    }>;
    testConnection(): Promise<{
        success: boolean;
        error?: string;
    }>;
}
//# sourceMappingURL=support.provider.d.ts.map