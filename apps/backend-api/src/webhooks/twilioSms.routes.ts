import { FastifyInstance } from 'fastify';
import { twilioService } from '../services/twilio.service.js';
import { claudeService } from '../services/claude.service.js';
import { pool } from '../config/db.js';

export default async function twilioSmsRoutes(app: FastifyInstance) {
    app.post('/incoming', async (request, reply) => {
        const { From, To, Body, MessageSid } = request.body as any;

        // 1. Find Workspace by Twilio 'To' Number
        const wsRes = await pool.query(`SELECT * FROM workspaces WHERE phone = $1 LIMIT 1`, [To]);
        
        let workspace = null;
        if (wsRes.rows.length === 0) {
             return reply.send({ success: false, message: 'Workspace not found.' });
        }
        workspace = wsRes.rows[0];

        try {
            // 2. See if there is an active conversational context for this user, else start one
            // Ideally we'd map this in postgres tracking, for this exercise we process it statelessly
            
            // 3. Generate response via Claude
            const aiResponseText = await claudeService.generateResponse(
                workspace.id,
                Body,
                [],
                workspace
            );

            // 4. Send the Reply back
            await twilioService.sendSMS(From, aiResponseText);

            // 5. Optionally log the interaction
            await pool.query(
                `INSERT INTO chats (workspace_id, visitor_name, visitor_email, messages_count, messages) 
                 VALUES ($1, $2, 'sms-user@phone.com', 2, $3)`,
                [
                    workspace.id,
                    From,
                    JSON.stringify([
                        { role: 'user', content: Body },
                        { role: 'assistant', content: aiResponseText }
                    ])
                ]
            );

            return reply.send({ success: true });
        } catch (error: any) {
            console.error('SMS incoming error:', error);
            // Even on error, avoid Twilio retry loops
            return reply.status(200).send({ success: false });
        }
    });
}
