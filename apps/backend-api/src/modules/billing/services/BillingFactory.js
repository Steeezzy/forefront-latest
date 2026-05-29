"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingFactory = void 0;
var StripeService_js_1 = require("./StripeService.js");
var RazorpayService_js_1 = require("./RazorpayService.js");
var BillingFactory = /** @class */ (function () {
    function BillingFactory() {
    }
    BillingFactory.getProvider = function (countryCode) {
        if (countryCode === 'IN') {
            return this.razorpayService;
        }
        return this.stripeService;
    };
    BillingFactory.stripeService = new StripeService_js_1.StripeService();
    BillingFactory.razorpayService = new RazorpayService_js_1.RazorpayService();
    return BillingFactory;
}());
exports.BillingFactory = BillingFactory;
