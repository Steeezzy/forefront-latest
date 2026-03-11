/**
 * AutoReplyEngine — Unified RAG auto-reply for all channels.
 *
 * When a message arrives on ANY channel (WhatsApp, Instagram, Messenger, Email),
 * this engine:
 * 1. Checks channel settings (auto-reply on? business hours? agent takeover?)
 * 2. Runs the message through Lyro (RAG + AI pipeline)
 * 3. Applies tone, truncation, and channel-specific formatting
 * 4. Sends the reply back via the correct channel
 * 5. Logs everything for analytics
 *
 * Uses the existing LyroService for actual AI/RAG processing.
 */
import { pool } from '../../config/db.js';
import { LyroService } from '../rag/LyroService.js';
import { channelSettingsService } from '../channels/ChannelSettingsService.js';
import { channelRouterService } from '../social/ChannelRouterService.js';
import { sarvamClient } from '../SarvamClient.js';
const lyroService = new LyroService();
// Escalation keyword detection
function containsEscalationKeyword(message, keywords) {
    const lower = message.toLowerCase();
    return keywords.some(kw => lower.includes(kw.toLowerCase()));
}
// Negative sentiment words
const NEGATIVE_WORDS = new Set([
    'angry', 'frustrated', 'annoyed', 'terrible', 'awful', 'horrible', 'useless',
    'worst', 'hate', 'stupid', 'ridiculous', 'unacceptable', 'pathetic', 'scam',
    'furious', 'disgusting', 'incompetent', 'waste', 'garbage', 'disappointed',
]);
function detectAngrySentiment(message) {
    const words = message.toLowerCase().split(/\s+/);
    const negativeCount = words.filter(w => NEGATIVE_WORDS.has(w)).length;
    return negativeCount >= 2 || (negativeCount / words.length) > 0.15;
}
export class AutoReplyEngine {
    /**
     * Main entry point — process an inbound message and potentially auto-reply.
     *
     * @param workspaceId - The workspace that owns this channel
     * @param conversationId - The conversation this message belongs to
     * @param messageId - The ID of the saved inbound message
     * @param channel - Which channel (whatsapp, instagram, messenger, email)
     * @param visitorMessage - The text of the visitor's message
     * @param senderId - The platform-specific sender ID
     * @param accountId - The social account ID to reply from
     * @param contactId - Optional contact ID for session context
     */
    async processInboundMessage(params) {
        const { workspaceId, conversationId, messageId, channel, visitorMessage, senderId, accountId, contactId } = params;
        const startTime = Date.now();
        try {
            // ────────────────────────────────────────────────────────────
            // 1. CHECK — Should we auto-reply?
            // ────────────────────────────────────────────────────────────
            // Check if conversation has been taken over by an agent
            const convResult = await pool.query(`SELECT auto_reply_paused, agent_takeover, status FROM conversations WHERE id = $1`, [conversationId]);
            const conversation = convResult.rows[0];
            if (conversation?.auto_reply_paused || conversation?.agent_takeover) {
                return { replied: false, escalated: false, channel, escalation_reason: 'Agent has taken over this conversation' };
            }
            if (conversation?.status === 'closed') {
                return { replied: false, escalated: false, channel, escalation_reason: 'Conversation is closed' };
            }
            // Get channel settings
            const settings = await channelSettingsService.get(workspaceId, channel);
            if (!settings.auto_reply) {
                return { replied: false, escalated: false, channel, escalation_reason: 'Auto-reply disabled for this channel' };
            }
            // Check business hours
            if (!channelSettingsService.isWithinBusinessHours(settings)) {
                // Send out-of-hours message if configured
                if (settings.out_of_hours_message) {
                    await this.sendReply(channel, accountId, senderId, conversationId, settings.out_of_hours_message, settings);
                }
                return { replied: true, reply_text: settings.out_of_hours_message, escalated: false, channel };
            }
            // ────────────────────────────────────────────────────────────
            // 2. CHECK ESCALATION — keyword/sentiment triggers
            // ────────────────────────────────────────────────────────────
            const rules = settings.escalation_rules;
            // Check for escalation keywords
            if (rules.on_keyword && containsEscalationKeyword(visitorMessage, rules.on_keyword)) {
                await this.escalate(workspaceId, conversationId, 'customer_request', 'Visitor used escalation keyword', settings);
                return {
                    replied: true,
                    reply_text: settings.fallback_message,
                    escalated: true,
                    escalation_reason: 'Escalation keyword detected',
                    channel,
                };
            }
            // Check for angry sentiment
            if (rules.on_angry_sentiment && detectAngrySentiment(visitorMessage)) {
                await this.escalate(workspaceId, conversationId, 'sentiment_negative', 'Angry sentiment detected', settings);
                return {
                    replied: true,
                    reply_text: settings.fallback_message,
                    escalated: true,
                    escalation_reason: 'Negative sentiment detected',
                    channel,
                };
            }
            // ────────────────────────────────────────────────────────────
            // 3. RUN RAG — Get AI response via LyroService
            // ────────────────────────────────────────────────────────────
            // Optional delay before replying (more human-like)
            if (settings.reply_delay_seconds > 0) {
                await new Promise(resolve => setTimeout(resolve, settings.reply_delay_seconds * 1000));
            }
            // Create or find session for this conversation
            const sessionId = `auto_${conversationId}`;
            const lyroResponse = await lyroService.chat({
                message: visitorMessage,
                session_id: sessionId,
                conversation_id: conversationId,
                workspace_id: workspaceId,
                contact_id: contactId,
            });
            // ────────────────────────────────────────────────────────────
            // 4. CHECK CONFIDENCE — Escalate if too low
            // ────────────────────────────────────────────────────────────
            const confidenceThreshold = rules.confidence_threshold || 0.75;
            if (lyroResponse.confidence < confidenceThreshold && rules.on_low_confidence) {
                // Send fallback message + escalate
                await this.sendReply(channel, accountId, senderId, conversationId, settings.fallback_message, settings);
                await this.escalate(workspaceId, conversationId, 'low_confidence', `AI confidence ${(lyroResponse.confidence * 100).toFixed(0)}% below threshold ${(confidenceThreshold * 100).toFixed(0)}%`, settings);
                await this.logAutoReply(workspaceId, conversationId, messageId, channel, visitorMessage, settings.fallback_message, lyroResponse.confidence, true, 'Low confidence', settings.tone, Date.now() - startTime, lyroResponse.sources);
                return {
                    replied: true,
                    reply_text: settings.fallback_message,
                    confidence: lyroResponse.confidence,
                    escalated: true,
                    escalation_reason: `Low confidence: ${(lyroResponse.confidence * 100).toFixed(0)}%`,
                    channel,
                };
            }
            // ────────────────────────────────────────────────────────────
            // 5. APPLY TONE — Rewrite if needed
            // ────────────────────────────────────────────────────────────
            let replyText = lyroResponse.answer;
            // Rewrite for tone if not default
            if (settings.tone && settings.tone !== 'friendly') {
                replyText = await this.rewriteForTone(replyText, settings.tone, channel);
            }
            // Truncate for channel limits
            if (replyText.length > settings.max_reply_length) {
                replyText = replyText.slice(0, settings.max_reply_length - 3) + '...';
            }
            // ────────────────────────────────────────────────────────────
            // 6. SEND REPLY
            // ────────────────────────────────────────────────────────────
            await this.sendReply(channel, accountId, senderId, conversationId, replyText, settings);
            // ────────────────────────────────────────────────────────────
            // 7. LOG
            // ────────────────────────────────────────────────────────────
            const replyDelay = Date.now() - startTime;
            await this.logAutoReply(workspaceId, conversationId, messageId, channel, visitorMessage, replyText, lyroResponse.confidence, false, null, settings.tone, replyDelay, lyroResponse.sources);
            return {
                replied: true,
                reply_text: replyText,
                confidence: lyroResponse.confidence,
                escalated: false,
                channel,
            };
        }
        catch (err) {
            console.error(`[AutoReplyEngine] Error processing message on ${channel}:`, err.message);
            // Log the error
            await this.logAutoReply(workspaceId, conversationId, messageId, channel, visitorMessage, null, null, false, null, null, Date.now() - startTime, null, err.message);
            return { replied: false, escalated: false, channel, error: err.message };
        }
    }
    /**
     * Send a reply back via the correct channel
     */
    async sendReply(channel, accountId, recipientId, conversationId, text, settings) {
        if (channel === 'email') {
            // Email replies are handled separately via EmailChannelService
            // We just save the message and let the email service send it
            await pool.query(`INSERT INTO messages (conversation_id, sender_type, content, message_type, metadata, ai_confidence)
         VALUES ($1, 'ai', $2, 'text', $3, 0)`, [conversationId, text, JSON.stringify({ channel: 'email', auto_reply: true, tone: settings.tone })]);
            // Notify email service to send
            const { emailChannelService } = await import('./EmailChannelService.js');
            await emailChannelService.sendReply(conversationId, text);
            return;
        }
        // Social channels: use ChannelRouterService
        const outbound = {
            conversation_id: conversationId,
            channel: channel,
            account_id: accountId,
            recipient_id: recipientId,
            content: { type: 'text', text },
        };
        try {
            const externalId = await channelRouterService.sendMessage(outbound);
            // Save bot message to conversation
            await pool.query(`INSERT INTO messages (conversation_id, sender_type, content, message_type, metadata, external_message_id, social_account_id, auto_reply_channel, tone_applied)
         VALUES ($1, 'ai', $2, 'text', $3, $4, $5, $6, $7)`, [
                conversationId, text,
                JSON.stringify({ channel, auto_reply: true }),
                externalId, accountId, channel, settings.tone,
            ]);
            // Update conversation
            await pool.query(`UPDATE conversations SET last_message_preview = $1, last_message_at = NOW(), updated_at = NOW(), ai_resolved = true
         WHERE id = $2`, [text.slice(0, 200), conversationId]);
        }
        catch (err) {
            console.error(`[AutoReplyEngine] Failed to send reply on ${channel}:`, err.message);
            throw err;
        }
    }
    /**
     * Escalate a conversation to human agents
     */
    async escalate(workspaceId, conversationId, trigger, reason, settings) {
        // Mark conversation as escalated
        await pool.query(`UPDATE conversations SET was_escalated = true, status = 'open', updated_at = NOW()
       WHERE id = $1`, [conversationId]);
        // Create handoff event
        await pool.query(`INSERT INTO handoff_events (conversation_id, workspace_id, trigger, trigger_detail, status)
       VALUES ($1, $2, $3, $4, 'pending')`, [conversationId, workspaceId, trigger, reason]);
        // Send fallback message if configured
        // (already handled by caller)
    }
    /**
     * Rewrite a reply to match the configured tone
     */
    async rewriteForTone(text, tone, channel) {
        const toneInstructions = {
            professional: 'Rewrite this customer support reply in a professional, business-appropriate tone. Keep the same information but make it more formal.',
            warm: 'Rewrite this customer support reply in a warm, empathetic tone. Show you care about the customer.',
            casual: 'Rewrite this customer support reply in a casual, conversational tone. Be natural and relaxed.',
            formal: 'Rewrite this customer support reply in a very formal, corporate tone. Use proper business language.',
        };
        const instruction = toneInstructions[tone];
        if (!instruction)
            return text;
        try {
            const response = await sarvamClient.chatCompletion([
                { role: 'system', content: instruction },
                { role: 'user', content: text },
            ], { temperature: 0.3, max_tokens: 300 });
            return response.choices?.[0]?.message?.content || text;
        }
        catch {
            return text; // Fallback to original if tone rewrite fails
        }
    }
    /**
     * Log an auto-reply for analytics
     */
    async logAutoReply(workspaceId, conversationId, messageId, channel, visitorMessage, aiReply, confidence, wasEscalated, escalationReason, tone, replyDelay, ragSources, error) {
        try {
            await pool.query(`INSERT INTO auto_reply_logs
         (workspace_id, conversation_id, message_id, channel, visitor_message, ai_reply,
          confidence, was_escalated, escalation_reason, tone_applied, reply_delay_ms, rag_sources, error)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`, [workspaceId, conversationId, messageId, channel, visitorMessage, aiReply,
                confidence, wasEscalated, escalationReason, tone, replyDelay,
                ragSources ? JSON.stringify(ragSources) : null, error || null]);
        }
        catch (e) {
            console.error('[AutoReplyEngine] Failed to log:', e.message);
        }
    }
}
export const autoReplyEngine = new AutoReplyEngine();
//# sourceMappingURL=AutoReplyEngine.js.map