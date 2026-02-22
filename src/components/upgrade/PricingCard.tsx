"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PricingTier } from "./PricingData";

export function PricingCard({ tier }: { tier: PricingTier }) {
    const isPremium = tier.isPremium;
    const isPopular = tier.highlight === 'popular';
    const isCart = tier.highlight === 'cart';

    return (
        <div className={cn(
            "relative flex flex-col rounded-2xl transition-all duration-300",
            isPremium
                ? "bg-[#121626] border border-blue-900 shadow-xl shadow-blue-900/10 text-white"
                : isCart || isPopular
                    ? "bg-[#18181b] border-2 border-blue-600 shadow-lg text-white"
                    : "bg-[#18181b] border border-white/10 text-white"
        )}>
            {/* Highlight Pills */}
            {isCart && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#1e2330] text-blue-400 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-blue-500/30">
                        In your cart
                    </span>
                </div>
            )}
            {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-500/30">
                        Most popular
                    </span>
                </div>
            )}

            {/* Header Content */}
            <div className="p-6 md:p-8 flex flex-col items-center text-center border-b border-white/5">
                <h3 className={cn(
                    "text-xl font-bold mb-3",
                    isPremium ? "text-white" : "text-white"
                )}>
                    {tier.name}
                </h3>
                <p className={cn(
                    "text-sm min-h-[60px] mb-6",
                    isPremium ? "text-slate-300" : "text-slate-400"
                )}>
                    {tier.description}
                </p>

                <div className="flex items-end gap-1 mb-6">
                    {tier.price === 0 ? (
                        <span className="text-5xl font-extrabold tracking-tight">0</span>
                    ) : (
                        <span className="text-5xl font-extrabold tracking-tight">{tier.price}</span>
                    )}
                    <div className="flex flex-col text-left leading-none pb-1">
                        <span className="text-sm font-semibold text-slate-300">USD</span>
                        <span className="text-sm text-slate-500">{tier.billingPeriod}</span>
                    </div>
                </div>

                {tier.quotaLabel && (
                    <div className="w-full mb-6 relative">
                        <select className={cn(
                            "w-full appearance-none bg-[#0f1115] border border-white/10 text-slate-300 text-sm rounded-lg px-4 py-2.5 outline-none focus:ring-1 focus:ring-blue-500",
                            isPremium ? "border-blue-800" : ""
                        )}>
                            <option>{tier.quotaLabel}</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <span className="text-slate-500 text-xs">▼</span>
                        </div>
                    </div>
                )}

                <Button
                    className={cn(
                        "w-full rounded-lg font-semibold py-6 transition-all",
                        tier.buttonVariant === 'blue'
                            ? "bg-blue-600 hover:bg-blue-500 text-white"
                            : isPremium
                                ? "bg-white text-black hover:bg-slate-200"
                                : "bg-transparent border-2 border-white/20 hover:bg-white/5 text-white"
                    )}
                >
                    {tier.buttonText}
                </Button>
            </div>

            {/* Features List */}
            <div className="p-6 md:p-8 flex-1">
                <ul className="space-y-4">
                    {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                            <CheckCircle2
                                size={18}
                                className={cn(
                                    "flex-shrink-0 mt-0.5",
                                    isPremium ? "text-blue-400 opacity-90" : "text-blue-500 opacity-80"
                                )}
                                fill="currentColor"
                                stroke={isPremium ? "#121626" : "#18181b"}
                            />
                            <span className={cn(
                                "text-sm",
                                isPremium ? "text-slate-200" : "text-slate-300"
                            )}>
                                {feature.name}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
