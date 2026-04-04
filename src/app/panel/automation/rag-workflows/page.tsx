"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bot, Building2, Loader2, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { buildProxyUrl } from "@/lib/backend-url";
import { industries as localIndustries } from "@/data/industries";

type WorkflowCategory = "ai" | "sales" | "it-ops" | "marketing" | "document-ops" | "support" | "other";

interface CategoryOption {
    id: WorkflowCategory;
    label: string;
}

interface IndustryOption {
    id: string;
    name: string;
    aliases?: string[];
    defaultCategories?: WorkflowCategory[];
    servicePackages?: string[];
}

interface RecommendationTemplate {
    id: string;
    title: string;
    url: string;
    category: WorkflowCategory;
    subcategory: string;
    summary: string;
    triggerMode: string;
    requiredApps: string[];
    matchedKeywords: string[];
    matchedProblems: string[];
    webhookFree: boolean;
}

interface RecommendationResult {
    industry: {
        id?: string | null;
        name: string;
        matched: boolean;
        servicePackages: string[];
    };
    summary: string;
    templates: RecommendationTemplate[];
    implementationBlueprint: Array<{
        phase: string;
        objective: string;
        actions: string[];
        suggestedTemplates: string[];
    }>;
    setupChecklist: {
        requiredApps: string[];
        actions: string[];
    };
    discoveredIndustries: Array<{
        industry: string;
        whyNow: string;
        highImpactServices: string[];
    }>;
}

const FALLBACK_CATEGORIES: CategoryOption[] = [
    { id: "ai", label: "AI" },
    { id: "sales", label: "Sales" },
    { id: "it-ops", label: "IT Ops" },
    { id: "marketing", label: "Marketing" },
    { id: "document-ops", label: "Document Ops" },
    { id: "support", label: "Support" },
    { id: "other", label: "Other" },
];

