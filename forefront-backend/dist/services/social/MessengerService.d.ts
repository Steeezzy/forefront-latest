/**
 * MessengerService — Facebook Messenger Page Messaging API.
 *
 * Handles inbound webhooks (text, attachments, quick replies, referrals),
 * outbound messaging (text, attachments, templates, quick replies),
 * sender actions, and page management.
 */
import type { InboundSocialMessage, SocialDeliveryReceipt, MessengerGenericElement, MessengerQuickReply } from '../../types/social.types.js';
export declare class MessengerService {
    /**
     * Parse inbound webhook payload.
     */
    parseWebhook(payload: any): InboundSocialMessage[];
    /**
     * Parse delivery and read receipts.
     */
    parseDeliveryAndRead(payload: any): SocialDeliveryReceipt[];
    /**
     * Send a text message.
     */
    sendText(pageId: string, recipientId: string, text: string, messagingType?: 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG'): Promise<string>;
    /**
     * Send an attachment (image, video, audio, file).
     */
    sendAttachment(pageId: string, recipientId: string, type: 'image' | 'video' | 'audio' | 'file', url: string): Promise<string>;
    /**
     * Send a generic template (cards with images + buttons).
     */
    sendTemplate(pageId: string, recipientId: string, elements: MessengerGenericElement[]): Promise<string>;
    /**
     * Send quick replies.
     */
    sendQuickReplies(pageId: string, recipientId: string, text: string, quickReplies: MessengerQuickReply[]): Promise<string>;
    /**
     * Send a sender action (typing indicator, mark seen).
     */
    senderAction(pageId: string, recipientId: string, action: 'typing_on' | 'typing_off' | 'mark_seen'): Promise<void>;
    /**
     * Get page details.
     */
    getPageDetails(pageId: string, accessToken: string): Promise<{
        name: string;
        category: string;
    }>;
    /**
     * Subscribe a page to webhook events.
     */
    subscribePageToWebhook(pageId: string, accessToken: string): Promise<void>;
    private parseMessageContent;
    private parseAttachments;
    private getAccessToken;
    private sendAPI;
}
export declare const messengerService: MessengerService;
//# sourceMappingURL=MessengerService.d.ts.map