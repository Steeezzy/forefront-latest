/**
 * MetaOAuthService — Facebook/Instagram OAuth token management.
 *
 * Handles the OAuth dialog URL generation, code-to-token exchange,
 * and fetch of connected pages + Instagram business accounts.
 */
import { redis } from '../../config/redis.js';
import * as crypto from 'crypto';
const API_VERSION = 'v19.0';
const FACEBOOK_URL = `https://www.facebook.com/${API_VERSION}`;
const GRAPH_URL = `https://graph.facebook.com/${API_VERSION}`;
export class MetaOAuthService {
    appId;
    appSecret;
    redirectUri;
    constructor() {
        this.appId = process.env.FB_APP_ID || '';
        this.appSecret = process.env.FB_APP_SECRET || '';
        this.redirectUri = process.env.FB_REDIRECT_URI || '';
    }
    /**
     * Get the Facebook OAuth dialog URL.
     */
    async getAuthorizationUrl(projectId, channel) {
        if (!this.appId || !this.redirectUri) {
            throw new Error('Meta OAuth not configured in environment (FB_APP_ID, FB_REDIRECT_URI)');
        }
        const nonce = crypto.randomBytes(16).toString('hex');
        const stateObj = { projectId, channel, nonce };
        const stateStr = Buffer.from(JSON.stringify(stateObj)).toString('base64');
        // Store nonce in Redis for 10 minutes (state validation)
        await redis.setex(`meta_auth_state:${nonce}`, 600, projectId);
        const scopes = channel === 'messenger'
            ? ['pages_show_list', 'pages_messaging', 'pages_read_engagement', 'pages_manage_metadata']
            : ['pages_show_list', 'instagram_basic', 'instagram_manage_messages'];
        const params = new URLSearchParams({
            client_id: this.appId,
            redirect_uri: this.redirectUri,
            state: stateStr,
            scope: scopes.join(','),
            response_type: 'code',
        });
        return `${FACEBOOK_URL}/dialog/oauth?${params.toString()}`;
    }
    /**
     * Handle exactly the redirect callback from Facebook.
     * Exchanges code for short-lived token, then short. for long-lived.
     * Fetches user's connected pages + IG accounts.
     */
    async handleCallback(code, stateBase64) {
        // 1. Validate State + Nonce
        let stateObj;
        try {
            stateObj = JSON.parse(Buffer.from(stateBase64, 'base64').toString('utf8'));
        }
        catch {
            throw new Error('Invalid state parameter format');
        }
        const cachedProject = await redis.get(`meta_auth_state:${stateObj.nonce}`);
        if (cachedProject !== stateObj.projectId) {
            throw new Error('Invalid state parameter (nonce missing or expired)');
        }
        await redis.del(`meta_auth_state:${stateObj.nonce}`); // Prevent replay
        // 2. Exchange code for short-lived access token
        const shortLivedToken = await this.exchangeCodeForToken(code);
        // 3. Exchange short-lived token for long-lived token (60 days)
        const longLivedToken = await this.getLongLivedToken(shortLivedToken);
        // 4. Fetch pages available to this user
        const pages = await this.getUserPages(longLivedToken);
        return { pages, projectId: stateObj.projectId, channel: stateObj.channel };
    }
    /**
     * Upgrade user token to a page token (never-expiring).
     */
    async exchangePageToken(pageId, userAccessToken) {
        const response = await fetch(`${GRAPH_URL}/${pageId}?fields=access_token&access_token=${userAccessToken}`);
        const data = await response.json();
        if (!response.ok)
            throw new Error(`Page token exchange failed: ${data.error?.message}`);
        return data.access_token;
    }
    /**
     * Get connected IG business account ID for a page.
     */
    async getInstagramAccountForPage(pageId, pageToken) {
        const response = await fetch(`${GRAPH_URL}/${pageId}?fields=instagram_business_account{id,username}&access_token=${pageToken}`);
        const data = await response.json();
        if (!response.ok)
            throw new Error(`Fetch IG account failed: ${data.error?.message}`);
        if (!data.instagram_business_account) {
            throw new Error(`No Instagram Business Account connected to Facebook Page ${pageId}`);
        }
        return {
            igAccountId: data.instagram_business_account.id,
            username: data.instagram_business_account.username || '',
        };
    }
    // ─── Private Helpers ───────────────────────────────────────────────
    async exchangeCodeForToken(code) {
        const params = new URLSearchParams({
            client_id: this.appId,
            redirect_uri: this.redirectUri,
            client_secret: this.appSecret,
            code,
        });
        const response = await fetch(`${GRAPH_URL}/oauth/access_token?${params.toString()}`);
        const data = await response.json();
        if (!response.ok)
            throw new Error(`Code exchange failed: ${data.error?.message}`);
        return data.access_token;
    }
    async getLongLivedToken(shortToken) {
        const params = new URLSearchParams({
            grant_type: 'fb_exchange_token',
            client_id: this.appId,
            client_secret: this.appSecret,
            fb_exchange_token: shortToken,
        });
        const response = await fetch(`${GRAPH_URL}/oauth/access_token?${params.toString()}`);
        const data = await response.json();
        if (!response.ok)
            throw new Error(`Long-lived token upgrade failed: ${data.error?.message}`);
        return data.access_token;
    }
    async getUserPages(userToken) {
        const response = await fetch(`${GRAPH_URL}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${userToken}`);
        const data = await response.json();
        if (!response.ok)
            throw new Error(`Fetch pages failed: ${data.error?.message}`);
        return data.data || [];
    }
}
export const metaOAuthService = new MetaOAuthService();
//# sourceMappingURL=MetaOAuthService.js.map