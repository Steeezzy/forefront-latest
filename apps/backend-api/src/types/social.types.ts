/**
 * Social Channel Integration type definitions.
 *
 * Covers WhatsApp Cloud API, Instagram DMs, and Messenger.
 */

// ─── Channels ────────────────────────────────────────────────────────

export type SocialChannel = 'whatsapp' | 'instagram' | 'messenger' | 'telegram';

// ─── Account ─────────────────────────────────────────────────────────

export interface SocialAccount {
    id: string;
    workspace_id: string;
    channel: SocialChannel;
    account_id: string; // platform UID (phone number ID, page ID, IG account ID)
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

// ─── Inbound Message ─────────────────────────────────────────────────

export type SocialContentType =
    | 'text' | 'image' | 'video' | 'audio' | 'document'
    | 'sticker' | 'location' | 'reaction' | 'interactive' | 'unsupported';

export interface SocialMessageContent {
    type: SocialContentType;
    text?: string;
    media_url?: string;
    mime_type?: string;
    file_name?: string;
    latitude?: number;
    longitude?: number;
    emoji?: string; // for reactions
    caption?: string;
    payload?: string; // for postbacks / quick replies
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

// ─── Outbound Message ────────────────────────────────────────────────

export interface OutboundSocialMessage {
    conversation_id: string;
    channel: SocialChannel;
    recipient_id: string;
    account_id: string;
    content: SocialMessageContent;
    reply_to_external_id?: string;
    sender_id?: string; // agent or bot
}

// ─── Delivery Receipt ────────────────────────────────────────────────

export type DeliveryStatus = 'sent' | 'delivered' | 'read' | 'failed';

export interface SocialDeliveryReceipt {
    external_message_id: string;
    channel: SocialChannel;
    status: DeliveryStatus;
    timestamp: Date;
    error_code?: string;
    error_message?: string;
}

// ─── Webhook Verification (Meta) ─────────────────────────────────────

export interface WebhookVerificationRequest {
    mode: string;
    token: string;
    challenge: string;
}

// ─── WhatsApp Interactive ────────────────────────────────────────────

export interface WhatsAppButton {
    type: 'reply';
    reply: { id: string; title: string };
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
    header?: { type: 'text'; text: string };
    body: { text: string };
    footer?: { text: string };
    action: {
        buttons?: WhatsAppButton[];          // for type 'button' (max 3)
        button?: string;                      // list CTA text
        sections?: WhatsAppListSection[];     // for type 'list'
    };
}

// ─── Messenger Template ──────────────────────────────────────────────

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

// ─── Instagram Generic Element ───────────────────────────────────────

export interface IGGenericElement {
    title: string;
    subtitle?: string;
    image_url?: string;
    buttons?: MessengerButton[]; // Same format as Messenger
}

// ─── Meta OAuth ──────────────────────────────────────────────────────

export interface MetaPage {
    id: string;
    name: string;
    access_token: string;
    instagram_business_account?: {
        id: string;
        username?: string;
    };
}

// ─── Social API Error ────────────────────────────────────────────────

export class SocialApiError extends Error {
    code: string;
    type: string;
    statusCode: number;

    constructor(message: string, code: string, type: string, statusCode: number = 400) {
        super(message);
        this.name = 'SocialApiError';
        this.code = code;
        this.type = type;
        this.statusCode = statusCode;
    }
}
