"use client";

import { useEffect, useState } from "react";
import { Play, Search, Smile, Square, Volume2, MoreHorizontal, Sliders } from "lucide-react";
import { buildProxyUrl } from "@/lib/backend-url";
import CreateAgentModal from "@/components/voice-agents/CreateAgentModal";

interface VoiceAgent {
    id: string;
    name: string;
    language?: string;
    voice?: string;
    first_message?: string;
    system_prompt?: string;
    agent_type?: string;
    call_direction?: string;
    call_count?: number;
    status?: string;
}

export default function VoiceAgentsPage() {
    const [agents, setAgents] = useState<VoiceAgent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [testAgent, setTestAgent] = useState<VoiceAgent | null>(null);
    const [previewText, setPreviewText] = useState("");
    const [speaking, setSpeaking] = useState(false);
    const [simMessages, setSimMessages] = useState<Array<{ role: "user" | "assistant"; content: string; handledBy?: string }>>([]);
    const [simInput, setSimInput] = useState("");
    const [simSessionId, setSimSessionId] = useState<string | null>(null);
    const [simLoading, setSimLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("All");
    const [orgId, setOrgId] = useState("");

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            let activeOrgId = orgId;
            if (!activeOrgId) {
                const agentRes = await fetch(buildProxyUrl("/agents/primary"));
                if (!agentRes.ok) {
                    throw new Error("Failed to resolve workspace session");
                }

                const agentData = await agentRes.json();
                activeOrgId = agentData.workspace_id;
                setOrgId(activeOrgId);
            }

            if (!activeOrgId) {
                throw new Error("Workspace session is unavailable");
            }

            const res = await fetch(buildProxyUrl(`/api/voice-agents?orgId=${activeOrgId}`));
            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                throw new Error(errData?.error || "Failed to fetch voice agents");
            }
            const data = await res.json();
            setAgents(data);
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (!testAgent) return;
        setPreviewText(
            testAgent.first_message ||
            `Hello, this is ${testAgent.name}. How can I help you today?`
        );
    }, [testAgent]);

    useEffect(() => {
        return () => {
            if (typeof window !== "undefined") {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const handleTestVoice = (agent: VoiceAgent) => {
        setTestAgent(agent);
        setSimMessages(agent.agent_type === "multi" ? [{
            role: "assistant",
            content: agent.first_message || `Hello, this is ${agent.name}. How can I help you today?`,
            handledBy: "front_desk",
        }] : []);
        setSimInput("");
        setSimSessionId(null);
    };

    const stopPreview = () => {
        if (typeof window === "undefined") return;
        window.speechSynthesis.cancel();
        setSpeaking(false);
    };

    const playPreview = () => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
            alert("Voice preview is not supported in this browser.");
            return;
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(
            previewText || `Hello, this is ${testAgent?.name || "your voice agent"}.`
        );

        const voices = window.speechSynthesis.getVoices();
        const languageHint = (testAgent?.language || "").toLowerCase();

        if (languageHint.includes("hindi")) {
            utterance.lang = "hi-IN";
        } else if (languageHint.includes("tamil")) {
            utterance.lang = "ta-IN";
        } else if (languageHint.includes("telugu")) {
            utterance.lang = "te-IN";
        } else if (languageHint.includes("malayalam")) {
            utterance.lang = "ml-IN";
        } else {
            utterance.lang = "en-IN";
        }

        const matchedVoice = voices.find((voice) => voice.lang.toLowerCase() === utterance.lang.toLowerCase())
            || voices.find((voice) => voice.lang.toLowerCase().startsWith(utterance.lang.slice(0, 2).toLowerCase()))
            || voices[0];

        if (matchedVoice) {
            utterance.voice = matchedVoice;
        }

        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    const sendSimulationMessage = async () => {
        if (!testAgent || testAgent.agent_type !== "multi" || !simInput.trim() || !orgId) {
            return;
        }

        const message = simInput.trim();
        setSimMessages((current) => [...current, { role: "user", content: message }]);
        setSimInput("");
        setSimLoading(true);

        try {
            const res = await fetch(buildProxyUrl("/api/orchestrator/chat"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message,
                    sessionId: simSessionId,
                    channel: "chat",
                    customerPhone: "preview-user",
                    agentId: testAgent.id,
                    workspaceId: orgId,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                throw new Error(errData?.error || "Failed to run the multi prompt simulation");
            }

            const payload = await res.json();
            const result = payload?.data || payload;
            setSimSessionId(result.sessionId);
            setSimMessages((current) => [
                ...current,
                {
                    role: "assistant",
                    content: result.reply,
                    handledBy: result.handledBy,
                },
            ]);
        } catch (err: any) {
            setSimMessages((current) => [
                ...current,
                {
                    role: "assistant",
                    content: err.message || "Unable to run the workflow simulation right now.",
                    handledBy: "error",
                },
            ]);
        } finally {
            setSimLoading(false);
        }
    };

    const filteredAgents = agents.filter(a => {
        const matchSearch = (a.name || '').toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === "All" || (a.call_direction || "").toLowerCase() === filter.toLowerCase();
        return matchSearch && matchFilter;
    });

    return (
        <div style={{ background: '#fafafa', minHeight: '100vh', width: '100%' }}>
            {/* Top Bar */}
            <div style={{
                height: '52px', background: '#ffffff', borderBottom: '1px solid #e4e4e7',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px'
            }}>
                <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                    Dashboard &gt; <span style={{ color: '#09090b' }}>Voice Agents</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ color: '#f97316', fontSize: '13px', fontWeight: 500, background: '#fff7ed', padding: '4px 8px', borderRadius: '6px' }}>
                        ₹1,200
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ padding: '28px 32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#09090b' }}>Voice Agents</h1>
                        <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Manage your all voice agents here</p>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {/* Search */}
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <input
                                placeholder="Search..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{
                                    width: '240px', height: '34px', background: '#fff', border: '1px solid #e4e4e7',
                                    borderRadius: '8px', padding: '0 14px 0 36px', fontSize: '13px', outline: 'none'
                                }}
                            />
                        </div>

                        {/* Filter */}
                        <select
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            style={{
                                height: '34px', border: '1px solid #e4e4e7', borderRadius: '8px', padding: '0 14px',
                                background: '#fff', fontSize: '13px', cursor: 'pointer', outline: 'none'
                            }}
                        >
                            <option value="All">All</option>
                            <option value="Inbound">Inbound</option>
                            <option value="Outbound">Outbound</option>
                            <option value="Webcall">Webcall</option>
                        </select>

                        {/* Create Button */}
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            style={{
                                background: '#09090b', color: 'white', height: '34px', padding: '0 16px',
                                borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: 'none'
                            }}
                        >
                            + Create Agent
                        </button>
                    </div>
                </div>

                <div style={{ height: '1px', background: '#e4e4e7', margin: '20px 0' }} />

                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500, marginBottom: '16px' }}>This week</div>

                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ height: '160px', background: '#fff', border: '1px solid #e4e4e7', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
                        ))}
                    </div>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', background: '#fff', borderRadius: '12px', border: '1px solid #e4e4e7' }}>
                        <p style={{ fontSize: '14px', fontWeight: 500, color: '#6b7280' }}>Unable to load voice agents</p>
                        <p style={{ fontSize: '13px', marginTop: '6px' }}>{error}</p>
                    </div>
                ) : filteredAgents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', background: '#fff', borderRadius: '12px', border: '1px solid #e4e4e7' }}>
                        <Smile size={48} style={{ marginBottom: 16, opacity: 0.4 }} />
                        <p style={{ fontSize: '14px', fontWeight: 500, color: '#6b7280' }}>No agents yet</p>
                        <p style={{ fontSize: '13px' }}>Click "+ Create" to get started</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        {filteredAgents.map(agent => (
                            <div key={agent.id} style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: '12px', padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ width: '48px', height: '48px', background: '#f3f4f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Smile size={24} style={{ color: '#6b7280' }} />
                                    </div>
                                    <button style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
                                        <MoreHorizontal size={16} />
                                    </button>
                                </div>

                                <div style={{ marginTop: '14px' }}>
                                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#09090b' }}>{agent.name}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
                                        <Sliders size={12} /> {agent.agent_type || 'Single Prompt'}
                                    </div>
                                </div>

                                <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                                    <div style={{ border: '1px solid #e4e4e7', borderRadius: '20px', padding: '4px 10px', fontSize: '12px', color: '#09090b' }}>
                                        {agent.call_direction
                                            ? agent.call_direction.charAt(0).toUpperCase() + agent.call_direction.slice(1).toLowerCase()
                                            : 'Outbound'}
                                    </div>
                                    <div style={{ border: '1px solid #e4e4e7', borderRadius: '20px', padding: '4px 10px', fontSize: '12px', color: '#09090b' }}>
                                        Calls: {agent.call_count || 0}
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleTestVoice(agent)}
                                    style={{
                                        marginTop: '16px',
                                        width: '100%',
                                        height: '36px',
                                        borderRadius: '10px',
                                        border: '1px solid #e4e4e7',
                                        background: '#f8fafc',
                                        color: '#09090b',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <Volume2 size={14} />
                                    Test Voice Agent
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal Injection */}
            <CreateAgentModal 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)} 
                orgId={orgId}
                onCreated={fetchData} 
            />

            {testAgent && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.24)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                    <div style={{ width: '560px', maxWidth: '100%', background: '#fff', borderRadius: '24px', border: '1px solid #e4e4e7', boxShadow: '0 30px 100px rgba(15, 23, 42, 0.18)', padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                            <div>
                                <div style={{ fontSize: '20px', fontWeight: 600, color: '#09090b' }}>Test Voice Agent</div>
                                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '6px' }}>
                                    Browser preview for <strong>{testAgent.name}</strong>. This simulates the opening voice, not the exact provider rendering.
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    stopPreview();
                                    setTestAgent(null);
                                }}
                                style={{ border: '1px solid #e4e4e7', background: '#fff', borderRadius: '10px', width: '34px', height: '34px', cursor: 'pointer', color: '#6b7280' }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ marginTop: '18px', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
                            <div style={{ border: '1px solid #e4e4e7', borderRadius: '16px', padding: '12px' }}>
                                <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Language</div>
                                <div style={{ fontSize: '13px', color: '#09090b', fontWeight: 600, marginTop: '6px' }}>{testAgent.language || 'English'}</div>
                            </div>
                            <div style={{ border: '1px solid #e4e4e7', borderRadius: '16px', padding: '12px' }}>
                                <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Voice</div>
                                <div style={{ fontSize: '13px', color: '#09090b', fontWeight: 600, marginTop: '6px' }}>{testAgent.voice || 'Default'}</div>
                            </div>
                            <div style={{ border: '1px solid #e4e4e7', borderRadius: '16px', padding: '12px' }}>
                                <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Direction</div>
                                <div style={{ fontSize: '13px', color: '#09090b', fontWeight: 600, marginTop: '6px' }}>{testAgent.call_direction || 'Outbound'}</div>
                            </div>
                        </div>

                        <div style={{ marginTop: '18px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#3f3f46', marginBottom: '8px' }}>Preview Script</label>
                            <textarea
                                value={previewText}
                                onChange={(e) => setPreviewText(e.target.value)}
                                rows={6}
                                style={{ width: '100%', borderRadius: '16px', border: '1px solid #e4e4e7', padding: '14px', fontSize: '14px', outline: 'none', resize: 'vertical', background: '#fcfcfb', lineHeight: 1.6 }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginTop: '18px' }}>
                            <div style={{ fontSize: '12px', color: '#71717a' }}>
                                {speaking ? 'Playing preview...' : 'Ready to preview the opening message.'}
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={stopPreview}
                                    style={{ height: '40px', padding: '0 16px', borderRadius: '12px', border: '1px solid #e4e4e7', background: '#fff', color: '#09090b', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <Square size={13} />
                                    Stop
                                </button>
                                <button
                                    onClick={playPreview}
                                    style={{ height: '40px', padding: '0 16px', borderRadius: '12px', border: 'none', background: '#09090b', color: '#fff', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <Play size={13} />
                                    Play Preview
                                </button>
                            </div>
                        </div>

                        {testAgent.agent_type === "multi" && (
                            <div style={{ marginTop: '22px', borderTop: '1px solid #eceae4', paddingTop: '22px' }}>
                                <div style={{ fontSize: '16px', fontWeight: 600, color: '#09090b' }}>Workflow Simulator</div>
                                <div style={{ fontSize: '12px', color: '#71717a', marginTop: '6px' }}>
                                    This runs the saved multi prompt workflow through the backend orchestrator and shows which specialist handled each reply.
                                </div>

                                <div style={{ marginTop: '14px', border: '1px solid #e4e4e7', borderRadius: '18px', background: '#fcfcfb', padding: '14px', minHeight: '220px', maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {simMessages.map((message, index) => (
                                        <div key={`${message.role}-${index}`} style={{ alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
                                            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textAlign: message.role === 'user' ? 'right' : 'left' }}>
                                                {message.role === 'user' ? 'You' : `Assistant${message.handledBy ? ` · ${message.handledBy}` : ''}`}
                                            </div>
                                            <div style={{
                                                borderRadius: '16px',
                                                padding: '12px 14px',
                                                background: message.role === 'user' ? '#111827' : '#fff',
                                                color: message.role === 'user' ? '#fff' : '#09090b',
                                                border: message.role === 'user' ? 'none' : '1px solid #e4e4e7',
                                                fontSize: '13px',
                                                lineHeight: 1.55,
                                            }}>
                                                {message.content}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                                    <textarea
                                        value={simInput}
                                        onChange={(e) => setSimInput(e.target.value)}
                                        rows={2}
                                        placeholder="Type a support, sales, booking, or escalation query to test routing..."
                                        style={{ flex: 1, borderRadius: '14px', border: '1px solid #e4e4e7', padding: '12px 14px', fontSize: '13px', background: '#fff', resize: 'vertical', outline: 'none' }}
                                    />
                                    <button
                                        onClick={sendSimulationMessage}
                                        disabled={simLoading || !simInput.trim()}
                                        style={{ alignSelf: 'stretch', minWidth: '112px', borderRadius: '14px', border: 'none', background: '#111827', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: simLoading || !simInput.trim() ? 'not-allowed' : 'pointer', opacity: simLoading || !simInput.trim() ? 0.6 : 1 }}
                                    >
                                        {simLoading ? 'Sending...' : 'Send'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
