/**
 * Social Channel Integration type definitions.
 *
 * Covers WhatsApp Cloud API, Instagram DMs, and Messenger.
 */
export type SocialChannel = 'whatsapp' | 'instagram' | 'messenger' | 'telegram';
export interface SocialAccount {
    id: string;
    workspace_id: string;
    channel: SocialChannel;
    account_id: string;
    account_name?: string;
    access_token: string;
    refresh_token?: string;
    token_expires_at?: Date;
    webhook_secret?: string;
    connected: boolean;
    metadata: Record<string, any>;
    created_at: Date;
    updated_at: Date;
}
export type SocialContentType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'location' | 'reaction' | 'interactive' | 'unsupported';
export interface SocialMessageContent {
    type: SocialContentType;
    text?: string;
    media_url?: string;
    mime_type?: string;
    file_name?: string;
    latitude?: number;
    longitude?: number;
    emoji?: string;
    caption?: string;
    payload?: string;
}
export interface SocialAttachment {
    id?: string;
    type: string;
    url: string;
    mime_type?: string;
    size?: number;
    file_name?: string;
}
export interface InboundSocialMessage {
    id?: string;
    channel: SocialChannel;
    account_id: string;
    sender_id: string;
    sender_name?: string;
    sender_avatar_url?: string;
    recipient_id: string;
    external_message_id: string;
    external_thread_id?: string;
    content: SocialMessageContent;
    attachments: SocialAttachment[];
    reply_to_message_id?: string;
    timestamp: Date;
    raw: Record<string, any>;
}
export interface OutboundSocialMessage {
    conversation_id: string;
    channel: SocialChannel;
    recipient_id: string;
    account_id: string;
    content: SocialMessageContent;
    reply_to_external_id?: string;
    sender_id?: string;
}
export type DeliveryStatus = 'sent' | 'delivered' | 'read' | 'failed';
export interface SocialDeliveryReceipt {
    external_message_id: string;
    channel: SocialChannel;
    status: DeliveryStatus;
    timestamp: Date;
    error_code?: string;
    error_message?: string;
}
export interface WebhookVerificationRequest {
    mode: string;
    token: string;
    challenge: string;
}
export interface WhatsAppButton {
    type: 'reply';
    reply: {
        id: string;
        title: string;
    };
}
export interface WhatsAppListRow {
    id: string;
    title: string;
    description?: string;
}
export interface WhatsAppListSection {
    title: string;
    rows: WhatsAppListRow[];
}
export interface WhatsAppInteractiveMessage {
    type: 'button' | 'list';
    header?: {
        type: 'text';
        text: string;
    };
    body: {
        text: string;
    };
    footer?: {
        text: string;
    };
    action: {
        buttons?: WhatsAppButton[];
        button?: string;
        sections?: WhatsAppListSection[];
    };
}
export interface MessengerButton {
    type: 'postback' | 'web_url';
    title: string;
    payload?: string;
    url?: string;
}
export interface MessengerGenericElement {
    title: string;
    subtitle?: string;
    image_url?: string;
    buttons?: MessengerButton[];
}
export interface MessengerQuickReply {
    content_type: 'text';
    title: string;
    payload: string;
    image_url?: string;
}
export interface IGGenericElement {
    title: string;
    subtitle?: string;
    image_url?: string;
    buttons?: MessengerButton[];
}
export interface MetaPage {
    id: string;
    name: string;
    access_token: string;
    instagram_business_account?: {
        id: string;
        username?: string;
    };
}
export declare class SocialApiError extends Error {
    code: string;
    type: string;
    statusCode: number;
    constructor(message: string, code: string, type: string, statusCode?: number);
}
//# sourceMappingURL=social.types.d.ts.map