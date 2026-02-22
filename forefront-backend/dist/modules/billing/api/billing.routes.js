import { BillingFactory } from '../services/BillingFactory.js';
import { query } from '../../../config/db.js';
import { authenticate } from '../../auth/auth.middleware.js';
export async function billingRoutes(app) {
    // Stripe Webhook
    app.post('/webhook/stripe', { config: { rawBody: true } }, async (req, reply) => {
        const sig = req.headers['stripe-signature'];
        const provider = BillingFactory.getProvider('US');
        const rawBody = req.rawBody;
        if (!provider.verifyWebhook(rawBody, sig)) {
            return reply.code(400).send({ error: 'Invalid Signature' });
        }
        const event = req.body;
        // Idempotency Check & Logging
        try {
            await query('INSERT INTO billing_events (provider, event_id, event_type, payload) VALUES ($1, $2, $3, $4)', ['stripe', event.id, event.type, JSON.stringify(event)]);
        }
        catch (e) {
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
        const sig = req.headers['x-razorpay-signature'];
        const provider = BillingFactory.getProvider('IN');
        const rawBody = req.rawBody;
        if (!provider.verifyWebhook(rawBody, sig)) {
            return reply.code(400).send({ error: 'Invalid Signature' });
        }
        // Razorpay structure: { entity: "event", event: "subscription.charged", payload: {...} }
        const eventId = req.body.event_id || `rp_${Date.now()}`;
        try {
            await query('INSERT INTO billing_events (provider, event_id, event_type, payload) VALUES ($1, $2, $3, $4)', ['razorpay', eventId, req.body.event, JSON.stringify(req.body)]);
        }
        catch (e) {
            // ... error handling
            console.error('Webhook Log Error', e);
        }
        return reply.send({ status: 'ok' });
    });
    // Billing Status
    app.get('/status', { preHandler: [authenticate] }, async (req, reply) => {
        // Mock status for now
        return reply.send({
            plan: 'free',
            status: 'active',
            usage: {
                tokens: 0,
                max_tokens: 1000
            }
        });
    });
    // Billing Usage
    app.get('/usage', { preHandler: [authenticate] }, async (req, reply) => {
        // Mock usage for now
        return reply.send({
            plan: 'free',
            status: 'active',
            usage: {
                tokens: 150,
                max_tokens: 1000,
                conversations: 5,
                max_conversations: 50
            }
        });
    });
}
