import type { FastifyInstance } from 'fastify';
import { pool } from '../../config/db.js';
import { provisionAutomationBlueprint } from '../automation/template-automation.service.js';
import { provisionStarterAvailability } from '../bookings/booking-provision.service.js';
import { WorkspacePlanService } from '../billing/services/WorkspacePlanService.js';

export default async function voiceRoutes(app: FastifyInstance) {
    const workspacePlanService = new WorkspacePlanService();

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
            const {
                orgId,
                name,
                language,
                secondaryLanguage,
                voice,
                systemPrompt,
                firstMessage,
                type,
                callDirection,
                templateId,
                templateMeta,
                serviceConfig,
	                automationBlueprint,
	            } = request.body as any;

                const resolvedPlan = await workspacePlanService.getWorkspacePlan(orgId);
                const voiceAgentLimit = resolvedPlan.meters.voice_agents ?? null;

                if (voiceAgentLimit !== null) {
                    const existingAgents = await pool.query(
                        'SELECT COUNT(*) AS total FROM voice_agents WHERE workspace_id = $1',
                        [orgId]
                    );
                    const currentCount = Number(existingAgents.rows[0]?.total || 0);
                    if (currentCount >= voiceAgentLimit) {
                        return reply.status(402).send({
                            error: `Voice agent limit reached for this workspace plan. Allowed: ${voiceAgentLimit}.`,
                        });
                    }
                }

	            const result = await pool.query(
                `INSERT INTO voice_agents (
                    workspace_id, name, language, secondary_language, voice, system_prompt, first_message,
                    agent_type, call_direction, template_id, template_meta, service_config, automation_blueprint
                 )
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
                [
                    orgId,
                    name,
                    language,
                    secondaryLanguage || null,
                    voice,
                    systemPrompt,
                    firstMessage,
                    type || 'single',
                    callDirection || 'outbound',
                    templateId || null,
                    JSON.stringify(templateMeta || {}),
                    JSON.stringify(serviceConfig || []),
                    JSON.stringify(automationBlueprint || []),
                ]
            );

            await provisionAutomationBlueprint({
                workspaceId: orgId,
                agentId: result.rows[0].id,
                rules: automationBlueprint || [],
            });

            if (Array.isArray(serviceConfig) && serviceConfig.some((service: any) => service?.id === 'booking')) {
                await provisionStarterAvailability({
                    workspaceId: orgId,
                    agentId: result.rows[0].id,
                });
            }

            return result.rows[0];
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    app.put('/:id', async (request, reply) => {
        try {
            const {
                name,
                language,
                secondaryLanguage,
                voice,
                systemPrompt,
                firstMessage,
                status,
                type,
                callDirection,
                templateId,
                templateMeta,
                serviceConfig,
                automationBlueprint,
            } = request.body as any;
            const { id } = request.params as { id: string };
            const result = await pool.query(
                `UPDATE voice_agents SET
                    name=$1,
                    language=$2,
                    secondary_language=$3,
                    voice=$4,
                    system_prompt=$5,
                    first_message=$6,
                    status=$7,
                    agent_type=$8,
                    call_direction=$9,
                    template_id=$10,
                    template_meta=$11,
                    service_config=$12,
                    automation_blueprint=$13,
                    updated_at=NOW()
                 WHERE id=$14 RETURNING *`,
                [
                    name,
                    language,
                    secondaryLanguage || null,
                    voice,
                    systemPrompt,
                    firstMessage,
                    status,
                    type || 'single',
                    callDirection || 'outbound',
                    templateId || null,
                    JSON.stringify(templateMeta || {}),
                    JSON.stringify(serviceConfig || []),
                    JSON.stringify(automationBlueprint || []),
                    id,
                ]
            );

            if (Array.isArray(serviceConfig) && serviceConfig.some((service: any) => service?.id === 'booking')) {
                await provisionStarterAvailability({
                    workspaceId: result.rows[0].workspace_id,
                    agentId: result.rows[0].id,
                });
            }
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
