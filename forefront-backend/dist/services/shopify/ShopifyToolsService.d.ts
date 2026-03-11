/**
 * ShopifyToolsService — AI Function Calling tools for Shopify.
 *
 * Registers Shopify-specific tools into the ToolRegistryService
 * so Lyro can query orders, check product availability, initiate
 * refunds, and create draft orders via function calling.
 */
export declare class ShopifyToolsService {
    /**
     * Get all tool definitions for OpenAI function calling schema.
     */
    getToolDefinitions(): Array<{
        name: string;
        description: string;
        parameters: object;
    }>;
    /**
     * Execute a tool by name.
     */
    executeTool(toolName: string, args: Record<string, any>, workspaceId: string): Promise<string>;
    private getOrderStatus;
    private getCustomerOrders;
    private trackShipment;
    private checkAvailability;
    private cancelOrder;
    private initiateRefund;
    private getStoreId;
    private getStoreInfo;
    private getStoreCurrency;
}
export declare const shopifyToolsService: ShopifyToolsService;
//# sourceMappingURL=ShopifyToolsService.d.ts.map