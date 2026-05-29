"use client";

import { useEffect, useState, useCallback } from "react";
import { Activity, Phone, PhoneOff, Clock, ArrowUpDown, AlertTriangle, CheckCircle2, Bot, User, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { buildProxyUrl } from "@/lib/backend-url";
import { resolveWorkspaceSession } from "@/lib/workspace-session";

/* ─── Types ─── */
interface LiveSession {
    id: string;
    agent_id: string;
    workspace_id: string;
    channel: string;
    customer_phone?: string;
    intent?: string;
    sentiment_score?: number;
    started_at: string;
    ended_at?: string;
    outcome?: string;
    transcript?: any[];
}

export default function LiveMonitorPage() {
    const [sessions, setSessions] = useState<LiveSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(true);
    const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null);
    const [orgId, setOrgId] = useState("");

    const fetchSessions = useCallback(async () => {
        try {
            let workspaceId = orgId;
            if (!workspaceId) {
                const session = await resolveWorkspaceSession();
                workspaceId = session.workspaceId;
                setOrgId(workspaceId);
            }
            const res = await fetch(buildProxyUrl(`/api/orchestrator/sessions?workspaceId=${workspaceId}&limit=50`));
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            setSessions(data.data || []);
            setConnected(true);
        } catch {
            setConnected(false);
        } finally {
            setLoading(false);
        }
    }, [orgId]);

    useEffect(() => { fetchSessions(); }, []);
    useEffect(() => { const i = setInterval(fetchSessions, 5000); return () => clearInterval(i); }, [fetchSessions]);

    const activeSessions = sessions.filter(s => !s.ended_at);
    const completedSessions = sessions.filter(s => !!s.ended_at);

    const getSentimentColor = (score?: number) => {
        if (!score || score > 0.6) return "#16a34a";
        if (score > 0.3) return "#f59e0b";
        return "#dc2626";
    };

    const getSentimentLabel = (score?: number) => {
        if (!score || score > 0.6) return "Positive";
        if (score > 0.3) return "Neutral";
        return "Negative";
    };

    const getDuration = (start: string) => {
        const mins = Math.round((Date.now() - new Date(start).getTime()) / 60000);
        if (mins < 1) return "< 1m";
        return `${mins}m`;
    };

    return (
        <div style={{ background: "#fafafa", minHeight: "100vh", width: "100%" }}>
            {/* Top Bar */}
            <div style={{
                height: "52px", background: "#ffffff", borderBottom: "1px solid #e4e4e7",
                display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px"
            }}>
                <div style={{ fontSize: "13px", color: "#9ca3af" }}>
                    Dashboard &gt; <span style={{ color: "#09090b" }}>Live Monitor</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {connected ? <Wifi size={14} color="#16a34a" /> : <WifiOff size={14} color="#dc2626" />}
                        <span style={{ fontSize: "12px", color: connected ? "#16a34a" : "#dc2626", fontWeight: 500 }}>
                            {connected ? "Live" : "Disconnected"}
                        </span>
                    </div>
                    <button onClick={fetchSessions} style={{
                        width: "32px", height: "32px", border: "1px solid #e4e4e7", borderRadius: "8px",
                        background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                    }}><RefreshCw size={14} color="#6b7280" /></button>
                </div>
            </div>

            {/* Page Header */}
            <div style={{ padding: "28px 32px 0" }}>
                <h1 style={{ fontSize: "20px", fontWeight: 600, color: "#09090b", margin: 0 }}>Live Calls Monitor</h1>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0" }}>See all active conversations, sentiment, and routing in real-time</p>
            </div>

            {/* Stats Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", padding: "20px 32px" }}>
                {[
                    { label: "Active Calls", value: activeSessions.length, icon: Phone, color: "#16a34a", bg: "#f0fdf4" },
                    { label: "Total Today", value: sessions.length, icon: Activity, color: "#9ccbc0", bg: "#f0fffb" },
                    { label: "Escalated", value: sessions.filter(s => s.outcome === "escalated").length, icon: AlertTriangle, color: "#f59e0b", bg: "#fffbeb" },
                    { label: "Resolved", value: sessions.filter(s => s.outcome === "resolved" || s.outcome === "completed").length, icon: CheckCircle2, color: "#16a34a", bg: "#f0fdf4" },
                ].map((stat, i) => (
                    <div key={i} style={{
                        background: "#fff", borderRadius: "14px", border: "1px solid #e4e4e7", padding: "18px 20px",
                        display: "flex", alignItems: "center", gap: "14px"
                    }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <stat.icon size={20} color={stat.color} />
                        </div>
                        <div>
                            <div style={{ fontSize: "22px", fontWeight: 700, color: "#09090b" }}>{stat.value}</div>
                            <div style={{ fontSize: "12px", color: "#6b7280" }}>{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Active Calls Section */}
            <div style={{ padding: "0 32px 16px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#09090b", margin: "0 0 12px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16a34a", animation: "pulse 2s infinite" }} />
                    Active Conversations ({activeSessions.length})
                    <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
                </h3>

                {activeSessions.length === 0 ? (
                    <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e4e4e7", padding: "40px", textAlign: "center" }}>
                        <Phone size={36} color="#d1d5db" style={{ margin: "0 auto 12px" }} />
                        <p style={{ fontSize: "14px", color: "#9ca3af", margin: 0 }}>No active conversations right now</p>
                        <p style={{ fontSize: "12px", color: "#d1d5db", margin: "4px 0 0" }}>Incoming calls and chats will appear here in real-time</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "12px" }}>
                        {activeSessions.map(s => (
                            <div key={s.id} onClick={() => setSelectedSession(s)} style={{
                                background: "#fff", borderRadius: "14px", border: "1px solid #e4e4e7",
                                padding: "16px", cursor: "pointer", transition: "all 0.15s",
                                borderLeft: `4px solid ${getSentimentColor(s.sentiment_score)}`
                            }}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)"; }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <div style={{
                                            width: "28px", height: "28px", borderRadius: "50%",
                                            background: "linear-gradient(135deg, #9ccbc0, #90bcb2)", color: "#fff",
                                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700
                                        }}>{(s.customer_phone || "?")[0]}</div>
                                        <div>
                                            <div style={{ fontSize: "13px", fontWeight: 600, color: "#09090b" }}>{s.customer_phone || "Unknown"}</div>
                                            <div style={{ fontSize: "11px", color: "#9ca3af" }}>{s.channel}</div>
                                        </div>
                                    </div>
                                    <span style={{
                                        fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "10px",
                                        color: getSentimentColor(s.sentiment_score),
                                        background: s.sentiment_score && s.sentiment_score < 0.3 ? "#fef2f2" : s.sentiment_score && s.sentiment_score < 0.6 ? "#fffbeb" : "#f0fdf4"
                                    }}>{getSentimentLabel(s.sentiment_score)}</span>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "#6b7280" }}>
                                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Clock size={12} />{getDuration(s.started_at)}</span>
                                    {s.intent && <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><ArrowUpDown size={12} />{s.intent}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Completed */}
            <div style={{ padding: "0 32px 32px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#09090b", margin: "0 0 12px" }}>Recent Completed</h3>
                <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e4e4e7", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid #f4f4f5" }}>
                                {["Customer", "Channel", "Intent", "Sentiment", "Duration", "Outcome"].map(h => (
                                    <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: "11px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {completedSessions.length === 0 ? (
                                <tr><td colSpan={6} style={{ padding: "24px", textAlign: "center", fontSize: "13px", color: "#9ca3af" }}>No completed sessions yet</td></tr>
                            ) : completedSessions.slice(0, 15).map(s => {
                                const duration = s.ended_at ? Math.round((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000) : 0;
                                return (
                                    <tr key={s.id} style={{ borderBottom: "1px solid #f4f4f5", cursor: "pointer" }} onClick={() => setSelectedSession(s)}
                                    onMouseEnter={e => (e.currentTarget.style.background = "#fafafa")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                    >
                                        <td style={{ padding: "10px 14px", fontSize: "13px", color: "#09090b" }}>{s.customer_phone || "Unknown"}</td>
                                        <td style={{ padding: "10px 14px" }}>
                                            <span style={{ fontSize: "11px", fontWeight: 500, padding: "2px 8px", borderRadius: "8px", background: s.channel === "voice" ? "#f0fffb" : "#f0fdf4", color: s.channel === "voice" ? "#9ccbc0" : "#16a34a" }}>{s.channel}</span>
                                        </td>
                                        <td style={{ padding: "10px 14px", fontSize: "12px", color: "#6b7280" }}>{s.intent || "—"}</td>
                                        <td style={{ padding: "10px 14px" }}>
                                            <span style={{ fontSize: "11px", fontWeight: 600, color: getSentimentColor(s.sentiment_score) }}>
                                                {getSentimentLabel(s.sentiment_score)}
                                            </span>
                                        </td>
                                        <td style={{ padding: "10px 14px", fontSize: "12px", color: "#6b7280" }}>{duration}m</td>
                                        <td style={{ padding: "10px 14px" }}>
                                            <span style={{
                                                fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "8px", textTransform: "capitalize",
                                                background: s.outcome === "escalated" ? "#fffbeb" : s.outcome === "resolved" ? "#f0fdf4" : "#f4f4f5",
                                                color: s.outcome === "escalated" ? "#f59e0b" : s.outcome === "resolved" ? "#16a34a" : "#6b7280"
                                            }}>{s.outcome || "completed"}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Session Detail Modal */}
            {selectedSession && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(2px)",
                    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
                }} onClick={() => setSelectedSession(null)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: "#fff", borderRadius: "16px", width: "500px", maxHeight: "80vh",
                        padding: "24px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflowY: "auto"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#09090b", margin: 0 }}>Session Details</h2>
                            <button onClick={() => setSelectedSession(null)} style={{
                                border: "none", background: "#f4f4f5", width: "28px", height: "28px",
                                borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", color: "#6b7280"
                            }}>✕</button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                            {[
                                { l: "Phone", v: selectedSession.customer_phone || "Unknown" },
                                { l: "Channel", v: selectedSession.channel },
                                { l: "Intent", v: selectedSession.intent || "—" },
                                { l: "Outcome", v: selectedSession.outcome || "ongoing" },
                            ].map(({ l, v }) => (
                                <div key={l} style={{ padding: "10px", borderRadius: "10px", background: "#fafafa" }}>
                                    <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "2px" }}>{l}</div>
                                    <div style={{ fontSize: "13px", fontWeight: 500, color: "#09090b", textTransform: "capitalize" }}>{v}</div>
                                </div>
                            ))}
                        </div>

                        {/* Transcript */}
                        <h4 style={{ fontSize: "12px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", marginBottom: "8px" }}>Transcript</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
                            {(selectedSession.transcript || []).length === 0 ? (
                                <div style={{ fontSize: "13px", color: "#9ca3af", textAlign: "center", padding: "16px" }}>No transcript available</div>
                            ) : (selectedSession.transcript || []).map((t: any, i: number) => (
                                <div key={i} style={{
                                    display: "flex", gap: "8px", alignItems: "flex-start",
                                    flexDirection: t.role === "user" ? "row" : "row-reverse"
                                }}>
                                    <div style={{
                                        width: "24px", height: "24px", borderRadius: "50%", flexShrink: 0,
                                        background: t.role === "user" ? "#f4f4f5" : "linear-gradient(135deg, #9ccbc0, #90bcb2)",
                                        color: t.role === "user" ? "#6b7280" : "#fff",
                                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px"
                                    }}>{t.role === "user" ? <User size={12} /> : <Bot size={12} />}</div>
                                    <div style={{
                                        padding: "8px 12px", borderRadius: "12px", fontSize: "13px",
                                        maxWidth: "75%", lineHeight: 1.5,
                                        background: t.role === "user" ? "#f4f4f5" : "#f0fffb",
                                        color: "#09090b"
                                    }}>{t.content}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
