/**
 * Social Webhook Signature Verification Middleware
 *
 * Provides middleware to verify HMAC-SHA256 signatures for Meta (WhatsApp/Instagram/Messenger)
 * webhooks, as well as Telegram secret token verification.
 *
 * * REQUIRES * fastify-raw-body to be registered on the app so that req.rawBody exists.
 */
import * as crypto from 'crypto';
/**
 * Common verification method for all Meta webhooks (Instagram, Messenger)
 * Standard format: "sha256=<hmac>" in the "x-hub-signature-256" header.
 */
export async function verifyMetaWebhook(req, reply) {
    // 1. Initial setup challenge check (GET) — no secret needed, only verify token
    if (req.method === 'GET') {
        return handleMetaChallenge(req, reply, process.env.META_VERIFY_TOKEN);
    }
    // 2. Incoming Event Verification (POST)
    const secret = process.env.META_WEBHOOK_SECRET;
    if (!secret) {
        console.error('[Webhook] META_WEBHOOK_SECRET is not configured');
        return reply.code(500).send({ error: 'Server misconfiguration' });
    }
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) {
        console.warn(`[Webhook] Missing Meta signature from ${req.ip}`);
        return reply.code(403).send({ error: 'Missing signature' });
    }
    const rawBody = req.rawBody; // From fastify-raw-body
    if (!rawBody) {
        console.warn('[Webhook] Missing raw body for Meta signature verification');
        return reply.code(500).send({ error: 'Missing raw_body buffer' });
    }
    const expectedSignature = `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;
    try {
        const isMatch = crypto.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expectedSignature, 'utf8'));
        if (!isMatch) {
            console.warn(`[Webhook] Invalid Meta signature from ${req.ip}`);
            return reply.code(403).send({ error: 'Invalid signature' });
        }
    }
    catch (err) {
        console.warn(`[Webhook] Signature length mismatch from ${req.ip}`);
        return reply.code(403).send({ error: 'Invalid signature format' });
    }
}
/**
 * WhatsApp Cloud API Webhook Verification
 * Identical signature to standard Meta webhooks, just uses potentially different token.
 */
export async function verifyWhatsAppWebhook(req, reply) {
    // 1. Initial setup challenge check (GET) — no secret needed, only verify token
    if (req.method === 'GET') {
        return handleMetaChallenge(req, reply, process.env.WA_VERIFY_TOKEN || process.env.META_VERIFY_TOKEN);
    }
    // 2. Incoming Event Verification (POST)
    const secret = process.env.META_WEBHOOK_SECRET; // WhatsApp uses App Secret
    if (!secret) {
        console.error('[Webhook] META_WEBHOOK_SECRET is not configured for WhatsApp');
        return reply.code(500).send({ error: 'Server misconfiguration' });
    }
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) {
        console.warn(`[Webhook] Missing WhatsApp signature from ${req.ip}`);
        return reply.code(403).send({ error: 'Missing signature' });
    }
    const rawBody = req.rawBody;
    if (!rawBody) {
        console.warn('[Webhook] Missing raw body for WhatsApp signature verification');
        return reply.code(500).send({ error: 'Missing raw_body buffer' });
    }
    const expectedSignature = `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;
    try {
        const isMatch = crypto.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expectedSignature, 'utf8'));
        if (!isMatch) {
            console.warn(`[Webhook] Invalid WhatsApp signature from ${req.ip}`);
            return reply.code(403).send({ error: 'Invalid signature' });
        }
    }
    catch (err) {
        console.warn(`[Webhook] WhatsApp signature length mismatch from ${req.ip}`);
        return reply.code(403).send({ error: 'Invalid signature format' });
    }
}
/**
 * Helper to process Meta's hub.challenge GET requests
 */
function handleMetaChallenge(req, reply, expectedToken) {
    const query = req.query;
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];
    if (!expectedToken) {
        console.error('[Webhook] Verify token not configured on server');
        return reply.code(500).send({ error: 'Verify token missing' });
    }
    if (mode === 'subscribe' && token === expectedToken) {
        console.log('[Webhook] Successfully verified Meta challenge');
        return reply.code(200).send(challenge); // Meta requires EXACT challenge string back, not JSON
    }
    else {
        console.warn(`[Webhook] Failed challenge verification. Expected: ${expectedToken}, Got: ${token}`);
        return reply.code(403).send({ error: 'Forbidden' });
    }
}
//# sourceMappingURL=social-webhook.middleware.js.map