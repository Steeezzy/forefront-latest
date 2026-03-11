export declare class UsageService {
    incrementMessageCount(workspaceId: string): Promise<void>;
    getUsage(workspaceId: string): Promise<{
        plan: {
            readonly id: "free";
            readonly name: "Free";
            readonly messageLimit: 50;
            readonly price: 0;
        } | {
            readonly id: "pro";
            readonly name: "Pro";
            readonly messageLimit: 1000;
            readonly price: 2900;
        } | {
            readonly id: "business";
            readonly name: "Business";
            readonly messageLimit: number;
            readonly price: 9900;
        };
        status: any;
        periodEnd: any;
        used: number;
        limit: number;
        remaining: number;
    }>;
    checkLimit(workspaceId: string): Promise<boolean>;
    trackTokens(workspaceId: string, tokens: number): Promise<void>;
}
//# sourceMappingURL=usage.service.d.ts.map