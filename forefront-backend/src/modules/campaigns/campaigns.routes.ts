import type { FastifyInstance } from 'fastify';
import { pool } from '../../config/db.js';

async function getTableColumns(tableName: string) {
    const result = await pool.query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1`,
        [tableName]
    );

    return new Set(result.rows.map((row: { column_name: string }) => row.column_name));
}

export default async function campaignsRoutes(app: FastifyInstance) {
    app.get('', async (request, reply) => {
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

    app.post('', async (request, reply) => {
        try {
            const { orgId, name, voiceAgentId, type, scheduledAt, contactFieldMapping, serviceConfig, launchConfig } = request.body as any;
            const campaignColumns = await getTableColumns('campaigns');
            const voiceAgentResult = await pool.query(
                `SELECT id, first_message, service_config
                 FROM voice_agents
                 WHERE id = $1 AND workspace_id = $2
                 LIMIT 1`,
                [voiceAgentId, orgId]
            );

            if (voiceAgentResult.rows.length === 0) {
                return reply.status(400).send({ error: 'Selected voice agent was not found for this workspace' });
            }

            const voiceAgent = voiceAgentResult.rows[0];
            const messageTemplate =
                voiceAgent.first_message ||
                'Hello {{name}}, this is a quick follow-up call from our business.';

            const insertColumns = ['workspace_id', 'name', 'voice_agent_id', 'type', 'scheduled_at'];
            const insertValues: any[] = [orgId, name, voiceAgentId, type, scheduledAt];

            if (campaignColumns.has('contact_field_mapping')) {
                insertColumns.push('contact_field_mapping');
                insertValues.push(JSON.stringify(contactFieldMapping || {}));
            }

            if (campaignColumns.has('service_config')) {
                insertColumns.push('service_config');
                insertValues.push(JSON.stringify(serviceConfig || voiceAgent.service_config || []));
            }

            if (campaignColumns.has('launch_config')) {
                insertColumns.push('launch_config');
                insertValues.push(JSON.stringify(launchConfig || {}));
            }

            if (campaignColumns.has('channel')) {
                insertColumns.push('channel');
                insertValues.push('call');
            }

            if (campaignColumns.has('message_template')) {
                insertColumns.push('message_template');
                insertValues.push(messageTemplate);
            }

            const placeholders = insertColumns.map((_, index) => `$${index + 1}`).join(', ');

            const result = await pool.query(
                `INSERT INTO campaigns (
                    ${insertColumns.join(', ')}
                 )
                 VALUES (${placeholders}) RETURNING *`,
                insertValues
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
            const contactColumns = await getTableColumns('campaign_contacts');

            for (const c of contacts) {
                const insertColumns = ['campaign_id', 'phone', 'name'];
                const insertValues: any[] = [id, c.phone, c.name || null];

                if (contactColumns.has('email')) {
                    insertColumns.push('email');
                    insertValues.push(c.email || null);
                }

                if (contactColumns.has('external_id')) {
                    insertColumns.push('external_id');
                    insertValues.push(c.externalId || null);
                }

                if (contactColumns.has('metadata')) {
                    insertColumns.push('metadata');
                    insertValues.push(JSON.stringify(c.metadata || {}));
                }

                if (contactColumns.has('personalization_data')) {
                    insertColumns.push('personalization_data');
                    insertValues.push(JSON.stringify(c.metadata || {}));
                }

                const placeholders = insertColumns.map((_, index) => `$${index + 1}`).join(', ');

                await pool.query(
                    `INSERT INTO campaign_contacts (${insertColumns.join(', ')})
                     VALUES (${placeholders})`,
                    insertValues
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
            const campaignColumns = await getTableColumns('campaigns');

            if (campaignColumns.has('started_at')) {
                await pool.query(
                    "UPDATE campaigns SET status='running', started_at = COALESCE(started_at, NOW()) WHERE id=$1",
                    [id]
                );
            } else {
                await pool.query(
                    "UPDATE campaigns SET status='running' WHERE id=$1",
                    [id]
                );
            }

            return { success: true };
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });
}
