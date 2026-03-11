/**
 * MetaOAuthService — Facebook/Instagram OAuth token management.
 *
 * Handles the OAuth dialog URL generation, code-to-token exchange,
 * and fetch of connected pages + Instagram business accounts.
 */
import type { MetaPage } from '../../types/social.types.js';
export declare class MetaOAuthService {
    private appId;
    private appSecret;
    private redirectUri;
    constructor();
    /**
     * Get the Facebook OAuth dialog URL.
     */
    getAuthorizationUrl(projectId: string, channel: 'instagram' | 'messenger'): Promise<string>;
    /**
     * Handle exactly the redirect callback from Facebook.
     * Exchanges code for short-lived token, then short. for long-lived.
     * Fetches user's connected pages + IG accounts.
     */
    handleCallback(code: string, stateBase64: string): Promise<{
        pages: MetaPage[];
        projectId: string;
        channel: string;
    }>;
    /**
     * Upgrade user token to a page token (never-expiring).
     */
    exchangePageToken(pageId: string, userAccessToken: string): Promise<string>;
    /**
     * Get connected IG business account ID for a page.
     */
    getInstagramAccountForPage(pageId: string, pageToken: string): Promise<{
        igAccountId: string;
        username: string;
    }>;
    private exchangeCodeForToken;
    private getLongLivedToken;
    private getUserPages;
}
export declare const metaOAuthService: MetaOAuthService;
//# sourceMappingURL=MetaOAuthService.d.ts.map