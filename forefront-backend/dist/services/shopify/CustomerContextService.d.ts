/**
 * CustomerContextService — Assembles rich e-commerce context for AI and agents.
 *
 * Fetches customer data, recent orders, open issues, abandoned checkouts,
 * and formats them for Lyro system prompts or inbox sidebar display.
 */
import type { CustomerEcommerceContext, ShopifyOrder } from '../../types/ecommerce.types.js';
export declare class CustomerContextService {
    /**
     * Get full context by email + workspace.
     */
    getContextByEmail(email: string, workspaceId: string): Promise<CustomerEcommerceContext | null>;
    /**
     * Get context by conversation ID (looks up contact email).
     */
    getContextByConversation(conversationId: string): Promise<CustomerEcommerceContext | null>;
    /**
     * Format context for injection into Lyro's system prompt.
     */
    formatContextForAI(ctx: CustomerEcommerceContext): string;
    /**
     * Format structured context for the agent inbox sidebar.
     */
    formatContextForAgent(ctx: CustomerEcommerceContext): object;
    /**
     * Search orders by order number, email, or product title.
     */
    searchOrders(query: string, storeId: string, limit?: number): Promise<ShopifyOrder[]>;
}
export declare const customerContextService: CustomerContextService;
//# sourceMappingURL=CustomerContextService.d.ts.map