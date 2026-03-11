/**
 * Widget Analytics — GA4 / GTM event emission
 *
 * Fires events to Google Analytics 4 (via gtag) and Google Tag Manager (via dataLayer)
 * when significant widget actions occur. This mirrors how Tidio pushes widget events
 * to the host page's analytics.
 *
 * Events emitted:
 *   - forefront_widget_open        → visitor opens the chat widget
 *   - forefront_widget_close       → visitor closes the widget
 *   - forefront_conversation_start → a new conversation is created
 *   - forefront_message_sent       → visitor sends a message
 *   - forefront_message_received   → agent/AI replies
 *   - forefront_prechat_submit     → pre-chat form submitted
 *   - forefront_rating_submitted   → visitor rates conversation
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

type WidgetEvent =
  | 'widget_open'
  | 'widget_close'
  | 'conversation_start'
  | 'message_sent'
  | 'message_received'
  | 'prechat_submit'
  | 'rating_submitted';

interface EventParams {
  conversation_id?: string;
  message_length?: number;
  sender_type?: string;
  channel?: string;
  rating?: number;
  visitor_email?: string;
  [key: string]: any;
}

export function emitWidgetEvent(event: WidgetEvent, params: EventParams = {}): void {
  const eventName = `forefront_${event}`;
  const eventData = {
    event_category: 'forefront_widget',
    ...params,
    timestamp: new Date().toISOString(),
  };

  // GA4 via gtag.js
  if (typeof window !== 'undefined' && window.gtag) {
    try {
      window.gtag('event', eventName, eventData);
    } catch (e) {
      // silently fail — analytics should never break the widget
    }
  }

  // GTM via dataLayer
  if (typeof window !== 'undefined' && window.dataLayer) {
    try {
      window.dataLayer.push({
        event: eventName,
        ...eventData,
      });
    } catch (e) {
      // silently fail
    }
  }
}
