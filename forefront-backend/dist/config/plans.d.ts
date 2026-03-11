export declare const PLANS: {
    readonly free: {
        readonly id: "free";
        readonly name: "Free";
        readonly messageLimit: 50;
        readonly price: 0;
    };
    readonly pro: {
        readonly id: "pro";
        readonly name: "Pro";
        readonly messageLimit: 1000;
        readonly price: 2900;
    };
    readonly business: {
        readonly id: "business";
        readonly name: "Business";
        readonly messageLimit: number;
        readonly price: 9900;
    };
};
export type PlanType = keyof typeof PLANS;
//# sourceMappingURL=plans.d.ts.map