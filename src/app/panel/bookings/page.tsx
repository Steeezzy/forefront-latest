"use client";

import { useEffect, useState, useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight, Plus, X, Clock, Phone, User, Bot, CheckCircle2, XCircle, CalendarDays, Loader2 } from "lucide-react";
import { buildProxyUrl } from "@/lib/backend-url";
import { resolveWorkspaceSession } from "@/lib/workspace-session";

/* ─── Types ─── */
interface Booking {
    id: string;
    customer_name: string;
    customer_phone?: string;
    customer_email?: string;
    status: string;
    notes?: string;
    slot_start: string;
    slot_end: string;
    slot_id?: string;
    agent_name?: string;
}

interface Slot {
    id: string;
    slot_date: string;
    slot_start: string;
    slot_end: string;
    is_booked: boolean;
    agent_id?: string;
}

/* ─── Helpers ─── */
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay();
}

function isSameDay(d1: Date, d2: Date) {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

const statusColors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    confirmed: { bg: "#f0fdf4", border: "#16a34a", text: "#15803d", badge: "#dcfce7" },
    available: { bg: "#f9fafb", border: "#d1d5db", text: "#6b7280", badge: "#f3f4f6" },
    cancelled: { bg: "#fef2f2", border: "#fecaca", text: "#dc2626", badge: "#fee2e2" },
    completed: { bg: "#eff6ff", border: "#bfdbfe", text: "#2563eb", badge: "#dbeafe" },
};

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function BookingsPage() {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [showAddSlot, setShowAddSlot] = useState(false);
    const [agents, setAgents] = useState<any[]>([]);
    const [orgId, setOrgId] = useState("");

    /* ─── Fetch ─── */
    const fetchBookings = async () => {
        setLoading(true);
        setError(null);
        try {
            let workspaceId = orgId;
            if (!workspaceId) {
                const session = await resolveWorkspaceSession();
                workspaceId = session.workspaceId;
                setOrgId(workspaceId);
            }

            const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
            const res = await fetch(buildProxyUrl(`/api/bookings?workspaceId=${workspaceId}&month=${monthStr}`));
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            setBookings(Array.isArray(data) ? data : data.data || []);
        } catch {
            setBookings([]);
        }
        try {
            const workspaceId = orgId || (await resolveWorkspaceSession()).workspaceId;
            if (!orgId) setOrgId(workspaceId);
            const res2 = await fetch(buildProxyUrl(`/api/bookings/slots?workspaceId=${workspaceId}`));
            if (res2.ok) {
                const d = await res2.json();
                setSlots(Array.isArray(d) ? d : d.data || []);
            }
        } catch { /* ignore */ }
        setLoading(false);
    };

    const fetchAgents = async () => {
        try {
            let workspaceId = orgId;
            if (!workspaceId) {
                const session = await resolveWorkspaceSession();
                workspaceId = session.workspaceId;
                setOrgId(workspaceId);
            }
            const res = await fetch(buildProxyUrl(`/api/voice-agents?orgId=${workspaceId}`));
            if (res.ok) setAgents(await res.json());
        } catch { /* empty */ }
    };

    useEffect(() => { fetchBookings(); }, [currentMonth, currentYear]);
    useEffect(() => { fetchAgents(); }, []);

    /* ─── Calendar Data ─── */
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

    const calendarDays = useMemo(() => {
        const days: (number | null)[] = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let d = 1; d <= daysInMonth; d++) days.push(d);
        return days;
    }, [firstDay, daysInMonth]);

    const bookingsForDay = (day: number) => {
        const target = new Date(currentYear, currentMonth, day);
        return bookings.filter(b => {
            if (!b.slot_start) return false;
            return isSameDay(new Date(b.slot_start), target);
        });
    };

    const slotsForDay = (day: number) => {
        const target = new Date(currentYear, currentMonth, day);
        return slots.filter(s => {
            if (!s.slot_start) return false;
            return isSameDay(new Date(s.slot_start), target) && !s.is_booked;
        });
    };

    /* ─── Upcoming (next 7 days) ─── */
    const upcoming = useMemo(() => {
        const now = new Date();
        const week = new Date(now.getTime() + 7 * 86400000);
        return bookings
            .filter(b => {
                const d = new Date(b.slot_start);
                return d >= now && d <= week && b.status !== "cancelled";
            })
            .sort((a, b) => new Date(a.slot_start).getTime() - new Date(b.slot_start).getTime());
    }, [bookings]);

    /* ─── Nav ─── */
    const prevMonth = () => {
        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
        else setCurrentMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
        else setCurrentMonth(m => m + 1);
    };
    const goToday = () => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); };

    /* ─── Action Handlers ─── */
    const handleStatusChange = async (id: string, status: string) => {
        try {
            await fetch(buildProxyUrl(`/api/bookings/${id}/cancel`), { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
            setSelectedBooking(null);
            fetchBookings();
        } catch { /* empty */ }
    };

    const handleAddSlot = async (slotData: { date: string; start: string; end: string; agentId?: string }) => {
        try {
            if (!orgId) {
                const session = await resolveWorkspaceSession();
                setOrgId(session.workspaceId);
            }
            await fetch(buildProxyUrl("/api/bookings/slots"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    workspaceId: orgId || (await resolveWorkspaceSession()).workspaceId,
                    agentId: slotData.agentId || null,
                    slots: [{ date: slotData.date, start: slotData.start, end: slotData.end }]
                })
            });
            setShowAddSlot(false);
            fetchBookings();
        } catch { /* empty */ }
    };

    /* ═══════════════════════════════════════════════════════
       RENDER
       ═══════════════════════════════════════════════════════ */
    return (
        <div style={{ background: "#fafafa", minHeight: "100vh", width: "100%" }}>
            {/* ── Top Bar ── */}
            <div style={{
                height: "52px", background: "#ffffff", borderBottom: "1px solid #e4e4e7",
                display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px"
            }}>
                <div style={{ fontSize: "13px", color: "#9ca3af" }}>
                    Dashboard &gt; <span style={{ color: "#09090b" }}>Bookings</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "13px", color: "#f97316", fontWeight: 600, background: "#fff7ed", padding: "4px 12px", borderRadius: "20px" }}>₹1,200</span>
                </div>
            </div>

            {/* ── Page Header ── */}
            <div style={{ padding: "28px 32px 0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <div>
                        <h1 style={{ fontSize: "20px", fontWeight: 600, color: "#09090b", margin: 0 }}>Bookings</h1>
                        <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0" }}>Manage appointments booked by your AI agents</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button onClick={goToday} style={{
                            padding: "6px 16px", border: "1px solid #e4e4e7", borderRadius: "8px",
                            background: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 500, color: "#374151"
                        }}>Today</button>
                        <button onClick={prevMonth} style={{
                            width: "32px", height: "32px", border: "1px solid #e4e4e7", borderRadius: "8px",
                            background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                        }}><ChevronLeft size={16} color="#374151" /></button>
                        <span style={{ fontSize: "15px", fontWeight: 600, color: "#09090b", minWidth: "160px", textAlign: "center" }}>
                            {MONTHS[currentMonth]} {currentYear}
                        </span>
                        <button onClick={nextMonth} style={{
                            width: "32px", height: "32px", border: "1px solid #e4e4e7", borderRadius: "8px",
                            background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                        }}><ChevronRight size={16} color="#374151" /></button>
                        <button onClick={() => setShowAddSlot(true)} style={{
                            display: "flex", alignItems: "center", gap: "6px", padding: "7px 18px",
                            background: "#9ccbc0", color: "#fff", border: "none", borderRadius: "8px",
                            fontSize: "13px", fontWeight: 600, cursor: "pointer"
                        }}><Plus size={14} /> Add Slot</button>
                    </div>
                </div>
            </div>

            {/* ── Body: Calendar + Right Panel ── */}
            <div style={{ display: "flex", gap: "24px", padding: "20px 32px 32px" }}>
                {/* Calendar Grid */}
                <div style={{ flex: 1, background: "#fff", borderRadius: "16px", border: "1px solid #e4e4e7", overflow: "hidden" }}>
                    {/* Day Headers */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid #e4e4e7" }}>
                        {DAYS.map(d => (
                            <div key={d} style={{
                                padding: "10px 0", textAlign: "center", fontSize: "12px",
                                fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px"
                            }}>{d}</div>
                        ))}
                    </div>

                    {/* Day Cells */}
                    {loading ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "400px", flexDirection: "column", gap: "12px" }}>
                            <Loader2 size={28} color="#9ccbc0" style={{ animation: "spin 1s linear infinite" }} />
                            <span style={{ fontSize: "13px", color: "#9ca3af" }}>Loading calendar...</span>
                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
                            {calendarDays.map((day, idx) => {
                                const isToday = day !== null && isSameDay(new Date(currentYear, currentMonth, day), today);
                                const dayBookings = day ? bookingsForDay(day) : [];
                                const daySlots = day ? slotsForDay(day) : [];

                                return (
                                    <div key={idx} style={{
                                        minHeight: "120px", borderRight: "0.5px solid #e4e4e7", borderBottom: "0.5px solid #e4e4e7",
                                        padding: "6px", background: isToday ? "#f0fffb" : day === null ? "#fafafa" : "#fff",
                                        position: "relative"
                                    }}>
                                        {day !== null && (
                                            <>
                                                <div style={{
                                                    fontSize: "12px", fontWeight: isToday ? 700 : 500,
                                                    color: isToday ? "#9ccbc0" : "#374151",
                                                    marginBottom: "4px",
                                                    ...(isToday ? {
                                                        background: "#9ccbc0", color: "#fff", width: "24px", height: "24px",
                                                        borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center"
                                                    } : {})
                                                }}>{day}</div>

                                                {/* Booking blocks */}
                                                {dayBookings.slice(0, 3).map(b => {
                                                    const colors = statusColors[b.status] || statusColors.confirmed;
                                                    return (
                                                        <div key={b.id} onClick={() => setSelectedBooking(b)} style={{
                                                            background: colors.bg, borderLeft: `3px solid ${colors.border}`,
                                                            borderRadius: "4px", padding: "3px 6px", marginBottom: "2px",
                                                            cursor: "pointer", transition: "box-shadow 0.15s",
                                                        }}
                                                        onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)")}
                                                        onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
                                                        >
                                                            <div style={{ fontSize: "10px", fontWeight: 700, color: colors.text }}>{formatTime(b.slot_start)}</div>
                                                            <div style={{ fontSize: "10px", color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                {b.customer_name || "Customer"}
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {/* Available slot markers */}
                                                {daySlots.slice(0, 2).map(s => (
                                                    <div key={s.id} style={{
                                                        background: "#f9fafb", borderLeft: "3px solid #d1d5db",
                                                        borderRadius: "4px", padding: "3px 6px", marginBottom: "2px"
                                                    }}>
                                                        <div style={{ fontSize: "10px", color: "#9ca3af" }}>{formatTime(s.slot_start)} - Open</div>
                                                    </div>
                                                ))}

                                                {dayBookings.length > 3 && (
                                                    <div style={{ fontSize: "10px", color: "#9ccbc0", fontWeight: 600, paddingLeft: "4px", cursor: "pointer" }}>
                                                        +{dayBookings.length - 3} more
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Right Panel: Upcoming ── */}
                <div style={{ width: "320px", flexShrink: 0 }}>
                    <div style={{
                        background: "#fff", borderRadius: "16px", border: "1px solid #e4e4e7", padding: "20px"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                            <div>
                                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#09090b", margin: 0 }}>Upcoming</h3>
                                <p style={{ fontSize: "12px", color: "#6b7280", margin: "2px 0 0" }}>Next 7 days</p>
                            </div>
                            <CalendarDays size={18} color="#9ca3af" />
                        </div>

                        {upcoming.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "32px 0" }}>
                                <Calendar size={40} color="#d1d5db" style={{ margin: "0 auto 12px" }} />
                                <p style={{ fontSize: "13px", color: "#9ca3af", margin: 0 }}>No upcoming bookings</p>
                                <p style={{ fontSize: "12px", color: "#d1d5db", margin: "4px 0 0" }}>AI-booked appointments will appear here</p>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {upcoming.map(b => {
                                    const colors = statusColors[b.status] || statusColors.confirmed;
                                    return (
                                        <div key={b.id} onClick={() => setSelectedBooking(b)} style={{
                                            padding: "12px", borderRadius: "12px", border: "1px solid #f4f4f5",
                                            cursor: "pointer", transition: "all 0.15s",
                                            background: "#fff"
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#e4e4e7"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#f4f4f5"; e.currentTarget.style.boxShadow = "none"; }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                                <span style={{
                                                    fontSize: "11px", fontWeight: 600, color: "#9ccbc0",
                                                    background: "#f0fffb", padding: "3px 8px", borderRadius: "12px"
                                                }}>{formatTime(b.slot_start)}</span>
                                                <span style={{
                                                    fontSize: "10px", fontWeight: 600, color: colors.text,
                                                    background: colors.badge, padding: "2px 8px", borderRadius: "10px",
                                                    textTransform: "capitalize"
                                                }}>{b.status}</span>
                                            </div>
                                            <div style={{ fontSize: "13px", fontWeight: 600, color: "#09090b" }}>{b.customer_name || "Customer"}</div>
                                            {b.customer_phone && (
                                                <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                                                    <Phone size={11} color="#9ca3af" />
                                                    <span style={{ fontSize: "12px", color: "#6b7280" }}>{b.customer_phone}</span>
                                                </div>
                                            )}
                                            {b.agent_name && (
                                                <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "3px" }}>
                                                    <Bot size={11} color="#9ca3af" />
                                                    <span style={{ fontSize: "12px", color: "#9ca3af" }}>Booked by {b.agent_name}</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Stats Card */}
                    <div style={{
                        background: "linear-gradient(135deg, #9ccbc0, #90bcb2)", borderRadius: "16px", padding: "20px", marginTop: "16px", color: "#fff"
                    }}>
                        <h4 style={{ fontSize: "13px", fontWeight: 600, margin: "0 0 12px", opacity: 0.9 }}>This Month</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <div>
                                <div style={{ fontSize: "24px", fontWeight: 700 }}>{bookings.filter(b => b.status === "confirmed").length}</div>
                                <div style={{ fontSize: "11px", opacity: 0.75 }}>Confirmed</div>
                            </div>
                            <div>
                                <div style={{ fontSize: "24px", fontWeight: 700 }}>{bookings.filter(b => b.status === "completed").length}</div>
                                <div style={{ fontSize: "11px", opacity: 0.75 }}>Completed</div>
                            </div>
                            <div>
                                <div style={{ fontSize: "24px", fontWeight: 700 }}>{bookings.filter(b => b.status === "cancelled").length}</div>
                                <div style={{ fontSize: "11px", opacity: 0.75 }}>Cancelled</div>
                            </div>
                            <div>
                                <div style={{ fontSize: "24px", fontWeight: 700 }}>{slots.filter(s => !s.is_booked).length}</div>
                                <div style={{ fontSize: "11px", opacity: 0.75 }}>Open Slots</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════
               BOOKING DETAIL MODAL
               ═══════════════════════════════════════════════════════ */}
            {selectedBooking && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(2px)",
                    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
                }} onClick={() => setSelectedBooking(null)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: "#fff", borderRadius: "16px", width: "440px", padding: "24px",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.15)", animation: "modalIn 0.2s ease"
                    }}>
                        <style>{`@keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>

                        {/* Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                            <div>
                                <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#09090b", margin: 0 }}>{formatDate(selectedBooking.slot_start)}</h2>
                                <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0" }}>
                                    {formatTime(selectedBooking.slot_start)} — {formatTime(selectedBooking.slot_end)}
                                </p>
                            </div>
                            <button onClick={() => setSelectedBooking(null)} style={{
                                width: "28px", height: "28px", border: "none", background: "#f4f4f5",
                                borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                            }}><X size={14} color="#6b7280" /></button>
                        </div>

                        {/* Customer Section */}
                        <div style={{ marginBottom: "20px" }}>
                            <h4 style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Customer</h4>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{
                                    width: "40px", height: "40px", borderRadius: "50%",
                                    background: "linear-gradient(135deg, #9ccbc0, #90bcb2)", color: "#fff",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "16px", fontWeight: 700
                                }}>
                                    {(selectedBooking.customer_name || "C")[0].toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#09090b" }}>{selectedBooking.customer_name || "Customer"}</div>
                                    {selectedBooking.customer_phone && (
                                        <div style={{ fontSize: "12px", color: "#6b7280", display: "flex", alignItems: "center", gap: "4px" }}>
                                            <Phone size={11} /> {selectedBooking.customer_phone}
                                        </div>
                                    )}
                                    {selectedBooking.customer_email && (
                                        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>{selectedBooking.customer_email}</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Booking Info */}
                        <div style={{ marginBottom: "20px", padding: "14px", borderRadius: "12px", background: "#fafafa", border: "1px solid #f4f4f5" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "2px" }}>Status</div>
                                    <span style={{
                                        fontSize: "12px", fontWeight: 600,
                                        color: (statusColors[selectedBooking.status] || statusColors.confirmed).text,
                                        background: (statusColors[selectedBooking.status] || statusColors.confirmed).badge,
                                        padding: "3px 10px", borderRadius: "10px", textTransform: "capitalize"
                                    }}>{selectedBooking.status}</span>
                                </div>
                                <div>
                                    <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "2px" }}>Duration</div>
                                    <div style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>
                                        {Math.round((new Date(selectedBooking.slot_end).getTime() - new Date(selectedBooking.slot_start).getTime()) / 60000)} min
                                    </div>
                                </div>
                            </div>
                            {selectedBooking.notes && (
                                <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e4e4e7" }}>
                                    <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "4px" }}>Notes</div>
                                    <div style={{ fontSize: "13px", color: "#374151" }}>{selectedBooking.notes}</div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            {selectedBooking.status === "confirmed" && (
                                <>
                                    <button onClick={() => handleStatusChange(selectedBooking.id, "cancelled")} style={{
                                        padding: "8px 16px", border: "1px solid #fecaca", borderRadius: "8px",
                                        background: "#fff", color: "#dc2626", fontSize: "13px", fontWeight: 500, cursor: "pointer"
                                    }}>Cancel Booking</button>
                                    <button onClick={() => handleStatusChange(selectedBooking.id, "completed")} style={{
                                        padding: "8px 16px", border: "none", borderRadius: "8px",
                                        background: "#9ccbc0", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer"
                                    }}>Mark Complete</button>
                                </>
                            )}
                            {selectedBooking.status !== "confirmed" && (
                                <button onClick={() => setSelectedBooking(null)} style={{
                                    padding: "8px 20px", border: "1px solid #e4e4e7", borderRadius: "8px",
                                    background: "#fff", color: "#374151", fontSize: "13px", fontWeight: 500, cursor: "pointer"
                                }}>Close</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════
               ADD SLOT MODAL
               ═══════════════════════════════════════════════════════ */}
            {showAddSlot && <AddSlotModal agents={agents} onClose={() => setShowAddSlot(false)} onSubmit={handleAddSlot} />}
        </div>
    );
}

/* ─── Add Slot Modal Component ─── */
function AddSlotModal({ agents, onClose, onSubmit }: { agents: any[]; onClose: () => void; onSubmit: (data: any) => void }) {
    const [date, setDate] = useState("");
    const [start, setStart] = useState("09:00");
    const [end, setEnd] = useState("09:30");
    const [agentId, setAgentId] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!date || !start || !end) return;
        setSubmitting(true);
        const startISO = `${date}T${start}:00`;
        const endISO = `${date}T${end}:00`;
        await onSubmit({ date, start: startISO, end: endISO, agentId: agentId || undefined });
        setSubmitting(false);
    };

    const inputStyle = {
        width: "100%", padding: "10px 12px", border: "1px solid #e4e4e7",
        borderRadius: "8px", fontSize: "13px", outline: "none", background: "#fff",
        color: "#09090b"
    };

    return (
        <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(2px)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{
                background: "#fff", borderRadius: "16px", width: "440px", padding: "24px",
                boxShadow: "0 20px 60px rgba(0,0,0,0.15)", animation: "modalIn 0.2s ease"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#09090b", margin: 0 }}>Add Available Slot</h2>
                    <button onClick={onClose} style={{
                        width: "28px", height: "28px", border: "none", background: "#f4f4f5",
                        borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                    }}><X size={14} color="#6b7280" /></button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div>
                        <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Date</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div>
                            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Start Time</label>
                            <input type="time" value={start} onChange={e => setStart(e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>End Time</label>
                            <input type="time" value={end} onChange={e => setEnd(e.target.value)} style={inputStyle} />
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Assign to Agent</label>
                        <select value={agentId} onChange={e => setAgentId(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                            <option value="">Any agent</option>
                            {agents.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "24px" }}>
                    <button onClick={onClose} style={{
                        padding: "8px 20px", border: "1px solid #e4e4e7", borderRadius: "8px",
                        background: "#fff", color: "#374151", fontSize: "13px", fontWeight: 500, cursor: "pointer"
                    }}>Cancel</button>
                    <button onClick={handleSubmit} disabled={submitting || !date} style={{
                        padding: "8px 20px", border: "none", borderRadius: "8px",
                        background: !date ? "#d1d5db" : "#9ccbc0", color: "#fff", fontSize: "13px", fontWeight: 600,
                        cursor: !date ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px"
                    }}>
                        {submitting && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                        Add Slot
                    </button>
                </div>
            </div>
        </div>
    );
}
