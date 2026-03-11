import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { pool } from '../../config/db.js';
import { authenticate } from '../auth/auth.middleware.js';

export async function flowRoutes(app: FastifyInstance) {

    // GET /api/flows?agentId=...
    app.get('/', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { agentId } = z.object({ agentId: z.string().uuid() }).parse(req.query);
            const result = await pool.query(
                `SELECT id, name, description, trigger_type, is_active, updated_at, created_at
                 FROM flows WHERE agent_id = $1 ORDER BY created_at DESC`,
                [agentId]
            );
            return reply.send({ flows: result.rows });
        } catch (error: any) {
            console.error('Error fetching flows:', error);
            return reply.status(400).send({ error: error.message });
        }
    });

    // POST /api/flows — create a new draft flow
    app.post('/', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = z.object({
                agentId: z.string().uuid(),
                name: z.string().optional(),
            }).parse(req.body);

            const result = await pool.query(
                `INSERT INTO flows (agent_id, name) VALUES ($1, $2) RETURNING *`,
                [body.agentId, body.name || 'Untitled Flow']
            );
            return reply.status(201).send({ flow: result.rows[0] });
        } catch (error: any) {
            console.error('Error creating flow:', error);
            return reply.status(400).send({ error: error.message });
        }
    });

    // GET /api/flows/:id
    app.get('/:id', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
            const result = await pool.query(`SELECT * FROM flows WHERE id = $1`, [id]);
            if (result.rows.length === 0) {
                return reply.status(404).send({ error: 'Flow not found' });
            }
            return reply.send({ flow: result.rows[0] });
        } catch (error: any) {
            console.error('Error fetching flow:', error);
            return reply.status(400).send({ error: error.message });
        }
    });

    // PUT /api/flows/:id
    app.put('/:id', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
            const updates = z.object({
                name: z.string().optional(),
                description: z.string().optional(),
                nodes: z.array(z.any()).optional(),
                edges: z.array(z.any()).optional(),
                variables: z.record(z.string(), z.any()).optional(),
                trigger_type: z.string().optional(),
                is_active: z.boolean().optional(),
            }).parse(req.body);

            const setClauses: string[] = [];
            const values: any[] = [];
            let idx = 1;

            if (updates.name !== undefined) { setClauses.push(`name = $${idx++}`); values.push(updates.name); }
            if (updates.description !== undefined) { setClauses.push(`description = $${idx++}`); values.push(updates.description); }
            if (updates.nodes !== undefined) { setClauses.push(`nodes = $${idx++}`); values.push(JSON.stringify(updates.nodes)); }
            if (updates.edges !== undefined) { setClauses.push(`edges = $${idx++}`); values.push(JSON.stringify(updates.edges)); }
            if (updates.variables !== undefined) { setClauses.push(`variables = $${idx++}`); values.push(JSON.stringify(updates.variables)); }
            if (updates.trigger_type !== undefined) { setClauses.push(`trigger_type = $${idx++}`); values.push(updates.trigger_type); }
            if (updates.is_active !== undefined) { setClauses.push(`is_active = $${idx++}`); values.push(updates.is_active); }

            if (setClauses.length === 0) return reply.status(400).send({ error: 'No fields to update' });

            values.push(id);
            const result = await pool.query(
                `UPDATE flows SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
                values
            );
            if (result.rows.length === 0) return reply.status(404).send({ error: 'Flow not found' });
            return reply.send({ flow: result.rows[0] });
        } catch (error: any) {
            console.error('Error updating flow:', error);
            return reply.status(400).send({ error: error.message });
        }
    });

    // DELETE /api/flows/:id
    app.delete('/:id', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
            const result = await pool.query(`DELETE FROM flows WHERE id = $1 RETURNING id`, [id]);
            if (result.rows.length === 0) return reply.status(404).send({ error: 'Flow not found' });
            return reply.send({ success: true, message: 'Flow deleted' });
        } catch (error: any) {
            console.error('Error deleting flow:', error);
            return reply.status(400).send({ error: error.message });
        }
    });

    // POST /api/flows/:id/test — Run flow in sandbox with test payload
    app.post('/:id/test', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
            const body = z.object({
                trigger_data: z.record(z.string(), z.any()).optional(),
                agent_id: z.string().uuid(),
                visitor_id: z.string().optional(),
            }).parse(req.body);

            const { FlowExecutionEngine } = await import('../../services/flow/FlowExecutionEngine.js');
            const engine = new FlowExecutionEngine();
            const result = await engine.execute(id, body.trigger_data || {}, {
                agent_id: body.agent_id,
                visitor_id: body.visitor_id || 'test-visitor',
            });

            return reply.send({ execution: result });
        } catch (error: any) {
            console.error('Flow test error:', error);
            return reply.status(500).send({ error: error.message });
        }
    });

    // GET /api/flows/:id/executions — List recent runs
    app.get('/:id/executions', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
            const result = await pool.query(
                `SELECT id, status, started_at, completed_at, total_tokens_used, llm_cost_usd, error_message
                 FROM flow_executions WHERE flow_id = $1 ORDER BY started_at DESC LIMIT 50`,
                [id]
            );
            return reply.send({ executions: result.rows });
        } catch (error: any) {
            return reply.status(400).send({ error: error.message });
        }
    });

    // GET /api/flows/executions/:execId — Full execution trace
    app.get('/executions/:execId', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { execId } = z.object({ execId: z.string().uuid() }).parse(req.params);
            const result = await pool.query(`SELECT * FROM flow_executions WHERE id = $1`, [execId]);
            if (result.rows.length === 0) return reply.status(404).send({ error: 'Execution not found' });
            return reply.send({ execution: result.rows[0] });
        } catch (error: any) {
            return reply.status(400).send({ error: error.message });
        }
    });

    // GET /api/flows/templates — Get all available flow templates
    app.get('/templates', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { flowTemplates, getTemplatesByCategory } = await import('./flow-templates.js');
            const { category } = req.query as { category?: string };

            const templates = category ? getTemplatesByCategory(category) : flowTemplates;
            return reply.send({
                templates: templates.map(t => ({
                    name: t.name,
                    description: t.description,
                    category: t.category,
                    trigger_type: t.trigger_type,
                    uses: t.uses || 0
                }))
            });
        } catch (error: any) {
            return reply.status(400).send({ error: error.message });
        }
    });

    // POST /api/flows/from-template — Create a flow from a template
    app.post('/from-template', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { agentId, templateName } = z.object({
                agentId: z.string().uuid(),
                templateName: z.string()
            }).parse(req.body);

            const { flowTemplates } = await import('./flow-templates.js');
            const template = flowTemplates.find(t => t.name === templateName);

            if (!template) {
                return reply.status(404).send({ error: 'Template not found' });
            }

            const result = await pool.query(
                `INSERT INTO flows (agent_id, name, description, trigger_type, is_active, nodes, edges)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING *`,
                [
                    agentId,
                    template.name,
                    template.description,
                    template.trigger_type,
                    false, // Start inactive
                    JSON.stringify(template.nodes),
                    JSON.stringify(template.edges)
                ]
            );

            return reply.status(201).send({ flow: result.rows[0] });
        } catch (error: any) {
            return reply.status(400).send({ error: error.message });
        }
    });

    // POST /api/flows/seed-defaults — Create default flows for an agent
    app.post('/seed-defaults', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { agentId } = z.object({ agentId: z.string().uuid() }).parse(req.body);

            // Check if agent already has flows
            const existing = await pool.query(
                `SELECT COUNT(*) FROM flows WHERE agent_id = $1`,
                [agentId]
            );
            if (parseInt(existing.rows[0].count) > 0) {
                return reply.send({ message: 'Agent already has flows', created: 0 });
            }

            // Import all templates
            const { flowTemplates } = await import('./flow-templates.js');

            let created = 0;
            for (const template of flowTemplates) {
                await pool.query(
                    `INSERT INTO flows (agent_id, name, description, trigger_type, is_active, nodes, edges)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                        agentId,
                        template.name,
                        template.description,
                        template.trigger_type,
                        template.is_active,
                        JSON.stringify(template.nodes),
                        JSON.stringify(template.edges)
                    ]
                );
                created++;
            }

            return reply.status(201).send({ message: 'Default flows created', created });
        } catch (error: any) {
            console.error('Error seeding default flows:', error);
            return reply.status(400).send({ error: error.message });
        }
    });
}
