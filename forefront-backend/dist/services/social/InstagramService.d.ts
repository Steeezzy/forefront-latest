/**
 * InstagramService — Instagram Direct Messages via Meta Graph API.
 *
 * Handles inbound DMs (text, attachments, reactions, postbacks),
 * outbound messaging (text, media, generic templates, quick replies),
 * and sender profile fetching.
 */
import type { InboundSocialMessage, IGGenericElement } from '../../types/social.types.js';
export declare class InstagramService {
    /**
     * Parse inbound webhook payload.
     */
    parseWebhook(payload: any): InboundSocialMessage[];
    /**
     * Send a text message.
     */
    sendText(accountId: string, recipientId: string, text: string): Promise<string>;
    /**
     * Send media attachment.
     */
    sendMedia(accountId: string, recipientId: string, type: 'image' | 'video' | 'audio' | 'file', url: string): Promise<string>;
    /**
     * Send generic template (cards with image + buttons).
     */
    sendGenericTemplate(accountId: string, recipientId: string, elements: IGGenericElement[]): Promise<string>;
    /**
     * Send quick replies.
     */
    sendQuickReplies(accountId: string, recipientId: string, text: string, quickReplies: Array<{
        title: string;
        payload: string;
    }>): Promise<string>;
    /**
     * Get sender profile (may fail due to privacy).
     */
    getSenderProfile(senderId: string, accessToken: string): Promise<{
        name: string;
        profilePic?: string;
    }>;
    private parseMessageContent;
    private parseAttachments;
    private getAccessToken;
    private sendAPI;
}
export declare const instagramService: InstagramService;
//# sourceMappingURL=InstagramService.d.ts.map