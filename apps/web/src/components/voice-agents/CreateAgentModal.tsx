"use client";

import { useState } from "react";
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    CircleDot,
    Globe2,
    MessageSquareQuote,
    Mic2,
    PhoneCall,
    Play,
    RotateCw,
    Sparkles,
    WandSparkles,
} from "lucide-react";
import { buildProxyUrl } from "@/lib/backend-url";
import {
    AGENT_TEMPLATES,
    BLANK_TEMPLATES,
    buildSystemPrompt,
    cloneWorkflowTemplate,
    type AgentDirection,
    type AgentTemplate,
    type MultiPromptWorkflowTemplate,
    getTemplateAutomationProfile,
    getIndustry,
    getTemplatesForIndustry,
    INDUSTRIES,
} from "@/components/voice-agents/template-data";
import MultiPromptWorkflowEditor from "@/components/voice-agents/MultiPromptWorkflowEditor";

interface CreateAgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    orgId: string;
    onCreated: (agent: any) => void;
}

const DIRECTION_META: Record<AgentDirection, { label: string; icon: typeof PhoneCall; helper: string }> = {
    outbound: { label: "Outbound", icon: PhoneCall, helper: "Proactive follow-up, reminders, qualification, and recovery flows." },
    inbound: { label: "Inbound", icon: MessageSquareQuote, helper: "Front-desk, support, routing, and help-desk style assistants." },
    webcall: { label: "Webcall", icon: Globe2, helper: "Website widget assistants for self-serve conversations and concierge flows." },
};

const LANGUAGE_OPTIONS = ["English", "Hindi", "Tamil", "Telugu", "Malayalam"];
const ALL_TEMPLATES_META = {
    id: "all",
    label: "All Templates",
    description: "Browse every industry template without narrowing to one category first.",
    accentFrom: "#111827",
    accentTo: "#4b5563",
    surface: "#f8fafc",
    border: "#d4d4d8",
    icon: Sparkles,
};

