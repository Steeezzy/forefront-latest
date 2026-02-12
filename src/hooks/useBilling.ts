"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export interface BillingStatus {
    plan: 'free' | 'pro' | 'business';
    status: string;
    currentPeriodEnd: string;
}

export interface BillingUsage {
    used: number;
    limit: number;
    remaining: number;
}

export function useBilling() {
    const [plan, setPlan] = useState<BillingStatus | null>(null);
    const [usage, setUsage] = useState<BillingUsage | null>(null);
    const [loading, setLoading] = useState(true);

    async function fetchBilling() {
        try {
            const status = await apiFetch("/billing/status");
            const usageData = await apiFetch("/billing/usage");

            setPlan(status);
            setUsage(usageData);
        } catch (error) {
            console.error("Failed to fetch billing info", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchBilling();
    }, []);

    const percent = usage && usage.limit > 0 ? (usage.used / usage.limit) * 100 : 0;
    // Handle Infinity case for Business plan
    const displayPercent = usage?.limit === Infinity ? 0 : percent;

    const isNearLimit = displayPercent > 80;
    const isLimitReached = usage?.limit !== Infinity && (usage ? usage.used >= usage.limit : false);

    const upgrade = async (planId: string = 'pro') => {
        // Stub for upgrade logic - in real app this calls /billing/subscribe
        const res = await apiFetch("/billing/subscribe", {
            method: "POST",
            body: JSON.stringify({
                plan: planId,
                billingCountry: 'US' // TODO: Detect or use user preference
            })
        });
        if (res.checkoutUrl) {
            window.location.href = res.checkoutUrl;
        }
    };

    return {
        plan,
        usage,
        loading,
        percent: displayPercent,
        isNearLimit,
        isLimitReached,
        refresh: fetchBilling,
        upgrade
    };
}
