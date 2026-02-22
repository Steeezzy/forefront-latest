import { StripeService } from './StripeService.js';
import { RazorpayService } from './RazorpayService.js';
export class BillingFactory {
    static get stripeService() {
        if (!this._stripeService) {
            this._stripeService = new StripeService();
        }
        return this._stripeService;
    }
    static get razorpayService() {
        if (!this._razorpayService) {
            this._razorpayService = new RazorpayService();
        }
        return this._razorpayService;
    }
    static getProvider(countryCode) {
        if (countryCode === 'IN') {
            return this.razorpayService;
        }
        return this.stripeService;
    }
}
// Lazy-initialized to avoid blocking server startup
BillingFactory._stripeService = null;
BillingFactory._razorpayService = null;
