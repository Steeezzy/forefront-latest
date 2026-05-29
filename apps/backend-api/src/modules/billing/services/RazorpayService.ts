import Razorpay from 'razorpay';
import crypto from 'crypto';
import type { IBillingProvider } from '../interfaces/IBillingProvider.js';
import { env } from '../../../config/env.js';

export class RazorpayService implements IBillingProvider {
    private razorpay: Razorpay;
    private webhookSecret: string;

    constructor() {
        // Basic check, might throw if keys missing
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || 'dummy',
            key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy'
        });
        this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    }

    async createCustomer(workspaceId: string, email: string): Promise<string> {
        const customer = await this.razorpay.customers.create({
            email,
            notes: { workspaceId },
            contact: '9999999999' // Razorpay requires contact, dummy for now or ask user
        });
        return customer.id;
    }

    async createSubscription(workspaceId: string, customerId: string, planId: string): Promise<any> {
        // Razorpay subscriptions require a plan_id created in dashboard
        const subscription = await this.razorpay.subscriptions.create({
            plan_id: planId,
            customer_notify: 1,
            total_count: 120, // 10 years monthly
            notes: { workspaceId }
        });
        return subscription;
    }

    async cancelSubscription(subscriptionId: string): Promise<void> {
        await this.razorpay.subscriptions.cancel(subscriptionId);
    }

    async getSubscriptionDetails(subscriptionId: string): Promise<any> {
        return await this.razorpay.subscriptions.fetch(subscriptionId);
    }

    verifyWebhook(payload: any, signature: string): boolean {
        // payload for Razorpay is usually the raw request body string
        const generatedSignature = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(JSON.stringify(payload))
            .digest('hex');

        return generatedSignature === signature;
    }

    async processWebhook(event: any): Promise<void> {
        console.log('Processing Razorpay Event', event.event);
    }
}