function splitLines(value: string) {
    return value
        .split(/\n|,/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function categoryTone(category: WorkflowCategory) {
    if (category === "ai") return { bg: "#eef2ff", color: "#4338ca" };
    if (category === "sales") return { bg: "#ecfeff", color: "#0f766e" };
    if (category === "it-ops") return { bg: "#f1f5f9", color: "#334155" };
    if (category === "marketing") return { bg: "#fff7ed", color: "#c2410c" };
    if (category === "document-ops") return { bg: "#fefce8", color: "#a16207" };
    if (category === "support") return { bg: "#ecfdf5", color: "#047857" };
    return { bg: "#fdf4ff", color: "#a21caf" };
}

export default function AutomationRagWorkflowPage() {
    const [industryId, setIndustryId] = useState("");
    const [customIndustryName, setCustomIndustryName] = useState("");
    const [problemStatement, setProblemStatement] = useState("");
    const [goalsInput, setGoalsInput] = useState("");
    const [painInput, setPainInput] = useState("");
    const [categories, setCategories] = useState<WorkflowCategory[]>(["ai", "sales", "support", "document-ops"]);
    const [avoidWebhooks] = useState(true);
    const [maxTemplates, setMaxTemplates] = useState(12);

    const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>(FALLBACK_CATEGORIES);
    const [industryOptions, setIndustryOptions] = useState<IndustryOption[]>([]);
    const [metaLoading, setMetaLoading] = useState(true);

    const [result, setResult] = useState<RecommendationResult | null>(null);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadMeta = async () => {
            try {
                const [categoriesRes, industriesRes] = await Promise.all([
                    fetch(buildProxyUrl("/api/workflows/niche-rag/categories")),
                    fetch(buildProxyUrl("/api/workflows/niche-rag/industries")),
                ]);

                if (categoriesRes.ok) {
                    const categoryPayload = await categoriesRes.json();
                    if (categoryPayload?.data?.categories?.length) {
                        setCategoryOptions(categoryPayload.data.categories);
                    }
                }

                if (industriesRes.ok) {
                    const industryPayload = await industriesRes.json();
                    if (industryPayload?.data?.industries?.length) {
                        setIndustryOptions(industryPayload.data.industries);
                    }
                }
            } catch {
                // Keep fallback values if discovery endpoints fail.
            } finally {
                setMetaLoading(false);
            }
        };

        void loadMeta();
    }, []);

    const mergedIndustries = useMemo(() => {
        const fromBackend = industryOptions.map((item) => ({ id: item.id, name: item.name }));
        const fromLocal = localIndustries.map((item) => ({ id: item.id, name: item.name }));
        const unique = new Map<string, { id: string; name: string }>();

        [...fromBackend, ...fromLocal].forEach((item) => {
            unique.set(item.id, item);
        });

        return Array.from(unique.values()).sort((left, right) => left.name.localeCompare(right.name));
    }, [industryOptions]);

    const toggleCategory = (category: WorkflowCategory) => {
        setCategories((current) => {
            if (current.includes(category)) {
                return current.filter((item) => item !== category);
            }
            return [...current, category];
        });
    };

    const generateBlueprint = async () => {
        setError(null);
        setResult(null);

        if (!problemStatement.trim()) {
            setError("Add a business problem statement before generating the automation stack.");
            return;
        }

        if (categories.length === 0) {
            setError("Pick at least one workflow category.");
            return;
        }

        setGenerating(true);

        try {
            const response = await fetch(buildProxyUrl("/api/workflows/niche-rag/recommend"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    industryId: industryId || undefined,
                    industryName: customIndustryName.trim() || undefined,
                    problemStatement: problemStatement.trim(),
                    goals: splitLines(goalsInput),
                    painPoints: splitLines(painInput),
                    categories,
                    avoidWebhooks,
                    maxTemplates,
                }),
            });

            const payload = await response.json();
            if (!response.ok || !payload?.success) {
                throw new Error(payload?.error || "Failed to generate recommendations");
            }

            setResult(payload.data);
        } catch (nextError: any) {
            setError(nextError?.message || "Failed to generate recommendations");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div style={{ background: "#fafafa", minHeight: "100vh", width: "100%" }}>
            <div style={{
                height: "52px",
                background: "#ffffff",
                borderBottom: "1px solid #e4e4e7",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 32px",
            }}>
                <div style={{ fontSize: "13px", color: "#9ca3af" }}>
                    Dashboard &gt; Automation &gt; <span style={{ color: "#09090b" }}>Niche Workflow Planner</span>
                </div>
                <a
                    href="/panel/automation"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        color: "#374151",
                        textDecoration: "none",
                        border: "1px solid #e4e4e7",
                        borderRadius: "10px",
                        padding: "6px 10px",
                        background: "#fff",
                    }}
                >
                    <ArrowLeft size={14} /> Back to Automation
                </a>
            </div>

            <div style={{ padding: "28px 32px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start", flexWrap: "wrap" }}>
                    <div>
                        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#09090b", margin: 0 }}>Webhook-Free RAG Workflow Builder</h1>
                        <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "6px", maxWidth: "760px" }}>
                            Built from free n8n templates across AI, Sales, IT Ops, Marketing, Document Ops, Support, and Other.
                            This planner returns non-technical automation blueprints for your target niche without public webhook dependencies.
                        </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#047857", borderRadius: "999px", padding: "6px 12px", fontSize: "12px", fontWeight: 600 }}>
                        <ShieldCheck size={14} /> Webhook-free mode enabled
                    </div>
                </div>

                <div style={{ marginTop: "18px", background: "#fff", border: "1px solid #e4e4e7", borderRadius: "18px", padding: "18px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>Target industry</label>
                            <select
                                value={industryId}
                                onChange={(event) => setIndustryId(event.target.value)}
                                style={{ width: "100%", height: "40px", borderRadius: "10px", border: "1px solid #e4e4e7", padding: "0 10px", fontSize: "13px", outline: "none", background: "#fff" }}
                            >
                                <option value="">Select industry (optional)</option>
                                {mergedIndustries.map((industry) => (
                                    <option key={industry.id} value={industry.id}>{industry.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>Custom industry label (optional)</label>
                            <input
                                value={customIndustryName}
                                onChange={(event) => setCustomIndustryName(event.target.value)}
                                placeholder="Example: D2C cosmetic brand with WhatsApp-heavy support"
                                style={{ width: "100%", height: "40px", borderRadius: "10px", border: "1px solid #e4e4e7", padding: "0 10px", fontSize: "13px", outline: "none" }}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: "12px" }}>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>Business problem statement</label>
                        <textarea
                            value={problemStatement}
                            onChange={(event) => setProblemStatement(event.target.value)}
                            rows={4}
                            placeholder="Describe what your client needs automated end-to-end without technical work."
                            style={{ width: "100%", borderRadius: "10px", border: "1px solid #e4e4e7", padding: "10px", fontSize: "13px", outline: "none", resize: "vertical", lineHeight: 1.5 }}
                        />
                    </div>

                    <div style={{ marginTop: "12px", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>Goals (comma or new line)</label>
                            <textarea
                                value={goalsInput}
                                onChange={(event) => setGoalsInput(event.target.value)}
                                rows={3}
                                placeholder="Increase qualified leads, reduce support response time, automate reminders"
                                style={{ width: "100%", borderRadius: "10px", border: "1px solid #e4e4e7", padding: "10px", fontSize: "13px", outline: "none", resize: "vertical", lineHeight: 1.5 }}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>Pain points (comma or new line)</label>
                            <textarea
                                value={painInput}
                                onChange={(event) => setPainInput(event.target.value)}
                                rows={3}
                                placeholder="Missed follow-ups, repetitive support tickets, invoice backlog"
                                style={{ width: "100%", borderRadius: "10px", border: "1px solid #e4e4e7", padding: "10px", fontSize: "13px", outline: "none", resize: "vertical", lineHeight: 1.5 }}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: "14px" }}>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>Workflow categories</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                            {categoryOptions.map((option) => {
                                const active = categories.includes(option.id);
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => toggleCategory(option.id)}
                                        style={{
                                            border: active ? "1px solid #111827" : "1px solid #d4d4d8",
                                            background: active ? "#111827" : "#fff",
                                            color: active ? "#fff" : "#374151",
                                            borderRadius: "999px",
                                            padding: "6px 11px",
                                            fontSize: "12px",
                                            cursor: "pointer",
                                            fontWeight: 600,
                                        }}
                                    >
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ marginTop: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#047857", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "999px", padding: "6px 10px" }}>
                            <ShieldCheck size={14} /> Avoid webhooks: ON
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <label style={{ fontSize: "12px", color: "#6b7280" }}>Max templates</label>
                            <input
                                type="number"
                                value={maxTemplates}
                                onChange={(event) => setMaxTemplates(Math.max(4, Math.min(24, Number(event.target.value) || 12)))}
                                min={4}
                                max={24}
                                style={{ width: "72px", height: "36px", borderRadius: "10px", border: "1px solid #e4e4e7", padding: "0 8px", fontSize: "13px" }}
                            />
                        </div>
                        <button
                            onClick={generateBlueprint}
                            disabled={generating || metaLoading}
                            style={{
                                border: "none",
                                background: generating ? "#4b5563" : "#111827",
                                color: "#fff",
                                borderRadius: "10px",
                                padding: "9px 14px",
                                fontSize: "13px",
                                fontWeight: 700,
                                cursor: generating ? "not-allowed" : "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "7px",
                            }}
                        >
                            {generating ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={14} />}
                            Generate Automation Blueprint
                        </button>
                    </div>
                </div>

                {error && (
                    <div style={{ marginTop: "14px", background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "12px", padding: "10px 12px", fontSize: "13px" }}>
                        {error}
                    </div>
                )}

                {result && (
                    <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
                        <div style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: "16px", padding: "16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 700, color: "#111827" }}>
                                <Bot size={16} /> Solution Summary
                            </div>
                            <p style={{ marginTop: "8px", fontSize: "13px", color: "#4b5563", lineHeight: 1.6 }}>{result.summary}</p>
                            <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                {result.industry.servicePackages.map((service) => (
                                    <span key={service} style={{ fontSize: "11px", background: "#f4f4f5", color: "#111827", borderRadius: "999px", padding: "5px 9px" }}>
                                        {service}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: "16px", padding: "16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 700, color: "#111827", marginBottom: "10px" }}>
                                <Workflow size={16} /> Recommended Free Templates
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px" }}>
                                {result.templates.map((template) => {
                                    const tone = categoryTone(template.category);
                                    return (
                                        <div key={template.id} style={{ border: "1px solid #eceae4", borderRadius: "12px", padding: "12px", background: "#fff" }}>
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                                                <div style={{ fontSize: "13px", fontWeight: 700, color: "#111827", lineHeight: 1.4 }}>{template.title}</div>
                                                <span style={{ fontSize: "10px", fontWeight: 700, background: tone.bg, color: tone.color, borderRadius: "999px", padding: "4px 7px", whiteSpace: "nowrap" }}>
                                                    {template.category}
                                                </span>
                                            </div>
                                            <div style={{ marginTop: "6px", fontSize: "12px", color: "#6b7280", lineHeight: 1.5 }}>{template.summary}</div>
                                            <div style={{ marginTop: "8px", fontSize: "11px", color: "#6b7280" }}>
                                                Trigger: {template.triggerMode} · Webhook-free: {template.webhookFree ? "Yes" : "No"}
                                            </div>
                                            <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                                {template.matchedKeywords.slice(0, 4).map((keyword) => (
                                                    <span key={keyword} style={{ fontSize: "10px", background: "#f4f4f5", color: "#374151", borderRadius: "999px", padding: "3px 6px" }}>
                                                        {keyword}
                                                    </span>
                                                ))}
                                            </div>
                                            <a
                                                href={template.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{ marginTop: "9px", display: "inline-block", fontSize: "11px", fontWeight: 700, color: "#111827", textDecoration: "none" }}
                                            >
                                                Open n8n template ↗
                                            </a>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px" }}>
                            <div style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: "16px", padding: "16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 700, color: "#111827", marginBottom: "10px" }}>
                                    <Building2 size={16} /> Implementation Blueprint
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    {result.implementationBlueprint.map((phase) => (
                                        <div key={phase.phase} style={{ border: "1px solid #eceae4", borderRadius: "12px", padding: "10px" }}>
                                            <div style={{ fontSize: "12px", fontWeight: 700, color: "#111827" }}>{phase.phase}</div>
                                            <div style={{ fontSize: "12px", color: "#6b7280", lineHeight: 1.5, marginTop: "4px" }}>{phase.objective}</div>
                                            <div style={{ marginTop: "6px", fontSize: "11px", color: "#374151", lineHeight: 1.55 }}>
                                                {phase.actions.map((action) => `• ${action}`).join("\n")}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                <div style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: "16px", padding: "16px" }}>
                                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>Non-Technical Setup Checklist</div>
                                    <div style={{ marginTop: "9px", fontSize: "12px", color: "#4b5563", lineHeight: 1.6 }}>
                                        {result.setupChecklist.actions.map((item) => `• ${item}`).join("\n")}
                                    </div>
                                    <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                        {result.setupChecklist.requiredApps.map((app) => (
                                            <span key={app} style={{ fontSize: "10px", background: "#f4f4f5", borderRadius: "999px", padding: "4px 7px", color: "#111827" }}>
                                                {app}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: "16px", padding: "16px" }}>
                                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>New Industry Opportunities</div>
                                    <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                        {result.discoveredIndustries.map((entry) => (
                                            <div key={entry.industry} style={{ border: "1px solid #eceae4", borderRadius: "10px", padding: "8px" }}>
                                                <div style={{ fontSize: "12px", fontWeight: 700, color: "#111827" }}>{entry.industry}</div>
                                                <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "3px", lineHeight: 1.45 }}>{entry.whyNow}</div>
                                                <div style={{ marginTop: "5px", fontSize: "11px", color: "#374151", lineHeight: 1.5 }}>
                                                    {entry.highImpactServices.map((service) => `• ${service}`).join("\n")}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
        </div>
    );
}
