"use client";

import { useMemo, useState } from "react";
import {
    Bot,
    Braces,
    Database,
    GitBranch,
    Globe2,
    Keyboard,
    MessageSquareQuote,
    Mic2,
    PhoneCall,
    PlugZap,
    RadioTower,
    RefreshCw,
    ScanSearch,
    Sparkles,
    ToggleLeft,
    ToggleRight,
    Wrench,
} from "lucide-react";
import type { MultiPromptWorkflowTemplate, MultiPromptSpecialistConfig } from "@/components/voice-agents/template-data";

type VariableRow = { key: string; value: string };

type SectionId =
    | "prompt"
    | "voice"
    | "variables"
    | "knowledge"
    | "call"
    | "chat"
    | "embed"
    | "keyword"
    | "analysis"
    | "tools"
    | "events"
    | "api"
    | "dtmf"
    | "inbound"
    | "ab";

interface MultiPromptWorkflowEditorProps {
    workflow: MultiPromptWorkflowTemplate;
    onWorkflowChange: (workflow: MultiPromptWorkflowTemplate) => void;
    firstMessage: string;
    onFirstMessageChange: (value: string) => void;
    systemPrompt: string;
    onSystemPromptChange: (value: string) => void;
    onRegeneratePrompt: () => void;
    voice: string;
    onVoiceChange: (value: string) => void;
    languagePrimary: string;
    onLanguagePrimaryChange: (value: string) => void;
    languageSecondary: string;
    onLanguageSecondaryChange: (value: string) => void;
    variables: VariableRow[];
    onVariablesChange: (variables: VariableRow[]) => void;
}

const LANGUAGE_OPTIONS = ["English", "Hindi", "Tamil", "Telugu", "Malayalam"];

const SECTION_GROUPS: Array<{ title: string; items: Array<{ id: SectionId; label: string; icon: any }> }> = [
    {
        title: "Prompt",
        items: [
            { id: "prompt", label: "Prompt", icon: MessageSquareQuote },
            { id: "voice", label: "Voice", icon: Mic2 },
            { id: "variables", label: "Custom Variables", icon: Braces },
            { id: "knowledge", label: "Knowledge Base", icon: Database },
        ],
    },
    {
        title: "Call Settings",
        items: [
            { id: "call", label: "Call", icon: PhoneCall },
            { id: "chat", label: "Chat", icon: MessageSquareQuote },
        ],
    },
    {
        title: "Advanced",
        items: [
            { id: "embed", label: "Embed", icon: Globe2 },
            { id: "keyword", label: "Keyword Boosting", icon: Sparkles },
            { id: "analysis", label: "Custom Analysis", icon: ScanSearch },
            { id: "tools", label: "Tools", icon: Wrench },
            { id: "events", label: "Event Subscription", icon: RadioTower },
            { id: "api", label: "API", icon: PlugZap },
            { id: "dtmf", label: "DTMF", icon: Keyboard },
            { id: "inbound", label: "Inbound Calling", icon: PhoneCall },
            { id: "ab", label: "A/B Testing", icon: GitBranch },
        ],
    },
];

function Toggle({
    enabled,
    onClick,
}: {
    enabled: boolean;
    onClick: () => void;
}) {
    const Icon = enabled ? ToggleRight : ToggleLeft;
    return (
        <button
            type="button"
            onClick={onClick}
            style={{ border: "none", background: "transparent", cursor: "pointer", color: enabled ? "#111827" : "#a1a1aa", padding: 0, display: "flex", alignItems: "center" }}
        >
            <Icon size={30} />
        </button>
    );
}

