import { query } from '../../config/db.js';
import { z } from 'zod';
export const widgetConfigSchema = z.object({
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    position: z.enum(['bottom-right', 'bottom-left']).optional(),
    offsetX: z.number().optional(),
    offsetY: z.number().optional(),
    bubbleIcon: z.string().optional(),
    customIconUrl: z.string().url().optional(),
    logoUrl: z.string().url().optional(),
    welcomeMessage: z.string().optional(),
    offlineMessage: z.string().optional(),
    inputPlaceholder: z.string().optional(),
    agentName: z.string().optional(),
    agentTitle: z.string().optional(),
    agentAvatarUrl: z.string().url().optional(),
    autoOpenDelay: z.number().optional(),
    showOnMobile: z.boolean().optional(),
    showAgentPhoto: z.boolean().optional(),
    showTypingIndicator: z.boolean().optional(),
    showFileUpload: z.boolean().optional(),
    showEmojiPicker: z.boolean().optional(),
    showBranding: z.boolean().optional(),
    collectEmailBeforeChat: z.boolean().optional(),
    soundEnabled: z.boolean().optional(),
    hiddenPages: z.array(z.string()).optional(),
    defaultLanguage: z.string().optional(),
    greetingRules: z.array(z.record(z.string(), z.any())).optional(),
});
export class WidgetService {
    async getWidgetConfig(workspaceId) {
        const result = await query('SELECT * FROM widget_configs WHERE workspace_id = $1', [workspaceId]);
        if (result.rows.length === 0) {
            // Create default config
            return this.createDefaultConfig(workspaceId);
        }
        return result.rows[0];
    }
    async getPublicWidgetConfig(workspaceId) {
        const result = await query(`SELECT 
        primary_color, text_color, background_color, position,
        offset_x, offset_y, bubble_icon, custom_icon_url, logo_url,
        welcome_message, offline_message, input_placeholder,
        agent_name, agent_title, agent_avatar_url, auto_open_delay,
        show_on_mobile, show_agent_photo, show_typing_indicator,
        show_file_upload, show_emoji_picker, show_branding,
        collect_email_before_chat, default_language, greeting_rules
       FROM widget_configs WHERE workspace_id = $1`, [workspaceId]);
        if (result.rows.length === 0) {
            return this.getDefaultPublicConfig();
        }
        return result.rows[0];
    }
    async updateWidgetConfig(workspaceId, data) {
        const existing = await query('SELECT id FROM widget_configs WHERE workspace_id = $1', [workspaceId]);
        if (existing.rows.length === 0) {
            // Create new config
            const result = await query(`INSERT INTO widget_configs 
         (workspace_id, primary_color, text_color, background_color, position,
          offset_x, offset_y, bubble_icon, custom_icon_url, logo_url,
          welcome_message, offline_message, input_placeholder,
          agent_name, agent_title, agent_avatar_url, auto_open_delay,
          show_on_mobile, show_agent_photo, show_typing_indicator,
          show_file_upload, show_emoji_picker, show_branding,
          collect_email_before_chat, default_language, greeting_rules)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
                 $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
         RETURNING *`, [
                workspaceId,
                data.primaryColor,
                data.textColor,
                data.backgroundColor,
                data.position,
                data.offsetX,
                data.offsetY,
                data.bubbleIcon,
                data.customIconUrl,
                data.logoUrl,
                data.welcomeMessage,
                data.offlineMessage,
                data.inputPlaceholder,
                data.agentName,
                data.agentTitle,
                data.agentAvatarUrl,
                data.autoOpenDelay,
                data.showOnMobile,
                data.showAgentPhoto,
                data.showTypingIndicator,
                data.showFileUpload,
                data.showEmojiPicker,
                data.showBranding,
                data.collectEmailBeforeChat,
                data.defaultLanguage,
                JSON.stringify(data.greetingRules || []),
            ]);
            return result.rows[0];
        }
        // Build dynamic update query
        const updates = [];
        const values = [];
        let paramIndex = 1;
        const fieldMap = {
            primaryColor: 'primary_color',
            textColor: 'text_color',
            backgroundColor: 'background_color',
            position: 'position',
            offsetX: 'offset_x',
            offsetY: 'offset_y',
            bubbleIcon: 'bubble_icon',
            customIconUrl: 'custom_icon_url',
            logoUrl: 'logo_url',
            welcomeMessage: 'welcome_message',
            offlineMessage: 'offline_message',
            inputPlaceholder: 'input_placeholder',
            agentName: 'agent_name',
            agentTitle: 'agent_title',
            agentAvatarUrl: 'agent_avatar_url',
            autoOpenDelay: 'auto_open_delay',
            showOnMobile: 'show_on_mobile',
            showAgentPhoto: 'show_agent_photo',
            showTypingIndicator: 'show_typing_indicator',
            showFileUpload: 'show_file_upload',
            showEmojiPicker: 'show_emoji_picker',
            showBranding: 'show_branding',
            collectEmailBeforeChat: 'collect_email_before_chat',
            soundEnabled: 'sound_enabled',
            defaultLanguage: 'default_language',
            greetingRules: 'greeting_rules',
        };
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
                const dbField = fieldMap[key];
                if (dbField) {
                    updates.push(`${dbField} = $${paramIndex}`);
                    values.push(key === 'greetingRules' || key === 'hiddenPages' ? JSON.stringify(value) : value);
                    paramIndex++;
                }
            }
        }
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(workspaceId);
        const result = await query(`UPDATE widget_configs SET ${updates.join(', ')} WHERE workspace_id = $${paramIndex} RETURNING *`, values);
        return result.rows[0];
    }
    async createDefaultConfig(workspaceId) {
        const result = await query(`INSERT INTO widget_configs (workspace_id) VALUES ($1) RETURNING *`, [workspaceId]);
        return result.rows[0];
    }
    getDefaultPublicConfig() {
        return {
            primary_color: '#3B82F6',
            text_color: '#FFFFFF',
            background_color: '#FFFFFF',
            position: 'bottom-right',
            offset_x: 20,
            offset_y: 20,
            bubble_icon: 'chat',
            welcome_message: 'Hi there! 👋 How can we help you today?',
            offline_message: 'We are currently offline. Leave a message and we will get back to you as soon as possible!',
            input_placeholder: 'Type a message...',
            agent_name: 'Support Team',
            agent_title: 'Customer Support',
            show_on_mobile: true,
            show_agent_photo: true,
            show_typing_indicator: true,
            show_file_upload: true,
            show_emoji_picker: true,
            show_branding: true,
            collect_email_before_chat: false,
            default_language: 'en',
            greeting_rules: [],
        };
    }
    generateEmbedCode(workspaceId, host) {
        return `<script>
  (function(w,d,s,o,f,js,fjs){
    w['ForefrontWidget']=o;w[o]=w[o]||function(){
    (w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s);fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','fw','${host}/widget.js'));
  
  fw('init', { workspaceId: '${workspaceId}' });
</script>`;
    }
}
export const widgetService = new WidgetService();
//# sourceMappingURL=widget.service.js.map