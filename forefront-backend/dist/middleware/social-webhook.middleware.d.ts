/**
 * Social Webhook Signature Verification Middleware
 *
 * Provides middleware to verify HMAC-SHA256 signatures for Meta (WhatsApp/Instagram/Messenger)
 * webhooks, as well as Telegram secret token verification.
 *
 * * REQUIRES * fastify-raw-body to be registered on the app so that req.rawBody exists.
 */
import { FastifyRequest, FastifyReply } from 'fastify';
/**
 * Common verification method for all Meta webhooks (Instagram, Messenger)
 * Standard format: "sha256=<hmac>" in the "x-hub-signature-256" header.
 */
export declare function verifyMetaWebhook(req: FastifyRequest, reply: FastifyReply): Promise<never>;
/**
 * WhatsApp Cloud API Webhook Verification
 * Identical signature to standard Meta webhooks, just uses potentially different token.
 */
export declare function verifyWhatsAppWebhook(req: FastifyRequest, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=social-webhook.middleware.d.ts.map