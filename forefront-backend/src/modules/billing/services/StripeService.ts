import Stripe from 'stripe';
import type { IBillingProvider } from '../interfaces/IBillingProvider.js';
import { env } from '../../../config/env.js';

export class StripeService implements IBillingProvider {
    private stripe: Stripe;
    private webhookSecret: string;

    constructor() {
        if (!env.STRIPE_SECRET_KEY) {
            console.warn('STRIPE_SECRET_KEY is missing. StripeService will fail.');
        }
        this.stripe = new Stripe(env.STRIPE_SECRET_KEY || 'dummy', {
            apiVersion: '2026-01-28.clover',
        });
        this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    }

    async createCustomer(workspaceId: string, email: string): Promise<string> {
        const customer = await this.stripe.customers.create({
            email,
            metadata: { workspaceId }
        });
        return customer.id;
    }

    async createSubscription(workspaceId: string, customerId: string, planId: string): Promise<any> {
        const subscription = await this.stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: planId }],
            metadata: { workspaceId },
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            expand: ['latest_invoice.payment_intent'],
        });
        return subscription;
    }

    async cancelSubscription(subscriptionId: string): Promise<void> {
        await this.stripe.subscriptions.cancel(subscriptionId);
    }

    async getSubscriptionDetails(subscriptionId: string): Promise<any> {
        return await this.stripe.subscriptions.retrieve(subscriptionId);
    }

    verifyWebhook(payload: any, signature: string): boolean {
        try {
            this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
            return true;
        } catch (err) {
            console.error('Stripe Webhook Verification Failed', err);
            return false;
        }
    }

    async processWebhook(event: any): Promise<void> {
        // Handled by controller usually, or here if we want fat service
        console.log('Processing Stripe Event', event.type);
    }
}
