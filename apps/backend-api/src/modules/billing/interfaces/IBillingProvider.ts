export interface IBillingProvider {
    createCustomer(workspaceId: string, email: string): Promise<string>;
    createSubscription(workspaceId: string, customerId: string, planId: string): Promise<any>;
    cancelSubscription(subscriptionId: string): Promise<void>;
    getSubscriptionDetails(subscriptionId: string): Promise<any>;
    verifyWebhook(payload: any, signature: string): boolean;
    processWebhook(event: any): Promise<void>;
}

export interface BillingConfig {
    provider: 'stripe' | 'razorpay';
    secretKey: string;
    webhookSecret: string;
}
