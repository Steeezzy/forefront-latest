"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export interface BillingStatus {
    planId: string;
    planName: string;
    status: string;
    currentPeriodEnd: string;
    isUnlimited: boolean;
    voiceAddonId?: string;
}

export interface BillingUsage {
    used: number;
    limit: number | null;
    remaining: number | null;
}

export function useBilling() {
    const [plan, setPlan] = useState<BillingStatus | null>(null);
    const [usage, setUsage] = useState<BillingUsage | null>(null);
    const [loading, setLoading] = useState(true);

    async function fetchBilling() {
        try {
            const status = await apiFetch("/billing/status");
            if (status) {
                setPlan({
                    planId: status.planId || 'conversa-free',
                    planName: status.plan || 'Free',
                    status: status.status || 'active',
                    currentPeriodEnd: status.periodEnd || '',
                    isUnlimited: !!status.isUnlimited,
                    voiceAddonId: status.voiceAddonId || 'voice-none',
                });
                setUsage({
                    used: status.usage?.messages || 0,
                    limit: status.isUnlimited ? null : (status.limits?.messages ?? 500),
                    remaining: status.isUnlimited ? null : Math.max((status.limits?.messages ?? 500) - (status.usage?.messages || 0), 0),
                });
            }
        } catch (error: any) {
            // Don't log auth errors - they're handled elsewhere
            if (error?.message !== 'UNAUTHORIZED') {
                console.error("Failed to fetch billing info", error);
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchBilling();
    }, []);

    const percent = usage && usage.limit && usage.limit > 0 ? (usage.used / usage.limit) * 100 : 0;
    const displayPercent = usage?.limit === null ? 0 : percent;

    const isNearLimit = displayPercent > 80;
    const isLimitReached = usage?.limit !== null && (usage ? usage.used >= usage.limit : false);

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
