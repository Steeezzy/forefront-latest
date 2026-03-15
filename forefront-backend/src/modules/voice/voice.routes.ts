import type { FastifyInstance } from 'fastify';
import { pool } from '../../config/db.js';

export default async function voiceRoutes(app: FastifyInstance) {
    app.get('/', async (request, reply) => {
        try {
            const { orgId } = request.query as { orgId: string };
            const result = await pool.query(
                'SELECT * FROM voice_agents WHERE workspace_id = $1 ORDER BY created_at DESC',
                [orgId]
            );
            return result.rows;
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    app.post('/', async (request, reply) => {
        try {
            const { orgId, name, language, voice, systemPrompt, firstMessage } = request.body as any;
            const result = await pool.query(
                `INSERT INTO voice_agents (workspace_id, name, language, voice, system_prompt, first_message)
                 VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
                [orgId, name, language, voice, systemPrompt, firstMessage]
            );
            return result.rows[0];
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    app.put('/:id', async (request, reply) => {
        try {
            const { name, language, voice, systemPrompt, firstMessage, status } = request.body as any;
            const { id } = request.params as { id: string };
            const result = await pool.query(
                `UPDATE voice_agents SET name=$1, language=$2, voice=$3,
                 system_prompt=$4, first_message=$5, status=$6, updated_at=NOW()
                 WHERE id=$7 RETURNING *`,
                [name, language, voice, systemPrompt, firstMessage, status, id]
            );
            return result.rows[0];
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    app.delete('/:id', async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            await pool.query('DELETE FROM voice_agents WHERE id = $1', [id]);
            return { success: true };
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });
}
