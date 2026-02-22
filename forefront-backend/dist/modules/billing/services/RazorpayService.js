import Razorpay from 'razorpay';
import * as crypto from 'crypto';
export class RazorpayService {
    constructor() {
        // Basic check, might throw if keys missing
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || 'dummy',
            key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy'
        });
        this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    }
    async createCustomer(workspaceId, email) {
        const customer = await this.razorpay.customers.create({
            email,
            notes: { workspaceId },
            contact: '9999999999' // Razorpay requires contact, dummy for now or ask user
        });
        return customer.id;
    }
    async createSubscription(workspaceId, customerId, planId) {
        // Razorpay subscriptions require a plan_id created in dashboard
        const subscription = await this.razorpay.subscriptions.create({
            plan_id: planId,
            customer_notify: 1,
            total_count: 120, // 10 years monthly
            notes: { workspaceId }
        });
        return subscription;
    }
    async cancelSubscription(subscriptionId) {
        await this.razorpay.subscriptions.cancel(subscriptionId);
    }
    async getSubscriptionDetails(subscriptionId) {
        return await this.razorpay.subscriptions.fetch(subscriptionId);
    }
    verifyWebhook(payload, signature) {
        // payload for Razorpay is usually the raw request body string
        const generatedSignature = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(JSON.stringify(payload))
            .digest('hex');
        return generatedSignature === signature;
    }
    async processWebhook(event) {
        console.log('Processing Razorpay Event', event.event);
    }
}
