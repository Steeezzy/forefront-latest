import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { pool } from '../../config/db.js';
import { authenticate } from '../auth/auth.middleware.js';

export async function actionRoutes(app: FastifyInstance) {

    // GET /api/actions?agentId=...
    app.get('/', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const querySchema = z.object({
                agentId: z.string().uuid()
            });
            const { agentId } = querySchema.parse(req.query);

            const result = await pool.query(
                `SELECT id, name, instructions, is_active, updated_at 
                 FROM conversa_actions 
                 WHERE agent_id = $1 
                 ORDER BY created_at DESC`,
                [agentId]
            );

            return reply.send({ actions: result.rows });
        } catch (error: any) {
            console.error('Error fetching actions:', error);
            return reply.status(400).send({ error: error.message });
        }
    });

    // POST /api/actions
    app.post('/', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const bodySchema = z.object({
                agentId: z.string().uuid(),
                name: z.string().min(1, 'Name is required'),
                instructions: z.string().optional(),
                askConfirmation: z.boolean().default(true)
            });
            const { agentId, name, instructions, askConfirmation } = bodySchema.parse(req.body);

            const result = await pool.query(
                `INSERT INTO conversa_actions (agent_id, name, instructions, ask_confirmation) 
                 VALUES ($1, $2, $3, $4) 
                 RETURNING *`,
                [agentId, name, instructions || null, askConfirmation]
            );

            return reply.status(201).send({ action: result.rows[0] });
        } catch (error: any) {
            console.error('Error creating action:', error);
            return reply.status(400).send({ error: error.message });
        }
    });

    // GET /api/actions/:id
    app.get('/:id', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const paramSchema = z.object({ id: z.string().uuid() });
            const { id } = paramSchema.parse(req.params);

            const result = await pool.query(`SELECT * FROM conversa_actions WHERE id = $1`, [id]);

            if (result.rows.length === 0) {
                return reply.status(404).send({ error: 'Action not found' });
            }

            return reply.send({ action: result.rows[0] });
        } catch (error: any) {
            console.error('Error fetching action details:', error);
            return reply.status(400).send({ error: error.message });
        }
    });

    // PUT /api/actions/:id
    app.put('/:id', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const paramSchema = z.object({ id: z.string().uuid() });
            const { id } = paramSchema.parse(req.params);

            const bodySchema = z.object({
                name: z.string().min(1, 'Name is required').optional(),
                instructions: z.string().optional(),
                nodes: z.array(z.any()).optional(),
                edges: z.array(z.any()).optional(),
                output_variables: z.array(z.any()).optional(),
                ask_confirmation: z.boolean().optional(),
                is_active: z.boolean().optional()
            });
            const updates = bodySchema.parse(req.body);

            // Dynamically build the UPDATE query based on provided fields
            const setClauses: string[] = [];
            const values: any[] = [];
            let paramIndex = 1;

            if (updates.name !== undefined) {
                setClauses.push(`name = $${paramIndex++}`);
                values.push(updates.name);
            }
            if (updates.instructions !== undefined) {
                setClauses.push(`instructions = $${paramIndex++}`);
                values.push(updates.instructions);
            }
            if (updates.nodes !== undefined) {
                setClauses.push(`nodes = $${paramIndex++}`);
                values.push(JSON.stringify(updates.nodes));
            }
            if (updates.edges !== undefined) {
                setClauses.push(`edges = $${paramIndex++}`);
                values.push(JSON.stringify(updates.edges));
            }
            if (updates.output_variables !== undefined) {
                setClauses.push(`output_variables = $${paramIndex++}`);
                values.push(JSON.stringify(updates.output_variables));
            }
            if (updates.ask_confirmation !== undefined) {
                setClauses.push(`ask_confirmation = $${paramIndex++}`);
                values.push(updates.ask_confirmation);
            }
            if (updates.is_active !== undefined) {
                setClauses.push(`is_active = $${paramIndex++}`);
                values.push(updates.is_active);
            }

            if (setClauses.length === 0) {
                return reply.status(400).send({ error: 'No fields to update' });
            }

            values.push(id); // ID is the last parameter for WHERE clause
            const query = `UPDATE conversa_actions SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

            const result = await pool.query(query, values);

            if (result.rows.length === 0) {
                return reply.status(404).send({ error: 'Action not found' });
            }

            return reply.send({ action: result.rows[0] });
        } catch (error: any) {
            console.error('Error updating action:', error);
            return reply.status(400).send({ error: error.message });
        }
    });

    // DELETE /api/actions/:id
    app.delete('/:id', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const paramSchema = z.object({ id: z.string().uuid() });
            const { id } = paramSchema.parse(req.params);

            const result = await pool.query(`DELETE FROM conversa_actions WHERE id = $1 RETURNING id`, [id]);

            if (result.rows.length === 0) {
                return reply.status(404).send({ error: 'Action not found' });
            }

            return reply.send({ success: true, message: 'Action deleted' });
        } catch (error: any) {
            console.error('Error deleting action:', error);
            return reply.status(400).send({ error: error.message });
        }
    });
}
