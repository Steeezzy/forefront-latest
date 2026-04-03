import { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { twilioService } from '../services/twilio.service.js';
import { claudeService } from '../services/claude.service.js';
import { sarvamClient } from '../services/SarvamClient.js';
import { pool } from '../config/db.js';
import { ivrService } from '../services/ivr.service.js';

// In-memory session store for simplistic conversation handling
const activeSessions = new Map<string, any>();
const callSessionLookup = new Map<string, { workspaceId: string; caller: string; language: string }>();
const UUID_REGEX = /^[0-9a-f-]{36}$/i;

function withCallRecording(twiml: string): string {
    const recordingStatusCallback = `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/webhooks/twilio/voice/recording-status`;

    if (twiml.includes('<Recording ')) {
        return twiml;
    }

    return twiml.replace(
        '<Response>',
        `<Response><Start><Recording recordingStatusCallback="${recordingStatusCallback}" recordingStatusCallbackMethod="POST" /></Start>`
    );
}

function isUuid(value?: string | null): value is string {
    return !!value && UUID_REGEX.test(value);
}

function parseJsonObject(value: any): Record<string, any> {
    if (!value) return {};
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch {
            return {};
        }
    }
    if (typeof value === 'object') {
        return value;
    }
    return {};
}

function interpolateTemplate(template: string, data: Record<string, any>) {
    return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, key: string) => {
        const value = data[key];
        return value === undefined || value === null ? '' : String(value);
    }).trim();
}

async function upsertCampaignCustomer(workspaceId: string, contact: any, personalizationData: Record<string, any>) {
    const company =
        (typeof personalizationData.company === 'string' && personalizationData.company.trim()) ||
        null;

    const metadata = {
        ...personalizationData,
        external_id: contact.external_id || null,
        source: 'campaign_voice',
    };

    const result = await pool.query(
        `INSERT INTO customers (
            workspace_id,
            phone,
            email,
            name,
            company,
            metadata,
            last_contact_at
         ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (workspace_id, phone)
         DO UPDATE SET
            email = COALESCE(EXCLUDED.email, customers.email),
            name = COALESCE(NULLIF(EXCLUDED.name, ''), customers.name),
            company = COALESCE(NULLIF(EXCLUDED.company, ''), customers.company),
            metadata = COALESCE(customers.metadata, '{}'::jsonb) || EXCLUDED.metadata,
            updated_at = NOW()
         RETURNING *`,
        [
            workspaceId,
            contact.phone || null,
            contact.email || null,
            contact.name || 'Unknown',
            company,
            JSON.stringify(metadata),
        ]
    );

    return result.rows[0] || null;
}

async function persistConversationTranscript(sessionDbId: string | undefined, history: any[]) {
    if (!sessionDbId) {
        return;
    }

    await pool.query(
        'UPDATE conversation_sessions SET transcript = $1 WHERE id = $2',
        [JSON.stringify(history), sessionDbId]
    );
}

function deriveCampaignCustomerSignals(transcript: string, callStatus: string, durationSeconds: number) {
    const lowered = transcript.toLowerCase();
    const tags = new Set<string>(['campaign_voice']);
    let leadScoreDelta = 0;

    if (callStatus === 'completed' && durationSeconds > 10) {
        tags.add('answered_call');
        leadScoreDelta += 5;
    }

    if (callStatus === 'busy') {
        tags.add('busy_line');
    }

    if (callStatus === 'failed') {
        tags.add('failed_call');
    }

    if (/\b(interested|book|appointment|demo|quote|pricing|callback|schedule)\b/.test(lowered)) {
        tags.add('interested');
        leadScoreDelta += 15;
    }

    if (/\b(not interested|stop|unsubscribe|remove me|do not call)\b/.test(lowered)) {
        tags.add('do_not_call_review');
        leadScoreDelta -= 10;
    }

    if (/\b(complaint|issue|problem|refund|cancel)\b/.test(lowered)) {
        tags.add('support_needed');
    }

    const sentimentScore =
        /\b(thank|great|good|yes|interested)\b/.test(lowered)
            ? 0.75
            : /\b(no|not interested|complaint|issue|refund|cancel)\b/.test(lowered)
                ? 0.25
                : 0.5;

    return {
        tags: Array.from(tags),
        leadScoreDelta,
        sentimentScore,
    };
}

