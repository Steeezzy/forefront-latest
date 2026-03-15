import type { FastifyInstance } from 'fastify';
import { pool } from '../../config/db.js';

export default async function numbersRoutes(app: FastifyInstance) {
    app.get('/', async (request, reply) => {
        try {
            const { orgId } = request.query as { orgId: string };
            const result = await pool.query(
                `SELECT n.*, va.name as agent_name
                 FROM phone_numbers n
                 LEFT JOIN voice_agents va ON va.id = n.assigned_agent_id
                 WHERE n.workspace_id = $1`,
                [orgId]
            );
            return result.rows;
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    app.post('/provision', async (request, reply) => {
        try {
            const { orgId, countryCode, type } = request.body as any;
            const number = '+91' + Math.floor(Math.random() * 9000000000 + 1000000000);
            const result = await pool.query(
                `INSERT INTO phone_numbers (workspace_id, number, country_code, type)
                 VALUES ($1,$2,$3,$4) RETURNING *`,
                [orgId, number, countryCode, type]
            );
            return result.rows[0];
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    app.put('/:id/assign', async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const { agentId } = request.body as any;
            const result = await pool.query(
                'UPDATE phone_numbers SET assigned_agent_id=$1 WHERE id=$2 RETURNING *',
                [agentId, id]
            );
            return result.rows[0];
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });
}
