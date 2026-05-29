"use client";

import { useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    ChevronRight,
    Eye as EyeIcon,
    FileText as FileTextIcon,
    Play as PlayIcon,
    Sliders as SlidersIcon,
    Upload as UploadIcon,
    X as XIcon,
} from "lucide-react";
import { buildProxyUrl } from "@/lib/backend-url";
import {
    ALL_AGENT_TEMPLATES,
    getTemplateAutomationProfile,
    type TemplateServiceDefinition,
} from "@/components/voice-agents/template-data";

interface Campaign {
    id: string;
    name: string;
    agent_id: string;
    agent_name?: string;
    status: "draft" | "running" | "completed" | "failed";
    total_contacts: number;
    calls_made?: number;
    calls_answered?: number;
    scheduled_at?: string;
    created_at?: string;
    service_config?: TemplateServiceDefinition[];
    agent_service_config?: TemplateServiceDefinition[];
    contact_field_mapping?: Record<string, string>;
}

interface VoiceAgent {
    id: string;
    name: string;
    template_id?: string;
    language?: string;
    first_message?: string;
    call_direction?: string;
    agent_type?: string;
    service_config?: TemplateServiceDefinition[];
}

interface CsvRecord {
    [key: string]: string;
}

interface FieldMapping {
    phone: string;
    name: string;
    email: string;
    company: string;
    externalId: string;
}

const EMPTY_FIELD_MAPPING: FieldMapping = {
    phone: "",
    name: "",
    email: "",
    company: "",
    externalId: "",
};

const FIELD_LABELS: Record<keyof FieldMapping, string> = {
    phone: "Phone",
    name: "Name",
    email: "Email",
    company: "Company",
    externalId: "External ID",
};

const FIELD_MATCHERS: Record<keyof FieldMapping, string[]> = {
    phone: ["phone", "phone_number", "mobile", "mobile_number", "contact_number"],
    name: ["name", "full_name", "customer_name", "lead_name", "callee_name"],
    email: ["email", "email_id", "customer_email", "work_email"],
    company: ["company", "company_name", "business_name", "brand_name"],
    externalId: ["customer_id", "external_id", "lead_id", "order_id"],
};

function normalizeHeader(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function parseCsvRow(line: string) {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const character = line[index];
        const nextCharacter = line[index + 1];

        if (character === '"' && inQuotes && nextCharacter === '"') {
            current += '"';
            index += 1;
            continue;
        }

        if (character === '"') {
            inQuotes = !inQuotes;
            continue;
        }

        if (character === "," && !inQuotes) {
            cells.push(current.trim());
            current = "";
            continue;
        }

        current += character;
    }

    cells.push(current.trim());
    return cells;
}

function parseCsvText(text: string) {
    const rows = text
        .replace(/\r/g, "")
        .split("\n")
        .filter((line) => line.trim().length > 0);

    if (rows.length === 0) {
        return { headers: [] as string[], records: [] as CsvRecord[] };
    }

    const headers = parseCsvRow(rows[0]).map((header, index) => header || `column_${index + 1}`);
    const records = rows.slice(1).map((row) => {
        const values = parseCsvRow(row);
        return headers.reduce<CsvRecord>((record, header, index) => {
            record[header] = values[index]?.trim() || "";
            return record;
        }, {});
    });

    return { headers, records };
}

function getSuggestedMapping(headers: string[]): FieldMapping {
    const nextMapping = { ...EMPTY_FIELD_MAPPING };

    (Object.keys(FIELD_MATCHERS) as (keyof FieldMapping)[]).forEach((field) => {
        const aliases = FIELD_MATCHERS[field];
        const matchedHeader = headers.find((header) => {
            const normalized = normalizeHeader(header);
            return aliases.some((alias) => normalized === alias || normalized.includes(alias));
        });

        nextMapping[field] = matchedHeader || "";
    });

    return nextMapping;
}

