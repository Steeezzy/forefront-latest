import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { pool } from '../../config/db.js';
import { MultiAgentOrchestrator } from './orchestrator.service.js';
import { WorkspacePlanService } from '../billing/services/WorkspacePlanService.js';
import { defaultVoiceFarewell, shouldEndVoiceCallFromUserInput } from '../voice/call-termination.js';
import { orchestratorQueue } from '../../queues/execution-queues.js';
import { markExecutionEventProcessed } from '../../services/execution-events.service.js';

/**
 * Orchestrator API Routes
 * 
 * Main entry points for multi-agent conversation handling.
 * POST /chat — text-based chat
 * POST /voice — voice call handler (Twilio webhook)
 * GET /session/:id — get session details
 * GET /sessions — list all sessions
 */

const orchestrator = new MultiAgentOrchestrator();
const workspacePlanService = new WorkspacePlanService();
const coreExecuteSchema = z.object({
    workspace_id: z.string().uuid(),
    message: z.string().min(2),
    channel: z.enum(['voice', 'chat', 'whatsapp']).optional(),
    customer_id: z.string().uuid().optional(),
    customer_phone: z.string().min(3).optional(),
    customer_name: z.string().min(1).optional(),
    context: z.record(z.string(), z.any()).optional(),
    ai_output: z.object({
        intent: z.string(),
        entities: z.record(z.string(), z.any()).optional(),
    }).optional(),
});

