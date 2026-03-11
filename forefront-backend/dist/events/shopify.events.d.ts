/**
 * Shopify Event Emitters & Listeners.
 *
 * Provides a global event emitter for Shopify webhooks (orders, checkouts, etc.)
 * so other modules (like workflows or inbox) can react asynchronously.
 */
import { EventEmitter } from 'events';
export declare const shopifyEventEmitter: EventEmitter<any>;
//# sourceMappingURL=shopify.events.d.ts.map