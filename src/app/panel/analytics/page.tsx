"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Phone, MessageSquare, Clock, Users, TrendingUp, TrendingDown,
  HelpCircle, Bot, BarChart3, Minus
} from "lucide-react";

type KPIs = {
  totalCalls: number;
  totalChats: number;
  voiceMinutes: number;
  callsAnswered: number;
  avgDuration: number;
  uniqueCustomers: number;
  changes: {
    calls: number;
    chats: number;
  };
};

type DailyVolume = { day: string; calls: number; chats: number };
type Outcome = { outcome: string; count: number };
type TopQuestion = { question: string; ask_count: number; avg_confidence: number };
type AgentPerf = {
  agent_name: string;
  total_sessions: number;
  answered: number;
  avg_duration_seconds: number;
  unique_contacts: number;
};

function ChangeIndicator({ value }: { value: number }) {
  if (value === 0) return <span className="flex items-center gap-0.5 text-[10px] text-gray-400"><Minus size={10} />0%</span>;
  if (value > 0) return <span className="flex items-center gap-0.5 text-[10px] text-emerald-600"><TrendingUp size={10} />+{value}%</span>;
  return <span className="flex items-center gap-0.5 text-[10px] text-red-500"><TrendingDown size={10} />{value}%</span>;
}

function MiniBar({ data, maxVal, color }: { data: number[]; maxVal: number; color: string }) {
  return (
    <div className="flex items-end gap-[2px] h-12">
      {data.map((v, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-t ${color} transition-all`}
          style={{ height: `${maxVal > 0 ? (v / maxVal) * 100 : 0}%`, minHeight: "2px" }}
        />
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<{
    kpis: KPIs;
    dailyVolume: DailyVolume[];
    outcomes: Outcome[];
    topQuestions: TopQuestion[];
    agentPerformance: AgentPerf[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  const workspaceId = typeof window !== "undefined" ? localStorage.getItem("workspaceId") || "" : "";

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/analytics/dashboard?workspaceId=${workspaceId}&period=${period}`, { credentials: "include" });
      if (res.ok) setData(await res.json());
    } catch { /* */ } finally {
      setLoading(false);
    }
  }, [workspaceId, period]);

  useEffect(() => {
    if (workspaceId) fetchData();
  }, [workspaceId, fetchData]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis;
  const dailyVolume = data?.dailyVolume || [];
  const callSeries = dailyVolume.map((d) => d.calls);
  const chatSeries = dailyVolume.map((d) => d.chats);
  const maxVolume = Math.max(...callSeries, ...chatSeries, 1);

  return (
    <div className="p-6 bg-[#f4f4f5] min-h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500">Performance overview for the last {period} days</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total Calls",
            value: kpis?.totalCalls || 0,
            icon: Phone,
            color: "text-blue-600",
            change: kpis?.changes.calls || 0,
            sparkData: callSeries.slice(-14),
            sparkColor: "bg-blue-400",
          },
          {
            label: "Chat Sessions",
            value: kpis?.totalChats || 0,
            icon: MessageSquare,
            color: "text-purple-600",
            change: kpis?.changes.chats || 0,
            sparkData: chatSeries.slice(-14),
            sparkColor: "bg-purple-400",
          },
          { label: "Voice Minutes", value: kpis?.voiceMinutes || 0, icon: Clock, color: "text-amber-600" },
          { label: "Unique Customers", value: kpis?.uniqueCustomers || 0, icon: Users, color: "text-emerald-600" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <kpi.icon size={14} className={kpi.color} />
                <span className="text-xs text-gray-500">{kpi.label}</span>
              </div>
              {"change" in kpi && <ChangeIndicator value={kpi.change as number} />}
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">{kpi.value.toLocaleString()}</div>
            {"sparkData" in kpi && kpi.sparkData && (
              <MiniBar data={kpi.sparkData as number[]} maxVal={maxVolume} color={kpi.sparkColor as string} />
            )}
          </div>
        ))}
      </div>

      {/* Two-column: Volume chart + Outcomes */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Volume */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 size={16} />
            Daily Volume
          </h3>
          <div className="flex items-end gap-1 h-40">
            {dailyVolume.slice(-30).map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-[1px]">
                <div className="w-full bg-blue-400 rounded-t" style={{ height: `${maxVolume > 0 ? (d.calls / maxVolume) * 100 : 0}%`, minHeight: "1px" }} />
                <div className="w-full bg-purple-400 rounded-t" style={{ height: `${maxVolume > 0 ? (d.chats / maxVolume) * 100 : 0}%`, minHeight: "1px" }} />
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-400 rounded" />Calls</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-purple-400 rounded" />Chats</span>
          </div>
        </div>

        {/* Outcomes */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Outcomes</h3>
          <div className="space-y-3">
            {(data?.outcomes || []).map((o) => {
              const total = (data?.outcomes || []).reduce((s, x) => s + x.count, 0);
              const pct = total > 0 ? Math.round((o.count / total) * 100) : 0;
              return (
                <div key={o.outcome}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 capitalize">{o.outcome.replace(/_/g, " ")}</span>
                    <span className="text-gray-500">{o.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-800 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {(data?.outcomes || []).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No outcome data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Two-column: Top Questions + Agent Performance */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top Questions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HelpCircle size={16} />
            Top Unanswered Questions
          </h3>
          <div className="space-y-2">
            {(data?.topQuestions || []).map((q, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs font-mono text-gray-400 w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{q.question}</p>
                </div>
                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{q.ask_count}×</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  q.avg_confidence > 60 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                }`}>{q.avg_confidence}%</span>
              </div>
            ))}
            {(data?.topQuestions || []).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No unanswered questions</p>
            )}
          </div>
        </div>

        {/* Agent Performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bot size={16} />
            Agent Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-xs font-medium text-gray-500">Agent</th>
                  <th className="text-left py-2 text-xs font-medium text-gray-500">Sessions</th>
                  <th className="text-left py-2 text-xs font-medium text-gray-500">Answered</th>
                  <th className="text-left py-2 text-xs font-medium text-gray-500">Avg Duration</th>
                </tr>
              </thead>
              <tbody>
                {(data?.agentPerformance || []).map((a) => (
                  <tr key={a.agent_name} className="border-b border-gray-50">
                    <td className="py-2 font-medium text-gray-900">{a.agent_name}</td>
                    <td className="py-2 text-gray-600">{a.total_sessions}</td>
                    <td className="py-2 text-gray-600">{a.answered}</td>
                    <td className="py-2 text-gray-600">{a.avg_duration_seconds}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(data?.agentPerformance || []).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No agent data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
