/**
 * WhatsAppService — WhatsApp Cloud API integration.
 *
 * Handles inbound webhook parsing, outbound messaging (text, media,
 * templates, interactive), and read receipts.
 *
 * API Base: https://graph.facebook.com/v19.0
 */
import type { InboundSocialMessage, SocialDeliveryReceipt, WhatsAppInteractiveMessage } from '../../types/social.types.js';
export declare class WhatsAppService {
    /**
     * Parse inbound webhook payload into normalized messages.
     */
    parseWebhook(payload: any): InboundSocialMessage[];
    /**
     * Parse status updates (delivery receipts) from webhook.
     */
    parseStatusUpdate(payload: any): SocialDeliveryReceipt[];
    /**
     * Send a text message.
     */
    sendText(accountId: string, to: string, text: string, replyToId?: string): Promise<string>;
    /**
     * Send media (image, video, audio, document).
     */
    sendMedia(accountId: string, to: string, type: 'image' | 'video' | 'audio' | 'document', mediaUrl: string, caption?: string): Promise<string>;
    /**
     * Send a template message.
     */
    sendTemplate(accountId: string, to: string, templateName: string, languageCode: string, components?: unknown[]): Promise<string>;
    /**
     * Send interactive message (buttons or list).
     */
    sendInteractive(accountId: string, to: string, interactive: WhatsAppInteractiveMessage): Promise<string>;
    /**
     * Mark a message as read.
     */
    markAsRead(accountId: string, messageId: string): Promise<void>;
    /**
     * Get account details (phone number display name).
     */
    getAccountDetails(phoneNumberId: string, accessToken: string): Promise<{
        displayName: string;
        phoneNumber: string;
    }>;
    private parseContent;
    private parseInteractiveReply;
    private parseAttachments;
    private getAccessToken;
    private apiCall;
    private parseError;
}
export declare const whatsAppService: WhatsAppService;
//# sourceMappingURL=WhatsAppService.d.ts.map