export default async function orchestratorRoutes(app: FastifyInstance) {

    // Workspace-core orchestrator path (data -> AI intent -> actions -> events)
    app.post('/core/execute', async (request, reply) => {
        let executionEventId: string | null = null;

        try {
            const body = coreExecuteSchema.parse(request.body || {});

            executionEventId = randomUUID();

            await pool.query(
                `INSERT INTO execution_events (
                    id,
                    workspace_id,
                    customer_id,
                    event_type,
                    event_source,
                    status,
                    payload
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    executionEventId,
                    body.workspace_id,
                    body.customer_id || null,
                    'orchestrator.turn.queued',
                    'api',
                    'pending',
                    JSON.stringify({
                        channel: body.channel || 'chat',
                        message: body.message,
                        customer_phone: body.customer_phone || null,
                        customer_name: body.customer_name || null,
                        has_ai_output: Boolean(body.ai_output),
                    }),
                ]
            );

            const input = {
                ...body,
                channel: body.channel || 'chat',
                ai_output: body.ai_output
                    ? {
                        intent: body.ai_output.intent,
                        entities: body.ai_output.entities || {},
                    }
                    : undefined,
            };

            const queuedJob = await orchestratorQueue.add('execute', {
                jobType: 'orchestrator_core',
                workspaceId: body.workspace_id,
                input,
                executionEventId,
            }, {
                jobId: `orchestrator-${executionEventId}`,
            });

            return reply.send({
                status: 'queued',
                jobId: queuedJob.id,
            });
        } catch (error: any) {
            if (executionEventId) {
                await markExecutionEventProcessed(
                    pool,
                    executionEventId,
                    'failed',
                    error?.message || 'orchestrator_enqueue_failed'
                );
            }

            if (error instanceof z.ZodError) {
                return reply.code(400).send({ success: false, error: error.message });
            }

            request.log.error({ err: error }, 'Failed to enqueue orchestrator core execution job');
            return reply.code(500).send({ success: false, error: error?.message || 'Internal server error' });
        }
    });

    // Browser-friendly health/info endpoint for /chat
    app.get('/chat', async (_request, reply) => {
        return reply.send({
            success: true,
            message: 'Orchestrator chat endpoint is available. Use POST to run a workflow turn.',
            method: 'POST',
            path: '/api/orchestrator/chat',
            requiredFields: ['message', 'workspaceId'],
            optionalFields: ['sessionId', 'channel', 'customerId', 'customerPhone', 'agentId'],
        });
    });

    // Main chat endpoint — receives messages and routes to agents
    app.post('/chat', async (request, reply) => {
        try {
            const { message, sessionId, channel, customerId, customerPhone, agentId, workspaceId } = request.body as any;

            if (!message || !workspaceId) {
                return reply.status(400).send({ error: 'message and workspaceId are required' });
            }

            const result = await orchestrator.handle({
                message,
                sessionId,
                channel: channel || 'chat',
                customerId,
                customerPhone,
                agentId: agentId || 'default',
                workspaceId
            });

            return {
                success: true,
                data: result
            };
        } catch (e: any) {
            console.error('Orchestrator chat error:', e);
            reply.status(500).send({ error: e.message });
        }
    });

    // Voice call handler — Twilio webhook endpoint
	    app.post('/voice', async (request, reply) => {
	        try {
            const body = request.body as any;
            const query = request.query as any;
            
            // Twilio sends: CallSid, From, To, SpeechResult (STT), Digits
            const callSid = body.CallSid;
            const from = body.From;
            const speechResult = body.SpeechResult || body.Digits || '';
	            const workspaceId = body.workspaceId || query.workspaceId || 'default';
	            const agentId = body.agentId || query.agentId || 'default';
	            const voiceAction = `/api/orchestrator/voice?workspaceId=${encodeURIComponent(workspaceId)}&agentId=${encodeURIComponent(agentId)}`;

                if (workspaceId !== 'default') {
                    const resolvedPlan = await workspacePlanService.getWorkspacePlan(workspaceId);
                    const usage = await workspacePlanService.getWorkspaceUsageSnapshot(workspaceId, resolvedPlan.currentPeriodStart);
                    const voiceMinuteLimit = resolvedPlan.meters.voice_minutes ?? null;

                    if (voiceMinuteLimit !== null && usage.voice_minutes >= voiceMinuteLimit) {
                        const limitReachedTwiml = `<?xml version="1.0" encoding="UTF-8"?>
                        <Response>
                            <Say>Your workspace has reached its current voice usage limit. Please upgrade the voice add-on or add more credits.</Say>
                            <Hangup/>
                        </Response>`;
                        reply.type('text/xml');
                        return limitReachedTwiml;
                    }
                }

	            if (!speechResult) {
                let greeting = 'Hello! Thank you for calling. How can I help you today?';

                if (/^[0-9a-f-]{36}$/i.test(agentId)) {
                    const agentResult = await pool.query(
                        'SELECT first_message FROM voice_agents WHERE id = $1 LIMIT 1',
                        [agentId]
                    );
                    const storedGreeting = agentResult.rows[0]?.first_message;
                    if (storedGreeting) {
                        greeting = storedGreeting;
                    }
                }

                // Initial call — send greeting TwiML
                const twiml = `<?xml version="1.0" encoding="UTF-8"?>
                <Response>
                    <Say voice="Polly.Aditi">${escapeXml(greeting)}</Say>
                    <Gather input="speech" action="${voiceAction}" method="POST" speechTimeout="auto" language="en-IN">
                        <Say voice="Polly.Aditi">I'm listening.</Say>
                    </Gather>
                </Response>`;
                
                reply.type('text/xml');
                return twiml;
            }

            // If user clearly indicates the conversation is over, end call immediately.
            if (shouldEndVoiceCallFromUserInput(speechResult)) {
                const endByUserTwiml = `<?xml version="1.0" encoding="UTF-8"?>
                <Response>
                    <Say voice="Polly.Aditi">${escapeXml(defaultVoiceFarewell())}</Say>
                    <Hangup/>
                </Response>`;
                reply.type('text/xml');
                return endByUserTwiml;
            }

            // Process speech through orchestrator
            const result = await orchestrator.handle({
                message: speechResult,
                sessionId: callSid,
                channel: 'voice',
                customerPhone: from,
                agentId,
                workspaceId
            });

            const actions = result.metadata?.actions || [];
            const shouldEndCall = actions.includes('end_call') || result.intent === 'end_call';

            if (shouldEndCall) {
                const endTwiml = `<?xml version="1.0" encoding="UTF-8"?>
                <Response>
                    <Say voice="Polly.Aditi">${escapeXml(result.reply)}</Say>
                    <Hangup/>
                </Response>`;
                reply.type('text/xml');
                return endTwiml;
            }

            // Convert response to TwiML
            const twiml = `<?xml version="1.0" encoding="UTF-8"?>
            <Response>
                <Say voice="Polly.Aditi">${escapeXml(result.reply)}</Say>
                <Gather input="speech" action="${voiceAction}" method="POST" speechTimeout="auto" language="en-IN">
                    <Say voice="Polly.Aditi">Is there anything else I can help you with?</Say>
                </Gather>
            </Response>`;

            reply.type('text/xml');
            return twiml;
        } catch (e: any) {
            console.error('Orchestrator voice error:', e);
            const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
            <Response>
                <Say>I apologize, I'm experiencing technical difficulties. Please try again later.</Say>
                <Hangup/>
            </Response>`;
            reply.type('text/xml');
            return errorTwiml;
        }
    });

    // Get session details with full transcript
    app.get('/session/:id', async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            
            const sessionResult = await pool.query(
                'SELECT * FROM conversation_sessions WHERE id = $1',
                [id]
            );

            if (sessionResult.rows.length === 0) {
                return reply.status(404).send({ error: 'Session not found' });
            }

            // Get routing log for this session
            const routingResult = await pool.query(
                'SELECT * FROM agent_routing_log WHERE session_id = $1 ORDER BY timestamp ASC',
                [id]
            );

            return {
                success: true,
                data: {
                    ...sessionResult.rows[0],
                    routing_log: routingResult.rows
                }
            };
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    // List all sessions for a workspace
    app.get('/sessions', async (request, reply) => {
        try {
            const { workspaceId, limit, offset, channel } = request.query as any;

            let query = 'SELECT * FROM conversation_sessions WHERE workspace_id = $1';
            const params: any[] = [workspaceId];
            let paramIndex = 2;

            if (channel) {
                query += ` AND channel = $${paramIndex}`;
                params.push(channel);
                paramIndex++;
            }

            query += ' ORDER BY started_at DESC';
            query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(parseInt(limit) || 50, parseInt(offset) || 0);

            const result = await pool.query(query, params);

            // Get total count
            const countResult = await pool.query(
                'SELECT COUNT(*) FROM conversation_sessions WHERE workspace_id = $1',
                [workspaceId]
            );

            return {
                success: true,
                data: result.rows,
                meta: {
                    total: parseInt(countResult.rows[0].count),
                    limit: parseInt(limit) || 50,
                    offset: parseInt(offset) || 0
                }
            };
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    // End a session manually
    app.post('/session/:id/end', async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const { outcome } = request.body as any;

            await orchestrator.endSession(id, outcome || 'completed');
            return { success: true };
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });
}

// Helper: escape XML special characters for TwiML
function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
