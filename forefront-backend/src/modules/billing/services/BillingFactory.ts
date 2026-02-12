import type { IBillingProvider } from '../interfaces/IBillingProvider.js';
import { StripeService } from './StripeService.js';
import { RazorpayService } from './RazorpayService.js';

export class BillingFactory {
    private static stripeService = new StripeService();
    private static razorpayService = new RazorpayService();

    static getProvider(countryCode: string): IBillingProvider {
        if (countryCode === 'IN') {
            return this.razorpayService;
        }
        return this.stripeService;
    }
}
