/**
 * ShopifyOAuthService — Handles Shopify OAuth install/callback flow.
 *
 * Generates install URLs, verifies HMAC signatures, exchanges codes
 * for access tokens, and manages webhook registration.
 */

import * as crypto from 'crypto';
import { redis } from '../../config/redis.js';

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY || '';
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || '';
const SHOPIFY_APP_URL = process.env.SHOPIFY_APP_URL || 'http://localhost:5000';
const DEFAULT_SCOPES = process.env.SHOPIFY_SCOPES ||
    'read_orders,write_orders,read_customers,write_customers,read_products,read_inventory,read_fulfillments,write_fulfillments,read_checkouts,read_shipping,write_draft_orders';

const SHOP_REGEX = /^[a-zA-Z0-9-]+\.myshopify\.com$/;

export class ShopifyOAuthService {

    /**
     * Generate the Shopify OAuth install URL.
     */
    async getInstallUrl(shop: string, workspaceId: string): Promise<string> {
        if (!SHOP_REGEX.test(shop)) throw new Error('Invalid shop domain format');
        if (!SHOPIFY_API_KEY) throw new Error('SHOPIFY_API_KEY not configured');

        const nonce = crypto.randomBytes(16).toString('hex');
        await redis.setex(`shopify_auth:${nonce}`, 600, JSON.stringify({ workspaceId, shop }));

        const redirectUri = `${SHOPIFY_APP_URL}/api/shopify/callback`;
        const params = new URLSearchParams({
            client_id: SHOPIFY_API_KEY,
            scope: DEFAULT_SCOPES,
            redirect_uri: redirectUri,
            state: nonce,
        });

        return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
    }

    /**
     * Handle the OAuth callback — verify HMAC, exchange code for token.
     */
    async handleCallback(params: {
        code: string; shop: string; state: string; hmac: string;
        timestamp?: string;
    }): Promise<{ accessToken: string; scopes: string[]; workspaceId: string }> {
        const { code, shop, state, hmac } = params;

        // 1. Validate shop format
        if (!SHOP_REGEX.test(shop)) throw new Error('Invalid shop domain');

        // 2. Verify HMAC
        const queryParams: Record<string, string> = { ...params };
        delete queryParams.hmac;
        const sortedKeys = Object.keys(queryParams).sort();
        const message = sortedKeys.map((k) => `${k}=${queryParams[k]}`).join('&');
        const expected = crypto.createHmac('sha256', SHOPIFY_API_SECRET).update(message).digest('hex');

        if (!crypto.timingSafeEqual(Buffer.from(hmac, 'utf8'), Buffer.from(expected, 'utf8'))) {
            throw new Error('HMAC verification failed');
        }

        // 3. Validate state nonce
        const cached = await redis.get(`shopify_auth:${state}`);
        if (!cached) throw new Error('Invalid or expired state nonce');
        await redis.del(`shopify_auth:${state}`);

        const { workspaceId } = JSON.parse(cached);

        // 4. Exchange code for access token
        const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: SHOPIFY_API_KEY,
                client_secret: SHOPIFY_API_SECRET,
                code,
            }),
        });

        const tokenData: any = await tokenRes.json();
        if (!tokenRes.ok) throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`);

        return {
            accessToken: tokenData.access_token,
            scopes: (tokenData.scope || '').split(','),
            workspaceId,
        };
    }

    /**
     * Verify a Shopify webhook HMAC signature.
     */
    verifyWebhookSignature(rawBody: string | Buffer, hmacHeader: string): boolean {
        try {
            const hash = crypto.createHmac('sha256', SHOPIFY_API_SECRET)
                .update(rawBody)
                .digest('base64');
            return crypto.timingSafeEqual(Buffer.from(hash, 'utf8'), Buffer.from(hmacHeader, 'utf8'));
        } catch {
            return false;
        }
    }
}

export const shopifyOAuthService = new ShopifyOAuthService();
