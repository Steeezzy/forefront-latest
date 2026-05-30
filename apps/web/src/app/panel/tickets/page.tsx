"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search, Filter, Plus, Clock, AlertTriangle, CheckCircle, XCircle,
  MessageSquare, ChevronDown, Send, User, Tag, Calendar
} from "lucide-react";

type Ticket = {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  source: string;
  requester_name?: string;
  requester_email?: string;
  assignee_email?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  resolved_at?: string;
};

type Comment = {
  id: string;
  content: string;
  author_type: string;
  author_name?: string;
  is_internal: boolean;
  created_at: string;
};

type TicketStats = {
  open_count: number;
  pending_count: number;
  solved_count: number;
  unassigned_count: number;
  urgent_open: number;
  avg_resolution_hours?: number;
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  pending: "bg-amber-100 text-amber-700",
  solved: "bg-emerald-100 text-emerald-700",
  closed: "bg-gray-100 text-gray-600",
  unassigned: "bg-red-100 text-red-700",
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-500 text-white",
  high: "bg-orange-100 text-orange-700",
  normal: "bg-gray-100 text-gray-600",
  low: "bg-gray-50 text-gray-400",
};

const STATUS_ICONS: Record<string, any> = {
  open: Clock,
  pending: AlertTriangle,
  solved: CheckCircle,
  closed: XCircle,
  unassigned: User,
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [replyText, setReplyText] = useState("");

  const workspaceId = typeof window !== "undefined" ? localStorage.getItem("workspaceId") || "" : "";

  const fetchTickets = useCallback(async () => {
    try {
      const params = new URLSearchParams({ status: statusFilter });
      if (search) params.set("search", search);
      const token = localStorage.getItem("token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      const res = await fetch(`${API_URL}/api/tickets?${params}`, { 
        headers: { "Authorization": `Bearer ${token}` } 
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.data || data.tickets || []);
      }
    } catch { /* */ }
  }, [statusFilter, search]);

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/tickets/stats`, { 
        headers: { "Authorization": `Bearer ${token}` } 
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.data || data);
      }
    } catch { /* */ }
  }, []);

  const fetchTicketDetail = async (ticketId: string) => {
    try {
      const token = localStorage.getItem("token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/tickets/${ticketId}`, { 
        headers: { "Authorization": `Bearer ${token}` } 
      });
      if (res.ok) {
        const responseData = await res.json();
        const data = responseData.data || responseData;
        setSelected(data.ticket || data);
        setComments(data.comments || []);
      }
    } catch { /* */ }
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      await Promise.all([fetchTickets(), fetchStats()]);
      setLoading(false);
    }
    if (workspaceId) load();
  }, [workspaceId, fetchTickets, fetchStats]);

  const handleReply = async () => {
    if (!selected || !replyText.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${API_URL}/api/tickets/${selected.id}/comments`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          ticket_id: selected.id,
          author_type: "agent",
          content: replyText,
          is_internal: false,
        }),
      });
      setReplyText("");
      fetchTicketDetail(selected.id);
    } catch { /* */ }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${API_URL}/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTickets();
      if (selected?.id === ticketId) fetchTicketDetail(ticketId);
    } catch { /* */ }
  };

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#f4f4f5]">
      {/* Left panel: List */}
      <div className={`${selected ? "hidden lg:flex" : "flex"} flex-col w-full lg:w-[420px] border-r border-gray-200 bg-white`}>
        {/* Stats bar */}
        {stats && (
          <div className="flex gap-1 px-4 py-3 border-b border-gray-100 overflow-x-auto">
            {[
              { label: "Open", count: stats.open_count, color: "text-blue-600" },
              { label: "Pending", count: stats.pending_count, color: "text-amber-600" },
              { label: "Solved", count: stats.solved_count, color: "text-emerald-600" },
              { label: "Urgent", count: stats.urgent_open, color: "text-red-600" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg text-xs whitespace-nowrap">
                <span className={`font-bold ${s.color}`}>{s.count}</span>
                <span className="text-gray-500">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Search + filters */}
        <div className="px-4 py-3 border-b border-gray-100 space-y-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>
          <div className="flex gap-1.5">
            {["all", "open", "pending", "solved", "unassigned"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 text-xs rounded-lg capitalize transition-colors ${
                  statusFilter === s ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Ticket list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No tickets found</p>
            </div>
          ) : (
            tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => fetchTicketDetail(t.id)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                  selected?.id === t.id ? "bg-gray-50" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-gray-400">{t.ticket_number}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[t.status] || ""}`}>
                        {t.status}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[t.priority] || ""}`}>
                        {t.priority}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">{t.subject}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t.requester_name || t.requester_email || "Unknown"} · {t.source}
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">{timeAgo(t.updated_at)}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel: Detail */}
      <div className={`${selected ? "flex" : "hidden lg:flex"} flex-col flex-1 bg-white`}>
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Select a ticket to view details
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100">
              <button onClick={() => setSelected(null)} className="lg:hidden text-xs text-gray-500 mb-2">← Back</button>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-gray-400">{selected.ticket_number}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[selected.status]}`}>
                      {selected.status}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[selected.priority]}`}>
                      {selected.priority}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">{selected.subject}</h2>
                </div>
                <div className="relative">
                  <select
                    value={selected.status}
                    onChange={(e) => handleStatusChange(selected.id, e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none"
                  >
                    <option value="open">Open</option>
                    <option value="pending">Pending</option>
                    <option value="solved">Solved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><User size={12} />{selected.requester_name || "Unknown"}</span>
                <span className="flex items-center gap-1"><Calendar size={12} />{new Date(selected.created_at).toLocaleDateString()}</span>
                {selected.tags?.length > 0 && (
                  <span className="flex items-center gap-1"><Tag size={12} />{selected.tags.join(", ")}</span>
                )}
              </div>
            </div>

            {/* Comments */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className={`rounded-xl p-4 max-w-[85%] ${
                    c.author_type === "agent"
                      ? "ml-auto bg-gray-900 text-white"
                      : c.author_type === "system"
                      ? "mx-auto bg-gray-100 text-gray-500 text-center text-xs max-w-full"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {c.author_type !== "system" && (
                    <div className={`text-xs mb-1 ${c.author_type === "agent" ? "text-gray-300" : "text-gray-500"}`}>
                      {c.author_name || c.author_type} · {timeAgo(c.created_at)}
                      {c.is_internal && <span className="ml-2 text-amber-400">Internal</span>}
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{c.content}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="text-center text-sm text-gray-400 py-8">No comments yet</div>
              )}
            </div>

            {/* Reply */}
            <div className="px-6 py-4 border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Write a reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleReply()}
                  className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
                <button
                  onClick={handleReply}
                  className="px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
