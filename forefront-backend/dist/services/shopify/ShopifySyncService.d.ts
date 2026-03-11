/**
 * ShopifySyncService — Initial and incremental data sync from Shopify.
 *
 * Handles paginated sync of customers, products, orders, and abandoned
 * checkouts into local PostgreSQL tables. Tracks progress via sync jobs.
 */
import type { SyncResult } from '../../types/ecommerce.types.js';
export declare class ShopifySyncService {
    /**
     * Run full initial sync after OAuth install. Called in background.
     */
    initialSync(storeId: string, shopDomain: string, accessToken: string): Promise<SyncResult>;
    /**
     * Incremental sync — only updated records since last sync.
     */
    incrementalSync(storeId: string): Promise<SyncResult>;
    upsertCustomer(storeId: string, raw: any): Promise<string>;
    upsertOrder(storeId: string, raw: any): Promise<string>;
    upsertProduct(storeId: string, raw: any): Promise<string>;
    upsertAbandonedCheckout(storeId: string, raw: any): Promise<string>;
    /**
     * Link a Shopify customer to a local Contact by email match.
     */
    linkCustomerToContact(storeId: string, shopifyCustomerId: string): Promise<void>;
    private fetchCustomersPage;
    private getShopDomainForClient;
    private updateJobProgress;
}
export declare const shopifySyncService: ShopifySyncService;
//# sourceMappingURL=ShopifySyncService.d.ts.map