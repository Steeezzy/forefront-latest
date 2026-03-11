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
export declare const GA4_EVENTS: readonly [{
    readonly name: "forefront_conversation_started";
    readonly description: "First message in a thread sent by visitor, agent, or flow";
}, {
    readonly name: "forefront_conversation_rated";
    readonly description: "Visitor rated a conversation using emojis";
}, {
    readonly name: "forefront_conversation_reply";
    readonly description: "A reply posted by a flow or an agent";
}, {
    readonly name: "forefront_prechat_finished";
    readonly description: "Visitor submitted the pre-chat survey";
}, {
    readonly name: "forefront_prechat_started";
    readonly description: "Pre-chat survey displayed to a visitor";
}, {
    readonly name: "forefront_widget_visitor_started_bot";
    readonly description: "Visitor started a flow intentionally";
}, {
    readonly name: "forefront_widget_close";
    readonly description: "Visitor closed the widget";
}, {
    readonly name: "forefront_widget_open";
    readonly description: "Visitor opened the widget";
}, {
    readonly name: "forefront_widget_mute_notifications";
    readonly description: "Visitor muted notifications";
}];
export declare const GA4_PARAMETERS: readonly [{
    readonly name: "thread_id";
    readonly description: "ID of the conversation thread";
}, {
    readonly name: "visitor_id";
    readonly description: "ID assigned to visitor by the widget";
}, {
    readonly name: "message_type";
    readonly description: "Type of message node used in a flow";
}, {
    readonly name: "chatbot_name";
    readonly description: "Name of the flow that sent a message";
}, {
    readonly name: "consent_given";
    readonly description: "Whether marketing consent was given in pre-chat";
}, {
    readonly name: "phone";
    readonly description: "Phone number from pre-chat survey";
}, {
    readonly name: "name";
    readonly description: "Name from pre-chat survey";
}, {
    readonly name: "email";
    readonly description: "Email from pre-chat survey";
}, {
    readonly name: "rating";
    readonly description: "Conversation rating value";
}, {
    readonly name: "source";
    readonly description: "Who sent the message: visitor, agent, chatbot";
}, {
    readonly name: "operator_status";
    readonly description: "Whether any agent is online or offline";
}];
export declare class GoogleAnalyticsService {
    /**
     * Track a widget event (server-side record keeping)
     */
    trackEvent(workspaceId: string, eventName: string, params: {
        visitorId?: string;
        threadId?: string;
        source?: string;
        [key: string]: any;
    }): Promise<void>;
    /**
     * Get recent events for a workspace (for analytics dashboard)
     */
    getEvents(workspaceId: string, limit?: number, eventName?: string): Promise<any[]>;
    /**
     * Get event counts grouped by name (for dashboard charts)
     */
    getEventCounts(workspaceId: string, since?: Date): Promise<any[]>;
    /**
     * Returns the GA4/GTM JavaScript snippet config for embedding in the widget
     * This is sent to the widget so it can emit events client-side
     */
    getWidgetConfig(measurementId: string | null, enabledEvents: string[]): {
        ga4: {
            measurementId: string;
            events: string[];
        };
    };
}
/**
 * Google Tag Manager Integration
 *
 * Similar to GA4 but uses GTM container ID instead.
 * Events are pushed to dataLayer[] on the client side.
 * The user configures tags/triggers in GTM to capture Forefront events.
 */
export declare class GoogleTagManagerService {
    /**
     * Returns the GTM config for the widget to use
     */
    getWidgetConfig(containerId: string): {
        gtm: {
            containerId: string;
            dataLayerName: string;
            events: ("forefront_conversation_started" | "forefront_conversation_rated" | "forefront_conversation_reply" | "forefront_prechat_finished" | "forefront_prechat_started" | "forefront_widget_visitor_started_bot" | "forefront_widget_close" | "forefront_widget_open" | "forefront_widget_mute_notifications")[];
        };
    };
}
//# sourceMappingURL=analytics.provider.d.ts.map