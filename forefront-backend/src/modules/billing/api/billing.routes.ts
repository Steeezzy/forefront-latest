import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BillingFactory } from '../services/BillingFactory.js';
import { query } from '../../../config/db.js';
import { UsageService } from '../../usage/usage.service.js';
import { authenticate } from '../../auth/auth.middleware.js';
import { WorkspacePlanService } from '../services/WorkspacePlanService.js';

export async function billingRoutes(app: FastifyInstance) {
    const usageService = new UsageService();
    const workspacePlanService = new WorkspacePlanService();

    app.get('/catalog', { preHandler: [authenticate] }, async (_req: FastifyRequest, reply: FastifyReply) => {
        try {
            return reply.send(workspacePlanService.getCatalog());
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    });

    app.get('/workspace-plan', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const user = (req as any).user as { workspaceId: string };
            const resolved = await workspacePlanService.getWorkspacePlan(user.workspaceId);
            const usage = await workspacePlanService.getWorkspaceUsageSnapshot(user.workspaceId, resolved.currentPeriodStart);

            return reply.send({
                ...resolved,
                usage,
                recommendation: workspacePlanService.getCatalog().recommendation,
            });
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    });

    app.put('/workspace-plan', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const user = (req as any).user as { workspaceId: string };
            const body = (req.body || {}) as any;

            const updated = await workspacePlanService.updateWorkspacePlan(user.workspaceId, {
                basePlanId: body.basePlanId,
                voiceAddonId: body.voiceAddonId,
                meterOverrides: body.meterOverrides,
                featureOverrides: body.featureOverrides,
                billingPreferences: body.billingPreferences,
            });
            const usage = await workspacePlanService.getWorkspaceUsageSnapshot(user.workspaceId, updated.currentPeriodStart);

            return reply.send({
                ...updated,
                usage,
                recommendation: workspacePlanService.getCatalog().recommendation,
            });
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    });

    // GET /billing/status - Get current user's billing status
    app.get('/status', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const user = (req as any).user as { userId: string; workspaceId: string };
            let usage: any = { used: 0, limit: 500, plan: { id: 'conversa-free', name: 'Free' } };
            try {
                usage = await usageService.getUsage(user.workspaceId);
            } catch (e) {
                // Default to free plan if no workspace found
            }

            const resolved = await workspacePlanService.getWorkspacePlan(user.workspaceId).catch(() => null);
            const isUnlimited = usage.limit === null;
            const percent = isUnlimited ? 0 : Math.min(100, Math.round((usage.used / Math.max(usage.limit || 1, 1)) * 100));

            return reply.send({
                plan: usage.plan?.name || 'Free',
                planId: usage.plan?.id || resolved?.basePlanId || 'conversa-free',
                status: usage.status || 'active',
                provider: resolved?.billingProvider || null,
                isUnlimited,
                usage: {
                    conversations: 0,
                    messages: usage.used || 0,
                },
                limits: {
                    conversations: null,
                    messages: usage.limit,
                },
                percent,
                isNearLimit: percent >= 80,
                isLimitReached: !isUnlimited && percent >= 100,
                periodEnd: usage.periodEnd,
                voiceAddonId: resolved?.voiceAddonId || 'voice-none',
                syncedPlan: resolved,
            });
        } catch (error: any) {
            console.error('Error fetching billing status:', error);
            return reply.status(500).send({ error: error.message });
        }
    });

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
