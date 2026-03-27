"use client";

import { useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    Bot,
    CheckCircle2,
    Filter,
    Loader2,
    Plus,
    Settings2,
    ShieldAlert,
    Sparkles,
    Tags,
    Ticket,
    ToggleLeft,
    ToggleRight,
    Trash2,
    Workflow,
    X,
    Zap,
} from "lucide-react";
import { buildProxyUrl } from "@/lib/backend-url";
import { resolveWorkspaceSession } from "@/lib/workspace-session";

interface VoiceAgent {
    id: string;
    name: string;
    agent_type?: string;
    call_direction?: string;
}

interface AutoRule {
    id: string;
    agent_id?: string | null;
    agent_name?: string | null;
    trigger_type: string;
    condition_config: Record<string, any>;
    action_type: string;
    action_config: Record<string, any>;
    is_active: boolean;
    created_at: string;
}

interface AutomationLog {
    id: string;
    agent_name?: string | null;
    action_type: string;
    status: string;
    payload?: Record<string, any>;
    error_message?: string;
    created_at: string;
}

interface TriggerOption {
    value: string;
    label: string;
    desc: string;
    icon: string;
}

interface ActionOption {
    value: string;
    label: string;
    desc: string;
    icon: string;
}

const TRIGGER_OPTIONS: TriggerOption[] = [
    { value: "sentiment_drops", label: "Sentiment Drops", desc: "Runs when a live conversation sentiment score falls below a threshold.", icon: "📉" },
    { value: "keyword_detected", label: "Keyword Detected", desc: "Runs when the current turn contains a keyword or phrase.", icon: "🔑" },
    { value: "duration_exceeded", label: "Long Conversation", desc: "Runs when an active session goes beyond a duration threshold.", icon: "⏱️" },
    { value: "intent_detected", label: "Intent Detected", desc: "Runs when the routed session intent matches sales, support, booking, and more.", icon: "🧭" },
];

const ACTION_OPTIONS: ActionOption[] = [
    { value: "escalate_to_human", label: "Escalate to Human", desc: "Marks the session as escalated for human takeover.", icon: "👤" },
    { value: "create_ticket", label: "Create Support Ticket", desc: "Creates a tracked support ticket inside the CRM table.", icon: "🎫" },
    { value: "send_sms", label: "Send SMS", desc: "Attempts SMS delivery through the workspace Twilio setup.", icon: "💬" },
    { value: "tag_customer", label: "Tag Customer", desc: "Creates or updates the customer record and appends a tag.", icon: "🏷️" },
];

const INTENT_OPTIONS = [
    "sales",
    "support",
    "booking",
    "billing",
    "complaint",
    "faq",
    "smalltalk",
    "order_status",
    "cancellation",
    "escalate",
];

const PRESET_AUTOMATIONS = [
    {
        title: "Frustration Escalation",
        description: "Escalate calls the moment the customer turns negative.",
        rule: {
            triggerType: "sentiment_drops",
            conditionConfig: { threshold: 0.35 },
            actionType: "escalate_to_human",
            actionConfig: { reason: "Negative sentiment detected" },
        },
    },
    {
        title: "Cancellation Rescue",
        description: "Create a follow-up ticket when the customer mentions cancelling.",
        rule: {
            triggerType: "keyword_detected",
            conditionConfig: { keyword: "cancel" },
            actionType: "create_ticket",
            actionConfig: { subject: "Cancellation-risk follow-up" },
        },
    },
    {
        title: "Sales Lead Tagger",
        description: "Tag customers automatically when the assistant routes them to sales.",
        rule: {
            triggerType: "intent_detected",
            conditionConfig: { intent: "sales" },
            actionType: "tag_customer",
            actionConfig: { tag: "sales-lead" },
        },
    },
    {
        title: "Long Call Follow-up",
        description: "Create a ticket when a conversation drags beyond eight minutes.",
        rule: {
            triggerType: "duration_exceeded",
            conditionConfig: { duration: 480 },
            actionType: "create_ticket",
            actionConfig: { subject: "Long conversation requires review" },
        },
    },
];

const COVERAGE_NOW = [
    "Workspace-wide and agent-specific rule scoping",
    "Triggers for sentiment, keyword, duration, and routed intent",
    "Actions for escalation, CRM ticketing, SMS, and customer tagging",
    "Template-provisioned rules plus recent execution logs",
];

const NEEDS_SETUP = [
    "SMS delivery still depends on Twilio credentials and an active number",
    "Customer tagging needs a phone or existing customer id in the session",
    "Rules still execute post-turn, not on external schedules or cron windows",
];

