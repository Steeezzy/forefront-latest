/**
 * ShopifyOAuthService — Handles Shopify OAuth install/callback flow.
 *
 * Generates install URLs, verifies HMAC signatures, exchanges codes
 * for access tokens, and manages webhook registration.
 */
export declare class ShopifyOAuthService {
    /**
     * Generate the Shopify OAuth install URL.
     */
    getInstallUrl(shop: string, workspaceId: string): Promise<string>;
    /**
     * Handle the OAuth callback — verify HMAC, exchange code for token.
     */
    handleCallback(params: {
        code: string;
        shop: string;
        state: string;
        hmac: string;
        timestamp?: string;
    }): Promise<{
        accessToken: string;
        scopes: string[];
        workspaceId: string;
    }>;
    /**
     * Sync the backend URL to Shopify App Metafields.
     */
    syncBackendMetafield(shop: string, accessToken: string): Promise<void>;
    /**
     * Verify a Shopify webhook HMAC signature.
     */
    verifyWebhookSignature(rawBody: string | Buffer, hmacHeader: string): boolean;
}
export declare const shopifyOAuthService: ShopifyOAuthService;
//# sourceMappingURL=ShopifyOAuthService.d.ts.map