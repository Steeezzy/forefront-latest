/**
 * ChannelRouterService — Unified social message router.
 *
 * Central entry point that receives InboundSocialMessages from any channel,
 * routes them into conversations/contacts, and dispatches outbound messages
 * to the correct channel service.
 */
import type { InboundSocialMessage, OutboundSocialMessage, SocialDeliveryReceipt, SocialAccount, SocialChannel } from '../../types/social.types.js';
export declare class ChannelRouterService {
    private whatsapp;
    private instagram;
    private messenger;
    private events;
    constructor();
    /**
     * Handle an inbound message from any social channel.
     * Creates/finds contact and conversation, persists message.
     */
    handleInbound(message: InboundSocialMessage): Promise<{
        conversation_id: string;
        contact_id: string;
        message_id: string;
    }>;
    /**
     * Handle a delivery receipt.
     */
    handleDeliveryReceipt(receipt: SocialDeliveryReceipt): Promise<void>;
    /**
     * Send an outbound message via the correct channel service.
     */
    sendMessage(outbound: OutboundSocialMessage): Promise<string>;
    /**
     * Connect a social account — validate and store credentials.
     */
    connectAccount(params: {
        workspace_id: string;
        channel: SocialChannel;
        account_id: string;
        account_name?: string;
        access_token: string;
        webhook_secret?: string;
        metadata?: Record<string, any>;
    }): Promise<SocialAccount>;
    /**
     * Disconnect a social account.
     */
    disconnectAccount(accountId: string): Promise<void>;
    private findAccount;
    private findOrCreateContact;
    private findOrCreateConversation;
}
export declare const channelRouterService: ChannelRouterService;
//# sourceMappingURL=ChannelRouterService.d.ts.map