const NEXT_LAYER = [
    "Webhook actions to push events into external systems",
    "Time-window scheduling, retries, and cooldown policies",
    "Calendar-aware booking automations and campaign-aware rules",
];

function getTriggerLabel(value: string) {
    return TRIGGER_OPTIONS.find((option) => option.value === value)?.label || value;
}

function getTriggerIcon(value: string) {
    return TRIGGER_OPTIONS.find((option) => option.value === value)?.icon || "⚡";
}

function getActionLabel(value: string) {
    return ACTION_OPTIONS.find((option) => option.value === value)?.label || value;
}

function getActionIcon(value: string) {
    return ACTION_OPTIONS.find((option) => option.value === value)?.icon || "🎯";
}

function getConditionSummary(type: string, config: Record<string, any>) {
    if (type === "sentiment_drops") return `below ${config?.threshold || 0.3}`;
    if (type === "keyword_detected") return `"${config?.keyword || ""}"`;
    if (type === "duration_exceeded") return `over ${config?.duration || 300}s`;
    if (type === "intent_detected") return config?.intent || "intent";
    return "Custom rule";
}

function getActionSummary(type: string, config: Record<string, any>) {
    if (type === "create_ticket") return config?.subject || "Auto-generated ticket";
    if (type === "send_sms") return config?.message || "Workspace SMS alert";
    if (type === "tag_customer") return config?.tag || "automation";
    if (type === "escalate_to_human") return "Escalate the session outcome";
    return "Custom action";
}

function getStatusTone(status: string) {
    if (status === "sent" || status === "success") {
        return { color: "#047857", background: "#ecfdf5" };
    }
    if (status === "needs_setup" || status === "skipped") {
        return { color: "#b45309", background: "#fffbeb" };
    }
    return { color: "#b91c1c", background: "#fef2f2" };
}

