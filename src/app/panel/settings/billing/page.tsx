"use client";

import { useEffect, useState } from "react";
import { CreditCard, ArrowUpRight, Check, AlertCircle, TrendingUp } from "lucide-react";
import { buildProxyUrl } from "@/lib/backend-url";

interface PlanInfo {
  plan: string;
  status: string;
  limits: Record<string, number>;
  planDetails?: {
    name: string;
    priceMonthly: number;
    features: string[];
  };
  current_period_end?: string;
  cancel_at_period_end?: boolean;
}

interface UsageInfo {
  [key: string]: number;
}

const USAGE_LABELS: Record<string, string> = {
  voice_minutes: "Voice Minutes",
  chat_messages: "Chat Messages",
  agents: "AI Agents",
  campaigns: "Campaigns",
  knowledge_sources: "Knowledge Sources",
  contacts: "Contacts",
};

export default function BillingPage() {
  const [subscription, setSubscription] = useState<PlanInfo | null>(null);
  const [usage, setUsage] = useState<UsageInfo>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBilling() {
      try {
        const res = await fetch(buildProxyUrl("/billing/subscription"), { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setSubscription(data.subscription);
          setUsage(data.usage || {});
        }
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    }
    fetchBilling();
  }, []);

  const handleUpgrade = async (planId: string) => {
    try {
      const res = await fetch(buildProxyUrl("/billing/checkout"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId, interval: "month" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
    }
  };

  const plan = subscription?.planDetails;
  const planName = plan?.name || subscription?.plan || "Free";
  const limits = subscription?.limits || {};

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-32 bg-gray-100 rounded-xl" />
          <div className="h-48 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Billing & Subscription</h1>
      <p className="text-sm text-gray-500 mb-8">Manage your plan, usage, and payment method.</p>

      {/* Current Plan Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gray-900 rounded-xl flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{planName} Plan</h2>
              <p className="text-xs text-gray-500">
                {subscription?.status === "active" ? "Active" : subscription?.status || "Active"}
                {subscription?.cancel_at_period_end && " · Cancels at period end"}
              </p>
            </div>
          </div>
          {plan?.priceMonthly ? (
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">₹{plan.priceMonthly.toLocaleString("en-IN")}</div>
              <div className="text-xs text-gray-500">/month</div>
            </div>
          ) : (
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">Free</div>
            </div>
          )}
        </div>

        {subscription?.current_period_end && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
            <AlertCircle size={12} />
            Current period ends {new Date(subscription.current_period_end).toLocaleDateString("en-IN")}
          </div>
        )}

        <div className="flex gap-3">
          {planName === "Free" || planName === "Starter" ? (
            <button
              onClick={() => handleUpgrade("growth")}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 flex items-center gap-2"
            >
              <TrendingUp size={14} />
              Upgrade to Growth
            </button>
          ) : null}
          <a
            href="/pricing"
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            View All Plans
            <ArrowUpRight size={14} />
          </a>
        </div>
      </div>

      {/* Usage Bars */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">This Month&apos;s Usage</h3>
        <div className="space-y-4">
          {Object.entries(USAGE_LABELS).map(([key, label]) => {
            const used = usage[key] || 0;
            const limit = (limits as any)[key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())] || 0;
            const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

            return (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{label}</span>
                  <span className="text-gray-500">
                    {used.toLocaleString()} / {limit.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      percent >= 90 ? "bg-red-500" : percent >= 70 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Plan Features */}
      {plan?.features && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Your Plan Includes</h3>
          <div className="grid grid-cols-2 gap-2">
            {plan.features.map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                <Check size={14} className="text-emerald-500 flex-shrink-0" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
