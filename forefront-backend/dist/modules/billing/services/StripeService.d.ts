import type { IBillingProvider } from '../interfaces/IBillingProvider.js';
export declare class StripeService implements IBillingProvider {
    private stripe;
    private webhookSecret;
    constructor();
    createCustomer(workspaceId: string, email: string): Promise<string>;
    createSubscription(workspaceId: string, customerId: string, planId: string): Promise<any>;
    cancelSubscription(subscriptionId: string): Promise<void>;
    getSubscriptionDetails(subscriptionId: string): Promise<any>;
    verifyWebhook(payload: any, signature: string): boolean;
    processWebhook(event: any): Promise<void>;
}
//# sourceMappingURL=StripeService.d.ts.map