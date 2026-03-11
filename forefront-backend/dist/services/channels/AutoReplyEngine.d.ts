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
import { type ChannelType } from '../channels/ChannelSettingsService.js';
export interface AutoReplyResult {
    replied: boolean;
    reply_text?: string;
    confidence?: number;
    escalated: boolean;
    escalation_reason?: string;
    channel: string;
    error?: string;
}
export declare class AutoReplyEngine {
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
    processInboundMessage(params: {
        workspaceId: string;
        conversationId: string;
        messageId: string;
        channel: ChannelType;
        visitorMessage: string;
        senderId: string;
        accountId: string;
        contactId?: string;
    }): Promise<AutoReplyResult>;
    /**
     * Send a reply back via the correct channel
     */
    private sendReply;
    /**
     * Escalate a conversation to human agents
     */
    private escalate;
    /**
     * Rewrite a reply to match the configured tone
     */
    private rewriteForTone;
    /**
     * Log an auto-reply for analytics
     */
    private logAutoReply;
}
export declare const autoReplyEngine: AutoReplyEngine;
//# sourceMappingURL=AutoReplyEngine.d.ts.map