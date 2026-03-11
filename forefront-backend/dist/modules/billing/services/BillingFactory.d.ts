import type { IBillingProvider } from '../interfaces/IBillingProvider.js';
export declare class BillingFactory {
    private static stripeService;
    private static razorpayService;
    static getProvider(countryCode: string): IBillingProvider;
}
//# sourceMappingURL=BillingFactory.d.ts.map