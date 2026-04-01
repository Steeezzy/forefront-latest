import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { pool } from '../../config/db.js';
import { authenticate } from '../auth/auth.middleware.js';

export async function chatbotFlowRoutes(app: FastifyInstance) {

    // GET /api/chatbot-flows/:workspaceId — Get all flows for a workspace
    app.get('/:workspaceId', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { workspaceId } = z.object({ workspaceId: z.string().uuid() }).parse(req.params);
            const result = await pool.query(
                `SELECT id, name, description, active, updated_at, created_at
                 FROM chatbot_flows WHERE workspace_id = $1 ORDER BY created_at DESC`,
                [workspaceId]
            );
            return reply.send({ flows: result.rows });
        } catch (error: any) {
            console.error('Error fetching chatbot flows:', error);
            return reply.status(400).send({ error: error.message });
        }
    });

    // POST /api/chatbot-flows/:workspaceId — Create a new flow
    app.post('/:workspaceId', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { workspaceId } = z.object({ workspaceId: z.string().uuid() }).parse(req.params);
            const body = z.object({
                name: z.string().optional(),
            }).parse(req.body);

            const result = await pool.query(
                `INSERT INTO chatbot_flows (workspace_id, name) VALUES ($1, $2) RETURNING *`,
                [workspaceId, body.name || 'Untitled Chatbot Flow']
            );
            return reply.status(201).send({ flow: result.rows[0] });
        } catch (error: any) {
            console.error('Error creating chatbot flow:', error);
            return reply.status(400).send({ error: error.message });
        }
    });

    // GET /api/chatbot-flows/flow/:flowId — Get specific flow
    app.get('/flow/:flowId', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { flowId } = z.object({ flowId: z.string().uuid() }).parse(req.params);
            const result = await pool.query(`SELECT * FROM chatbot_flows WHERE id = $1`, [flowId]);
            if (result.rows.length === 0) {
                return reply.status(404).send({ error: 'Flow not found' });
            }
            return reply.send({ flow: result.rows[0] });
        } catch (error: any) {
            console.error('Error fetching chatbot flow:', error);
            return reply.status(400).send({ error: error.message });
        }
    });

    // PUT /api/chatbot-flows/:flowId — Update flow
    app.put('/:flowId', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { flowId } = z.object({ flowId: z.string().uuid() }).parse(req.params);
            const updates = z.object({
                name: z.string().optional(),
                description: z.string().optional(),
                nodes: z.array(z.any()).optional(),
                edges: z.array(z.any()).optional(),
                variables: z.record(z.string(), z.any()).optional(),
                active: z.boolean().optional(),
            }).parse(req.body);

            const setClauses: string[] = [];
            const values: any[] = [];
            let idx = 1;

            if (updates.name !== undefined) { setClauses.push(`name = $${idx++}`); values.push(updates.name); }
            if (updates.description !== undefined) { setClauses.push(`description = $${idx++}`); values.push(updates.description); }
            if (updates.nodes !== undefined) { setClauses.push(`nodes = $${idx++}`); values.push(JSON.stringify(updates.nodes)); }
            if (updates.edges !== undefined) { setClauses.push(`edges = $${idx++}`); values.push(JSON.stringify(updates.edges)); }
            if (updates.variables !== undefined) { setClauses.push(`variables = $${idx++}`); values.push(JSON.stringify(updates.variables)); }
            if (updates.active !== undefined) { setClauses.push(`active = $${idx++}`); values.push(updates.active); }

            if (setClauses.length === 0) return reply.status(400).send({ error: 'No fields to update' });

            values.push(flowId);
            const result = await pool.query(
                `UPDATE chatbot_flows SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
                values
            );
            if (result.rows.length === 0) return reply.status(404).send({ error: 'Flow not found' });
            return reply.send({ flow: result.rows[0] });
        } catch (error: any) {
            console.error('Error updating chatbot flow:', error);
            return reply.status(400).send({ error: error.message });
        }
    });

    // DELETE /api/chatbot-flows/:flowId — Delete flow
    app.delete('/:flowId', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { flowId } = z.object({ flowId: z.string().uuid() }).parse(req.params);
            const result = await pool.query(`DELETE FROM chatbot_flows WHERE id = $1 RETURNING id`, [flowId]);
            if (result.rows.length === 0) return reply.status(404).send({ error: 'Flow not found' });
            return reply.send({ success: true, message: 'Flow deleted' });
        } catch (error: any) {
            console.error('Error deleting chatbot flow:', error);
            return reply.status(400).send({ error: error.message });
        }
    });

    // POST /api/chatbot-flows/:flowId/activate — Activate/deactivate flow
    app.post('/:flowId/activate', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { flowId } = z.object({ flowId: z.string().uuid() }).parse(req.params);
            const { active } = z.object({ active: z.boolean() }).parse(req.body);

            const result = await pool.query(
                `UPDATE chatbot_flows SET active = $1 WHERE id = $2 RETURNING *`,
                [active, flowId]
            );
            if (result.rows.length === 0) return reply.status(404).send({ error: 'Flow not found' });
            return reply.send({ flow: result.rows[0] });
        } catch (error: any) {
            console.error('Error toggling chatbot flow:', error);
            return reply.status(400).send({ error: error.message });
        }
    });
}
