import { StripeService } from './StripeService.js';
import { RazorpayService } from './RazorpayService.js';
export class BillingFactory {
    static stripeService = new StripeService();
    static razorpayService = new RazorpayService();
    static getProvider(countryCode) {
        if (countryCode === 'IN') {
            return this.razorpayService;
        }
        return this.stripeService;
    }
}
//# sourceMappingURL=BillingFactory.js.map