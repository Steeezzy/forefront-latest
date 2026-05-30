"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bot, CheckCircle2, Loader2, MessageSquare, PhoneCall, Settings2, Sparkles, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildProxyUrl } from "@/lib/backend-url";

type TabOption = "customer-service" | "conversa-ai" | "flows";

type FeatureStatus = "implemented" | "partial" | "missing" | "operational";

type BillingFeature = {
    id: string;
    label: string;
    category: string;
    status: FeatureStatus;
    summary: string;
    evidence?: string;
    enabled?: boolean;
};

type PlanTemplate = {
    id: string;
    family: TabOption;
    name: string;
    monthlyPrice: number;
    currency: string;
    billingMode: "free" | "self_serve" | "contact_sales";
    summary: string;
    meterDefaults: Record<string, number | null>;
    featureIds: string[];
};

type VoiceAddonTemplate = {
    id: string;
    name: string;
    monthlyPrice: number;
    currency: string;
    billingMode: "included" | "self_serve" | "contact_sales";
    summary: string;
    meterDefaults: Record<string, number | null>;
    featureIds: string[];
};

type MeterDefinition = {
    id: string;
    label: string;
    unit: string;
    summary: string;
};

type CatalogFamily = {
    id: TabOption;
    label: string;
    description: string;
    plans: PlanTemplate[];
};

type BillingCatalog = {
    planFamilies: CatalogFamily[];
    voiceAddons: VoiceAddonTemplate[];
    features: BillingFeature[];
    meters: MeterDefinition[];
    recommendation: {
        recommendedModel: string;
        summary: string;
        whyNotPureTokens: string[];
        recommendedMeters: string[];
    };
};

type WorkspacePlan = {
    workspaceId: string;
    basePlanId: string;
    voiceAddonId: string;
    basePlan: PlanTemplate;
    voiceAddon: VoiceAddonTemplate;
    meters: Record<string, number | null>;
    meterOverrides: Record<string, number | null>;
    featureOverrides: Record<string, boolean>;
    features: BillingFeature[];
    usage: Record<string, number>;
    recommendation: BillingCatalog["recommendation"];
};

const CUSTOMIZABLE_FEATURE_IDS = [
    "no_branding",
    "custom_branding",
    "openapi",
    "voice_campaigns",
    "voice_bookings",
    "voice_automation",
    "native_shopify_actions",
    "macros",
    "automatic_response",
    "live_typing",
    "product_recommendation",
    "inbound_calling",
];

const TAB_ICONS: Record<TabOption, typeof MessageSquare> = {
    "customer-service": MessageSquare,
    "conversa-ai": Bot,
    "flows": Workflow,
};

function formatMoney(value: number, currency = "USD") {
    if (!value) return `${currency} 0`;
    return `${currency} ${value}`;
}

function formatMeterValue(value: number | null) {
    return value === null ? "Unlimited" : value.toLocaleString();
}

function getFeatureTone(status: FeatureStatus) {
    if (status === "implemented") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (status === "partial") return "bg-amber-50 text-amber-700 border-amber-200";
    if (status === "missing") return "bg-rose-50 text-rose-700 border-rose-200";
    return "bg-slate-100 text-slate-600 border-slate-200";
}

