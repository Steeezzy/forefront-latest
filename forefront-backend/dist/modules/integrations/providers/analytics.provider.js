/**
 * Google Analytics GA4 Integration
 *
 * How it works (matching Tidio):
 * - User provides their GA4 Measurement ID (G-XXXXXXX) in the integration settings
 * - The widget emits Forefront-specific events to GA4 via gtag()
 * - Events: conversation_started, conversation_rated, conversation_reply,
 *           prechat_finished, prechat_started, widget_open, widget_close,
 *           widget_mute_notifications, visitor_started_bot, custom_event
 * - Each event includes parameters: thread_id, visitor_id, source, operator_status, etc.
 *
 * Backend responsibility:
 * - Store/retrieve the GA4 config (measurement ID, enabled events)
 * - The actual event emission happens client-side in the widget via gtag()
 * - Track widget events server-side for our own analytics
 */
import { pool } from '../../../config/db.js';
export const GA4_EVENTS = [
    { name: 'forefront_conversation_started', description: 'First message in a thread sent by visitor, agent, or flow' },
    { name: 'forefront_conversation_rated', description: 'Visitor rated a conversation using emojis' },
    { name: 'forefront_conversation_reply', description: 'A reply posted by a flow or an agent' },
    { name: 'forefront_prechat_finished', description: 'Visitor submitted the pre-chat survey' },
    { name: 'forefront_prechat_started', description: 'Pre-chat survey displayed to a visitor' },
    { name: 'forefront_widget_visitor_started_bot', description: 'Visitor started a flow intentionally' },
    { name: 'forefront_widget_close', description: 'Visitor closed the widget' },
    { name: 'forefront_widget_open', description: 'Visitor opened the widget' },
    { name: 'forefront_widget_mute_notifications', description: 'Visitor muted notifications' },
];
export const GA4_PARAMETERS = [
    { name: 'thread_id', description: 'ID of the conversation thread' },
    { name: 'visitor_id', description: 'ID assigned to visitor by the widget' },
    { name: 'message_type', description: 'Type of message node used in a flow' },
    { name: 'chatbot_name', description: 'Name of the flow that sent a message' },
    { name: 'consent_given', description: 'Whether marketing consent was given in pre-chat' },
    { name: 'phone', description: 'Phone number from pre-chat survey' },
    { name: 'name', description: 'Name from pre-chat survey' },
    { name: 'email', description: 'Email from pre-chat survey' },
    { name: 'rating', description: 'Conversation rating value' },
    { name: 'source', description: 'Who sent the message: visitor, agent, chatbot' },
    { name: 'operator_status', description: 'Whether any agent is online or offline' },
];
export class GoogleAnalyticsService {
    /**
     * Track a widget event (server-side record keeping)
     */
    async trackEvent(workspaceId, eventName, params) {
        await pool.query(`INSERT INTO analytics_widget_events (workspace_id, event_name, visitor_id, thread_id, source, parameters)
       VALUES ($1, $2, $3, $4, $5, $6)`, [workspaceId, eventName, params.visitorId, params.threadId, params.source, JSON.stringify(params)]);
    }
    /**
     * Get recent events for a workspace (for analytics dashboard)
     */
    async getEvents(workspaceId, limit = 100, eventName) {
        let query = `SELECT * FROM analytics_widget_events WHERE workspace_id = $1`;
        const values = [workspaceId];
        if (eventName) {
            query += ` AND event_name = $2`;
            values.push(eventName);
        }
        query += ` ORDER BY created_at DESC LIMIT $${values.length + 1}`;
        values.push(limit);
        const result = await pool.query(query, values);
        return result.rows;
    }
    /**
     * Get event counts grouped by name (for dashboard charts)
     */
    async getEventCounts(workspaceId, since) {
        const sinceDate = since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days default
        const result = await pool.query(`SELECT event_name, COUNT(*) as count
       FROM analytics_widget_events
       WHERE workspace_id = $1 AND created_at >= $2
       GROUP BY event_name
       ORDER BY count DESC`, [workspaceId, sinceDate]);
        return result.rows;
    }
    /**
     * Returns the GA4/GTM JavaScript snippet config for embedding in the widget
     * This is sent to the widget so it can emit events client-side
     */
    getWidgetConfig(measurementId, enabledEvents) {
        return {
            ga4: {
                measurementId,
                events: enabledEvents.length > 0 ? enabledEvents : GA4_EVENTS.map(e => e.name),
            }
        };
    }
}
/**
 * Google Tag Manager Integration
 *
 * Similar to GA4 but uses GTM container ID instead.
 * Events are pushed to dataLayer[] on the client side.
 * The user configures tags/triggers in GTM to capture Forefront events.
 */
export class GoogleTagManagerService {
    /**
     * Returns the GTM config for the widget to use
     */
    getWidgetConfig(containerId) {
        return {
            gtm: {
                containerId, // GTM-XXXXXX
                dataLayerName: 'dataLayer',
                events: GA4_EVENTS.map(e => e.name),
            }
        };
    }
}
//# sourceMappingURL=analytics.provider.js.map