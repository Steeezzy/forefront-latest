/**
 * ChannelSettingsService — CRUD for per-channel auto-reply configuration.
 */

import { pool } from '../../config/db.js';

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

const CHANNEL_LIMITS: Record<ChannelType, number> = {
  whatsapp: 4096,
  instagram: 1000,
  messenger: 2000,
  email: 100000,
  web: 10000,
};

export class ChannelSettingsService {

  /**
   * Get settings for a specific channel. Creates defaults if not found.
   */
  async get(workspaceId: string, channel: ChannelType): Promise<ChannelSettings> {
    const result = await pool.query(
      `SELECT * FROM channel_settings WHERE workspace_id = $1 AND channel_type = $2`,
      [workspaceId, channel]
    );

    if (result.rows[0]) return result.rows[0];

    // Create default settings
    return this.createDefaults(workspaceId, channel);
  }

  /**
   * Get all channel settings for a workspace
   */
  async getAll(workspaceId: string): Promise<ChannelSettings[]> {
    const result = await pool.query(
      `SELECT * FROM channel_settings WHERE workspace_id = $1 ORDER BY channel_type`,
      [workspaceId]
    );
    return result.rows;
  }

  /**
   * Update channel settings
   */
  async update(workspaceId: string, channel: ChannelType, data: Partial<ChannelSettings>): Promise<ChannelSettings> {
    // Ensure row exists
    await this.get(workspaceId, channel);

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 3;

    const allowedFields = [
      'auto_reply', 'tone', 'reply_delay_seconds', 'business_hours_only',
      'timezone', 'business_hours', 'escalation_rules', 'fallback_message',
      'out_of_hours_message', 'welcome_message', 'max_reply_length',
    ];

    for (const field of allowedFields) {
      if ((data as any)[field] !== undefined) {
        const dbValue = ['business_hours', 'escalation_rules'].includes(field)
          ? JSON.stringify((data as any)[field])
          : (data as any)[field];
        fields.push(`${field} = $${idx}`);
        values.push(dbValue);
        idx++;
      }
    }

    if (fields.length === 0) {
      return this.get(workspaceId, channel);
    }

    fields.push(`updated_at = NOW()`);

    const result = await pool.query(
      `UPDATE channel_settings SET ${fields.join(', ')}
       WHERE workspace_id = $1 AND channel_type = $2
       RETURNING *`,
      [workspaceId, channel, ...values]
    );
    return result.rows[0];
  }

  /**
   * Check if auto-reply is enabled for a channel
   */
  async isAutoReplyEnabled(workspaceId: string, channel: ChannelType): Promise<boolean> {
    const settings = await this.get(workspaceId, channel);
    return settings.auto_reply;
  }

  /**
   * Check if current time is within business hours
   */
  isWithinBusinessHours(settings: ChannelSettings): boolean {
    if (!settings.business_hours_only) return true;

    const now = new Date();
    // Convert to workspace timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: settings.timezone || 'UTC',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const weekday = parts.find(p => p.type === 'weekday')?.value?.toLowerCase().slice(0, 3) || 'mon';
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
    const currentMinutes = hour * 60 + minute;

    const schedule = settings.business_hours[weekday];
    if (!schedule) return false; // No hours set for this day

    // Parse "09:00-18:00"
    const [start, end] = schedule.split('-');
    if (!start || !end) return false;
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  /**
   * Create default channel settings
   */
  private async createDefaults(workspaceId: string, channel: ChannelType): Promise<ChannelSettings> {
    const result = await pool.query(
      `INSERT INTO channel_settings (workspace_id, channel_type, max_reply_length)
       VALUES ($1, $2, $3)
       ON CONFLICT (workspace_id, channel_type) DO UPDATE SET updated_at = NOW()
       RETURNING *`,
      [workspaceId, channel, CHANNEL_LIMITS[channel] || 4096]
    );
    return result.rows[0];
  }
}

export const channelSettingsService = new ChannelSettingsService();
