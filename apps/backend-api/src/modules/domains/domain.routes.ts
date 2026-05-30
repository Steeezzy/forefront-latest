import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { DomainService } from './domain.service.js';
import { authenticate } from '../auth/auth.middleware.js';

const domainService = new DomainService();

export async function domainRoutes(fastify: FastifyInstance) {

    // ═══════════════════════════════════════════════════════════════════
    // PUBLIC ENDPOINTS (no auth)
    // ═══════════════════════════════════════════════════════════════════

    // Widget domain check — called by widget loader
    fastify.get('/widget/check', async (request: FastifyRequest, reply: FastifyReply) => {
        const { domain, workspaceId } = request.query as { domain?: string; workspaceId?: string };
        if (!domain || !workspaceId) {
            return reply.code(400).send({ error: 'domain and workspaceId required' });
        }
        const allowed = await domainService.isWidgetAllowed(workspaceId, domain);
        return reply.send({ allowed });
    });

    // Resolve custom domain → workspace
    fastify.get('/custom/resolve/:domain', async (request: FastifyRequest, reply: FastifyReply) => {
        const { domain } = request.params as { domain: string };
        const workspaceId = await domainService.resolveCustomDomain(domain);
        if (!workspaceId) {
            return reply.code(404).send({ error: 'Domain not found' });
        }
        return reply.send({ workspaceId });
    });

    // ═══════════════════════════════════════════════════════════════════
    // PROTECTED ENDPOINTS
    // ═══════════════════════════════════════════════════════════════════

    fastify.register(async function protectedRoutes(app) {
        app.addHook('onRequest', authenticate);

        // ─── Widget Domains ──────────────────────────────────────────

        app.get('/widget', async (request: FastifyRequest, reply: FastifyReply) => {
            const workspaceId = (request as any).user?.workspaceId;
            if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

            const domains = await domainService.listWidgetDomains(workspaceId);
            return reply.send({ success: true, domains });
        });

        app.post('/widget', async (request: FastifyRequest, reply: FastifyReply) => {
            const workspaceId = (request as any).user?.workspaceId;
            if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

            const { domain } = request.body as { domain: string };
            if (!domain) return reply.code(400).send({ error: 'domain is required' });

            try {
                const result = await domainService.addWidgetDomain(workspaceId, domain);
                return reply.send({ success: true, domain: result });
            } catch (err: any) {
                return reply.code(400).send({ error: err.message });
            }
        });

        app.delete('/widget/:id', async (request: FastifyRequest, reply: FastifyReply) => {
            const workspaceId = (request as any).user?.workspaceId;
            if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

            const { id } = request.params as { id: string };
            await domainService.removeWidgetDomain(workspaceId, id);
            return reply.send({ success: true });
        });

        app.post('/widget/:id/verify', async (request: FastifyRequest, reply: FastifyReply) => {
            const workspaceId = (request as any).user?.workspaceId;
            if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

            const { id } = request.params as { id: string };
            try {
                const result = await domainService.verifyWidgetDomain(workspaceId, id);
                return reply.send({ success: true, ...result });
            } catch (err: any) {
                return reply.code(400).send({ error: err.message });
            }
        });

        // ─── Custom Branded Domains ──────────────────────────────────

        app.get('/custom', async (request: FastifyRequest, reply: FastifyReply) => {
            const workspaceId = (request as any).user?.workspaceId;
            if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

            const domains = await domainService.listCustomDomains(workspaceId);
            return reply.send({ success: true, domains });
        });

        app.post('/custom', async (request: FastifyRequest, reply: FastifyReply) => {
            const workspaceId = (request as any).user?.workspaceId;
            if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

            const { domain } = request.body as { domain: string };
            if (!domain) return reply.code(400).send({ error: 'domain is required' });

            try {
                const result = await domainService.addCustomDomain(workspaceId, domain);
                return reply.send({ success: true, domain: result });
            } catch (err: any) {
                return reply.code(400).send({ error: err.message });
            }
        });

        app.delete('/custom/:id', async (request: FastifyRequest, reply: FastifyReply) => {
            const workspaceId = (request as any).user?.workspaceId;
            if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

            const { id } = request.params as { id: string };
            await domainService.removeCustomDomain(workspaceId, id);
            return reply.send({ success: true });
        });

        app.post('/custom/:id/verify', async (request: FastifyRequest, reply: FastifyReply) => {
            const workspaceId = (request as any).user?.workspaceId;
            if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

            const { id } = request.params as { id: string };
            try {
                const result = await domainService.verifyCustomDomain(workspaceId, id);
                return reply.send({ success: true, ...result });
            } catch (err: any) {
                return reply.code(400).send({ error: err.message });
            }
        });

        // ─── Email Domains ───────────────────────────────────────────

        app.get('/email', async (request: FastifyRequest, reply: FastifyReply) => {
            const workspaceId = (request as any).user?.workspaceId;
            if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

            const domains = await domainService.listEmailDomains(workspaceId);
            return reply.send({ success: true, domains });
        });

        app.post('/email', async (request: FastifyRequest, reply: FastifyReply) => {
            const workspaceId = (request as any).user?.workspaceId;
            if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

            const { domain } = request.body as { domain: string };
            if (!domain) return reply.code(400).send({ error: 'domain is required' });

            try {
                const result = await domainService.addEmailDomain(workspaceId, domain);
                return reply.send({ success: true, domain: result });
            } catch (err: any) {
                return reply.code(400).send({ error: err.message });
            }
        });

        app.delete('/email/:id', async (request: FastifyRequest, reply: FastifyReply) => {
            const workspaceId = (request as any).user?.workspaceId;
            if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

            const { id } = request.params as { id: string };
            await domainService.removeEmailDomain(workspaceId, id);
            return reply.send({ success: true });
        });

        app.post('/email/:id/verify', async (request: FastifyRequest, reply: FastifyReply) => {
            const workspaceId = (request as any).user?.workspaceId;
            if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

            const { id } = request.params as { id: string };
            try {
                const result = await domainService.verifyEmailDomain(workspaceId, id);
                return reply.send({ success: true, domain: result });
            } catch (err: any) {
                return reply.code(400).send({ error: err.message });
            }
        });

        app.get('/email/:id/records', async (request: FastifyRequest, reply: FastifyReply) => {
            const workspaceId = (request as any).user?.workspaceId;
            if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

            const { id } = request.params as { id: string };
            try {
                const records = await domainService.getEmailDomainRecords(workspaceId, id);
                return reply.send({ success: true, records });
            } catch (err: any) {
                return reply.code(400).send({ error: err.message });
            }
        });
    });
}
