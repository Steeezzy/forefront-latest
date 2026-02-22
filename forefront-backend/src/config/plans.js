"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLANS = void 0;
exports.PLANS = {
    free: {
        id: 'free',
        name: 'Free',
        messageLimit: 50,
        price: 0,
    },
    pro: {
        id: 'pro',
        name: 'Pro',
        messageLimit: 1000,
        price: 2900, // in cents (Stripe) or paise (Razorpay)
    },
    business: {
        id: 'business',
        name: 'Business',
        messageLimit: Infinity,
        price: 9900,
    },
};
