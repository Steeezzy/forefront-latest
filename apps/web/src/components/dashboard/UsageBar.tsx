"use client";

import { useBilling } from "@/hooks/useBilling";
import Link from 'next/link';

export function UsageBar() {
    const { usage, percent, loading, isNearLimit, isLimitReached, plan } = useBilling();

    if (loading) return <div className="h-2 w-full bg-gray-800 animate-pulse rounded"></div>;
    if (!usage) return null;

    if (usage.limit === null) {
        return (
            <div className="p-4 bg-white rounded-lg border border-gray-800">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 text-sm">Plan Usage</span>
                    <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider">Unlimited</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{usage.used} <span className="text-sm font-normal text-gray-500">messages</span></p>
            </div>
        );
    }

    // Color Logic
    let barColor = "bg-emerald-500";
    if (percent > 75) barColor = "bg-amber-500";
    if (percent >= 100) barColor = "bg-red-500";

    return (
        <div className="p-4 bg-white rounded-lg border border-gray-800">
            <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm">Monthly Usage</span>
                <span className={`text-xs font-bold uppercase tracking-wider ${isLimitReached ? 'text-red-500' : 'text-gray-500'}`}>
                    {usage.used} / {usage.limit}
                </span>
            </div>

            <div className="w-full bg-gray-800 rounded-full h-2 mb-4 overflow-hidden">
                <div
                    className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                />
            </div>

            {isNearLimit && !isLimitReached && (
                <div className="text-xs text-amber-500 mb-3">
                    Running low on messages.
                </div>
            )}

            {isLimitReached && (
                <div className="text-xs text-red-500 mb-3 font-medium">
                    Limit reached. Upgrade to continue chatting.
                </div>
            )}

            {!plan?.isUnlimited && (
                <Link href="/panel/upgrade" className="w-full">
                    <button
                        style={{ background: '#9ccbc0', color: '#fff' }}
                        className="w-full py-2 text-sm font-semibold rounded-lg transition hover:opacity-90"
                    >
                        Upgrade Plan
                    </button>
                </Link>
            )}
        </div>
    );
}
