import type { FastifyInstance } from 'fastify';
import { BillingFactory } from '../services/BillingFactory.js';
import { query } from '../../../config/db.js';
import { UsageService } from '../../usage/usage.service.js';

export async function billingRoutes(app: FastifyInstance) {

    // Stripe Webhook
    app.post('/webhook/stripe', { config: { rawBody: true } }, async (req, reply) => {
        const sig = req.headers['stripe-signature'] as string;
        const provider = BillingFactory.getProvider('US');
        const rawBody = (req as any).rawBody;

        if (!provider.verifyWebhook(rawBody, sig)) {
            return reply.code(400).send({ error: 'Invalid Signature' });
        }

        const event = req.body as any;

        // Idempotency Check & Logging
        try {
            await query(
                'INSERT INTO billing_events (provider, event_id, event_type, payload) VALUES ($1, $2, $3, $4)',
                ['stripe', event.id, event.type, JSON.stringify(event)]
            );
        } catch (e: any) {
            if (e.code === '23505') { // Unique violation
                console.log('Duplicate Webhook Event:', event.id);
                return reply.send({ received: true });
            }
            console.error('Webhook Log Error', e);
            return reply.code(500).send();
        }

        return reply.send({ received: true });
    });

    // Razorpay Webhook
    app.post('/webhook/razorpay', { config: { rawBody: true } }, async (req, reply) => {
        const sig = req.headers['x-razorpay-signature'] as string;
        const provider = BillingFactory.getProvider('IN');
        const rawBody = (req as any).rawBody;

        if (!provider.verifyWebhook(rawBody, sig)) {
            return reply.code(400).send({ error: 'Invalid Signature' });
        }

        // Razorpay structure: { entity: "event", event: "subscription.charged", payload: {...} }
        const eventId = (req.body as any).event_id || `rp_${Date.now()}`;

        try {
            await query(
                'INSERT INTO billing_events (provider, event_id, event_type, payload) VALUES ($1, $2, $3, $4)',
                ['razorpay', eventId, (req.body as any).event, JSON.stringify(req.body)]
            );
        } catch (e: any) {
            // ... error handling
            console.error('Webhook Log Error', e);
        }

        return reply.send({ status: 'ok' });
    });
}
