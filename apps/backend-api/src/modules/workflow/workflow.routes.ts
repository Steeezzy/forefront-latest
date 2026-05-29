/**
 * Workflow Routes — CRUD + management for backend workflow automations.
 *
 * @route GET    /api/workflows           — list all workflows
 * @route POST   /api/workflows           — create workflow
 * @route GET    /api/workflows/templates  — list pre-built templates
 * @route GET    /api/workflows/:id        — get workflow details
 * @route PUT    /api/workflows/:id        — update workflow
 * @route DELETE /api/workflows/:id        — delete workflow
 * @route POST   /api/workflows/:id/toggle — enable/disable
 * @route POST   /api/workflows/import     — import from JSON
 * @route GET    /api/workflows/:id/export — export to JSON
 * @route GET    /api/workflows/:id/executions — execution history
 * @security JWT
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { pool } from '../../config/db.js';
import { authenticate } from '../auth/auth.middleware.js';
import { WorkflowEngine } from '../../services/workflow/WorkflowEngine.js';
import { nicheWorkflowRagService } from './niche-rag.service.js';

const workflowEngine = new WorkflowEngine();
const nicheCategoryEnum = z.enum(['ai', 'sales', 'it-ops', 'marketing', 'document-ops', 'support', 'other']);

export async function workflowRoutes(app: FastifyInstance) {
    app.addHook('onRequest', authenticate);

    // ─── List Workflows ────────────────────────────────────────────────

    app.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const workspaceId = req.user?.workspaceId;
            if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

            const result = await pool.query(
                `SELECT id, name, description, type, trigger_event, is_active, run_count, last_run_at, created_at, updated_at
         FROM workflows WHERE workspace_id = $1 ORDER BY created_at DESC`,
                [workspaceId]
            );

            return reply.send({ success: true, data: { workflows: result.rows } });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    });

    // ─── Create Workflow ───────────────────────────────────────────────

    app.post('/', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const workspaceId = req.user?.workspaceId;
            if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

            const body = z.object({
                name: z.string().min(1).max(255),
                description: z.string().optional(),
                type: z.string().default('custom'),
                trigger_event: z.string().min(1),
                conditions: z.record(z.string(), z.any()).optional(),
                actions: z.array(z.any()).optional(),
                config: z.record(z.string(), z.any()).optional(),
                is_active: z.boolean().default(false),
            }).parse(req.body);

            const result = await pool.query(
                `INSERT INTO workflows (workspace_id, name, description, type, trigger_event, conditions, actions, config, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
                [
                    workspaceId,
                    body.name,
                    body.description || null,
                    body.type,
                    body.trigger_event,
                    JSON.stringify(body.conditions || {}),
                    JSON.stringify(body.actions || []),
                    JSON.stringify(body.config || {}),
                    body.is_active,
                ]
            );

            return reply.code(201).send({ success: true, data: result.rows[0] });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    });

    // ─── Get Templates ─────────────────────────────────────────────────

    app.get('/templates', async (_req: FastifyRequest, reply: FastifyReply) => {
        return reply.send({ success: true, data: { templates: workflowEngine.getTemplates() } });
    });

    // ─── Niche Workflow RAG Discovery ────────────────────────────────

    app.get('/niche-rag/categories', async (_req: FastifyRequest, reply: FastifyReply) => {
        return reply.send({
            success: true,
            data: {
                categories: nicheWorkflowRagService.getCategories(),
            },
        });
    });

    app.get('/niche-rag/industries', async (_req: FastifyRequest, reply: FastifyReply) => {
        return reply.send({
            success: true,
            data: {
                industries: nicheWorkflowRagService.getIndustryProfiles(),
            },
        });
    });

    app.get('/niche-rag/templates', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const query = z.object({
                category: nicheCategoryEnum.optional(),
                industryId: z.string().optional(),
                avoidWebhooks: z.string().optional(),
            }).parse(req.query || {});

            const avoidWebhooks = query.avoidWebhooks === undefined
                ? true
                : query.avoidWebhooks.toLowerCase() !== 'false';

            const templates = nicheWorkflowRagService.getTemplateLibrary({
                category: query.category,
                industryId: query.industryId,
                avoidWebhooks,
            });

            return reply.send({
                success: true,
                data: {
                    templates,
                },
            });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    });

    app.post('/niche-rag/recommend', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = z.object({
                industryId: z.string().optional(),
                industryName: z.string().optional(),
                problemStatement: z.string().min(6),
                goals: z.array(z.string().min(1)).optional(),
                painPoints: z.array(z.string().min(1)).optional(),
                categories: z.array(nicheCategoryEnum).optional(),
                avoidWebhooks: z.boolean().optional(),
                maxTemplates: z.number().int().min(4).max(24).optional(),
            }).parse(req.body || {});

            const recommendation = nicheWorkflowRagService.recommend(body);
            return reply.send({
                success: true,
                data: recommendation,
            });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    });

    // ─── Get Workflow ──────────────────────────────────────────────────

    app.get('/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const workspaceId = req.user?.workspaceId;
            if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

            const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
            const result = await pool.query(
                `SELECT * FROM workflows WHERE id = $1 AND workspace_id = $2`,
                [id, workspaceId]
            );

            if (result.rows.length === 0) return reply.code(404).send({ error: 'Workflow not found' });

            return reply.send({ success: true, data: result.rows[0] });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    });

    // ─── Update Workflow ───────────────────────────────────────────────

    app.put('/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const workspaceId = req.user?.workspaceId;
            if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

            const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
            const body = z.object({
                name: z.string().min(1).max(255).optional(),
                description: z.string().optional(),
                trigger_event: z.string().optional(),
                conditions: z.record(z.string(), z.any()).optional(),
                actions: z.array(z.any()).optional(),
                config: z.record(z.string(), z.any()).optional(),
                is_active: z.boolean().optional(),
            }).parse(req.body);

            const setClauses: string[] = [];
            const values: any[] = [];
            let idx = 1;

            if (body.name !== undefined) { setClauses.push(`name = $${idx++}`); values.push(body.name); }
            if (body.description !== undefined) { setClauses.push(`description = $${idx++}`); values.push(body.description); }
            if (body.trigger_event !== undefined) { setClauses.push(`trigger_event = $${idx++}`); values.push(body.trigger_event); }
            if (body.conditions !== undefined) { setClauses.push(`conditions = $${idx++}`); values.push(JSON.stringify(body.conditions)); }
            if (body.actions !== undefined) { setClauses.push(`actions = $${idx++}`); values.push(JSON.stringify(body.actions)); }
            if (body.config !== undefined) { setClauses.push(`config = $${idx++}`); values.push(JSON.stringify(body.config)); }
            if (body.is_active !== undefined) { setClauses.push(`is_active = $${idx++}`); values.push(body.is_active); }

            if (setClauses.length === 0) return reply.code(400).send({ error: 'No fields to update' });

            values.push(id, workspaceId);
            const result = await pool.query(
                `UPDATE workflows SET ${setClauses.join(', ')} WHERE id = $${idx} AND workspace_id = $${idx + 1} RETURNING *`,
                values
            );

            if (result.rows.length === 0) return reply.code(404).send({ error: 'Workflow not found' });

            return reply.send({ success: true, data: result.rows[0] });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    });

    // ─── Delete Workflow ───────────────────────────────────────────────

    app.delete('/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const workspaceId = req.user?.workspaceId;
            if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

            const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
            const result = await pool.query(
                `DELETE FROM workflows WHERE id = $1 AND workspace_id = $2 RETURNING id`,
                [id, workspaceId]
            );

            if (result.rows.length === 0) return reply.code(404).send({ error: 'Workflow not found' });

            return reply.send({ success: true, message: 'Workflow deleted' });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    });

    // ─── Toggle Active ─────────────────────────────────────────────────

    app.post('/:id/toggle', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const workspaceId = req.user?.workspaceId;
            if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

            const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
            const result = await pool.query(
                `UPDATE workflows SET is_active = NOT is_active WHERE id = $1 AND workspace_id = $2 RETURNING id, is_active`,
                [id, workspaceId]
            );

            if (result.rows.length === 0) return reply.code(404).send({ error: 'Workflow not found' });

            return reply.send({ success: true, data: result.rows[0] });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    });

    // ─── Import from JSON ──────────────────────────────────────────────

    app.post('/import', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const workspaceId = req.user?.workspaceId;
            if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

            const body = z.object({
                workflow: z.object({
                    name: z.string(),
                    description: z.string().optional(),
                    type: z.string(),
                    trigger_event: z.string(),
                    conditions: z.any(),
                    actions: z.any(),
                    config: z.any(),
                }),
            }).parse(req.body);

            const wf = body.workflow;
            const result = await pool.query(
                `INSERT INTO workflows (workspace_id, name, description, type, trigger_event, conditions, actions, config)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
                [
                    workspaceId,
                    wf.name,
                    wf.description || null,
                    wf.type,
                    wf.trigger_event,
                    JSON.stringify(wf.conditions || {}),
                    JSON.stringify(wf.actions || []),
                    JSON.stringify(wf.config || {}),
                ]
            );

            return reply.code(201).send({ success: true, data: result.rows[0], message: 'Workflow imported' });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    });

    // ─── Export to JSON ────────────────────────────────────────────────

    app.get('/:id/export', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const workspaceId = req.user?.workspaceId;
            if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

            const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
            const result = await pool.query(
                `SELECT name, description, type, trigger_event, conditions, actions, config
         FROM workflows WHERE id = $1 AND workspace_id = $2`,
                [id, workspaceId]
            );

            if (result.rows.length === 0) return reply.code(404).send({ error: 'Workflow not found' });

            return reply.send({ success: true, data: { workflow: result.rows[0] } });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    });

    // ─── Execution History ─────────────────────────────────────────────

    app.get('/:id/executions', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const workspaceId = req.user?.workspaceId;
            if (!workspaceId) return reply.code(401).send({ error: 'Unauthorized' });

            const { id } = z.object({ id: z.string().uuid() }).parse(req.params);

            // Verify workflow belongs to workspace
            const wf = await pool.query(
                `SELECT id FROM workflows WHERE id = $1 AND workspace_id = $2`,
                [id, workspaceId]
            );
            if (wf.rows.length === 0) return reply.code(404).send({ error: 'Workflow not found' });

            const result = await pool.query(
                `SELECT * FROM workflow_executions WHERE workflow_id = $1 ORDER BY executed_at DESC LIMIT 100`,
                [id]
            );

            return reply.send({ success: true, data: { executions: result.rows } });
        } catch (error: any) {
            return reply.code(400).send({ success: false, error: error.message });
        }
    });
}