function MultiPromptWorkflowEditor({
    workflow,
    onWorkflowChange,
    firstMessage,
    onFirstMessageChange,
    systemPrompt,
    onSystemPromptChange,
    onRegeneratePrompt,
    voice,
    onVoiceChange,
    languagePrimary,
    onLanguagePrimaryChange,
    languageSecondary,
    onLanguageSecondaryChange,
    variables,
    onVariablesChange,
}: MultiPromptWorkflowEditorProps) {
    const [activeSection, setActiveSection] = useState<SectionId>("prompt");

    const enabledSpecialists = useMemo(
        () => workflow.specialists.filter((specialist) => specialist.enabled),
        [workflow.specialists]
    );

    const updateFrontDesk = <K extends keyof MultiPromptWorkflowTemplate["frontDesk"]>(
        key: K,
        value: MultiPromptWorkflowTemplate["frontDesk"][K]
    ) => {
        onWorkflowChange({
            ...workflow,
            frontDesk: {
                ...workflow.frontDesk,
                [key]: value,
            },
        });
    };

    const updateRouter = <K extends keyof MultiPromptWorkflowTemplate["router"]>(
        key: K,
        value: MultiPromptWorkflowTemplate["router"][K]
    ) => {
        onWorkflowChange({
            ...workflow,
            router: {
                ...workflow.router,
                [key]: value,
            },
        });
    };

    const updateAdvanced = <K extends keyof MultiPromptWorkflowTemplate["advanced"]>(
        key: K,
        value: MultiPromptWorkflowTemplate["advanced"][K]
    ) => {
        onWorkflowChange({
            ...workflow,
            advanced: {
                ...workflow.advanced,
                [key]: value,
            },
        });
    };

    const updateSpecialist = (
        specialistId: string,
        updater: (specialist: MultiPromptSpecialistConfig) => MultiPromptSpecialistConfig
    ) => {
        onWorkflowChange({
            ...workflow,
            specialists: workflow.specialists.map((specialist) =>
                specialist.id === specialistId ? updater(specialist) : specialist
            ),
        });
    };

    const updateVariable = (index: number, field: keyof VariableRow, value: string) => {
        onVariablesChange(
            variables.map((variable, variableIndex) =>
                variableIndex === index ? { ...variable, [field]: value } : variable
            )
        );
    };

    const renderSection = () => {
        if (activeSection === "prompt") {
            return (
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    <div style={{ borderRadius: "24px", border: "1px solid #eceae4", background: "#fff", padding: "20px" }}>
                        <div style={{ fontSize: "24px", fontWeight: 600, color: "#111827" }}>Multi prompt workflow</div>
                        <div style={{ fontSize: "13px", color: "#71717a", lineHeight: 1.6, marginTop: "8px" }}>
                            This mirrors Ringg&apos;s routed assistant model: a front desk prompt that classifies intent, then specialist prompts that continue the conversation without exposing internal switches.
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px", marginTop: "18px" }}>
                            {[
                                { label: "Enabled specialists", value: enabledSpecialists.length.toString() },
                                { label: "Language auto-detect", value: workflow.router.languageDetection ? "On" : "Off" },
                                { label: "Hidden handoffs", value: workflow.router.hideInternalHandoffs ? "On" : "Off" },
                            ].map((item) => (
                                <div key={item.label} style={{ borderRadius: "18px", background: "#fafaf9", border: "1px solid #eceae4", padding: "14px" }}>
                                    <div style={{ fontSize: "11px", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.08em" }}>{item.label}</div>
                                    <div style={{ fontSize: "20px", fontWeight: 600, color: "#111827", marginTop: "8px" }}>{item.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ borderRadius: "24px", border: "1px solid #eceae4", background: "#fff", padding: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                            <div>
                                <div style={{ fontSize: "16px", fontWeight: 600, color: "#111827" }}>Front desk</div>
                                <div style={{ fontSize: "12px", color: "#71717a", marginTop: "4px" }}>The opening prompt that triages the caller before a specialist continues.</div>
                            </div>
                            <div style={{ padding: "6px 10px", borderRadius: "999px", background: "#f4f4f5", fontSize: "11px", color: "#52525b" }}>Primary router</div>
                        </div>

                        <div style={{ marginTop: "16px" }}>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#3f3f46", marginBottom: "8px" }}>First message</label>
                            <textarea
                                value={firstMessage}
                                onChange={(event) => onFirstMessageChange(event.target.value)}
                                rows={3}
                                style={{ width: "100%", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "14px", fontSize: "14px", outline: "none", resize: "vertical", background: "#fcfcfb", lineHeight: 1.6 }}
                            />
                        </div>

                        <div style={{ marginTop: "16px" }}>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#3f3f46", marginBottom: "8px" }}>Objective</label>
                            <textarea
                                value={workflow.frontDesk.objective}
                                onChange={(event) => updateFrontDesk("objective", event.target.value)}
                                rows={5}
                                style={{ width: "100%", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "14px", fontSize: "14px", outline: "none", resize: "vertical", background: "#fcfcfb", lineHeight: 1.6 }}
                            />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#3f3f46", marginBottom: "8px" }}>Routing checklist</label>
                                <textarea
                                    value={workflow.frontDesk.steps.join("\n")}
                                    onChange={(event) => updateFrontDesk("steps", event.target.value.split("\n").map((item) => item.trim()).filter(Boolean))}
                                    rows={6}
                                    style={{ width: "100%", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "14px", fontSize: "14px", outline: "none", resize: "vertical", background: "#fcfcfb", lineHeight: 1.6 }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#3f3f46", marginBottom: "8px" }}>Fields to capture</label>
                                <textarea
                                    value={workflow.frontDesk.collectFields.join("\n")}
                                    onChange={(event) => updateFrontDesk("collectFields", event.target.value.split("\n").map((item) => item.trim()).filter(Boolean))}
                                    rows={6}
                                    style={{ width: "100%", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "14px", fontSize: "14px", outline: "none", resize: "vertical", background: "#fcfcfb", lineHeight: 1.6 }}
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: "16px" }}>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#3f3f46", marginBottom: "8px" }}>Response style</label>
                            <textarea
                                value={workflow.frontDesk.responseStyle}
                                onChange={(event) => updateFrontDesk("responseStyle", event.target.value)}
                                rows={3}
                                style={{ width: "100%", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "14px", fontSize: "14px", outline: "none", resize: "vertical", background: "#fcfcfb", lineHeight: 1.6 }}
                            />
                        </div>
                    </div>

                    <div style={{ borderRadius: "24px", border: "1px solid #eceae4", background: "#fff", padding: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                            <div>
                                <div style={{ fontSize: "16px", fontWeight: 600, color: "#111827" }}>Generated master prompt</div>
                                <div style={{ fontSize: "12px", color: "#71717a", marginTop: "4px" }}>Saved with the agent and used by the backend orchestrator.</div>
                            </div>
                            <button
                                type="button"
                                onClick={onRegeneratePrompt}
                                style={{ height: "36px", padding: "0 14px", borderRadius: "12px", border: "1px solid #e4e4e7", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#111827" }}
                            >
                                <RefreshCw size={13} />
                                Regenerate
                            </button>
                        </div>
                        <textarea
                            value={systemPrompt}
                            onChange={(event) => onSystemPromptChange(event.target.value)}
                            rows={14}
                            style={{ width: "100%", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "14px", fontSize: "14px", outline: "none", resize: "vertical", background: "#fcfcfb", lineHeight: 1.65, marginTop: "14px", whiteSpace: "pre-wrap" }}
                        />
                    </div>

                    <div style={{ borderRadius: "24px", border: "1px solid #eceae4", background: "#fff", padding: "20px" }}>
                        <div style={{ fontSize: "16px", fontWeight: 600, color: "#111827" }}>Specialist workflow</div>
                        <div style={{ fontSize: "12px", color: "#71717a", marginTop: "4px" }}>Each specialist is a routed prompt with its own objective and trigger hints.</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                            {workflow.specialists.map((specialist) => (
                                <div key={specialist.id} style={{ borderRadius: "18px", border: "1px solid #eceae4", background: "#fcfcfb", padding: "16px" }}>
                                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                                        <div>
                                            <div style={{ fontSize: "15px", fontWeight: 600, color: "#111827" }}>{specialist.label}</div>
                                            <div style={{ fontSize: "12px", color: "#71717a", marginTop: "4px" }}>{specialist.summary}</div>
                                        </div>
                                        <Toggle
                                            enabled={specialist.enabled}
                                            onClick={() => updateSpecialist(specialist.id, (current) => ({ ...current, enabled: !current.enabled }))}
                                        />
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "14px" }}>
                                        <textarea
                                            value={specialist.objective}
                                            onChange={(event) => updateSpecialist(specialist.id, (current) => ({ ...current, objective: event.target.value }))}
                                            rows={5}
                                            style={{ width: "100%", borderRadius: "14px", border: "1px solid #e4e4e7", padding: "12px", fontSize: "13px", outline: "none", resize: "vertical", background: "#fff", lineHeight: 1.6 }}
                                        />
                                        <div style={{ display: "grid", gap: "10px" }}>
                                            <input
                                                value={specialist.handoffLabel}
                                                onChange={(event) => updateSpecialist(specialist.id, (current) => ({ ...current, handoffLabel: event.target.value }))}
                                                placeholder="Caller-facing label"
                                                style={{ height: "40px", borderRadius: "12px", border: "1px solid #e4e4e7", padding: "0 12px", fontSize: "13px", background: "#fff" }}
                                            />
                                            <textarea
                                                value={specialist.triggerIntents.join(", ")}
                                                onChange={(event) => updateSpecialist(specialist.id, (current) => ({ ...current, triggerIntents: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))}
                                                rows={2}
                                                placeholder="Intent list"
                                                style={{ width: "100%", borderRadius: "14px", border: "1px solid #e4e4e7", padding: "12px", fontSize: "13px", outline: "none", resize: "vertical", background: "#fff", lineHeight: 1.6 }}
                                            />
                                            <textarea
                                                value={specialist.triggerKeywords.join(", ")}
                                                onChange={(event) => updateSpecialist(specialist.id, (current) => ({ ...current, triggerKeywords: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))}
                                                rows={2}
                                                placeholder="Keyword hints"
                                                style={{ width: "100%", borderRadius: "14px", border: "1px solid #e4e4e7", padding: "12px", fontSize: "13px", outline: "none", resize: "vertical", background: "#fff", lineHeight: 1.6 }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        if (activeSection === "voice") {
            return (
                <div style={{ display: "grid", gap: "18px" }}>
                    <div style={{ borderRadius: "24px", border: "1px solid #eceae4", background: "#fff", padding: "20px" }}>
                        <div style={{ fontSize: "20px", fontWeight: 600, color: "#111827" }}>Voice setup</div>
                        <div style={{ fontSize: "13px", color: "#71717a", marginTop: "6px" }}>Primary and secondary language settings stay aligned with the router so the front desk can switch cleanly.</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "18px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#3f3f46", marginBottom: "8px" }}>Language - Primary</label>
                                <select value={languagePrimary} onChange={(event) => onLanguagePrimaryChange(event.target.value)} style={{ width: "100%", height: "42px", borderRadius: "14px", border: "1px solid #e4e4e7", padding: "0 14px", fontSize: "14px", background: "#fcfcfb" }}>
                                    {LANGUAGE_OPTIONS.map((language) => (
                                        <option key={language} value={language}>{language}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#3f3f46", marginBottom: "8px" }}>Language - Secondary</label>
                                <select value={languageSecondary} onChange={(event) => onLanguageSecondaryChange(event.target.value)} style={{ width: "100%", height: "42px", borderRadius: "14px", border: "1px solid #e4e4e7", padding: "0 14px", fontSize: "14px", background: "#fcfcfb" }}>
                                    <option value="">None</option>
                                    {LANGUAGE_OPTIONS.map((language) => (
                                        <option key={language} value={language}>{language}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div style={{ marginTop: "16px" }}>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#3f3f46", marginBottom: "8px" }}>Voice</label>
                            <select value={voice} onChange={(event) => onVoiceChange(event.target.value)} style={{ width: "100%", height: "42px", borderRadius: "14px", border: "1px solid #e4e4e7", padding: "0 14px", fontSize: "14px", background: "#fcfcfb" }}>
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
                        </div>
                    </div>
                </div>
            );
        }

        if (activeSection === "variables") {
            return (
                <div style={{ borderRadius: "24px", border: "1px solid #eceae4", background: "#fff", padding: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px" }}>
                        <div>
                            <div style={{ fontSize: "20px", fontWeight: 600, color: "#111827" }}>Custom variables</div>
                            <div style={{ fontSize: "12px", color: "#71717a", marginTop: "4px" }}>These work like Ringg&apos;s {`@{{variable}}`} placeholders across the first prompt and specialist prompts.</div>
                        </div>
                        <button type="button" onClick={() => onVariablesChange([...variables, { key: "", value: "" }])} style={{ border: "1px dashed #d4d4d8", borderRadius: "999px", padding: "8px 12px", background: "#fff", cursor: "pointer", fontSize: "12px", color: "#52525b" }}>
                            + Add Variable
                        </button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
                        {variables.map((variable, index) => (
                            <div key={`${variable.key}-${index}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                <input value={variable.key} onChange={(event) => updateVariable(index, "key", event.target.value)} placeholder="key" style={{ height: "40px", borderRadius: "14px", border: "1px solid #e4e4e7", padding: "0 12px", fontSize: "13px", background: "#fcfcfb" }} />
                                <input value={variable.value} onChange={(event) => updateVariable(index, "value", event.target.value)} placeholder="example value" style={{ height: "40px", borderRadius: "14px", border: "1px solid #e4e4e7", padding: "0 12px", fontSize: "13px", background: "#fcfcfb" }} />
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        const advancedSectionMap: Record<Exclude<SectionId, "prompt" | "voice" | "variables">, keyof MultiPromptWorkflowTemplate["advanced"]> = {
            knowledge: "knowledgeBase",
            call: "call",
            chat: "chat",
            embed: "embed",
            keyword: "keywordBoosting",
            analysis: "customAnalysis",
            tools: "tools",
            events: "eventSubscription",
            api: "apiAccess",
            dtmf: "dtmfCapture",
            inbound: "inboundCalling",
            ab: "abTesting",
        };

        const configKey = advancedSectionMap[activeSection as Exclude<SectionId, "prompt" | "voice" | "variables">];
        const sectionLabel = SECTION_GROUPS.flatMap((group) => group.items).find((item) => item.id === activeSection)?.label || "Settings";
        const descriptions: Partial<Record<SectionId, string>> = {
            knowledge: "Let specialists use your uploaded business knowledge and FAQ content.",
            call: "Keeps the workflow optimized for voice-first conversations and spoken confirmations.",
            chat: "Allows the same workflow to be reused for text simulations and chat-based previews.",
            embed: "Makes the assistant suitable for website widgets and embedded entry points.",
            keyword: "Extra keyword hints bias the router before the fallback classifier runs.",
            analysis: "Stores structured follow-up and routing context after each conversation.",
            tools: "Enables service actions like booking creation, CRM updates, and ticket creation.",
            events: "Publishes post-call events for downstream automation when available.",
            api: "Keeps the assistant ready for API-driven launches and external orchestration.",
            dtmf: "Allows keypad collection for IVR-style flows when your number provider supports it.",
            inbound: "Optimizes the workflow for inbound front-desk behavior.",
            ab: "Supports testing variants of the same workflow later.",
        };

        return (
            <div style={{ display: "grid", gap: "18px" }}>
                <div style={{ borderRadius: "24px", border: "1px solid #eceae4", background: "#fff", padding: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                        <div>
                            <div style={{ fontSize: "20px", fontWeight: 600, color: "#111827" }}>{sectionLabel}</div>
                            <div style={{ fontSize: "13px", color: "#71717a", marginTop: "6px" }}>{descriptions[activeSection]}</div>
                        </div>
                        <Toggle enabled={workflow.advanced[configKey]} onClick={() => updateAdvanced(configKey, !workflow.advanced[configKey])} />
                    </div>

                    {(activeSection === "knowledge" || activeSection === "call") && (
                        <div style={{ marginTop: "18px", borderRadius: "18px", border: "1px solid #eceae4", background: "#fafaf9", padding: "16px" }}>
                            <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>Router policy</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#52525b", marginBottom: "8px" }}>Fallback specialist</label>
                                    <select value={workflow.router.fallbackAgent} onChange={(event) => updateRouter("fallbackAgent", event.target.value as MultiPromptWorkflowTemplate["router"]["fallbackAgent"])} style={{ width: "100%", height: "40px", borderRadius: "12px", border: "1px solid #e4e4e7", padding: "0 12px", fontSize: "13px", background: "#fff" }}>
                                        {workflow.specialists.map((specialist) => (
                                            <option key={specialist.id} value={specialist.agentKey}>{specialist.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#52525b", marginBottom: "8px" }}>Confirmation style</label>
                                    <input value={workflow.router.confirmationStyle} onChange={(event) => updateRouter("confirmationStyle", event.target.value)} style={{ width: "100%", height: "40px", borderRadius: "12px", border: "1px solid #e4e4e7", padding: "0 12px", fontSize: "13px", background: "#fff" }} />
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "16px", marginTop: "14px", flexWrap: "wrap" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <Toggle enabled={workflow.router.languageDetection} onClick={() => updateRouter("languageDetection", !workflow.router.languageDetection)} />
                                    <div style={{ fontSize: "12px", color: "#52525b" }}>Language detection</div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <Toggle enabled={workflow.router.hideInternalHandoffs} onClick={() => updateRouter("hideInternalHandoffs", !workflow.router.hideInternalHandoffs)} />
                                    <div style={{ fontSize: "12px", color: "#52525b" }}>Hide internal handoffs</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "18px", minHeight: 0 }}>
            <div style={{ borderRadius: "24px", border: "1px solid #eceae4", background: "#fff", padding: "18px", overflowY: "auto", maxHeight: "calc(100vh - 220px)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "18px", background: "#111827", color: "#fff" }}>
                    <Bot size={16} />
                    <div>
                        <div style={{ fontSize: "13px", fontWeight: 600 }}>Multi prompt editor</div>
                        <div style={{ fontSize: "11px", opacity: 0.75, marginTop: "2px" }}>Front desk + specialist routing</div>
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "18px" }}>
                    {SECTION_GROUPS.map((group) => (
                        <div key={group.title}>
                            <div style={{ fontSize: "11px", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px", padding: "0 6px" }}>{group.title}</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = activeSection === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setActiveSection(item.id)}
                                            style={{
                                                width: "100%",
                                                border: `1px solid ${isActive ? "#111827" : "#eceae4"}`,
                                                background: isActive ? "#f5f5f4" : "#fff",
                                                borderRadius: "16px",
                                                padding: "12px 14px",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "10px",
                                                cursor: "pointer",
                                                color: "#111827",
                                                textAlign: "left",
                                            }}
                                        >
                                            <Icon size={15} />
                                            <span style={{ fontSize: "13px", fontWeight: isActive ? 600 : 500 }}>{item.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ minWidth: 0, overflowY: "auto", maxHeight: "calc(100vh - 220px)", paddingRight: "4px" }}>
                {renderSection()}
            </div>
        </div>
    );
}

export default MultiPromptWorkflowEditor;