export default function CreateAgentModal({ isOpen, onClose, orgId, onCreated }: CreateAgentModalProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedIndustry, setSelectedIndustry] = useState("all");
    const [selectedDirection, setSelectedDirection] = useState<AgentDirection>("outbound");
    const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
    const [name, setName] = useState("");
    const [languagePrimary, setLanguagePrimary] = useState("English");
    const [languageSecondary, setLanguageSecondary] = useState("");
    const [voice, setVoice] = useState("sarvam-tanya");
    const [firstMessage, setFirstMessage] = useState("");
    const [systemPrompt, setSystemPrompt] = useState("");
    const [variables, setVariables] = useState<{ key: string; value: string }[]>([]);
    const [workflowDraft, setWorkflowDraft] = useState<MultiPromptWorkflowTemplate | null>(null);
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const automationProfile = selectedTemplate ? getTemplateAutomationProfile(selectedTemplate) : null;

    const activeIndustry = selectedIndustry === "all" ? ALL_TEMPLATES_META : getIndustry(selectedIndustry);
    const liveTemplates = selectedIndustry === "blank"
        ? BLANK_TEMPLATES
        : selectedIndustry === "all"
            ? AGENT_TEMPLATES.filter((template) => template.direction === selectedDirection)
            : getTemplatesForIndustry(selectedIndustry, selectedDirection);

    const applyTemplate = (template: AgentTemplate) => {
        const nextWorkflow = cloneWorkflowTemplate(template.workflow);
        setSelectedTemplate(template);
        setName(template.name);
        setLanguagePrimary(template.primaryLanguage);
        setLanguageSecondary(template.secondaryLanguage || "");
        setVoice(template.voice);
        setFirstMessage(template.firstMessage);
        setWorkflowDraft(nextWorkflow);
        setSystemPrompt(buildSystemPrompt(template, nextWorkflow));
        setVariables(template.variables.map((key) => ({ key, value: "" })));
        setStep(2);
    };

    const handleSelectBlank = (templateId: string) => {
        const template = BLANK_TEMPLATES.find((item) => item.id === templateId);
        if (template) applyTemplate(template);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (!orgId) {
                throw new Error("Workspace session is unavailable");
            }

            const res = await fetch(buildProxyUrl("/api/voice-agents"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orgId,
                    name,
                    language: languagePrimary,
                    secondaryLanguage: languageSecondary,
                    voice,
                    systemPrompt,
                    firstMessage,
                    type: selectedTemplate?.mode === "multi" ? "multi" : "single",
                    callDirection: selectedTemplate?.direction || "outbound",
                    templateId: selectedTemplate?.id || null,
                    templateMeta: selectedTemplate ? {
                        name: selectedTemplate.name,
                        industryId: selectedTemplate.industryId,
                        summary: selectedTemplate.summary,
                        outcome: selectedTemplate.outcome,
                        customVariables: variables.filter((variable) => variable.key.trim()),
                        workflow: workflowDraft,
                    } : null,
                    serviceConfig: automationProfile?.services || [],
                    automationBlueprint: automationProfile?.defaultRules || [],
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                throw new Error(errData?.error || "Failed to create assistant");
            }

            const data = await res.json();
            onCreated(data);
            onClose();
        } catch (err: any) {
            alert(err.message || "Failed to create assistant");
        } finally {
            setSubmitting(false);
        }
    };

    const updateVariable = (index: number, field: "key" | "value", value: string) => {
        setVariables((current) =>
            current.map((variable, currentIndex) =>
                currentIndex === index ? { ...variable, [field]: value } : variable
            )
        );
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.26)", backdropFilter: "blur(10px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
            <div style={{ background: "#fcfcfb", width: "1120px", maxWidth: "100%", height: "760px", maxHeight: "calc(100vh - 48px)", borderRadius: "28px", boxShadow: "0 40px 120px rgba(15, 23, 42, 0.18)", overflow: "hidden", display: "flex", flexDirection: "column", border: "1px solid rgba(228, 228, 231, 0.9)" }}>
                <div style={{ padding: "22px 28px", borderBottom: "1px solid #eceae4", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(252,252,251,0.96) 100%)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <button onClick={() => (step === 2 ? setStep(1) : onClose())} style={{ width: "34px", height: "34px", borderRadius: "12px", border: "1px solid #e4e4e7", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#52525b" }}>
                            <ArrowLeft size={16} />
                        </button>
                        <div>
                            <div style={{ fontSize: "18px", fontWeight: 600, color: "#111827" }}>Create Assistant</div>
                            <div style={{ fontSize: "12px", color: "#71717a", marginTop: "2px" }}>
                                {step === 1 ? "Pick a starter blueprint" : "Customize the selected assistant"}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "999px", background: "#ffffff", border: "1px solid #eceae4" }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "999px", background: step === 1 ? "#111827" : "#d4d4d8" }} />
                            <span style={{ fontSize: "12px", color: "#52525b" }}>Choose Template</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "999px", background: "#ffffff", border: "1px solid #eceae4" }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "999px", background: step === 2 ? "#111827" : "#d4d4d8" }} />
                            <span style={{ fontSize: "12px", color: "#52525b" }}>Configure Prompt</span>
                        </div>
                    </div>
                </div>

                <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
                {step === 1 ? (
                    <div style={{ height: "100%", display: "grid", gridTemplateColumns: "260px 1fr", minHeight: 0 }}>
                        <div style={{ borderRight: "1px solid #eceae4", background: "#fffdf8", padding: "22px 18px", display: "flex", flexDirection: "column", gap: "14px", height: "100%", minHeight: 0, overflow: "hidden" }}>
                            <div style={{ borderRadius: "22px", padding: "18px", background: "linear-gradient(135deg, #111827 0%, #374151 100%)", color: "#fff" }}>
                                <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.12em", opacity: 0.72 }}>Template Library</div>
                                <div style={{ fontSize: "20px", fontWeight: 600, marginTop: "10px" }}>Build faster with agent blueprints</div>
                                <div style={{ fontSize: "13px", lineHeight: 1.55, opacity: 0.85, marginTop: "10px" }}>
                                    Each template ships with a distinct opening line, objective, variables, and response rules.
                                </div>
                            </div>

                            <div style={{ fontSize: "11px", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.12em", padding: "0 6px" }}>
                                Industries
                            </div>

                            <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px", paddingRight: "6px", overscrollBehavior: "contain", scrollbarWidth: "thin" }}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedIndustry("all")}
                                    style={{
                                        border: `1px solid ${selectedIndustry === "all" ? ALL_TEMPLATES_META.border : "#eceae4"}`,
                                        background: selectedIndustry === "all" ? ALL_TEMPLATES_META.surface : "#fff",
                                        borderRadius: "18px",
                                        padding: "12px 14px",
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: "12px",
                                        textAlign: "left",
                                        cursor: "pointer",
                                    }}
                                >
                                    <div style={{ width: "34px", height: "34px", borderRadius: "12px", background: `linear-gradient(135deg, ${ALL_TEMPLATES_META.accentFrom} 0%, ${ALL_TEMPLATES_META.accentTo} 100%)`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <Sparkles size={16} />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#18181b" }}>{ALL_TEMPLATES_META.label}</div>
                                        <div style={{ fontSize: "11px", color: "#71717a", lineHeight: 1.45, marginTop: "4px" }}>{ALL_TEMPLATES_META.description}</div>
                                    </div>
                                </button>
                                {INDUSTRIES.map((industry) => {
                                    const Icon = industry.icon;
                                    const isActive = selectedIndustry === industry.id;

                                    return (
                                        <button
                                            key={industry.id}
                                            type="button"
                                            onClick={() => setSelectedIndustry(industry.id)}
                                            style={{
                                                border: `1px solid ${isActive ? industry.border : "#eceae4"}`,
                                                background: isActive ? industry.surface : "#fff",
                                                borderRadius: "18px",
                                                padding: "12px 14px",
                                                display: "flex",
                                                alignItems: "flex-start",
                                                gap: "12px",
                                                textAlign: "left",
                                                cursor: "pointer",
                                            }}
                                        >
                                            <div style={{ width: "34px", height: "34px", borderRadius: "12px", background: `linear-gradient(135deg, ${industry.accentFrom} 0%, ${industry.accentTo} 100%)`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                <Icon size={16} />
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontSize: "13px", fontWeight: 600, color: "#18181b" }}>{industry.label}</div>
                                                <div style={{ fontSize: "11px", color: "#71717a", lineHeight: 1.45, marginTop: "4px" }}>{industry.description}</div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={{ padding: "24px", display: "flex", flexDirection: "column", minHeight: 0, overflowY: "auto" }}>
                            <div style={{ borderRadius: "26px", padding: "22px", background: `linear-gradient(135deg, ${activeIndustry.surface} 0%, #ffffff 76%)`, border: `1px solid ${activeIndustry.border}` }}>
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                                    <div>
                                        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "7px 11px", borderRadius: "999px", background: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,255,255,0.9)", fontSize: "11px", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                            <Sparkles size={12} />
                                            {selectedIndustry === "blank" ? "Flexible Prompting" : `${activeIndustry.label} Agent Collection`}
                                        </div>
                                        <div style={{ fontSize: "28px", fontWeight: 600, color: "#111827", marginTop: "14px" }}>{activeIndustry.label}</div>
                                        <div style={{ fontSize: "14px", color: "#52525b", lineHeight: 1.6, maxWidth: "720px", marginTop: "8px" }}>
                                            {activeIndustry.description}
                                        </div>
                                    </div>

                                    <div style={{ minWidth: "240px", borderRadius: "20px", background: "#fff", border: "1px solid rgba(255,255,255,0.9)", padding: "16px" }}>
                                        <div style={{ fontSize: "11px", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.08em" }}>Selection summary</div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "12px" }}>
                                            <div>
                                                <div style={{ fontSize: "11px", color: "#a1a1aa" }}>Direction</div>
                                                <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827", marginTop: "4px" }}>{DIRECTION_META[selectedDirection].label}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: "11px", color: "#a1a1aa" }}>Templates</div>
                                                <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827", marginTop: "4px" }}>{liveTemplates.length}</div>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#71717a", lineHeight: 1.55, marginTop: "12px" }}>
                                            {selectedIndustry === "blank" ? "Start from a blank structure and shape the behavior yourself." : DIRECTION_META[selectedDirection].helper}
                                        </div>
                                    </div>
                                </div>

                                {selectedIndustry !== "blank" && (
                                    <div style={{ display: "flex", gap: "8px", marginTop: "18px", flexWrap: "wrap" }}>
                                        {(Object.keys(DIRECTION_META) as AgentDirection[]).map((direction) => {
                                            const meta = DIRECTION_META[direction];
                                            const Icon = meta.icon;
                                            const isActive = selectedDirection === direction;

                                            return (
                                                <button
                                                    key={direction}
                                                    type="button"
                                                    onClick={() => setSelectedDirection(direction)}
                                                    style={{
                                                        border: `1px solid ${isActive ? "#111827" : "#e4e4e7"}`,
                                                        background: isActive ? "#111827" : "#fff",
                                                        color: isActive ? "#fff" : "#52525b",
                                                        borderRadius: "999px",
                                                        padding: "10px 14px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "8px",
                                                        fontSize: "13px",
                                                        fontWeight: 500,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    <Icon size={14} />
                                                    {meta.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "14px" }}>
                                    <div>
                                        <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#a1a1aa" }}>Choose an agent</div>
                                        <div style={{ fontSize: "17px", fontWeight: 600, color: "#111827", marginTop: "6px" }}>
                                            {selectedIndustry === "blank" ? "Prompt-first starters" : `${DIRECTION_META[selectedDirection].label} templates`}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#71717a" }}>
                                        {selectedIndustry === "blank"
                                            ? "Minimal starter kits for custom assistants."
                                            : "Each card preloads its own persona, objective, and variables."}
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px", overflowY: "auto", paddingRight: "6px", paddingBottom: "4px", overscrollBehavior: "contain", scrollbarWidth: "thin" }}>
                                    {(selectedIndustry === "blank" ? BLANK_TEMPLATES : liveTemplates).map((template) => {
                                        const Icon = template.icon;
                                        const industry = getIndustry(template.industryId);

                                        return (
                                            <button
                                                key={template.id}
                                                type="button"
                                                onClick={() => (template.industryId === "blank" ? handleSelectBlank(template.id) : applyTemplate(template))}
                                                style={{
                                                    border: `1px solid ${industry.border}`,
                                                    borderRadius: "24px",
                                                    padding: "18px",
                                                    background: `linear-gradient(135deg, ${industry.surface} 0%, #ffffff 72%)`,
                                                    cursor: "pointer",
                                                    textAlign: "left",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: "16px",
                                                    minHeight: "250px",
                                                    boxShadow: "0 12px 40px rgba(15, 23, 42, 0.04)",
                                                }}
                                            >
                                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "14px" }}>
                                                    <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: `linear-gradient(135deg, ${industry.accentFrom} 0%, ${industry.accentTo} 100%)`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                        <Icon size={20} />
                                                    </div>
                                                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                                                        {selectedIndustry === "all" && (
                                                            <div style={{ padding: "6px 10px", borderRadius: "999px", background: "#fff", border: "1px solid rgba(255,255,255,0.95)", fontSize: "11px", color: "#52525b" }}>
                                                                {industry.label}
                                                            </div>
                                                        )}
                                                        <div style={{ padding: "6px 10px", borderRadius: "999px", background: "#fff", border: "1px solid rgba(255,255,255,0.95)", fontSize: "11px", color: "#52525b" }}>{DIRECTION_META[template.direction].label}</div>
                                                        <div style={{ padding: "6px 10px", borderRadius: "999px", background: "#fff", border: "1px solid rgba(255,255,255,0.95)", fontSize: "11px", color: "#52525b" }}>{template.mode === "multi" ? "Multi Prompt" : "Single Prompt"}</div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <div style={{ fontSize: "11px", color: "#71717a", textTransform: "uppercase", letterSpacing: "0.08em" }}>{template.eyebrow}</div>
                                                    <div style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginTop: "8px" }}>{template.name}</div>
                                                    <div style={{ fontSize: "13px", color: "#52525b", lineHeight: 1.6, marginTop: "8px" }}>{template.summary}</div>
                                                </div>

                                                <div style={{ borderRadius: "18px", padding: "14px", background: "rgba(255,255,255,0.88)", border: "1px solid rgba(255,255,255,0.92)" }}>
                                                    <div style={{ fontSize: "11px", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.08em" }}>Designed to do</div>
                                                    <div style={{ fontSize: "13px", color: "#18181b", lineHeight: 1.55, marginTop: "8px" }}>{template.outcome}</div>
                                                </div>

                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginTop: "auto" }}>
                                                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                                        {template.variables.slice(0, 3).map((variable) => (
                                                            <div key={variable} style={{ padding: "6px 10px", borderRadius: "999px", border: "1px dashed #d4d4d8", fontSize: "11px", color: "#52525b", background: "#fff" }}>
                                                                {`{{${variable}}}`}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#18181b", fontSize: "13px", fontWeight: 600 }}>
                                                        Use Template
                                                        <ArrowRight size={14} />
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {selectedIndustry !== "blank" && liveTemplates.length === 0 && (
                                    <div style={{ marginTop: "18px", border: "1px dashed #d4d4d8", borderRadius: "24px", padding: "30px", textAlign: "center", color: "#71717a" }}>
                                        No {DIRECTION_META[selectedDirection].label.toLowerCase()} templates available for {activeIndustry.label} yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleCreate} style={{ flex: 1, display: "grid", gridTemplateColumns: "340px 1fr", minHeight: 0, height: "100%", overflow: "hidden" }}>
                        <div style={{ borderRight: "1px solid #eceae4", background: "#fffdf8", padding: "24px 20px", overflowY: "auto" }}>
                            <div style={{ borderRadius: "24px", padding: "18px", background: `linear-gradient(135deg, ${getIndustry(selectedTemplate?.industryId || "blank").surface} 0%, #fff 72%)`, border: `1px solid ${getIndustry(selectedTemplate?.industryId || "blank").border}` }}>
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                                    <div>
                                        <div style={{ fontSize: "11px", color: "#71717a", textTransform: "uppercase", letterSpacing: "0.08em" }}>{selectedTemplate?.eyebrow || "Custom assistant"}</div>
                                        <div style={{ fontSize: "22px", fontWeight: 600, color: "#111827", marginTop: "8px" }}>{selectedTemplate?.name || "Assistant Blueprint"}</div>
                                    </div>
                                    <div style={{ padding: "7px 10px", borderRadius: "999px", background: "#fff", border: "1px solid rgba(255,255,255,0.95)", fontSize: "11px", color: "#52525b" }}>
                                        {selectedTemplate?.mode === "multi" ? "Multi Prompt" : "Single Prompt"}
                                    </div>
                                </div>

                                <div style={{ fontSize: "13px", lineHeight: 1.6, color: "#52525b", marginTop: "12px" }}>
                                    {selectedTemplate?.summary}
                                </div>

                                <div style={{ borderRadius: "18px", padding: "14px", background: "#fff", border: "1px solid rgba(255,255,255,0.95)", marginTop: "16px" }}>
                                    <div style={{ fontSize: "11px", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.08em" }}>Core outcome</div>
                                    <div style={{ fontSize: "13px", lineHeight: 1.55, color: "#111827", marginTop: "8px" }}>{selectedTemplate?.outcome}</div>
                                </div>
                            </div>

                            <div style={{ marginTop: "20px", borderRadius: "22px", border: "1px solid #eceae4", background: "#fff", padding: "18px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: "#111827" }}>
                                    <WandSparkles size={15} />
                                    Response design
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
                                    {selectedTemplate?.guidelines.map((guideline) => (
                                        <div key={guideline} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                                            <CheckCircle2 size={14} style={{ color: "#18181b", marginTop: "2px", flexShrink: 0 }} />
                                            <div style={{ fontSize: "13px", color: "#52525b", lineHeight: 1.55 }}>{guideline}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginTop: "20px", borderRadius: "22px", border: "1px solid #eceae4", background: "#fff", padding: "18px" }}>
                                <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>Variables to personalize</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                                    {variables.length > 0 ? variables.map((variable) => (
                                        <div key={variable.key} style={{ padding: "7px 10px", borderRadius: "999px", border: "1px dashed #d4d4d8", background: "#fafafa", fontSize: "12px", color: "#52525b" }}>
                                            {`{{${variable.key}}}`}
                                        </div>
                                    )) : (
                                        <div style={{ fontSize: "12px", color: "#71717a" }}>No variables added yet.</div>
                                    )}
                                </div>
                            </div>

                            {automationProfile && (
                                <div style={{ marginTop: "20px", borderRadius: "22px", border: "1px solid #eceae4", background: "#fff", padding: "18px" }}>
                                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>Automation services</div>
                                    <div style={{ fontSize: "12px", color: "#71717a", marginTop: "4px", lineHeight: 1.55 }}>
                                        This template provisions the service stack below when the agent is created.
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
                                        {automationProfile.services.map((service) => (
                                            <div key={service.id} style={{ borderRadius: "16px", border: "1px solid #eceae4", padding: "12px 14px", background: "#fcfcfb" }}>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                                                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{service.label}</div>
                                                    <div style={{ padding: "4px 8px", borderRadius: "999px", background: service.readiness === "available" ? "#ecfdf5" : "#fff7ed", color: service.readiness === "available" ? "#047857" : "#c2410c", fontSize: "11px", fontWeight: 600 }}>
                                                        {service.readiness === "available" ? "Ready" : "Needs Setup"}
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: "12px", color: "#52525b", lineHeight: 1.55, marginTop: "8px" }}>{service.description}</div>
                                                <div style={{ fontSize: "11px", color: "#71717a", lineHeight: 1.5, marginTop: "8px" }}>{service.readinessNote}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!orgId && (
                                <div style={{ marginTop: "20px", borderRadius: "18px", border: "1px solid #fde68a", background: "#fffbeb", padding: "14px", fontSize: "12px", color: "#92400e", lineHeight: 1.55 }}>
                                    Workspace session is still loading. The create button will unlock as soon as the active workspace resolves.
                                </div>
                            )}
                        </div>

                        <div style={{ padding: "24px", overflowY: "auto", minHeight: 0 }}>
                            {selectedTemplate?.mode === "multi" && workflowDraft ? (
                                <>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px", marginBottom: "18px" }}>
                                        <div style={{ borderRadius: "22px", border: "1px solid #eceae4", background: "#fff", padding: "18px" }}>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#3f3f46", marginBottom: "8px" }}>Agent Name</label>
                                            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tiffany from Ringg AI" required style={{ width: "100%", height: "42px", borderRadius: "14px", border: "1px solid #e4e4e7", padding: "0 14px", fontSize: "14px", outline: "none", background: "#fcfcfb" }} />
                                        </div>

                                        <div style={{ borderRadius: "22px", border: "1px solid #eceae4", background: "#fff", padding: "18px" }}>
                                            <div style={{ fontSize: "12px", fontWeight: 600, color: "#3f3f46", marginBottom: "8px" }}>Assistant Type</div>
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "14px", border: "1px solid #e4e4e7", padding: "0 14px", height: "42px", background: "#fcfcfb" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#18181b" }}>
                                                    <CircleDot size={14} />
                                                    Multi Prompt Workflow
                                                </div>
                                                <div style={{ fontSize: "12px", color: "#71717a" }}>{selectedTemplate ? DIRECTION_META[selectedTemplate.direction].label : "Custom"}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <MultiPromptWorkflowEditor
                                        workflow={workflowDraft}
                                        onWorkflowChange={(nextWorkflow) => {
                                            setWorkflowDraft(nextWorkflow);
                                            if (selectedTemplate) {
                                                setSystemPrompt(buildSystemPrompt(selectedTemplate, nextWorkflow));
                                            }
                                        }}
                                        firstMessage={firstMessage}
                                        onFirstMessageChange={setFirstMessage}
                                        systemPrompt={systemPrompt}
                                        onSystemPromptChange={setSystemPrompt}
                                        onRegeneratePrompt={() => {
                                            if (selectedTemplate) {
                                                setSystemPrompt(buildSystemPrompt(selectedTemplate, workflowDraft));
                                            }
                                        }}
                                        voice={voice}
                                        onVoiceChange={setVoice}
                                        languagePrimary={languagePrimary}
                                        onLanguagePrimaryChange={setLanguagePrimary}
                                        languageSecondary={languageSecondary}
                                        onLanguageSecondaryChange={setLanguageSecondary}
                                        variables={variables}
                                        onVariablesChange={setVariables}
                                    />
                                </>
                            ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" }}>
                                <div style={{ borderRadius: "22px", border: "1px solid #eceae4", background: "#fff", padding: "18px" }}>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#3f3f46", marginBottom: "8px" }}>Agent Name</label>
                                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tiffany from Ringg AI" required style={{ width: "100%", height: "42px", borderRadius: "14px", border: "1px solid #e4e4e7", padding: "0 14px", fontSize: "14px", outline: "none", background: "#fcfcfb" }} />
                                </div>

                                <div style={{ borderRadius: "22px", border: "1px solid #eceae4", background: "#fff", padding: "18px" }}>
                                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#3f3f46", marginBottom: "8px" }}>Assistant Type</div>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "14px", border: "1px solid #e4e4e7", padding: "0 14px", height: "42px", background: "#fcfcfb" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#18181b" }}>
                                            <CircleDot size={14} />
                                            {selectedTemplate?.mode === "multi" ? "Multi Prompt" : "Single Prompt"}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#71717a" }}>{selectedTemplate ? DIRECTION_META[selectedTemplate.direction].label : "Custom"}</div>
                                    </div>
                                </div>

                                <div style={{ borderRadius: "22px", border: "1px solid #eceae4", background: "#fff", padding: "18px" }}>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#3f3f46", marginBottom: "8px" }}>Language - Primary</label>
                                    <select value={languagePrimary} onChange={(e) => setLanguagePrimary(e.target.value)} style={{ width: "100%", height: "42px", borderRadius: "14px", border: "1px solid #e4e4e7", padding: "0 14px", fontSize: "14px", background: "#fcfcfb" }}>
                                        {LANGUAGE_OPTIONS.map((language) => (
                                            <option key={language} value={language}>{language}</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ borderRadius: "22px", border: "1px solid #eceae4", background: "#fff", padding: "18px" }}>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#3f3f46", marginBottom: "8px" }}>Language - Secondary</label>
                                    <select value={languageSecondary} onChange={(e) => setLanguageSecondary(e.target.value)} style={{ width: "100%", height: "42px", borderRadius: "14px", border: "1px solid #e4e4e7", padding: "0 14px", fontSize: "14px", background: "#fcfcfb" }}>
                                        <option value="">None</option>
                                        {LANGUAGE_OPTIONS.map((language) => (
                                            <option key={language} value={language}>{language}</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ gridColumn: "1 / span 2", borderRadius: "22px", border: "1px solid #eceae4", background: "#fff", padding: "18px" }}>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#3f3f46", marginBottom: "8px" }}>Voice</label>
                                    <div style={{ position: "relative" }}>
                                        <select value={voice} onChange={(e) => setVoice(e.target.value)} style={{ width: "100%", height: "42px", borderRadius: "14px", border: "1px solid #e4e4e7", padding: "0 14px", paddingRight: "48px", fontSize: "14px", background: "#fcfcfb" }}>
                                            <optgroup label="Sarvam AI">
                                                <option value="sarvam-tanya">Tanya (Hindi/English - Female)</option>
                                                <option value="sarvam-raj">Raj (Hindi/English - Male)</option>
                                                <option value="sarvam-naina">Naina (Tamil - Female)</option>
                                            </optgroup>
                                            <optgroup label="ElevenLabs">
                                                <option value="eleven-rachel">Rachel (English - Female)</option>
                                                <option value="eleven-drew">Drew (English - Male)</option>
                                                <option value="eleven-clyde">Clyde (English - Male)</option>
                                                <option value="eleven-freya">Freya (British - Female)</option>
                                            </optgroup>
                                        </select>
                                        <button type="button" style={{ position: "absolute", top: "8px", right: "10px", width: "26px", height: "26px", borderRadius: "999px", border: "none", background: "#111827", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                            <Play size={12} />
                                        </button>
                                    </div>
                                </div>

                                <div style={{ gridColumn: "1 / span 2", borderRadius: "22px", border: "1px solid #eceae4", background: "#fff", padding: "18px" }}>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#3f3f46", marginBottom: "8px" }}>First Message</label>
                                    <textarea value={firstMessage} onChange={(e) => setFirstMessage(e.target.value)} rows={3} placeholder="Type the opening line your assistant will say first..." style={{ width: "100%", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "14px", fontSize: "14px", outline: "none", resize: "vertical", background: "#fcfcfb", lineHeight: 1.55 }} />
                                    <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#71717a" }}>
                                        <Mic2 size={13} />
                                        Use variables like <code style={{ fontSize: "12px", padding: "2px 6px", borderRadius: "6px", background: "#f4f4f5", border: "1px solid #e4e4e7" }}>{"@{{callee_name}}"}</code> in the first line for personalization.
                                    </div>
                                </div>

                                <div style={{ gridColumn: "1 / span 2", borderRadius: "22px", border: "1px solid #eceae4", background: "#fff", padding: "18px" }}>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#3f3f46", marginBottom: "8px" }}>System Prompt</label>
                                    <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={14} placeholder="Describe the assistant objective, tone, decision rules, and escalation logic..." style={{ width: "100%", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "14px", fontSize: "14px", outline: "none", resize: "vertical", background: "#fcfcfb", lineHeight: 1.65, whiteSpace: "pre-wrap" }} />
                                </div>

                                <div style={{ gridColumn: "1 / span 2", borderRadius: "22px", border: "1px solid #eceae4", background: "#fff", padding: "18px" }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px" }}>
                                        <div>
                                            <div style={{ fontSize: "12px", fontWeight: 600, color: "#3f3f46" }}>Custom Variables</div>
                                            <div style={{ fontSize: "12px", color: "#71717a", marginTop: "4px" }}>Map CSV or workflow values into the template before launch.</div>
                                        </div>
                                        <button type="button" onClick={() => setVariables((current) => [...current, { key: "", value: "" }])} style={{ border: "1px dashed #d4d4d8", borderRadius: "999px", padding: "8px 12px", background: "#fff", cursor: "pointer", fontSize: "12px", color: "#52525b" }}>
                                            + Add Variable
                                        </button>
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
                                        {variables.map((variable, index) => (
                                            <div key={`${variable.key}-${index}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                                <input value={variable.key} onChange={(e) => updateVariable(index, "key", e.target.value)} placeholder="key" style={{ height: "40px", borderRadius: "14px", border: "1px solid #e4e4e7", padding: "0 12px", fontSize: "13px", background: "#fcfcfb" }} />
                                                <input value={variable.value} onChange={(e) => updateVariable(index, "value", e.target.value)} placeholder="example value" style={{ height: "40px", borderRadius: "14px", border: "1px solid #e4e4e7", padding: "0 12px", fontSize: "13px", background: "#fcfcfb" }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            )}

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginTop: "18px", paddingTop: "18px", borderTop: "1px solid #eceae4" }}>
                                <div style={{ fontSize: "12px", color: "#71717a" }}>
                                    {selectedTemplate ? `${selectedTemplate.name} is ready to create.` : "Choose a template and configure the prompt."}
                                </div>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button type="button" onClick={() => setStep(1)} style={{ height: "42px", padding: "0 16px", borderRadius: "14px", border: "1px solid #e4e4e7", background: "#fff", cursor: "pointer", fontSize: "13px", color: "#3f3f46" }}>
                                        Back
                                    </button>
                                    <button type="submit" disabled={submitting || !name || !orgId} style={{ height: "42px", padding: "0 18px", borderRadius: "14px", border: "none", background: "#111827", color: "#fff", cursor: submitting || !name || !orgId ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, opacity: submitting || !name || !orgId ? 0.6 : 1 }}>
                                        {submitting ? <RotateCw size={14} style={{ animation: "spin 1s linear infinite" }} /> : null}
                                        Create Agent
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                )}
                </div>
            </div>
        </div>
    );
}