export default async function twilioVoiceRoutes(app: FastifyInstance) {
    // Webhook expects URL encoded body (application/x-www-form-urlencoded)
    app.post('/incoming', async (request, reply) => {
        const { From, To, CallSid } = request.body as any;
        
        // 1. Find Workspace by Twilio 'To' Number
        // Usually, in a real system we'd map Twilio numbers to Workspaces in a numbers table.
        // For MVP, attempt to find a workspace with matching `phone`
        const wsRes = await pool.query(`SELECT * FROM workspaces WHERE phone = $1 LIMIT 1`, [To]);
        
        let workspace = null;
        if (wsRes.rows.length > 0) {
            workspace = wsRes.rows[0];
        } else {
            // Fallback generic workspace or error greeting
            return reply.type('text/xml').send(`
                <Response>
                    <Say>This number is not configured.</Say>
                </Response>
            `);
        }

        // 2. Initialize Call Session
        activeSessions.set(CallSid, {
            workspaceId: workspace.id,
            workspaceConfig: workspace,
            history: [],
            caller: From,
            language: workspace.language || 'en-IN',
            ivrRetryCount: 0
        });
        callSessionLookup.set(CallSid, {
            workspaceId: workspace.id,
            caller: From,
            language: workspace.language || 'en-IN'
        });

        const ivrMenu = await ivrService.getMenu(pool, workspace.id);
        if (ivrMenu && ivrMenu.enabled) {
            return reply.type('text/xml').send(withCallRecording(ivrService.generateGatherTwiML(ivrMenu)));
        }

        // 3. Return TwiML with Greeting
        const greeting = workspace.greeting || `Hello, thank you for calling ${workspace.business_name}. How can I help you?`;
        
        const gatherUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/webhooks/twilio/voice/gather`;
        const twiml = twilioService.buildVoiceResponse(greeting, gatherUrl, workspace.language);

        reply.type('text/xml').send(withCallRecording(twiml));
    });

    app.post('/campaign/:campaignId/contact/:contactId', async (request, reply) => {
        const { campaignId, contactId } = request.params as { campaignId: string; contactId: string };
        const { CallSid, To } = request.body as any;

        try {
            const campaignRes = await pool.query(
                `SELECT
                    c.id AS campaign_id,
                    c.name AS campaign_name,
                    c.workspace_id,
                    c.voice_agent_id,
                    c.message_template,
                    c.service_config,
                    w.business_name,
                    w.name AS workspace_name,
                    w.language,
                    w.greeting,
                    w.chatbot_personality,
                    w.voice_agent_name,
                    w.business_hours,
                    w.departments,
                    w.knowledge_entries,
                    va.name AS agent_name,
                    va.first_message AS agent_first_message,
                    va.system_prompt AS agent_system_prompt,
                    va.language AS agent_language
                 FROM campaigns c
                 JOIN workspaces w ON w.id = c.workspace_id
                 LEFT JOIN voice_agents va ON va.id = c.voice_agent_id
                 WHERE c.id = $1
                 LIMIT 1`,
                [campaignId]
            );

            const contactRes = await pool.query(
                `SELECT *
                 FROM campaign_contacts
                 WHERE campaign_id = $1 AND id = $2
                 LIMIT 1`,
                [campaignId, contactId]
            );

            const campaign = campaignRes.rows[0];
            const contact = contactRes.rows[0];

            if (!campaign || !contact) {
                return reply.type('text/xml').send(`
                    <Response>
                        <Say>This campaign contact is not configured.</Say>
                        <Hangup/>
                    </Response>
                `);
            }

            const personalizationData = {
                ...parseJsonObject(contact.metadata),
                ...parseJsonObject(contact.personalization_data),
            };
            const customer = await upsertCampaignCustomer(campaign.workspace_id, contact, personalizationData);
            const sessionDbId = randomUUID();

            const customerContext = {
                name: contact.name || null,
                phone: contact.phone || null,
                email: contact.email || null,
                externalId: contact.external_id || null,
                campaignName: campaign.campaign_name,
                personalizationData,
            };

            await pool.query(
                `INSERT INTO conversation_sessions (
                    id,
                    agent_id,
                    workspace_id,
                    customer_id,
                    customer_phone,
                    channel,
                    metadata
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    sessionDbId,
                    campaign.voice_agent_id || null,
                    campaign.workspace_id,
                    customer?.id || null,
                    contact.phone || null,
                    'voice',
                    JSON.stringify({
                        direction: 'outbound',
                        source: 'campaign',
                        campaignId,
                        campaignContactId: contactId,
                        campaignName: campaign.campaign_name,
                        customerName: contact.name || null,
                        personalizationData,
                        callSid: CallSid,
                    }),
                ]
            );

            const workspaceConfig = {
                business_name: campaign.business_name || campaign.workspace_name || 'the business',
                voice_agent_name: campaign.agent_name || campaign.voice_agent_name || 'Agent',
                chatbot_personality: campaign.chatbot_personality || 'helpful and friendly',
                knowledge_entries: campaign.knowledge_entries || [],
                business_hours: campaign.business_hours || {},
                departments: campaign.departments || [],
                system_prompt: campaign.agent_system_prompt || undefined,
                customer_context: customerContext,
            };

            const greetingTemplate =
                campaign.agent_first_message ||
                campaign.message_template ||
                campaign.greeting ||
                `Hello {{name}}, this is ${workspaceConfig.voice_agent_name} from ${workspaceConfig.business_name}. How can I help you today?`;

            const greeting = interpolateTemplate(greetingTemplate, {
                name: contact.name || 'there',
                phone: contact.phone || '',
                business: workspaceConfig.business_name,
                campaign: campaign.campaign_name,
                ...personalizationData,
            });

            activeSessions.set(CallSid, {
                workspaceId: campaign.workspace_id,
                workspaceConfig,
                history: [],
                caller: contact.phone,
                customerName: contact.name || null,
                language: campaign.agent_language || campaign.language || 'en-IN',
                ivrRetryCount: 0,
                direction: 'outbound',
                agentId: campaign.voice_agent_id,
                campaignId,
                campaignContactId: contactId,
                customerId: customer?.id || null,
                sessionDbId,
                templateUsed: campaign.campaign_name,
            });
            callSessionLookup.set(CallSid, {
                workspaceId: campaign.workspace_id,
                caller: contact.phone,
                language: campaign.agent_language || campaign.language || 'en-IN',
            });

            const gatherUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/webhooks/twilio/voice/gather`;
            const twiml = twilioService.buildVoiceResponse(
                greeting,
                gatherUrl,
                campaign.agent_language || campaign.language || 'en-IN'
            );

            return reply.type('text/xml').send(withCallRecording(twiml));
        } catch (error) {
            console.error('Campaign voice webhook error:', error);
            return reply.type('text/xml').send(`
                <Response>
                    <Say>We are having trouble connecting your call right now.</Say>
                    <Hangup/>
                </Response>
            `);
        }
    });

    app.post('/gather', async (request, reply) => {
        const { SpeechResult, CallSid, Confidence } = request.body as any;
        
        const session = activeSessions.get(CallSid);
        if (!session) {
            return reply.type('text/xml').send(`<Response><Hangup/></Response>`);
        }

        if (!SpeechResult) {
            // User said nothing, reprompt
            const gatherUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/webhooks/twilio/voice/gather`;
            const twiml = twilioService.buildVoiceResponse('I am still here. How can I help?', gatherUrl, session.language);
            return reply.type('text/xml').send(twiml);
        }

        try {
            // 1. Optionally Detect Language
            if (session.history.length === 0) {
                const langResult = await sarvamClient.identifyLanguage(SpeechResult);
                session.language = langResult.language;
            }

            // 2. Generate Claude Response
            const aiResponseText = await claudeService.generateResponse(
                session.workspaceId,
                SpeechResult,
                session.history,
                session.workspaceConfig
            );

            if (isUuid(session.agentId)) {
                const turnNumber = Math.floor(session.history.length / 2) + 1;
                await pool.query(
                    `INSERT INTO voice_call_logs (
                        session_id,
                        agent_id,
                        workspace_id,
                        user_message,
                        ai_message,
                        language,
                        turn_number,
                        metadata
                     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [
                        CallSid,
                        session.agentId,
                        session.workspaceId,
                        SpeechResult,
                        aiResponseText,
                        session.language,
                        turnNumber,
                        JSON.stringify({
                            direction: session.direction || 'inbound',
                            campaignId: session.campaignId || null,
                            campaignContactId: session.campaignContactId || null,
                            customerName: session.customerName || null,
                            customerPhone: session.caller || null,
                        }),
                    ]
                );
            }

            // 3. Append to history
            session.history.push({ role: 'user', content: SpeechResult });
            session.history.push({ role: 'assistant', content: aiResponseText });
            await persistConversationTranscript(session.sessionDbId, session.history);

            if (session.sessionDbId) {
                try {
                    const { AutomationEngine } = await import('../modules/automation/automation.service.js');
                    const automation = new AutomationEngine();
                    await automation.evaluate(session.sessionDbId, {
                        message: SpeechResult,
                        role: 'user',
                        sentimentScore: 0.5,
                    });
                } catch (automationError) {
                    console.error('Campaign call automation evaluation error:', automationError);
                }
            }

            // 4. Return TwiML
            const gatherUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/webhooks/twilio/voice/gather`;
            const twiml = twilioService.buildVoiceResponse(aiResponseText, gatherUrl, session.language);

            reply.type('text/xml').send(twiml);
        } catch (error) {
            console.error('Gather webhook error:', error);
            const gatherUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/webhooks/twilio/voice/gather`;
            reply.type('text/xml').send(twilioService.buildVoiceResponse('Sorry, I encountered an error. Please continue.', gatherUrl, session.language));
        }
    });

    app.post('/ivr', async (request, reply) => {
        const { Digits, CallSid, To } = request.body as any;

        const session = activeSessions.get(CallSid);
        let workspaceId = session?.workspaceId;

        if (!workspaceId && To) {
            const wsRes = await pool.query(`SELECT * FROM workspaces WHERE phone = $1 LIMIT 1`, [To]);
            if (wsRes.rows[0]) {
                workspaceId = wsRes.rows[0].id;
            }
        }

        if (!workspaceId) {
            return reply.type('text/xml').send(`<Response><Hangup/></Response>`);
        }

        const nextRetryCount = Digits ? 0 : (session?.ivrRetryCount || 0) + 1;
        if (session) {
            session.ivrRetryCount = nextRetryCount;
        }

        const twiml = await ivrService.handleDigitPressed(
            pool,
            workspaceId,
            Digits,
            CallSid,
            nextRetryCount
        );

        return reply.type('text/xml').send(twiml);
    });

    app.post('/voicemail', async (request, reply) => {
        return reply.send({ success: true });
    });

    app.post('/recording-status', async (request, reply) => {
        const { RecordingUrl, CallSid, RecordingDuration, RecordingSid } = request.body as any;

        try {
            const session = activeSessions.get(CallSid);
            const lookup = callSessionLookup.get(CallSid);
            const workspaceId = session?.workspaceId || lookup?.workspaceId;

            if (!workspaceId) {
                return reply.status(200).send({ success: false, message: 'Workspace not found for call recording' });
            }

            await pool.query(
                `INSERT INTO call_recordings (
                    id,
                    call_id,
                    workspace_id,
                    recording_url,
                    recording_sid,
                    duration
                 ) VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    randomUUID(),
                    CallSid,
                    workspaceId,
                    RecordingUrl,
                    RecordingSid,
                    parseInt(RecordingDuration || 0)
                ]
            );

            callSessionLookup.delete(CallSid);
            return reply.status(200).send({ success: true });
        } catch (error) {
            console.error('Recording status webhook error:', error);
            return reply.status(200).send({ success: false });
        }
    });

    app.post('/status', async (request, reply) => {
        const { CallSid, CallStatus, CallDuration } = request.body as any;

        if (CallStatus === 'completed' || CallStatus === 'failed' || CallStatus === 'busy') {
            const session = activeSessions.get(CallSid);
            if (session) {
                // Formatting transcript
                const transcript = session.history.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
                const durationSeconds = parseInt(CallDuration || 0);
                const customerSignals = deriveCampaignCustomerSignals(transcript, CallStatus, durationSeconds);
                
                // Save Call Record
                await pool.query(
                    `INSERT INTO calls (workspace_id, direction, caller_phone, duration, outcome, transcript, language_detected, template_used)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [
                        session.workspaceId,
                        session.direction || 'inbound',
                        session.caller,
                        durationSeconds,
                        CallStatus,
                        transcript,
                        session.language,
                        session.templateUsed || null,
                    ]
                );

                if (session.campaignContactId) {
                    await pool.query(
                        `UPDATE campaign_contacts
                         SET outcome = $1,
                             called_at = COALESCE(called_at, NOW()),
                             response = CASE WHEN $3 <> '' THEN $3 ELSE response END
                         WHERE id = $2`,
                        [CallStatus, session.campaignContactId, transcript]
                    );
                }

                if (session.campaignId && CallStatus === 'completed' && parseInt(CallDuration || 0) > 0) {
                    await pool.query(
                        `UPDATE campaigns
                         SET calls_answered = calls_answered + 1,
                             responded = responded + 1
                         WHERE id = $1`,
                        [session.campaignId]
                    );
                }

                if (session.sessionDbId) {
                    await pool.query(
                        `UPDATE conversation_sessions
                         SET transcript = $1,
                             outcome = $2,
                             sentiment_score = $3,
                             ended_at = NOW(),
                             metadata = COALESCE(metadata, '{}'::jsonb) || $4::jsonb
                         WHERE id = $5`,
                        [
                            JSON.stringify(session.history),
                            CallStatus,
                            customerSignals.sentimentScore,
                            JSON.stringify({
                                callSid: CallSid,
                                durationSeconds,
                                campaignId: session.campaignId || null,
                                campaignContactId: session.campaignContactId || null,
                                completedAt: new Date().toISOString(),
                            }),
                            session.sessionDbId,
                        ]
                    );
                }

                if (session.customerId) {
                    await pool.query(
                        `UPDATE customers
                         SET last_contact_at = NOW(),
                             total_calls = total_calls + 1,
                             lead_score = GREATEST(0, COALESCE(lead_score, 0) + $2),
                             tags = ARRAY(
                                SELECT DISTINCT tag
                                FROM unnest(COALESCE(tags, '{}'::text[]) || $3::text[]) AS tag
                             ),
                             metadata = COALESCE(metadata, '{}'::jsonb) || $4::jsonb,
                             updated_at = NOW()
                         WHERE id = $1`,
                        [
                            session.customerId,
                            customerSignals.leadScoreDelta,
                            customerSignals.tags,
                            JSON.stringify({
                                last_campaign_id: session.campaignId || null,
                                last_campaign_contact_id: session.campaignContactId || null,
                                last_call_outcome: CallStatus,
                                last_call_duration_seconds: durationSeconds,
                            }),
                        ]
                    );
                }

                if (session.sessionDbId) {
                    try {
                        const { AutomationEngine } = await import('../modules/automation/automation.service.js');
                        const automation = new AutomationEngine();
                        await automation.evaluate(session.sessionDbId, {
                            message: transcript || CallStatus,
                            role: 'system',
                            sentimentScore: customerSignals.sentimentScore,
                            callOutcome: CallStatus,
                            durationSeconds,
                        });
                    } catch (automationError) {
                        console.error('Campaign call completion automation error:', automationError);
                    }
                }

                activeSessions.delete(CallSid);
            }
        }

        reply.send({ success: true });
    });
}