function getContactsFromCsv(records: CsvRecord[], mapping: FieldMapping) {
    const mappedHeaders = new Set(Object.values(mapping).filter(Boolean));

    return records
        .map((record) => {
            const phone = mapping.phone ? record[mapping.phone]?.trim() || "" : "";
            const name = mapping.name ? record[mapping.name]?.trim() || "" : "";
            const email = mapping.email ? record[mapping.email]?.trim() || "" : "";
            const externalId = mapping.externalId ? record[mapping.externalId]?.trim() || "" : "";
            const company = mapping.company ? record[mapping.company]?.trim() || "" : "";

            const metadata = Object.entries(record).reduce<Record<string, string>>((result, [header, value]) => {
                if (!value?.trim() || mappedHeaders.has(header)) {
                    return result;
                }

                result[normalizeHeader(header)] = value.trim();
                return result;
            }, {});

            if (company) {
                metadata.company = company;
            }

            return {
                phone,
                name: name || company || "Contact",
                email,
                externalId,
                metadata,
            };
        })
        .filter((contact) => contact.phone.length > 5);
}

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [agents, setAgents] = useState<VoiceAgent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isConcurrencyOpen, setIsConcurrencyOpen] = useState(false);
    const [wizardTab, setWizardTab] = useState<"Configuration" | "Contacts">("Configuration");
    const [orgId, setOrgId] = useState("");

    const [name, setName] = useState("");
    const [selectedAgentId, setSelectedAgentId] = useState("");
    const [csvFileName, setCsvFileName] = useState("");
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvRecords, setCsvRecords] = useState<CsvRecord[]>([]);
    const [fieldMapping, setFieldMapping] = useState<FieldMapping>(EMPTY_FIELD_MAPPING);
    const [scheduleTime, setScheduleTime] = useState("");
    const [launchAfterCreate, setLaunchAfterCreate] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [workspaceConcurrency, setWorkspaceConcurrency] = useState(10);

    const selectedAgent = useMemo(
        () => agents.find((agent) => agent.id === selectedAgentId) || null,
        [agents, selectedAgentId]
    );

    const selectedAgentServices = useMemo(() => {
        if (!selectedAgent) {
            return [] as TemplateServiceDefinition[];
        }

        if (selectedAgent.service_config?.length) {
            return selectedAgent.service_config;
        }

        const selectedTemplate = ALL_AGENT_TEMPLATES.find((template) => template.id === selectedAgent.template_id);
        return selectedTemplate ? getTemplateAutomationProfile(selectedTemplate).services : [];
    }, [selectedAgent]);

    const csvPreview = useMemo(() => csvRecords.slice(0, 4), [csvRecords]);
    const runningCampaigns = campaigns.filter((campaign) => campaign.status === "running").length;
    const totalContacts = campaigns.reduce((sum, campaign) => sum + (campaign.total_contacts || 0), 0);

    const resetForm = () => {
        setName("");
        setSelectedAgentId("");
        setCsvFileName("");
        setCsvHeaders([]);
        setCsvRecords([]);
        setFieldMapping(EMPTY_FIELD_MAPPING);
        setScheduleTime("");
        setLaunchAfterCreate(true);
        setWizardTab("Configuration");
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            let activeOrgId = orgId;

            if (!activeOrgId) {
                const sessionRes = await fetch(buildProxyUrl("/agents/primary"));
                if (!sessionRes.ok) {
                    throw new Error("Failed to resolve workspace session");
                }

                const session = await sessionRes.json();
                activeOrgId = session.workspace_id;
                setOrgId(activeOrgId);
            }

            if (!activeOrgId) {
                throw new Error("Workspace session is unavailable");
            }

            const [campaignRes, agentRes] = await Promise.all([
                fetch(buildProxyUrl(`/api/campaigns?orgId=${activeOrgId}`)),
                fetch(buildProxyUrl(`/api/voice-agents?orgId=${activeOrgId}`)),
            ]);

            if (!campaignRes.ok) {
                const errData = await campaignRes.json().catch(() => null);
                throw new Error(errData?.error || "Failed to fetch campaigns");
            }

            if (!agentRes.ok) {
                const errData = await agentRes.json().catch(() => null);
                throw new Error(errData?.error || "Failed to fetch voice agents");
            }

            const [campaignData, agentData] = await Promise.all([campaignRes.json(), agentRes.json()]);
            setCampaigns(campaignData);
            setAgents(agentData);
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCsvChange = async (file: File | null) => {
        if (!file) {
            setCsvFileName("");
            setCsvHeaders([]);
            setCsvRecords([]);
            setFieldMapping(EMPTY_FIELD_MAPPING);
            return;
        }

        const text = await file.text();
        const parsed = parseCsvText(text);

        setCsvFileName(file.name);
        setCsvHeaders(parsed.headers);
        setCsvRecords(parsed.records);
        setFieldMapping(getSuggestedMapping(parsed.headers));
    };

    const handleCreate = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitting(true);

        try {
            if (!orgId) {
                throw new Error("Workspace session is unavailable");
            }

            if (!selectedAgent) {
                throw new Error("Choose a voice agent for the campaign");
            }

            const contacts = getContactsFromCsv(csvRecords, fieldMapping);
            if (contacts.length === 0) {
                throw new Error("Upload a CSV with at least one valid phone number");
            }

            const createRes = await fetch(buildProxyUrl("/api/campaigns"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orgId,
                    name,
                    voiceAgentId: selectedAgent.id,
                    type: "outbound",
                    scheduledAt: scheduleTime || null,
                    contactFieldMapping: fieldMapping,
                    serviceConfig: selectedAgentServices,
                    launchConfig: {
                        concurrency: workspaceConcurrency,
                        launchMode: scheduleTime ? "scheduled" : launchAfterCreate ? "instant" : "draft",
                    },
                }),
            });

            if (!createRes.ok) {
                const errData = await createRes.json().catch(() => null);
                throw new Error(errData?.error || "Failed to create campaign");
            }

            const campaign = await createRes.json();

            const contactsRes = await fetch(buildProxyUrl(`/api/campaigns/${campaign.id}/contacts`), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contacts }),
            });

            if (!contactsRes.ok) {
                const errData = await contactsRes.json().catch(() => null);
                throw new Error(errData?.error || "Failed to upload campaign contacts");
            }

            if (launchAfterCreate && !scheduleTime) {
                const launchRes = await fetch(buildProxyUrl(`/api/campaigns/${campaign.id}/launch`), {
                    method: "POST",
                });

                if (!launchRes.ok) {
                    const errData = await launchRes.json().catch(() => null);
                    throw new Error(errData?.error || "Campaign was created but could not be launched");
                }
            }

            setIsCreateOpen(false);
            resetForm();
            fetchData();
        } catch (err: any) {
            alert(err.message || "Failed to create campaign");
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusChange = async (id: string) => {
        try {
            const res = await fetch(buildProxyUrl(`/api/campaigns/${id}/launch`), { method: "POST" });
            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                throw new Error(errData?.error || "Failed to launch campaign");
            }
            fetchData();
        } catch (err: any) {
            alert(err.message || "Failed to update campaign");
        }
    };

    return (
        <div style={{ background: "#f7f7f5", minHeight: "100vh", width: "100%", padding: "28px 32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", marginBottom: "24px" }}>
                <div>
                    <div style={{ fontSize: "12px", color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase" }}>Campaign automation</div>
                    <h1 style={{ fontSize: "26px", fontWeight: 600, color: "#111827", marginTop: "8px" }}>Campaigns</h1>
                    <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "6px", maxWidth: "720px", lineHeight: 1.6 }}>
                        Build outbound campaigns that inherit automation from the selected voice agent, store contact business data, and provision CRM, booking, or ticketing flows automatically.
                    </p>
                </div>

                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <button
                        onClick={() => setIsConcurrencyOpen(true)}
                        style={{
                            background: "#fff",
                            border: "1px solid #e4e4e7",
                            height: "40px",
                            padding: "0 14px",
                            borderRadius: "12px",
                            fontSize: "13px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            color: "#111827",
                        }}
                    >
                        <SlidersIcon size={14} />
                        Concurrency
                    </button>

                    <button
                        onClick={() => setIsCreateOpen(true)}
                        style={{
                            background: "#111827",
                            color: "white",
                            height: "40px",
                            padding: "0 18px",
                            borderRadius: "12px",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer",
                            border: "none",
                        }}
                    >
                        + New Campaign
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ marginBottom: "16px", borderRadius: "16px", border: "1px solid #fecaca", background: "#fff1f2", color: "#9f1239", padding: "14px 16px", fontSize: "13px", lineHeight: 1.55 }}>
                    {error}
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "16px", marginBottom: "20px" }}>
                {[
                    { label: "Total Campaigns", value: campaigns.length, helper: "All campaign drafts and launches in this workspace." },
                    { label: "Running Now", value: runningCampaigns, helper: "Campaigns currently in progress." },
                    { label: "Total Contacts", value: totalContacts, helper: "Contacts uploaded across all campaigns." },
                ].map((item) => (
                    <div key={item.label} style={{ borderRadius: "20px", border: "1px solid #ebe9e1", background: "linear-gradient(180deg, #ffffff 0%, #fcfcfb 100%)", padding: "18px 20px" }}>
                        <div style={{ fontSize: "12px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>{item.label}</div>
                        <div style={{ fontSize: "26px", fontWeight: 600, color: "#111827", marginTop: "12px" }}>{item.value}</div>
                        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px", lineHeight: 1.55 }}>{item.helper}</div>
                    </div>
                ))}
            </div>

            {loading ? (
                <div style={{ padding: "52px", textAlign: "center", color: "#6b7280", background: "#fff", borderRadius: "20px", border: "1px solid #ebe9e1" }}>
                    Loading campaigns...
                </div>
            ) : campaigns.length === 0 ? (
                <div style={{ textAlign: "center", padding: "72px 0", color: "#9ca3af", background: "#fff", borderRadius: "20px", border: "1px solid #ebe9e1" }}>
                    <FileTextIcon size={46} style={{ marginBottom: 16, opacity: 0.4 }} />
                    <p style={{ fontSize: "15px", fontWeight: 600, color: "#6b7280" }}>No campaigns created yet</p>
                    <p style={{ fontSize: "13px", marginTop: "6px" }}>Create one and upload a CSV to activate automated calling services.</p>
                </div>
            ) : (
                <div style={{ background: "#ffffff", border: "1px solid #ebe9e1", borderRadius: "20px", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                            <tr style={{ background: "#fafaf9", borderBottom: "1px solid #ebe9e1" }}>
                                {["Campaign", "Status", "Contacts", "Automation", "Schedule", "Actions"].map((column) => (
                                    <th key={column} style={{ padding: "12px 18px", fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                                        {column}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.map((campaign) => {
                                const serviceCount = campaign.service_config?.length || campaign.agent_service_config?.length || 0;
                                return (
                                    <tr key={campaign.id} style={{ borderBottom: "1px solid #f4f4f5" }}>
                                        <td style={{ padding: "16px 18px" }}>
                                            <div style={{ fontSize: "14px", color: "#111827", fontWeight: 600 }}>{campaign.name}</div>
                                            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>Agent: {campaign.agent_name || "Voice agent"}</div>
                                        </td>
                                        <td style={{ padding: "16px 18px" }}>
                                            <span style={{
                                                fontSize: "11px",
                                                padding: "5px 10px",
                                                borderRadius: "999px",
                                                fontWeight: 600,
                                                background: campaign.status === "running" ? "#ecfeff" : campaign.status === "completed" ? "#ecfdf5" : campaign.status === "failed" ? "#fff1f2" : "#f4f4f5",
                                                color: campaign.status === "running" ? "#0f766e" : campaign.status === "completed" ? "#047857" : campaign.status === "failed" ? "#be123c" : "#52525b",
                                            }}>
                                                {campaign.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: "16px 18px", fontSize: "13px", color: "#111827" }}>
                                            {(campaign.calls_made || 0)} / {campaign.total_contacts || 0}
                                        </td>
                                        <td style={{ padding: "16px 18px", fontSize: "13px", color: "#52525b" }}>
                                            {serviceCount > 0 ? `${serviceCount} services` : "Template-managed"}
                                        </td>
                                        <td style={{ padding: "16px 18px", fontSize: "12px", color: "#6b7280" }}>
                                            {campaign.scheduled_at ? new Date(campaign.scheduled_at).toLocaleString() : "Launch manually"}
                                        </td>
                                        <td style={{ padding: "16px 18px" }}>
                                            <div style={{ display: "flex", gap: "8px" }}>
                                                {campaign.status === "draft" && (
                                                    <button
                                                        onClick={() => handleStatusChange(campaign.id)}
                                                        style={{ background: "none", border: "1px solid #e4e4e7", borderRadius: "10px", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#111827" }}
                                                    >
                                                        <PlayIcon size={12} style={{ color: "#16a34a" }} />
                                                        Launch
                                                    </button>
                                                )}
                                                <button style={{ background: "none", border: "1px solid #e4e4e7", borderRadius: "10px", padding: "6px", cursor: "pointer", color: "#6b7280" }}>
                                                    <EyeIcon size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {isCreateOpen && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.42)", backdropFilter: "blur(12px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
                    <div style={{ background: "#fcfcfb", borderRadius: "28px", width: "1120px", maxWidth: "100%", maxHeight: "calc(100vh - 48px)", overflow: "hidden", boxShadow: "0 35px 100px rgba(15, 23, 42, 0.24)", border: "1px solid rgba(228, 228, 231, 0.9)", display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 24px", borderBottom: "1px solid #eceae4", background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(252,252,251,0.98) 100%)" }}>
                            <div>
                                <div style={{ fontSize: "18px", fontWeight: 600, color: "#111827" }}>Create Campaign</div>
                                <div style={{ fontSize: "12px", color: "#71717a", marginTop: "4px" }}>Wire a voice agent, contact list, and service automation into one launch-ready campaign.</div>
                            </div>
                            <button onClick={() => { setIsCreateOpen(false); resetForm(); }} style={{ width: "34px", height: "34px", borderRadius: "12px", border: "1px solid #e4e4e7", background: "#fff", cursor: "pointer", color: "#52525b" }}>
                                <XIcon size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} style={{ display: "grid", gridTemplateColumns: "320px 1fr", minHeight: "0", flex: 1, overflow: "hidden" }}>
                            <div style={{ borderRight: "1px solid #eceae4", background: "#fffdf8", padding: "24px 20px", overflowY: "auto" }}>
                                <div style={{ borderRadius: "24px", padding: "18px", background: "linear-gradient(135deg, #111827 0%, #374151 100%)", color: "#fff" }}>
                                    <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.12em", opacity: 0.7 }}>Launch flow</div>
                                    <div style={{ fontSize: "20px", fontWeight: 600, marginTop: "10px" }}>Campaigns inherit automation from the selected agent</div>
                                    <div style={{ fontSize: "13px", lineHeight: 1.6, opacity: 0.84, marginTop: "10px" }}>
                                        The chosen template decides what gets stored automatically: CRM updates, booking workflows, support ticketing, payment blockers, or follow-up SMS.
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: "8px", marginTop: "18px" }}>
                                    {(["Configuration", "Contacts"] as const).map((tab) => (
                                        <button
                                            key={tab}
                                            type="button"
                                            onClick={() => setWizardTab(tab)}
                                            style={{
                                                flex: 1,
                                                height: "38px",
                                                borderRadius: "12px",
                                                border: `1px solid ${wizardTab === tab ? "#111827" : "#e4e4e7"}`,
                                                background: wizardTab === tab ? "#111827" : "#fff",
                                                color: wizardTab === tab ? "#fff" : "#52525b",
                                                cursor: "pointer",
                                                fontSize: "12px",
                                                fontWeight: 600,
                                            }}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                                <div style={{ marginTop: "20px", borderRadius: "22px", border: "1px solid #eceae4", background: "#fff", padding: "18px" }}>
                                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>Selected agent</div>
                                    <div style={{ fontSize: "12px", color: "#71717a", marginTop: "4px", lineHeight: 1.55 }}>
                                        {selectedAgent
                                            ? `${selectedAgent.name} (${selectedAgent.call_direction || "voice"} · ${selectedAgent.agent_type || "single"})`
                                            : "Choose a voice agent to inspect what this campaign can automate."}
                                    </div>

                                    {selectedAgentServices.length > 0 && (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
                                            {selectedAgentServices.map((service) => (
                                                <div key={service.id} style={{ borderRadius: "16px", border: "1px solid #eceae4", padding: "12px 14px", background: "#fcfcfb" }}>
                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                                                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{service.label}</div>
                                                        <div style={{ padding: "4px 8px", borderRadius: "999px", background: service.readiness === "available" ? "#ecfdf5" : "#fff7ed", color: service.readiness === "available" ? "#047857" : "#c2410c", fontSize: "11px", fontWeight: 600 }}>
                                                            {service.readiness === "available" ? "Ready" : "Needs Setup"}
                                                        </div>
                                                    </div>
                                                    <div style={{ fontSize: "12px", color: "#52525b", lineHeight: 1.55, marginTop: "8px" }}>{service.description}</div>
                                                    <div style={{ fontSize: "11px", color: "#71717a", marginTop: "8px", lineHeight: 1.5 }}>{service.readinessNote}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div style={{ marginTop: "20px", borderRadius: "22px", border: "1px solid #eceae4", background: "#fff", padding: "18px" }}>
                                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>CSV readiness</div>
                                    <div style={{ fontSize: "12px", color: "#71717a", marginTop: "8px", lineHeight: 1.55 }}>
                                        {csvRecords.length > 0
                                            ? `${csvRecords.length} contacts parsed from ${csvFileName}.`
                                            : "Upload a CSV in the Contacts step. Extra business columns will be stored automatically."}
                                    </div>
                                    <div style={{ marginTop: "12px", fontSize: "12px", color: "#52525b", lineHeight: 1.6 }}>
                                        Required field:
                                        <span style={{ fontWeight: 600, color: "#111827" }}> phone</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: "24px", overflowY: "auto", minHeight: 0 }}>
                                {wizardTab === "Configuration" ? (
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" }}>
                                        <div style={{ gridColumn: "1 / span 2", borderRadius: "22px", border: "1px solid #eceae4", background: "#fff", padding: "18px" }}>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#3f3f46", marginBottom: "8px" }}>Campaign Name</label>
                                            <input
                                                value={name}
                                                onChange={(event) => setName(event.target.value)}
                                                placeholder="e.g. April demo follow-up"
                                                required
                                                style={{ width: "100%", height: "44px", borderRadius: "14px", border: "1px solid #e4e4e7", padding: "0 14px", fontSize: "14px", outline: "none", background: "#fcfcfb" }}
                                            />
                                        </div>

                                        <div style={{ borderRadius: "22px", border: "1px solid #eceae4", background: "#fff", padding: "18px" }}>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#3f3f46", marginBottom: "8px" }}>Voice Agent</label>
                                            <select
                                                value={selectedAgentId}
                                                onChange={(event) => setSelectedAgentId(event.target.value)}
                                                style={{ width: "100%", height: "44px", borderRadius: "14px", border: "1px solid #e4e4e7", padding: "0 14px", fontSize: "14px", background: "#fcfcfb" }}
                                            >
                                                <option value="">Choose agent</option>
                                                {agents.map((agent) => (
                                                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div style={{ borderRadius: "22px", border: "1px solid #eceae4", background: "#fff", padding: "18px" }}>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#3f3f46", marginBottom: "8px" }}>Schedule</label>
                                            <input
                                                type="datetime-local"
                                                value={scheduleTime}
                                                onChange={(event) => setScheduleTime(event.target.value)}
                                                style={{ width: "100%", height: "44px", borderRadius: "14px", border: "1px solid #e4e4e7", padding: "0 14px", fontSize: "14px", outline: "none", background: "#fcfcfb" }}
                                            />
                                        </div>

                                        <div style={{ gridColumn: "1 / span 2", borderRadius: "22px", border: "1px solid #eceae4", background: "#fff", padding: "18px" }}>
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px" }}>
                                                <div>
                                                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>Launch behaviour</div>
                                                    <div style={{ fontSize: "12px", color: "#71717a", marginTop: "4px", lineHeight: 1.55 }}>
                                                        Launch immediately after contact upload, unless a schedule is defined.
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setLaunchAfterCreate((current) => !current)}
                                                    style={{
                                                        width: "54px",
                                                        height: "30px",
                                                        borderRadius: "999px",
                                                        border: "none",
                                                        background: launchAfterCreate ? "#111827" : "#d4d4d8",
                                                        cursor: "pointer",
                                                        position: "relative",
                                                    }}
                                                >
                                                    <span style={{
                                                        position: "absolute",
                                                        top: "3px",
                                                        left: launchAfterCreate ? "27px" : "3px",
                                                        width: "24px",
                                                        height: "24px",
                                                        borderRadius: "999px",
                                                        background: "#fff",
                                                        transition: "left 0.18s ease",
                                                    }} />
                                                </button>
                                            </div>
                                        </div>

                                        {selectedAgentServices.length > 0 && (
                                            <div style={{ gridColumn: "1 / span 2", borderRadius: "22px", border: "1px solid #eceae4", background: "#fff", padding: "18px" }}>
                                                <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>What this campaign will automate</div>
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "14px" }}>
                                                    {selectedAgentServices.map((service) => (
                                                        <div key={service.id} style={{ padding: "10px 12px", borderRadius: "14px", border: "1px solid #eceae4", background: "#fcfcfb", minWidth: "220px" }}>
                                                            <div style={{ fontSize: "12px", fontWeight: 600, color: "#111827" }}>{service.label}</div>
                                                            <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "6px", lineHeight: 1.5 }}>{service.readinessNote}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                        <div style={{ borderRadius: "22px", border: "1px solid #eceae4", background: "#fff", padding: "18px" }}>
                                            <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>Upload calling list</div>
                                            <div style={{ fontSize: "12px", color: "#71717a", marginTop: "4px", lineHeight: 1.55 }}>
                                                Upload a CSV with phone numbers. Extra columns are preserved as business metadata for follow-up automation.
                                            </div>
                                            <div style={{ marginTop: "14px", border: "2px dashed #e4e4e7", borderRadius: "18px", padding: "28px", textAlign: "center", background: "#fcfcfb" }}>
                                                <input
                                                    type="file"
                                                    id="campaign-csv"
                                                    accept=".csv"
                                                    onChange={(event) => handleCsvChange(event.target.files?.[0] || null)}
                                                    style={{ display: "none" }}
                                                />
                                                <label htmlFor="campaign-csv" style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}>
                                                    <UploadIcon size={34} style={{ color: "#9ca3af", marginBottom: "12px" }} />
                                                    <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>{csvFileName || "Click to upload CSV"}</span>
                                                    <span style={{ fontSize: "12px", color: "#6b7280", marginTop: "6px" }}>Recommended headers: phone, name, email, company, order_id, lead_id</span>
                                                </label>
                                            </div>
                                        </div>

                                        {csvHeaders.length > 0 && (
                                            <div style={{ borderRadius: "22px", border: "1px solid #eceae4", background: "#fff", padding: "18px" }}>
                                                <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>Map CSV fields</div>
                                                <div style={{ fontSize: "12px", color: "#71717a", marginTop: "4px", lineHeight: 1.55 }}>
                                                    Choose how campaign data should be stored. Unmapped columns stay inside contact metadata automatically.
                                                </div>
                                                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px", marginTop: "14px" }}>
                                                    {(Object.keys(FIELD_LABELS) as (keyof FieldMapping)[]).map((field) => (
                                                        <div key={field}>
                                                            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#3f3f46", marginBottom: "8px" }}>{FIELD_LABELS[field]}</label>
                                                            <select
                                                                value={fieldMapping[field]}
                                                                onChange={(event) => setFieldMapping((current) => ({ ...current, [field]: event.target.value }))}
                                                                style={{ width: "100%", height: "42px", borderRadius: "14px", border: "1px solid #e4e4e7", padding: "0 14px", fontSize: "13px", background: "#fcfcfb" }}
                                                            >
                                                                <option value="">Not mapped</option>
                                                                {csvHeaders.map((header) => (
                                                                    <option key={header} value={header}>{header}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {csvPreview.length > 0 && (
                                            <div style={{ borderRadius: "22px", border: "1px solid #eceae4", background: "#fff", padding: "18px" }}>
                                                <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>Preview</div>
                                                <div style={{ overflowX: "auto", marginTop: "14px" }}>
                                                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "640px" }}>
                                                        <thead>
                                                            <tr>
                                                                {csvHeaders.map((header) => (
                                                                    <th key={header} style={{ textAlign: "left", padding: "10px 12px", fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid #eceae4" }}>
                                                                        {header}
                                                                    </th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {csvPreview.map((record, rowIndex) => (
                                                                <tr key={rowIndex}>
                                                                    {csvHeaders.map((header) => (
                                                                        <td key={`${rowIndex}-${header}`} style={{ padding: "10px 12px", fontSize: "12px", color: "#3f3f46", borderBottom: "1px solid #f4f4f5" }}>
                                                                            {record[header] || "—"}
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginTop: "20px", paddingTop: "18px", borderTop: "1px solid #eceae4" }}>
                                    <div style={{ fontSize: "12px", color: "#71717a", lineHeight: 1.55 }}>
                                        {wizardTab === "Configuration"
                                            ? "Choose the voice agent whose services this campaign should inherit."
                                            : `${csvRecords.length || 0} contact${csvRecords.length === 1 ? "" : "s"} ready for import.`}
                                    </div>
                                    <div style={{ display: "flex", gap: "10px" }}>
                                        {wizardTab === "Contacts" && (
                                            <button
                                                type="button"
                                                onClick={() => setWizardTab("Configuration")}
                                                style={{ height: "42px", padding: "0 16px", borderRadius: "14px", border: "1px solid #e4e4e7", background: "#fff", cursor: "pointer", fontSize: "13px", color: "#3f3f46" }}
                                            >
                                                Back
                                            </button>
                                        )}

                                        {wizardTab === "Configuration" ? (
                                            <button
                                                type="button"
                                                disabled={!name || !selectedAgentId}
                                                onClick={() => setWizardTab("Contacts")}
                                                style={{ height: "42px", padding: "0 18px", borderRadius: "14px", border: "none", background: "#111827", color: "#fff", cursor: !name || !selectedAgentId ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, opacity: !name || !selectedAgentId ? 0.6 : 1 }}
                                            >
                                                Continue
                                                <ChevronRight size={14} />
                                            </button>
                                        ) : (
                                            <button
                                                type="submit"
                                                disabled={submitting || !name || !selectedAgentId || !fieldMapping.phone || csvRecords.length === 0}
                                                style={{ height: "42px", padding: "0 18px", borderRadius: "14px", border: "none", background: "#111827", color: "#fff", cursor: submitting || !name || !selectedAgentId || !fieldMapping.phone || csvRecords.length === 0 ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: 600, opacity: submitting || !name || !selectedAgentId || !fieldMapping.phone || csvRecords.length === 0 ? 0.6 : 1 }}
                                            >
                                                {submitting ? "Creating..." : launchAfterCreate && !scheduleTime ? "Create & Launch" : "Create Campaign"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isConcurrencyOpen && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.35)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ background: "#fff", borderRadius: "20px", padding: "26px", width: "420px", boxShadow: "0 20px 50px rgba(15,23,42,0.18)", position: "relative", border: "1px solid #eceae4" }}>
                        <button onClick={() => setIsConcurrencyOpen(false)} style={{ position: "absolute", right: "18px", top: "18px", background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}>
                            <XIcon size={18} />
                        </button>
                        <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#111827" }}>Campaign concurrency</h2>
                        <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "6px", lineHeight: 1.55 }}>
                            This value is stored into campaign launch config so operators know the intended dial limit.
                        </p>

                        <div style={{ marginTop: "24px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#111827", fontWeight: 600, marginBottom: "10px" }}>
                                <span>Workspace Limit</span>
                                <span>{workspaceConcurrency} calls</span>
                            </div>
                            <input type="range" min="1" max="50" value={workspaceConcurrency} onChange={(event) => setWorkspaceConcurrency(parseInt(event.target.value, 10))} style={{ width: "100%", accentColor: "#111827" }} />
                            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginTop: "14px", borderRadius: "14px", border: "1px solid #fde68a", background: "#fffbeb", padding: "12px 14px" }}>
                                <AlertTriangle size={14} style={{ color: "#b45309", marginTop: "2px", flexShrink: 0 }} />
                                <div style={{ fontSize: "12px", color: "#92400e", lineHeight: 1.55 }}>
                                    This is a planning control today. The current backend stores the value in campaign config, but it does not yet enforce dial throttling server-side.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
