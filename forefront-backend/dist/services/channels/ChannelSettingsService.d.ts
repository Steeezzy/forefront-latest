/**
 * ChannelSettingsService — CRUD for per-channel auto-reply configuration.
 */
export type ChannelType = 'whatsapp' | 'instagram' | 'messenger' | 'email' | 'web';
export interface ChannelSettings {
    id: string;
    workspace_id: string;
    channel_type: ChannelType;
    auto_reply: boolean;
    tone: string;
    reply_delay_seconds: number;
    business_hours_only: boolean;
    timezone: string;
    business_hours: Record<string, string | null>;
    escalation_rules: {
        on_low_confidence: boolean;
        on_angry_sentiment: boolean;
        on_keyword: string[];
        confidence_threshold: number;
        escalate_to: string;
    };
    fallback_message: string;
    out_of_hours_message: string;
    welcome_message: string | null;
    max_reply_length: number;
    created_at: string;
    updated_at: string;
}
export declare class ChannelSettingsService {
    /**
     * Get settings for a specific channel. Creates defaults if not found.
     */
    get(workspaceId: string, channel: ChannelType): Promise<ChannelSettings>;
    /**
     * Get all channel settings for a workspace
     */
    getAll(workspaceId: string): Promise<ChannelSettings[]>;
    /**
     * Update channel settings
     */
    update(workspaceId: string, channel: ChannelType, data: Partial<ChannelSettings>): Promise<ChannelSettings>;
    /**
     * Check if auto-reply is enabled for a channel
     */
    isAutoReplyEnabled(workspaceId: string, channel: ChannelType): Promise<boolean>;
    /**
     * Check if current time is within business hours
     */
    isWithinBusinessHours(settings: ChannelSettings): boolean;
    /**
     * Create default channel settings
     */
    private createDefaults;
}
export declare const channelSettingsService: ChannelSettingsService;
//# sourceMappingURL=ChannelSettingsService.d.ts.map