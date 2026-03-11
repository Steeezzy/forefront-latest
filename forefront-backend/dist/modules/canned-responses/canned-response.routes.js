import { query } from '../../config/db.js';
import { authenticate } from '../auth/auth.middleware.js';
import { z } from 'zod';
const createCannedResponseSchema = z.object({
    shortcut: z.string().min(1),
    title: z.string().min(1),
    content: z.string().min(1),
    category: z.string().optional(),
});
const updateCannedResponseSchema = z.object({
    shortcut: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
    category: z.string().optional(),
    isActive: z.boolean().optional(),
});
export async function cannedResponseRoutes(fastify) {
    // All routes require authentication
    fastify.addHook('onRequest', authenticate);
    // List canned responses
    fastify.get('/', async (request, reply) => {
        try {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }
            const queryParams = request.query;
            const category = queryParams.category;
            let sql = 'SELECT * FROM canned_responses WHERE workspace_id = $1 AND is_active = true';
            const params = [workspaceId];
            if (category) {
                sql += ' AND category = $2';
                params.push(category);
            }
            sql += ' ORDER BY use_count DESC, created_at DESC';
            const result = await query(sql, params);
            return reply.send({
                success: true,
                data: result.rows,
            });
        }
        catch (error) {
            return reply.code(400).send({
                success: false,
                error: error.message,
            });
        }
    });
    // Create canned response
    fastify.post('/', async (request, reply) => {
        try {
            const workspaceId = request.user?.workspaceId;
            const userId = request.user?.userId;
            if (!workspaceId || !userId) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }
            const data = createCannedResponseSchema.parse(request.body);
            const result = await query(`INSERT INTO canned_responses 
         (workspace_id, shortcut, title, content, category, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`, [workspaceId, data.shortcut, data.title, data.content, data.category || null, userId]);
            return reply.send({
                success: true,
                data: result.rows[0],
            });
        }
        catch (error) {
            return reply.code(400).send({
                success: false,
                error: error.message,
            });
        }
    });
    // Update canned response
    fastify.patch('/:id', async (request, reply) => {
        try {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }
            const data = updateCannedResponseSchema.parse(request.body);
            const updates = [];
            const values = [];
            let paramIndex = 1;
            if (data.shortcut !== undefined) {
                updates.push(`shortcut = $${paramIndex}`);
                values.push(data.shortcut);
                paramIndex++;
            }
            if (data.title !== undefined) {
                updates.push(`title = $${paramIndex}`);
                values.push(data.title);
                paramIndex++;
            }
            if (data.content !== undefined) {
                updates.push(`content = $${paramIndex}`);
                values.push(data.content);
                paramIndex++;
            }
            if (data.category !== undefined) {
                updates.push(`category = $${paramIndex}`);
                values.push(data.category);
                paramIndex++;
            }
            if (data.isActive !== undefined) {
                updates.push(`is_active = $${paramIndex}`);
                values.push(data.isActive);
                paramIndex++;
            }
            updates.push(`updated_at = CURRENT_TIMESTAMP`);
            values.push(request.params.id);
            values.push(workspaceId);
            const result = await query(`UPDATE canned_responses SET ${updates.join(', ')} WHERE id = $${paramIndex} AND workspace_id = $${paramIndex + 1} RETURNING *`, values);
            if (result.rows.length === 0) {
                return reply.code(404).send({ error: 'Canned response not found' });
            }
            return reply.send({
                success: true,
                data: result.rows[0],
            });
        }
        catch (error) {
            return reply.code(400).send({
                success: false,
                error: error.message,
            });
        }
    });
    // Delete canned response
    fastify.delete('/:id', async (request, reply) => {
        try {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }
            const result = await query('DELETE FROM canned_responses WHERE id = $1 AND workspace_id = $2 RETURNING *', [request.params.id, workspaceId]);
            if (result.rows.length === 0) {
                return reply.code(404).send({ error: 'Canned response not found' });
            }
            return reply.send({
                success: true,
                message: 'Canned response deleted',
            });
        }
        catch (error) {
            return reply.code(400).send({
                success: false,
                error: error.message,
            });
        }
    });
    // Use canned response (increment use count)
    fastify.post('/:id/use', async (request, reply) => {
        try {
            const workspaceId = request.user?.workspaceId;
            if (!workspaceId) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }
            await query('UPDATE canned_responses SET use_count = use_count + 1 WHERE id = $1 AND workspace_id = $2', [request.params.id, workspaceId]);
            return reply.send({
                success: true,
                message: 'Use count incremented',
            });
        }
        catch (error) {
            return reply.code(400).send({
                success: false,
                error: error.message,
            });
        }
    });
}
//# sourceMappingURL=canned-response.routes.js.map