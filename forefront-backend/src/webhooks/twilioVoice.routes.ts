import { FastifyInstance } from 'fastify';
import { twilioService } from '../services/twilio.service.js';
import { claudeService } from '../services/claude.service.js';
import { sarvamClient } from '../services/SarvamClient.js';
import { pool } from '../config/db.js';

// In-memory session store for simplistic conversation handling
const activeSessions = new Map<string, any>();

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
            language: workspace.language || 'en-IN'
        });

        // 3. Return TwiML with Greeting
        const greeting = workspace.greeting || `Hello, thank you for calling ${workspace.business_name}. How can I help you?`;
        
        const gatherUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/webhooks/twilio/voice/gather`;
        const twiml = twilioService.buildVoiceResponse(greeting, gatherUrl, workspace.language);

        reply.type('text/xml').send(twiml);
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

            // 3. Append to history
            session.history.push({ role: 'user', content: SpeechResult });
            session.history.push({ role: 'assistant', content: aiResponseText });

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

    app.post('/status', async (request, reply) => {
        const { CallSid, CallStatus, CallDuration } = request.body as any;

        if (CallStatus === 'completed' || CallStatus === 'failed' || CallStatus === 'busy') {
            const session = activeSessions.get(CallSid);
            if (session) {
                // Formatting transcript
                const transcript = session.history.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
                
                // Save Call Record
                await pool.query(
                    `INSERT INTO calls (workspace_id, direction, caller_phone, duration, outcome, transcript, language_detected)
                     VALUES ($1, 'inbound', $2, $3, $4, $5, $6)`,
                    [
                        session.workspaceId,
                        session.caller,
                        parseInt(CallDuration || 0),
                        CallStatus,
                        transcript,
                        session.language
                    ]
                );

                activeSessions.delete(CallSid);
            }
        }

        reply.send({ success: true });
    });
}
