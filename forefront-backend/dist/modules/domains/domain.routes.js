import { DomainService } from './domain.service.js';
import { authenticate } from '../auth/auth.middleware.js';
const domainService = new DomainService();
export async function domainRoutes(fastify) {
    // ═══════════════════════════════════════════════════════════════════
    // PUBLIC ENDPOINTS (no auth)
    // ═══════════════════════════════════════════════════════════════════
    // Widget domain check — called by widget loader
    fastify.get('/widget/check', async (request, reply) => {
        const { domain, workspaceId } = request.query;
        if (!domain || !workspaceId) {
            return reply.code(400).send({ error: 'domain and workspaceId required' });
        }
        const allowed = await domainService.isWidgetAllowed(workspaceId, domain);
        return reply.send({ allowed });
    });
    // Resolve custom domain → workspace
    fastify.get('/custom/resolve/:domain', async (request, reply) => {
        const { domain } = request.params;
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
        app.get('/widget', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const domains = await domainService.listWidgetDomains(workspaceId);
            return reply.send({ success: true, domains });
        });
        app.post('/widget', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { domain } = request.body;
            if (!domain)
                return reply.code(400).send({ error: 'domain is required' });
            try {
                const result = await domainService.addWidgetDomain(workspaceId, domain);
                return reply.send({ success: true, domain: result });
            }
            catch (err) {
                return reply.code(400).send({ error: err.message });
            }
        });
        app.delete('/widget/:id', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { id } = request.params;
            await domainService.removeWidgetDomain(workspaceId, id);
            return reply.send({ success: true });
        });
        app.post('/widget/:id/verify', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { id } = request.params;
            try {
                const result = await domainService.verifyWidgetDomain(workspaceId, id);
                return reply.send({ success: true, ...result });
            }
            catch (err) {
                return reply.code(400).send({ error: err.message });
            }
        });
        // ─── Custom Branded Domains ──────────────────────────────────
        app.get('/custom', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const domains = await domainService.listCustomDomains(workspaceId);
            return reply.send({ success: true, domains });
        });
        app.post('/custom', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { domain } = request.body;
            if (!domain)
                return reply.code(400).send({ error: 'domain is required' });
            try {
                const result = await domainService.addCustomDomain(workspaceId, domain);
                return reply.send({ success: true, domain: result });
            }
            catch (err) {
                return reply.code(400).send({ error: err.message });
            }
        });
        app.delete('/custom/:id', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { id } = request.params;
            await domainService.removeCustomDomain(workspaceId, id);
            return reply.send({ success: true });
        });
        app.post('/custom/:id/verify', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { id } = request.params;
            try {
                const result = await domainService.verifyCustomDomain(workspaceId, id);
                return reply.send({ success: true, ...result });
            }
            catch (err) {
                return reply.code(400).send({ error: err.message });
            }
        });
        // ─── Email Domains ───────────────────────────────────────────
        app.get('/email', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const domains = await domainService.listEmailDomains(workspaceId);
            return reply.send({ success: true, domains });
        });
        app.post('/email', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { domain } = request.body;
            if (!domain)
                return reply.code(400).send({ error: 'domain is required' });
            try {
                const result = await domainService.addEmailDomain(workspaceId, domain);
                return reply.send({ success: true, domain: result });
            }
            catch (err) {
                return reply.code(400).send({ error: err.message });
            }
        });
        app.delete('/email/:id', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { id } = request.params;
            await domainService.removeEmailDomain(workspaceId, id);
            return reply.send({ success: true });
        });
        app.post('/email/:id/verify', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { id } = request.params;
            try {
                const result = await domainService.verifyEmailDomain(workspaceId, id);
                return reply.send({ success: true, domain: result });
            }
            catch (err) {
                return reply.code(400).send({ error: err.message });
            }
        });
        app.get('/email/:id/records', async (request, reply) => {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId)
                return reply.code(401).send({ error: 'Unauthorized' });
            const { id } = request.params;
            try {
                const records = await domainService.getEmailDomainRecords(workspaceId, id);
                return reply.send({ success: true, records });
            }
            catch (err) {
                return reply.code(400).send({ error: err.message });
            }
        });
    });
}
//# sourceMappingURL=domain.routes.js.map