import Stripe from 'stripe';
import type { IBillingProvider } from '../interfaces/IBillingProvider.js';
import { env } from '../../../config/env.js';
import { pool } from '../../../config/db.js';
import { getPlanById, getAllPlans, getPlanStripePriceId, type PlanDefinition } from '../plans.js';

export class StripeService implements IBillingProvider {
    private stripe: Stripe;
    private webhookSecret: string;

    constructor() {
        if (!env.STRIPE_SECRET_KEY) {
            console.warn('STRIPE_SECRET_KEY is missing. StripeService will fail.');
        }
        this.stripe = new Stripe(env.STRIPE_SECRET_KEY || 'dummy', {
            apiVersion: '2026-02-25.clover',
        });
        this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    }

    // ── Customer Management ──────────────────────────────────────────────

    async createCustomer(workspaceId: string, email: string): Promise<string> {
        const customer = await this.stripe.customers.create({
            email,
            metadata: { workspaceId }
        });
        return customer.id;
    }

    // ── Checkout Session ─────────────────────────────────────────────────

    async createCheckoutSession(
        workspaceId: string,
        planId: string,
        email: string,
        successUrl: string,
        cancelUrl: string,
        interval: 'month' | 'year' = 'month'
    ): Promise<{ sessionId: string; url: string }> {
        const plan = getPlanById(planId);
        const stripePriceId = getPlanStripePriceId(planId, interval);
        if (!plan || !stripePriceId) {
            throw new Error(`Invalid plan or missing Stripe ${interval} price ID for: ${planId}`);
        }

        // Find or create Stripe customer
        let customerId: string;
        const subRes = await pool.query(
            `SELECT stripe_customer_id FROM subscriptions WHERE workspace_id = $1`,
            [workspaceId]
        );

        if (subRes.rows.length > 0 && subRes.rows[0].stripe_customer_id) {
            customerId = subRes.rows[0].stripe_customer_id;
        } else {
            customerId = await this.createCustomer(workspaceId, email);
            // Upsert subscription record
            await pool.query(
                `INSERT INTO subscriptions (workspace_id, stripe_customer_id, plan)
                 VALUES ($1, $2, 'free')
                 ON CONFLICT (workspace_id)
                 DO UPDATE SET stripe_customer_id = $2, updated_at = NOW()`,
                [workspaceId, customerId]
            );
        }

        const session = await this.stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            line_items: [{ price: stripePriceId, quantity: 1 }],
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: { workspaceId, planId, interval },
            subscription_data: {
                metadata: { workspaceId, planId, interval },
            },
        });

        return {
            sessionId: session.id,
            url: session.url || '',
        };
    }

    // ── Subscription Management ──────────────────────────────────────────

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
        await this.stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
        });
    }

    async cancelSubscriptionImmediately(subscriptionId: string): Promise<void> {
        await this.stripe.subscriptions.cancel(subscriptionId);
    }

    async getSubscriptionDetails(subscriptionId: string): Promise<any> {
        return await this.stripe.subscriptions.retrieve(subscriptionId);
    }

    // ── Subscription Lookup ──────────────────────────────────────────────

    async getWorkspaceSubscription(workspaceId: string) {
        const result = await pool.query(
            `SELECT * FROM subscriptions WHERE workspace_id = $1`,
            [workspaceId]
        );

        if (result.rows.length === 0) {
            return { plan: 'free', status: 'active', limits: getPlanById('free')!.limits };
        }

        const sub = result.rows[0];
        const plan = getPlanById(sub.plan) || getPlanById('free')!;

        return {
            ...sub,
            limits: plan.limits,
            planDetails: plan,
        };
    }

    // ── Usage Tracking ───────────────────────────────────────────────────

    async getUsage(workspaceId: string) {
        const result = await pool.query(
            `SELECT usage_type, SUM(quantity)::numeric AS total_used
             FROM usage_logs
             WHERE workspace_id = $1
               AND created_at >= date_trunc('month', CURRENT_TIMESTAMP)
             GROUP BY usage_type`,
            [workspaceId]
        );

        const usage: Record<string, number> = {};
        for (const row of result.rows) {
            usage[row.usage_type] = Number(row.total_used);
        }

        return usage;
    }

    async logUsage(workspaceId: string, usageType: string, quantity: number = 1, metadata: Record<string, any> = {}) {
        await pool.query(
            `INSERT INTO usage_logs (workspace_id, usage_type, quantity, metadata)
             VALUES ($1, $2, $3, $4)`,
            [workspaceId, usageType, quantity, JSON.stringify(metadata)]
        );
    }

    async checkLimit(workspaceId: string, usageType: string): Promise<{ allowed: boolean; used: number; limit: number }> {
        const sub = await this.getWorkspaceSubscription(workspaceId);
        const usage = await this.getUsage(workspaceId);

        const limitMap: Record<string, string> = {
            voice_minutes: 'voiceMinutes',
            chat_messages: 'chatMessages',
            agents: 'agents',
            campaigns: 'campaigns',
            knowledge_sources: 'knowledgeSources',
            contacts: 'contacts',
        };

        const limitKey = limitMap[usageType] || usageType;
        const limit = (sub.limits as any)?.[limitKey] || 0;
        const used = usage[usageType] || 0;

        return {
            allowed: used < limit,
            used,
            limit,
        };
    }

    // ── Plans ────────────────────────────────────────────────────────────

    getPlans(): PlanDefinition[] {
        return getAllPlans();
    }

    // ── Webhook Processing ───────────────────────────────────────────────

    verifyWebhook(payload: any, signature: string): boolean {
        try {
            this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
            return true;
        } catch (err) {
            console.error('Stripe Webhook Verification Failed', err);
            return false;
        }
    }

    async handleWebhookEvent(event: Stripe.Event): Promise<void> {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const workspaceId = session.metadata?.workspaceId;
                const planId = session.metadata?.planId;
                if (!workspaceId || !planId) break;

                await pool.query(
                    `INSERT INTO subscriptions (workspace_id, stripe_customer_id, stripe_subscription_id, plan, status)
                     VALUES ($1, $2, $3, $4, 'active')
                     ON CONFLICT (workspace_id)
                     DO UPDATE SET
                       stripe_customer_id = $2,
                       stripe_subscription_id = $3,
                       plan = $4,
                       status = 'active',
                       cancel_at_period_end = false,
                       updated_at = NOW()`,
                    [workspaceId, session.customer, session.subscription, planId]
                );
                console.log(`[Stripe] Checkout completed: workspace=${workspaceId} plan=${planId}`);
                break;
            }

            case 'customer.subscription.updated': {
                const sub = event.data.object as Stripe.Subscription;
                const subAny = sub as any;
                const workspaceId = sub.metadata?.workspaceId;
                if (!workspaceId) break;

                await pool.query(
                    `UPDATE subscriptions
                     SET status = $2,
                         current_period_start = $3,
                         current_period_end = $4,
                         cancel_at_period_end = $5,
                         updated_at = NOW()
                     WHERE workspace_id = $1`,
                    [
                        workspaceId,
                        sub.status,
                        subAny.current_period_start ? new Date(subAny.current_period_start * 1000).toISOString() : null,
                        subAny.current_period_end ? new Date(subAny.current_period_end * 1000).toISOString() : null,
                        sub.cancel_at_period_end,
                    ]
                );
                break;
            }

            case 'customer.subscription.deleted': {
                const sub = event.data.object as Stripe.Subscription;
                const workspaceId = sub.metadata?.workspaceId;
                if (!workspaceId) break;

                await pool.query(
                    `UPDATE subscriptions
                     SET plan = 'free', status = 'canceled', cancel_at_period_end = false, updated_at = NOW()
                     WHERE workspace_id = $1`,
                    [workspaceId]
                );
                console.log(`[Stripe] Subscription canceled: workspace=${workspaceId}`);
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
                if (!customerId) break;

                await pool.query(
                    `UPDATE subscriptions SET status = 'past_due', updated_at = NOW()
                     WHERE stripe_customer_id = $1`,
                    [customerId]
                );
                break;
            }

            default:
                console.log(`[Stripe] Unhandled event type: ${event.type}`);
        }
    }

    async processWebhook(event: any): Promise<void> {
        await this.handleWebhookEvent(event as Stripe.Event);
    }
}
