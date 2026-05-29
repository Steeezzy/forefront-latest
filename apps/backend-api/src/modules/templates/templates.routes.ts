import type { FastifyInstance } from 'fastify';
import { templateService } from './templates.service.js';

export default async function templatesRoutes(app: FastifyInstance) {
    /**
     * Public: List all active templates (with optional filters)
     * GET /api/templates?industry_id=...&direction=...
     */
    app.get('/', async (request, reply) => {
        try {
            const { industry_id, direction, mode, featured } = request.query as any;
            const templates = await templateService.listTemplates({
                industry_id,
                direction,
                mode,
                featured: featured === 'true' ? true : undefined,
            });
            return { success: true, data: templates };
        } catch (e: any) {
            reply.status(500).send({ success: false, error: e.message });
        }
    });

    /**
     * Public: Get a single template by ID
     * GET /api/templates/:id
     */
    app.get('/:id', async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const template = await templateService.getTemplate(id);
            if (!template) {
                return reply.status(404).send({ success: false, error: 'Template not found' });
            }
            return { success: true, data: template };
        } catch (e: any) {
            reply.status(500).send({ success: false, error: e.message });
        }
    });

    /**
     * Public: Get all industries
     * GET /api/templates/industries
     */
    app.get('/industries/list', async (request, reply) => {
        try {
            const industries = await templateService.getIndustries();
            return { success: true, data: industries };
        } catch (e: any) {
            reply.status(500).send({ success: false, error: e.message });
        }
    });

    /**
     * Public: Get templates by industry
     * GET /api/templates/industry/:industryId
     */
    app.get('/industry/:industryId', async (request, reply) => {
        try {
            const { industryId } = request.params as { industryId: string };
            const templates = await templateService.getTemplatesByIndustry(industryId);
            return { success: true, data: templates };
        } catch (e: any) {
            reply.status(500).send({ success: false, error: e.message });
        }
    });

    /**
     * Public: Get featured templates (for homepage)
     * GET /api/templates/featured?limit=6
     */
    app.get('/featured', async (request, reply) => {
        try {
            const { limit } = request.query as { limit?: string };
            const templates = await templateService.getFeaturedTemplates(limit ? parseInt(limit) : 6);
            return { success: true, data: templates };
        } catch (e: any) {
            reply.status(500).send({ success: false, error: e.message });
        }
    });

    // ============================================
    // Admin Routes (protected - TODO: add guards)
    // ============================================

    /**
     * Admin: Create a new template
     * POST /api/templates/admin
     */
    app.post('/admin', async (request, reply) => {
        try {
            const template = await templateService.createTemplate(request.body as any);
            return { success: true, data: template };
        } catch (e: any) {
            reply.status(500).send({ success: false, error: e.message });
        }
    });

    /**
     * Admin: Update template
     * PUT /api/templates/admin/:id
     */
    app.put('/admin/:id', async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const template = await templateService.updateTemplate(id, request.body as any);
            if (!template) {
                return reply.status(404).send({ success: false, error: 'Template not found' });
            }
            return { success: true, data: template };
        } catch (e: any) {
            reply.status(500).send({ success: false, error: e.message });
        }
    });

    /**
     * Admin: Delete template (soft)
     * DELETE /api/templates/admin/:id
     */
    app.delete('/admin/:id', async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const deleted = await templateService.deleteTemplate(id);
            return { success: true, data: { deleted } };
        } catch (e: any) {
            reply.status(500).send({ success: false, error: e.message });
        }
    });

    /**
     * Admin: Seed templates from hardcoded data (one-time)
     * POST /api/templates/admin/seed
     */
    app.post('/admin/seed', async (request, reply) => {
        try {
            // This expects a JSON array of template objects
            const templates = request.body as any[];
            if (!Array.isArray(templates)) {
                return reply.status(400).send({ success: false, error: 'Body must be an array of template objects' });
            }
            const count = await templateService.seedTemplatesFromData(templates);
            return { success: true, data: { seeded: count } };
        } catch (e: any) {
            reply.status(500).send({ success: false, error: e.message });
        }
    });
}
