import type { FastifyInstance } from 'fastify';
import { pool } from '../../config/db.js';

export default async function campaignsRoutes(app: FastifyInstance) {
    app.get('/', async (request, reply) => {
        try {
            const { orgId } = request.query as { orgId: string };
            const result = await pool.query(
                `SELECT c.*, va.name as agent_name, va.service_config as agent_service_config, va.template_id as agent_template_id
                 FROM campaigns c
                 LEFT JOIN voice_agents va ON va.id = c.voice_agent_id
                 WHERE c.workspace_id = $1
                 ORDER BY c.created_at DESC`,
                [orgId]
            );
            return result.rows;
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    app.post('/', async (request, reply) => {
        try {
            const { orgId, name, voiceAgentId, type, scheduledAt, contactFieldMapping, serviceConfig, launchConfig } = request.body as any;
            const result = await pool.query(
                `INSERT INTO campaigns (workspace_id, name, voice_agent_id, type, scheduled_at, contact_field_mapping, service_config, launch_config)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
                [
                    orgId,
                    name,
                    voiceAgentId,
                    type,
                    scheduledAt,
                    JSON.stringify(contactFieldMapping || {}),
                    JSON.stringify(serviceConfig || []),
                    JSON.stringify(launchConfig || {}),
                ]
            );
            return result.rows[0];
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    app.post('/:id/contacts', async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const { contacts } = request.body as any;
            for (const c of contacts) {
                await pool.query(
                    `INSERT INTO campaign_contacts (campaign_id, phone, name, email, external_id, metadata)
                     VALUES ($1,$2,$3,$4,$5,$6)`,
                    [
                        id,
                        c.phone,
                        c.name || null,
                        c.email || null,
                        c.externalId || null,
                        JSON.stringify(c.metadata || {}),
                    ]
                );
            }
            await pool.query(
                'UPDATE campaigns SET total_contacts = $1 WHERE id = $2',
                [contacts.length, id]
            );
            return { success: true };
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    app.post('/:id/launch', async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            await pool.query(
                "UPDATE campaigns SET status='running' WHERE id=$1",
                [id]
            );
            return { success: true };
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });
}