export default function UpgradePage() {
    const [catalog, setCatalog] = useState<BillingCatalog | null>(null);
    const [workspacePlan, setWorkspacePlan] = useState<WorkspacePlan | null>(null);
    const [activeTab, setActiveTab] = useState<TabOption>("conversa-ai");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [draftBasePlanId, setDraftBasePlanId] = useState("");
    const [draftVoiceAddonId, setDraftVoiceAddonId] = useState("voice-none");
    const [draftMeterOverrides, setDraftMeterOverrides] = useState<Record<string, string>>({});
    const [draftFeatureOverrides, setDraftFeatureOverrides] = useState<Record<string, boolean>>({});

    useEffect(() => {
        void fetchUpgradeState();
    }, []);

    const fetchUpgradeState = async () => {
        setLoading(true);
        setError(null);
        try {
            const [catalogRes, workspaceRes] = await Promise.all([
                fetch(buildProxyUrl("/billing/catalog"), { credentials: "include" }),
                fetch(buildProxyUrl("/billing/workspace-plan"), { credentials: "include" }),
            ]);

            const catalogData = await catalogRes.json();
            const workspaceData = await workspaceRes.json();

            if (!catalogRes.ok) {
                throw new Error(catalogData.error || "Failed to load billing catalog");
            }
            if (!workspaceRes.ok) {
                throw new Error(workspaceData.error || "Failed to load workspace plan");
            }

            setCatalog(catalogData);
            setWorkspacePlan(workspaceData);
            setDraftBasePlanId(workspaceData.basePlanId);
            setDraftVoiceAddonId(workspaceData.voiceAddonId || "voice-none");
            setDraftMeterOverrides(
                Object.fromEntries(
                    Object.entries(workspaceData.meterOverrides || {}).map(([key, value]) => [
                        key,
                        value === null || value === undefined ? "" : String(value),
                    ])
                )
            );
            setDraftFeatureOverrides(workspaceData.featureOverrides || {});
        } catch (nextError: any) {
            setError(nextError.message || "Failed to load upgrade workspace");
        } finally {
            setLoading(false);
        }
    };

    const activeFamily = useMemo(
        () => catalog?.planFamilies.find((family) => family.id === activeTab) || null,
        [catalog, activeTab]
    );

    const customizableFeatures = useMemo(() => {
        if (!workspacePlan) return [];
        return workspacePlan.features.filter((feature) => CUSTOMIZABLE_FEATURE_IDS.includes(feature.id) && feature.status !== "operational");
    }, [workspacePlan]);

    const featureSummary = useMemo(() => {
        if (!workspacePlan) return { implemented: 0, partial: 0, missing: 0, operational: 0 };
        return workspacePlan.features.reduce((acc, feature) => {
            acc[feature.status] += feature.enabled ? 1 : 0;
            return acc;
        }, { implemented: 0, partial: 0, missing: 0, operational: 0 });
    }, [workspacePlan]);

    const saveWorkspacePlan = async () => {
        setSaving(true);
        setError(null);
        setSaveMessage(null);

        try {
            const meterOverrides = Object.fromEntries(
                Object.entries(draftMeterOverrides)
                    .map(([key, value]) => [key, value.trim() === "" ? null : Number(value)])
                    .filter(([, value]) => value === null || Number.isFinite(value as number))
            );

            const response = await fetch(buildProxyUrl("/billing/workspace-plan"), {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    basePlanId: draftBasePlanId,
                    voiceAddonId: draftVoiceAddonId,
                    meterOverrides,
                    featureOverrides: draftFeatureOverrides,
                    billingPreferences: {
                        monetizationModel: "hybrid_subscription_plus_usage_credits",
                    },
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Failed to save workspace plan");
            }

            setWorkspacePlan(data);
            setSaveMessage("Workspace entitlements updated.");
        } catch (nextError: any) {
            setError(nextError.message || "Failed to save workspace plan");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] text-gray-900 flex flex-col">
            <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div>
                        <div className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Billing Workspace</div>
                        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Plans, entitlements, and implementation coverage</h1>
                    </div>
                    <div className="rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-sm font-semibold text-orange-600">
                        Synced chat + voice pricing
                    </div>
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8">
                {loading ? (
                    <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-gray-200 bg-white">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
                    </div>
                ) : error ? (
                    <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-5 text-sm text-rose-700">
                        {error}
                    </div>
                ) : catalog && workspacePlan ? (
                    <>
                        <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
                            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Current workspace plan</div>
                                        <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                                            {workspacePlan.basePlan.name} + {workspacePlan.voiceAddon.name}
                                        </h2>
                                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                            The upgrade page now reflects what the product actually supports, and the workspace plan merges chat, flows, and voice entitlements from one source of truth.
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                                        <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Recommended billing model</div>
                                        <div className="mt-1 text-sm font-semibold text-slate-900">{catalog.recommendation.recommendedModel.replace(/_/g, " ")}</div>
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-3 md:grid-cols-4">
                                    <StatCard label="Implemented" value={featureSummary.implemented} tone="emerald" />
                                    <StatCard label="Partial" value={featureSummary.partial} tone="amber" />
                                    <StatCard label="Missing" value={featureSummary.missing} tone="rose" />
                                    <StatCard label="Operational only" value={featureSummary.operational} tone="slate" />
                                </div>

                                <div className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
                                    {catalog.meters.map((meter) => (
                                        <div key={meter.id} className="rounded-2xl border border-gray-200 bg-[#fcfcfb] p-4">
                                            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{meter.label}</div>
                                            <div className="mt-2 text-2xl font-semibold text-slate-900">
                                                {formatMeterValue(workspacePlan.meters[meter.id] ?? null)}
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">{meter.unit}</div>
                                            <div className="mt-2 text-xs text-slate-400">
                                                Used: {workspacePlan.usage?.[meter.id] !== undefined ? workspacePlan.usage[meter.id] : 0}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <Sparkles className="mt-0.5 h-5 w-5 text-sky-500" />
                                    <div>
                                        <div className="text-sm font-semibold text-slate-900">Why I do not recommend pure tokens</div>
                                        <div className="mt-2 text-sm leading-6 text-slate-500">
                                            {catalog.recommendation.summary}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-3">
                                    {catalog.recommendation.whyNotPureTokens.map((reason) => (
                                        <div key={reason} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                            {reason}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-5 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-4">
                                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">Recommended meters</div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {catalog.recommendation.recommendedMeters.map((meterId) => {
                                            const meter = catalog.meters.find((item) => item.id === meterId);
                                            return (
                                                <span key={meterId} className="rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-medium text-sky-700">
                                                    {meter?.label || meterId}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
                            <div className="grid gap-3 md:grid-cols-3">
                                {catalog.planFamilies.map((family) => {
                                    const Icon = TAB_ICONS[family.id];
                                    return (
                                        <button
                                            key={family.id}
                                            onClick={() => setActiveTab(family.id)}
                                            className={cn(
                                                "rounded-2xl border p-5 text-left transition",
                                                activeTab === family.id
                                                    ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                                                    : "border-gray-200 bg-[#fcfcfb] hover:border-slate-300"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon className={cn("h-5 w-5", activeTab === family.id ? "text-white" : "text-slate-500")} />
                                                <div className="text-sm font-semibold">{family.label}</div>
                                            </div>
                                            <div className={cn("mt-3 text-sm leading-6", activeTab === family.id ? "text-slate-200" : "text-slate-500")}>
                                                {family.description}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                            <div className="space-y-6">
                                <div className="grid gap-4 lg:grid-cols-3">
                                    {activeFamily?.plans.map((plan) => (
                                        <PlanCard
                                            key={plan.id}
                                            plan={plan}
                                            isCurrent={workspacePlan.basePlanId === plan.id}
                                            features={catalog.features.filter((feature) => plan.featureIds.includes(feature.id))}
                                            meters={catalog.meters}
                                            onSelect={() => setDraftBasePlanId(plan.id)}
                                        />
                                    ))}
                                </div>

                                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <PhoneCall className="h-5 w-5 text-slate-700" />
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900">Voice add-ons</div>
                                            <div className="text-sm text-slate-500">Voice capacity is now synced separately from the base chat/flows plan, then merged into one workspace entitlement set.</div>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                                        {catalog.voiceAddons.map((addon) => (
                                            <VoiceAddonCard
                                                key={addon.id}
                                                addon={addon}
                                                meters={catalog.meters}
                                                isCurrent={workspacePlan.voiceAddonId === addon.id}
                                                features={catalog.features.filter((feature) => addon.featureIds.includes(feature.id))}
                                                onSelect={() => setDraftVoiceAddonId(addon.id)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <Settings2 className="h-5 w-5 text-slate-700" />
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900">Workspace overrides</div>
                                            <div className="text-sm text-slate-500">Customize the synced plan for a specific workspace without inventing a new hardcoded tier.</div>
                                        </div>
                                    </div>

                                    <div className="mt-5 space-y-4">
                                        <div>
                                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Base plan</label>
                                            <select
                                                value={draftBasePlanId}
                                                onChange={(event) => setDraftBasePlanId(event.target.value)}
                                                className="h-11 w-full rounded-2xl border border-gray-200 bg-[#fcfcfb] px-4 text-sm outline-none"
                                            >
                                                {catalog.planFamilies.flatMap((family) =>
                                                    family.plans.map((plan) => (
                                                        <option key={plan.id} value={plan.id}>
                                                            {family.label} • {plan.name}
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Voice add-on</label>
                                            <select
                                                value={draftVoiceAddonId}
                                                onChange={(event) => setDraftVoiceAddonId(event.target.value)}
                                                className="h-11 w-full rounded-2xl border border-gray-200 bg-[#fcfcfb] px-4 text-sm outline-none"
                                            >
                                                {catalog.voiceAddons.map((addon) => (
                                                    <option key={addon.id} value={addon.id}>
                                                        {addon.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Meter overrides</div>
                                            <div className="grid gap-3 md:grid-cols-2">
                                                {catalog.meters.map((meter) => (
                                                    <label key={meter.id} className="rounded-2xl border border-gray-200 bg-[#fcfcfb] p-3">
                                                        <div className="text-sm font-medium text-slate-900">{meter.label}</div>
                                                        <div className="mt-1 text-xs text-slate-500">{meter.unit}</div>
                                                        <input
                                                            value={draftMeterOverrides[meter.id] || ""}
                                                            onChange={(event) => setDraftMeterOverrides((current) => ({ ...current, [meter.id]: event.target.value }))}
                                                            placeholder="Leave blank for default"
                                                            className="mt-3 h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none"
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Feature overrides</div>
                                            <div className="space-y-2">
                                                {customizableFeatures.map((feature) => {
                                                    const checked = draftFeatureOverrides[feature.id] ?? feature.enabled ?? false;
                                                    return (
                                                        <label key={feature.id} className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-[#fcfcfb] px-4 py-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={(event) =>
                                                                    setDraftFeatureOverrides((current) => ({
                                                                        ...current,
                                                                        [feature.id]: event.target.checked,
                                                                    }))
                                                                }
                                                                className="mt-1 h-4 w-4 rounded border-gray-300"
                                                            />
                                                            <div>
                                                                <div className="text-sm font-medium text-slate-900">{feature.label}</div>
                                                                <div className="mt-1 text-xs text-slate-500">{feature.summary}</div>
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                                            <div>{saveMessage || "Use overrides for enterprise deals, pilot accounts, and workspace-specific entitlement changes."}</div>
                                            <Button onClick={saveWorkspacePlan} disabled={saving} className="rounded-xl bg-slate-900 px-5 text-white hover:bg-slate-800">
                                                {saving ? "Saving..." : "Save Workspace Plan"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="h-5 w-5 text-slate-700" />
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900">Implementation audit</div>
                                            <div className="text-sm text-slate-500">Every upgrade-line item is now classified instead of being assumed complete.</div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-col gap-3">
                                        {workspacePlan.features
                                            .filter((feature) => feature.enabled)
                                            .sort((a, b) => a.label.localeCompare(b.label))
                                            .map((feature) => (
                                                <div key={feature.id} className="rounded-2xl border border-gray-200 bg-[#fcfcfb] p-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <div className="text-sm font-medium text-slate-900">{feature.label}</div>
                                                            <div className="mt-1 text-xs leading-5 text-slate-500">{feature.summary}</div>
                                                        </div>
                                                        <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize", getFeatureTone(feature.status))}>
                                                            {feature.status.replace("_", " ")}
                                                        </span>
                                                    </div>
                                                    {feature.evidence && (
                                                        <div className="mt-2 text-[11px] text-slate-400">Evidence: {feature.evidence}</div>
                                                    )}
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </>
                ) : null}
            </main>
        </div>
    );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "emerald" | "amber" | "rose" | "slate" }) {
    const toneMap = {
        emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
        amber: "bg-amber-50 border-amber-100 text-amber-700",
        rose: "bg-rose-50 border-rose-100 text-rose-700",
        slate: "bg-slate-100 border-slate-200 text-slate-700",
    };

    return (
        <div className={cn("rounded-2xl border px-4 py-4", toneMap[tone])}>
            <div className="text-xs font-semibold uppercase tracking-[0.22em]">{label}</div>
            <div className="mt-2 text-2xl font-semibold">{value}</div>
        </div>
    );
}

function PlanCard({
    plan,
    features,
    meters,
    isCurrent,
    onSelect,
}: {
    plan: PlanTemplate;
    features: BillingFeature[];
    meters: MeterDefinition[];
    isCurrent: boolean;
    onSelect: () => void;
}) {
    return (
        <div className={cn("flex h-full flex-col rounded-3xl border p-5 shadow-sm transition", isCurrent ? "border-slate-900 bg-slate-900 text-white" : "border-gray-200 bg-white")}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{plan.billingMode.replace(/_/g, " ")}</div>
                    <div className={cn("mt-2 text-2xl font-semibold", isCurrent ? "text-white" : "text-slate-900")}>{plan.name}</div>
                    <div className={cn("mt-2 text-sm leading-6", isCurrent ? "text-slate-200" : "text-slate-500")}>{plan.summary}</div>
                </div>
                {isCurrent && <CheckCircle2 className="h-5 w-5 text-emerald-300" />}
            </div>

            <div className={cn("mt-6 text-4xl font-semibold tracking-tight", isCurrent ? "text-white" : "text-slate-900")}>
                {formatMoney(plan.monthlyPrice, plan.currency)}
                <span className={cn("ml-2 text-sm font-medium", isCurrent ? "text-slate-300" : "text-slate-400")}>/ mo</span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
                {Object.entries(plan.meterDefaults)
                    .slice(0, 4)
                    .map(([meterId, value]) => {
                        const meter = meters.find((item) => item.id === meterId);
                        return (
                            <span
                                key={meterId}
                                className={cn(
                                    "rounded-full border px-3 py-1 text-xs font-medium",
                                    isCurrent ? "border-slate-700 bg-slate-800 text-slate-100" : "border-gray-200 bg-slate-50 text-slate-700"
                                )}
                            >
                                {meter?.label || meterId}: {formatMeterValue(value)}
                            </span>
                        );
                    })}
            </div>

            <div className="mt-5 flex-1 space-y-2">
                {features.slice(0, 8).map((feature) => (
                    <div key={feature.id} className={cn("flex items-center justify-between gap-3 rounded-2xl border px-3 py-2", isCurrent ? "border-slate-700 bg-slate-800" : "border-gray-200 bg-[#fcfcfb]")}>
                        <span className={cn("text-sm", isCurrent ? "text-slate-100" : "text-slate-700")}>{feature.label}</span>
                        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize", getFeatureTone(feature.status))}>
                            {feature.status}
                        </span>
                    </div>
                ))}
                {features.length > 8 && (
                    <div className={cn("text-xs", isCurrent ? "text-slate-300" : "text-slate-400")}>
                        +{features.length - 8} more features
                    </div>
                )}
            </div>

            <Button
                onClick={onSelect}
                className={cn(
                    "mt-6 rounded-2xl py-6",
                    isCurrent ? "bg-white text-slate-900 hover:bg-slate-100" : "bg-slate-900 text-white hover:bg-slate-800"
                )}
            >
                {isCurrent ? "Current base plan" : plan.billingMode === "contact_sales" ? "Use for custom deal" : "Set as base plan"}
            </Button>
        </div>
    );
}

function VoiceAddonCard({
    addon,
    meters,
    features,
    isCurrent,
    onSelect,
}: {
    addon: VoiceAddonTemplate;
    meters: MeterDefinition[];
    features: BillingFeature[];
    isCurrent: boolean;
    onSelect: () => void;
}) {
    return (
        <div className={cn("rounded-3xl border p-5 shadow-sm", isCurrent ? "border-sky-500 bg-sky-50" : "border-gray-200 bg-[#fcfcfb]")}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-sm font-semibold text-slate-900">{addon.name}</div>
                    <div className="mt-1 text-sm leading-6 text-slate-500">{addon.summary}</div>
                </div>
                {isCurrent && <CheckCircle2 className="h-5 w-5 text-sky-600" />}
            </div>

            <div className="mt-4 text-2xl font-semibold text-slate-900">
                {formatMoney(addon.monthlyPrice, addon.currency)}
                <span className="ml-2 text-sm font-medium text-slate-400">/ mo</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(addon.meterDefaults).map(([meterId, value]) => {
                    const meter = meters.find((item) => item.id === meterId);
                    return (
                        <span key={meterId} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                            {meter?.label || meterId}: {formatMeterValue(value)}
                        </span>
                    );
                })}
            </div>

            <div className="mt-4 space-y-2">
                {features.map((feature) => (
                    <div key={feature.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                        <span className="text-sm text-slate-700">{feature.label}</span>
                        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize", getFeatureTone(feature.status))}>
                            {feature.status}
                        </span>
                    </div>
                ))}
            </div>

            <Button onClick={onSelect} className="mt-5 w-full rounded-2xl bg-slate-900 py-6 text-white hover:bg-slate-800">
                {isCurrent ? "Current voice add-on" : addon.billingMode === "contact_sales" ? "Use for custom deal" : "Set voice add-on"}
            </Button>
        </div>
    );
}