export default function AutomationPage() {
    const [rules, setRules] = useState<AutoRule[]>([]);
    const [logs, setLogs] = useState<AutomationLog[]>([]);
    const [agents, setAgents] = useState<VoiceAgent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [orgId, setOrgId] = useState("");
    const [selectedAgentFilter, setSelectedAgentFilter] = useState("all");

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            let workspaceId = orgId;
            if (!workspaceId) {
                const session = await resolveWorkspaceSession();
                workspaceId = session.workspaceId;
                setOrgId(workspaceId);
            }

            const agentQuery = selectedAgentFilter !== "all" ? `&agentId=${selectedAgentFilter}` : "";
            const [rulesRes, logsRes, agentsRes] = await Promise.all([
                fetch(buildProxyUrl(`/api/automation/rules?workspaceId=${workspaceId}${agentQuery}`)),
                fetch(buildProxyUrl(`/api/automation/logs?workspaceId=${workspaceId}&limit=12`)),
                fetch(buildProxyUrl(`/api/voice-agents?orgId=${workspaceId}`)),
            ]);

            if (!rulesRes.ok || !logsRes.ok || !agentsRes.ok) {
                throw new Error("Failed to load automation workspace");
            }

            const [rulesData, logsData, agentsData] = await Promise.all([
                rulesRes.json(),
                logsRes.json(),
                agentsRes.json(),
            ]);

            setRules(rulesData.data || []);
            setLogs(logsData.data || []);
            setAgents(agentsData || []);
        } catch (nextError: any) {
            setError(nextError.message || "Failed to load automation workspace");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchData();
    }, [selectedAgentFilter]);

    const metrics = useMemo(() => {
        const activeRules = rules.filter((rule) => rule.is_active).length;
        const templateRules = rules.filter((rule) => rule.action_config?.source === "template_provisioning").length;
        const successfulActions = logs.filter((log) => log.status === "sent" || log.status === "success").length;
        const setupWarnings = logs.filter((log) => log.status === "needs_setup").length;

        return { activeRules, templateRules, successfulActions, setupWarnings };
    }, [rules, logs]);

    const handleCreate = async (data: {
        agentId?: string | null;
        triggerType: string;
        conditionConfig: Record<string, any>;
        actionType: string;
        actionConfig: Record<string, any>;
    }) => {
        const workspaceId = orgId || (await resolveWorkspaceSession()).workspaceId;
        if (!orgId) {
            setOrgId(workspaceId);
        }

        await fetch(buildProxyUrl("/api/automation/rules"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                workspaceId,
                agentId: data.agentId || null,
                triggerType: data.triggerType,
                conditionConfig: data.conditionConfig,
                actionType: data.actionType,
                actionConfig: data.actionConfig,
            }),
        });

        setShowCreate(false);
        await fetchData();
    };

    const toggleRule = async (rule: AutoRule) => {
        await fetch(buildProxyUrl(`/api/automation/rules/${rule.id}`), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                agentId: rule.agent_id,
                triggerType: rule.trigger_type,
                conditionConfig: rule.condition_config,
                actionType: rule.action_type,
                actionConfig: rule.action_config,
                isActive: !rule.is_active,
            }),
        });

        await fetchData();
    };

    const deleteRule = async (id: string) => {
        await fetch(buildProxyUrl(`/api/automation/rules/${id}`), { method: "DELETE" });
        await fetchData();
    };

    const createFromPreset = async (preset: (typeof PRESET_AUTOMATIONS)[number]) => {
        await handleCreate({
            ...preset.rule,
            agentId: selectedAgentFilter === "all" ? null : selectedAgentFilter,
        });
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
                    Dashboard &gt; <span style={{ color: "#09090b" }}>Automation</span>
                </div>
                <span style={{ fontSize: "13px", color: "#f97316", fontWeight: 600, background: "#fff7ed", padding: "4px 12px", borderRadius: "20px" }}>₹1,200</span>
            </div>

            <div style={{ padding: "28px 32px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                <div>
                    <h1 style={{ fontSize: "20px", fontWeight: 600, color: "#09090b", margin: 0 }}>Automation Workspace</h1>
                    <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0" }}>
                        Build event-driven rules for voice agents, inspect what is already working, and see what still needs external setup.
                    </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fff", border: "1px solid #e4e4e7", borderRadius: "10px", padding: "0 12px", height: "38px" }}>
                        <Filter size={14} color="#6b7280" />
                        <select
                            value={selectedAgentFilter}
                            onChange={(event) => setSelectedAgentFilter(event.target.value)}
                            style={{ border: "none", background: "transparent", fontSize: "13px", color: "#111827", outline: "none" }}
                        >
                            <option value="all">All agents</option>
                            {agents.map((agent) => (
                                <option key={agent.id} value={agent.id}>{agent.name}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 18px",
                            background: "#111827",
                            color: "#fff",
                            border: "none",
                            borderRadius: "10px",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        <Plus size={14} />
                        Create Rule
                    </button>
                </div>
            </div>

            <div style={{ margin: "20px 32px 0", display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "14px" }}>
                {[
                    { title: "Working now", items: COVERAGE_NOW, icon: CheckCircle2, background: "#ffffff", border: "#e4e4e7", color: "#047857" },
                    { title: "Needs setup", items: NEEDS_SETUP, icon: ShieldAlert, background: "#fffaf0", border: "#fed7aa", color: "#b45309" },
                    { title: "Next adds", items: NEXT_LAYER, icon: Sparkles, background: "#f8fafc", border: "#dbe4ee", color: "#334155" },
                ].map((section) => (
                    <div key={section.title} style={{ background: section.background, border: `1px solid ${section.border}`, borderRadius: "18px", padding: "18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <section.icon size={16} color={section.color} />
                            <div style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{section.title}</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "14px" }}>
                            {section.items.map((item) => (
                                <div key={item} style={{ fontSize: "12px", color: "#52525b", lineHeight: 1.5 }}>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ margin: "16px 32px 0", display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "14px" }}>
                {[
                    { label: "Active rules", value: metrics.activeRules, icon: Zap, tone: "#111827", background: "#ffffff" },
                    { label: "Template rules", value: metrics.templateRules, icon: Workflow, tone: "#0f766e", background: "#f0fdfa" },
                    { label: "Successful actions", value: metrics.successfulActions, icon: CheckCircle2, tone: "#047857", background: "#ecfdf5" },
                    { label: "Setup warnings", value: metrics.setupWarnings, icon: AlertTriangle, tone: "#b45309", background: "#fffbeb" },
                ].map((item) => (
                    <div key={item.label} style={{ background: item.background, border: "1px solid #e4e4e7", borderRadius: "16px", padding: "16px 18px", display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#fff", border: "1px solid #e4e4e7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <item.icon size={18} color={item.tone} />
                        </div>
                        <div>
                            <div style={{ fontSize: "22px", fontWeight: 700, color: "#09090b" }}>{item.value}</div>
                            <div style={{ fontSize: "12px", color: "#6b7280" }}>{item.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ margin: "20px 32px 0", background: "#fff", borderRadius: "18px", border: "1px solid #e4e4e7", padding: "18px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                    <div>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>Quick-start automations</div>
                        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                            One-click rules built from the capabilities currently supported by the backend.
                        </div>
                    </div>
                    <div style={{ fontSize: "12px", color: "#71717a" }}>
                        Scope: {selectedAgentFilter === "all" ? "workspace-wide" : agents.find((agent) => agent.id === selectedAgentFilter)?.name || "selected agent"}
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "12px", marginTop: "16px" }}>
                    {PRESET_AUTOMATIONS.map((preset) => (
                        <button
                            key={preset.title}
                            type="button"
                            onClick={() => createFromPreset(preset)}
                            style={{ border: "1px solid #eceae4", background: "#fcfcfb", borderRadius: "16px", padding: "14px", textAlign: "left", cursor: "pointer" }}
                        >
                            <div style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{preset.title}</div>
                            <div style={{ fontSize: "12px", color: "#6b7280", lineHeight: 1.5, marginTop: "8px" }}>{preset.description}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", fontSize: "11px", color: "#111827" }}>
                                <span>{getTriggerIcon(preset.rule.triggerType)}</span>
                                <span>{getTriggerLabel(preset.rule.triggerType)}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {logs.length > 0 && (
                <div style={{ margin: "20px 32px 0", background: "#fff", borderRadius: "18px", border: "1px solid #e4e4e7", padding: "18px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>Recent automation activity</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
                        {logs.map((log) => {
                            const tone = getStatusTone(log.status);
                            return (
                                <div key={log.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", borderRadius: "12px", background: "#fafafa", padding: "12px 14px" }}>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <span style={{ fontSize: "15px" }}>{getActionIcon(log.action_type)}</span>
                                            <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{getActionLabel(log.action_type)}</span>
                                            <span style={{ fontSize: "11px", color: "#6b7280" }}>{log.agent_name || "Workspace rule"}</span>
                                        </div>
                                        <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px", lineHeight: 1.45 }}>
                                            {log.error_message || log.payload?.message || log.payload?.subject || log.payload?.tag || "Automation action executed"}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontSize: "11px", fontWeight: 700, color: tone.color, background: tone.background, borderRadius: "999px", padding: "4px 8px", textTransform: "capitalize" }}>
                                            {log.status.replace("_", " ")}
                                        </div>
                                        <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "6px" }}>
                                            {new Date(log.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div style={{ padding: "20px 32px 32px" }}>
                {loading ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", flexDirection: "column", gap: "12px" }}>
                        <Loader2 size={28} color="#111827" style={{ animation: "spin 1s linear infinite" }} />
                        <span style={{ fontSize: "13px", color: "#9ca3af" }}>Loading automation workspace...</span>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : error ? (
                    <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #fecaca", padding: "32px", color: "#991b1b" }}>
                        {error}
                    </div>
                ) : rules.length === 0 ? (
                    <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "60px 40px", textAlign: "center" }}>
                        <Settings2 size={44} color="#d1d5db" style={{ margin: "0 auto 16px" }} />
                        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#09090b", margin: "0 0 6px" }}>No automation rules yet</h3>
                        <p style={{ fontSize: "13px", color: "#9ca3af", maxWidth: "420px", margin: "0 auto 20px", lineHeight: 1.5 }}>
                            The engine is ready, but this workspace has no manual rules yet. Start from a preset or create a custom rule for a specific voice agent.
                        </p>
                        <button onClick={() => setShowCreate(true)} style={{ padding: "8px 20px", background: "#111827", color: "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                            Create First Rule
                        </button>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {rules.map((rule) => (
                            <div key={rule.id} style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "18px 20px", opacity: rule.is_active ? 1 : 0.6 }}>
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                            <span style={{ fontSize: "16px" }}>{getTriggerIcon(rule.trigger_type)}</span>
                                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{getTriggerLabel(rule.trigger_type)}</span>
                                            <span style={{ fontSize: "11px", color: "#0f766e", background: "#f0fdfa", borderRadius: "999px", padding: "3px 8px" }}>
                                                {getConditionSummary(rule.trigger_type, rule.condition_config)}
                                            </span>
                                            <span style={{ fontSize: "11px", color: "#6b7280", background: "#f4f4f5", borderRadius: "999px", padding: "3px 8px" }}>
                                                {rule.agent_name || "Workspace-wide"}
                                            </span>
                                            {rule.action_config?.source === "template_provisioning" && (
                                                <span style={{ fontSize: "11px", color: "#7c2d12", background: "#fff7ed", borderRadius: "999px", padding: "3px 8px" }}>
                                                    Template rule
                                                </span>
                                            )}
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
                                            <span style={{ fontSize: "15px" }}>{getActionIcon(rule.action_type)}</span>
                                            <span style={{ fontSize: "12px", fontWeight: 600, color: "#111827" }}>{getActionLabel(rule.action_type)}</span>
                                            <span style={{ fontSize: "12px", color: "#6b7280" }}>{getActionSummary(rule.action_type, rule.action_config)}</span>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <button onClick={() => toggleRule(rule)} style={{ border: "none", background: "transparent", cursor: "pointer", padding: "4px" }}>
                                            {rule.is_active ? <ToggleRight size={28} color="#111827" /> : <ToggleLeft size={28} color="#d1d5db" />}
                                        </button>
                                        <button onClick={() => deleteRule(rule.id)} style={{ border: "none", background: "#fef2f2", width: "34px", height: "34px", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <Trash2 size={14} color="#dc2626" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showCreate && (
                <CreateRuleModal
                    agents={agents}
                    defaultAgentId={selectedAgentFilter === "all" ? "" : selectedAgentFilter}
                    onClose={() => setShowCreate(false)}
                    onSubmit={handleCreate}
                />
            )}
        </div>
    );
}

function CreateRuleModal({
    agents,
    defaultAgentId,
    onClose,
    onSubmit,
}: {
    agents: VoiceAgent[];
    defaultAgentId?: string;
    onClose: () => void;
    onSubmit: (data: {
        agentId?: string | null;
        triggerType: string;
        conditionConfig: Record<string, any>;
        actionType: string;
        actionConfig: Record<string, any>;
    }) => Promise<void>;
}) {
    const [agentId, setAgentId] = useState(defaultAgentId || "");
    const [triggerType, setTriggerType] = useState("");
    const [actionType, setActionType] = useState("");
    const [conditionValue, setConditionValue] = useState("");
    const [actionValue, setActionValue] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const inputStyle = {
        width: "100%",
        padding: "10px 12px",
        border: "1px solid #e4e4e7",
        borderRadius: "10px",
        fontSize: "13px",
        outline: "none",
        background: "#fff",
        color: "#09090b",
    };

    const handleSubmit = async () => {
        if (!triggerType || !actionType) {
            return;
        }

        let conditionConfig: Record<string, any> = {};
        if (triggerType === "sentiment_drops") conditionConfig = { threshold: parseFloat(conditionValue) || 0.3 };
        if (triggerType === "keyword_detected") conditionConfig = { keyword: conditionValue.trim() };
        if (triggerType === "duration_exceeded") conditionConfig = { duration: parseInt(conditionValue, 10) || 300 };
        if (triggerType === "intent_detected") conditionConfig = { intent: conditionValue || "sales" };

        let actionConfig: Record<string, any> = {};
        if (actionType === "send_sms") actionConfig = { message: actionValue || "Your conversation has been flagged for follow-up." };
        if (actionType === "create_ticket") actionConfig = { subject: actionValue || "Automation follow-up required" };
        if (actionType === "tag_customer") actionConfig = { tag: actionValue || "automation" };

        setSubmitting(true);
        await onSubmit({
            agentId: agentId || null,
            triggerType,
            conditionConfig,
            actionType,
            actionConfig,
        });
        setSubmitting(false);
    };

    return (
        <div
            style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.36)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "24px" }}
            onClick={onClose}
        >
            <div
                onClick={(event) => event.stopPropagation()}
                style={{ background: "#fff", borderRadius: "22px", width: "720px", maxWidth: "100%", maxHeight: "calc(100vh - 48px)", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 90px rgba(15, 23, 42, 0.18)" }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 22px", borderBottom: "1px solid #eceae4" }}>
                    <div>
                        <div style={{ fontSize: "17px", fontWeight: 700, color: "#09090b" }}>Create Automation Rule</div>
                        <div style={{ fontSize: "12px", color: "#71717a", marginTop: "4px" }}>Choose a scope, trigger, and action that match the current automation engine.</div>
                    </div>
                    <button onClick={onClose} style={{ width: "32px", height: "32px", border: "none", background: "#f4f4f5", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <X size={14} color="#6b7280" />
                    </button>
                </div>

                <div style={{ padding: "22px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "18px" }}>
                    <div style={{ borderRadius: "16px", border: "1px solid #eceae4", background: "#fcfcfb", padding: "16px" }}>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "8px" }}>Scope</label>
                        <select value={agentId} onChange={(event) => setAgentId(event.target.value)} style={{ ...inputStyle, height: "42px" }}>
                            <option value="">Workspace-wide rule</option>
                            {agents.map((agent) => (
                                <option key={agent.id} value={agent.id}>{agent.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ fontSize: "12px", fontWeight: 700, color: "#374151", display: "block", marginBottom: "8px" }}>When this happens</label>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px" }}>
                            {TRIGGER_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setTriggerType(option.value)}
                                    style={{ padding: "14px", borderRadius: "14px", cursor: "pointer", border: triggerType === option.value ? "2px solid #111827" : "1px solid #e4e4e7", background: triggerType === option.value ? "#f8fafc" : "#fff", textAlign: "left" }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span style={{ fontSize: "16px" }}>{option.icon}</span>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{option.label}</span>
                                    </div>
                                    <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "6px", lineHeight: 1.45 }}>{option.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {triggerType && (
                        <div style={{ borderRadius: "16px", border: "1px solid #eceae4", background: "#fff", padding: "16px" }}>
                            <label style={{ fontSize: "12px", fontWeight: 700, color: "#374151", display: "block", marginBottom: "8px" }}>
                                {triggerType === "sentiment_drops"
                                    ? "Threshold"
                                    : triggerType === "keyword_detected"
                                        ? "Keyword"
                                        : triggerType === "duration_exceeded"
                                            ? "Duration in seconds"
                                            : "Intent"}
                            </label>

                            {triggerType === "intent_detected" ? (
                                <select value={conditionValue} onChange={(event) => setConditionValue(event.target.value)} style={{ ...inputStyle, height: "42px" }}>
                                    {INTENT_OPTIONS.map((intent) => (
                                        <option key={intent} value={intent}>{intent}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type={triggerType === "keyword_detected" ? "text" : "number"}
                                    value={conditionValue}
                                    onChange={(event) => setConditionValue(event.target.value)}
                                    placeholder={triggerType === "sentiment_drops" ? "0.3" : triggerType === "keyword_detected" ? "cancel" : "300"}
                                    style={inputStyle}
                                />
                            )}
                        </div>
                    )}

                    <div>
                        <label style={{ fontSize: "12px", fontWeight: 700, color: "#374151", display: "block", marginBottom: "8px" }}>Then do this</label>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px" }}>
                            {ACTION_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setActionType(option.value)}
                                    style={{ padding: "14px", borderRadius: "14px", cursor: "pointer", border: actionType === option.value ? "2px solid #111827" : "1px solid #e4e4e7", background: actionType === option.value ? "#f8fafc" : "#fff", textAlign: "left" }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span style={{ fontSize: "16px" }}>{option.icon}</span>
                                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{option.label}</span>
                                    </div>
                                    <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "6px", lineHeight: 1.45 }}>{option.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {(actionType === "send_sms" || actionType === "create_ticket" || actionType === "tag_customer") && (
                        <div style={{ borderRadius: "16px", border: "1px solid #eceae4", background: "#fff", padding: "16px" }}>
                            <label style={{ fontSize: "12px", fontWeight: 700, color: "#374151", display: "block", marginBottom: "8px" }}>
                                {actionType === "send_sms" ? "SMS message" : actionType === "create_ticket" ? "Ticket subject" : "Customer tag"}
                            </label>
                            {actionType === "send_sms" ? (
                                <textarea
                                    value={actionValue}
                                    onChange={(event) => setActionValue(event.target.value)}
                                    rows={3}
                                    placeholder="We have escalated your request and will reach out shortly."
                                    style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
                                />
                            ) : (
                                <input
                                    value={actionValue}
                                    onChange={(event) => setActionValue(event.target.value)}
                                    placeholder={actionType === "create_ticket" ? "Automation follow-up required" : "sales-lead"}
                                    style={inputStyle}
                                />
                            )}
                        </div>
                    )}
                </div>

                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", padding: "16px 22px 22px", borderTop: "1px solid #eceae4" }}>
                    <button onClick={onClose} style={{ padding: "8px 20px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fff", color: "#374151", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!triggerType || !actionType || submitting}
                        style={{ padding: "8px 20px", border: "none", borderRadius: "10px", background: (!triggerType || !actionType) ? "#d1d5db" : "#111827", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: (!triggerType || !actionType) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                    >
                        {submitting && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                        Create Rule
                    </button>
                </div>
            </div>
        </div>
    );
}
