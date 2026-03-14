/**
 * Widget Analytics — GA4 / GTM event emission
 *
 * Fires events to Google Analytics 4 (via gtag) and Google Tag Manager (via dataLayer)
 * when significant widget actions occur. This mirrors how Tidio pushes widget events
 * to the host page's analytics.
 *
 * Events emitted:
 *   - questron_widget_open        → visitor opens the chat widget
 *   - questron_widget_close       → visitor closes the widget
 *   - questron_conversation_start → a new conversation is created
 *   - questron_message_sent       → visitor sends a message
 *   - questron_message_received   → agent/AI replies
 *   - questron_prechat_submit     → pre-chat form submitted
 *   - questron_rating_submitted   → visitor rates conversation
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
  const eventName = `questron_${event}`;
  const eventData = {
    event_category: 'questron_widget',
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
