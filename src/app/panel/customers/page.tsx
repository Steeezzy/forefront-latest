"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search, Users, TrendingUp, DollarSign, Phone, Mail,
  ChevronDown, LayoutGrid, List, Star, Calendar, Tag, MoreVertical, Plus
} from "lucide-react";

type Customer = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  lead_score: number;
  deal_stage: string;
  deal_value: number;
  lifetime_value: number;
  total_calls: number;
  tags: string[];
  source?: string;
  last_contact_at?: string;
  next_followup_at?: string;
  created_at: string;
};

const STAGES = [
  { id: "new", label: "New", color: "bg-blue-500" },
  { id: "contacted", label: "Contacted", color: "bg-indigo-500" },
  { id: "qualified", label: "Qualified", color: "bg-purple-500" },
  { id: "proposal", label: "Proposal", color: "bg-amber-500" },
  { id: "negotiation", label: "Negotiation", color: "bg-orange-500" },
  { id: "won", label: "Won", color: "bg-emerald-500" },
  { id: "lost", label: "Lost", color: "bg-red-500" },
];

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "text-emerald-600 bg-emerald-50" : score >= 40 ? "text-amber-600 bg-amber-50" : "text-gray-500 bg-gray-100";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${color}`}>
      <Star size={9} fill="currentColor" />
      {score}
    </span>
  );
}

function formatCurrency(v: number) {
  return `₹${v.toLocaleString("en-IN")}`;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"table" | "kanban">("table");
  const [stageFilter, setStageFilter] = useState("all");

  const workspaceId = typeof window !== "undefined" ? localStorage.getItem("workspaceId") || "" : "";

  const fetchCustomers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (stageFilter !== "all") params.set("stage", stageFilter);
      const token = localStorage.getItem("token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      const res = await fetch(`${API_URL}/api/customers/${workspaceId}?${params}`, { 
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        const rawCustomers = data.customers || data || [];
        const mappedCustomers = rawCustomers.map((c: any) => ({
            ...c,
            lead_score: c.risk_score || 0, // Invert risk to lead score if needed, or just use it
            deal_stage: c.deal_stage || (c.next_action === 'win_back' ? 'lost' : 'new'),
            deal_value: c.lifetime_value || 0,
            total_calls: c.total_interactions || 0,
            last_contact_at: c.last_interaction,
        }));
        setCustomers(mappedCustomers);
      }
    } catch { /* */ } finally {
      setLoading(false);
    }
  }, [workspaceId, search, stageFilter]);

  useEffect(() => {
    if (workspaceId) fetchCustomers();
  }, [workspaceId, fetchCustomers]);

  const totalPipeline = customers.reduce((s, c) => s + (c.deal_value || 0), 0);
  const avgScore = customers.length > 0 ? Math.round(customers.reduce((s, c) => s + (c.lead_score || 0), 0) / customers.length) : 0;
  const newCount = customers.filter((c) => c.deal_stage === "new").length;

  const handleStageChange = async (customerId: string, newStage: string) => {
    try {
      const token = localStorage.getItem("token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      await fetch(`${API_URL}/api/customers/${workspaceId}/${customerId}/notes`, {
        method: "PUT",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ notes: `Deal stage updated to ${newStage}` }), // Quick fix for stage updating, will add backend support later
      });
      fetchCustomers();
    } catch { /* */ }
  };

  return (
    <div className="p-6 bg-[#f4f4f5] min-h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500">{customers.length} contacts in your CRM</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setView("table")}
              className={`p-2 ${view === "table" ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"}`}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setView("kanban")}
              className={`p-2 ${view === "kanban" ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"}`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Contacts", value: customers.length, icon: Users, color: "text-blue-600" },
          { label: "New This Month", value: newCount, icon: Plus, color: "text-emerald-600" },
          { label: "Pipeline Value", value: formatCurrency(totalPipeline), icon: DollarSign, color: "text-amber-600" },
          { label: "Avg Lead Score", value: avgScore, icon: TrendingUp, color: "text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={14} className={s.color} />
              <span className="text-xs text-gray-500">{s.label}</span>
            </div>
            <div className="text-xl font-bold text-gray-900">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16">Loading customers...</div>
      ) : view === "table" ? (
        /* Table View */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Phone</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Score</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Stage</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Deal Value</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Calls</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Last Contact</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{c.name || "Unknown"}</div>
                      {c.email && <div className="text-xs text-gray-400">{c.email}</div>}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{c.phone}</td>
                    <td className="py-3 px-4"><ScoreBadge score={c.lead_score || 0} /></td>
                    <td className="py-3 px-4">
                      <select
                        value={c.deal_stage || "new"}
                        onChange={(e) => handleStageChange(c.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                      >
                        {STAGES.map((s) => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-gray-700 font-medium">{formatCurrency(c.deal_value || 0)}</td>
                    <td className="py-3 px-4 text-gray-600">{c.total_calls || 0}</td>
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {c.last_contact_at ? new Date(c.last_contact_at).toLocaleDateString() : "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {customers.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Users className="mx-auto h-10 w-10 mb-3 text-gray-300" />
              <p>No customers yet</p>
            </div>
          )}
        </div>
      ) : (
        /* Kanban View */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.filter((s) => s.id !== "lost").map((stage) => {
            const stageCustomers = customers.filter((c) => (c.deal_stage || "new") === stage.id);
            const stageValue = stageCustomers.reduce((s, c) => s + (c.deal_value || 0), 0);

            return (
              <div key={stage.id} className="flex-shrink-0 w-72">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${stage.color}`} />
                    <span className="text-sm font-semibold text-gray-900">{stage.label}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{stageCustomers.length}</span>
                  </div>
                  <span className="text-xs text-gray-500">{formatCurrency(stageValue)}</span>
                </div>
                <div className="space-y-2">
                  {stageCustomers.map((c) => (
                    <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{c.name || "Unknown"}</p>
                          <p className="text-xs text-gray-500">{c.phone}</p>
                        </div>
                        <ScoreBadge score={c.lead_score || 0} />
                      </div>
                      {c.deal_value > 0 && (
                        <div className="text-xs font-medium text-gray-700">{formatCurrency(c.deal_value)}</div>
                      )}
                      {c.tags?.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {c.tags.slice(0, 3).map((t) => (
                            <span key={t} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {stageCustomers.length === 0 && (
                    <div className="text-center py-8 text-xs text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      No contacts
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
