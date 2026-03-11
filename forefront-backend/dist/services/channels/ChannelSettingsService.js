/**
 * ChannelSettingsService — CRUD for per-channel auto-reply configuration.
 */
import { pool } from '../../config/db.js';
const CHANNEL_LIMITS = {
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
    async get(workspaceId, channel) {
        const result = await pool.query(`SELECT * FROM channel_settings WHERE workspace_id = $1 AND channel_type = $2`, [workspaceId, channel]);
        if (result.rows[0])
            return result.rows[0];
        // Create default settings
        return this.createDefaults(workspaceId, channel);
    }
    /**
     * Get all channel settings for a workspace
     */
    async getAll(workspaceId) {
        const result = await pool.query(`SELECT * FROM channel_settings WHERE workspace_id = $1 ORDER BY channel_type`, [workspaceId]);
        return result.rows;
    }
    /**
     * Update channel settings
     */
    async update(workspaceId, channel, data) {
        // Ensure row exists
        await this.get(workspaceId, channel);
        const fields = [];
        const values = [];
        let idx = 3;
        const allowedFields = [
            'auto_reply', 'tone', 'reply_delay_seconds', 'business_hours_only',
            'timezone', 'business_hours', 'escalation_rules', 'fallback_message',
            'out_of_hours_message', 'welcome_message', 'max_reply_length',
        ];
        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                const dbValue = ['business_hours', 'escalation_rules'].includes(field)
                    ? JSON.stringify(data[field])
                    : data[field];
                fields.push(`${field} = $${idx}`);
                values.push(dbValue);
                idx++;
            }
        }
        if (fields.length === 0) {
            return this.get(workspaceId, channel);
        }
        fields.push(`updated_at = NOW()`);
        const result = await pool.query(`UPDATE channel_settings SET ${fields.join(', ')}
       WHERE workspace_id = $1 AND channel_type = $2
       RETURNING *`, [workspaceId, channel, ...values]);
        return result.rows[0];
    }
    /**
     * Check if auto-reply is enabled for a channel
     */
    async isAutoReplyEnabled(workspaceId, channel) {
        const settings = await this.get(workspaceId, channel);
        return settings.auto_reply;
    }
    /**
     * Check if current time is within business hours
     */
    isWithinBusinessHours(settings) {
        if (!settings.business_hours_only)
            return true;
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
        if (!schedule)
            return false; // No hours set for this day
        // Parse "09:00-18:00"
        const [start, end] = schedule.split('-');
        if (!start || !end)
            return false;
        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }
    /**
     * Create default channel settings
     */
    async createDefaults(workspaceId, channel) {
        const result = await pool.query(`INSERT INTO channel_settings (workspace_id, channel_type, max_reply_length)
       VALUES ($1, $2, $3)
       ON CONFLICT (workspace_id, channel_type) DO UPDATE SET updated_at = NOW()
       RETURNING *`, [workspaceId, channel, CHANNEL_LIMITS[channel] || 4096]);
        return result.rows[0];
    }
}
export const channelSettingsService = new ChannelSettingsService();
//# sourceMappingURL=ChannelSettingsService.js.map