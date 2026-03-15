import type { FastifyInstance } from 'fastify';
import { pool } from '../../config/db.js';

export default async function workspaceRoutes(app: FastifyInstance) {
    app.get('/members', async (request, reply) => {
        try {
            const { orgId } = request.query as { orgId: string };
            const result = await pool.query(
                `SELECT wm.*, u.email, u.name as user_name
                 FROM workspace_members wm
                 JOIN users u ON u.id = wm.user_id
                 WHERE wm.workspace_id = $1`,
                [orgId]
            );
            return result.rows;
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    app.post('/invite', async (request, reply) => {
        try {
            const { orgId, email, role, invitedBy } = request.body as any;
            const userResult = await pool.query(
                'SELECT id FROM users WHERE email=$1', [email]
            );
            if (!userResult.rows.length) {
                return reply.status(404).send({ error: 'User not found' });
            }
            const result = await pool.query(
                `INSERT INTO workspace_members (workspace_id, user_id, role, invited_by)
                 VALUES ($1,$2,$3,$4) RETURNING *`,
                [orgId, userResult.rows[0].id, role, invitedBy]
            );
            return result.rows[0];
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    app.delete('/members/:id', async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            await pool.query('DELETE FROM workspace_members WHERE id=$1', [id]);
            return { success: true };
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });
}
