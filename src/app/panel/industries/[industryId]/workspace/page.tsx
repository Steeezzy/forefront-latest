"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/ui/StatCard";
import { Panel } from "@/components/ui/Panel";
import { TemplateToggle } from "@/components/ui/TemplateToggle";
import { ConversationPreview } from "@/components/ui/ConversationPreview";
import { CallLogTable } from "@/components/ui/CallLogTable";
import { IntegrationGrid } from "@/components/ui/IntegrationGrid";
import { QuickActions } from "@/components/ui/QuickActions";
import { industries } from "@/data/industries";
import { TEMPLATES as templates } from "@/data/templates";
import { industryBundles } from "@/data/template-bundles";
import { sampleConversations } from "@/data/sample-conversations";
import { INDUSTRY_CONFIGS } from "@/data/auto-config";
import {
  ChevronLeft,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  DollarSign,
  TrendingUp,
  Users,
  Phone,
  MessageSquare,
  Calendar,
  CreditCard,
  UserPlus,
  FileText,
  BarChart3,
  PieChart,
  Download,
} from "lucide-react";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ── Types ──

interface ManualEntry {
  id: string;
  type: "customer" | "appointment" | "call" | "payment" | "lead";
  data: Record<string, string>;
  createdAt: string;
}

// ── Mock Data ──

const mockCalls = [
  { id: "1", workspaceId: "", direction: "inbound" as const, callerName: "Maria Garcia", callerPhone: "(555) 234-8901", duration: "2:34", outcome: "booked" as const, templateUsed: "appointment-booking", timestamp: "2 min ago" },
  { id: "2", workspaceId: "", direction: "inbound" as const, callerName: "James Wilson", callerPhone: "(555) 876-5432", duration: "1:12", outcome: "answered" as const, templateUsed: "faq-responder", timestamp: "8 min ago" },
  { id: "3", workspaceId: "", direction: "inbound" as const, callerName: "Sarah Chen", callerPhone: "(555) 345-6789", duration: "3:01", outcome: "booked" as const, templateUsed: "appointment-booking", timestamp: "15 min ago" },
  { id: "4", workspaceId: "", direction: "inbound" as const, callerName: "Unknown", callerPhone: "(555) 000-1234", duration: "0:00", outcome: "missed" as const, templateUsed: "", timestamp: "22 min ago" },
  { id: "5", workspaceId: "", direction: "inbound" as const, callerName: "Robert Kim", callerPhone: "(555) 567-8901", duration: "1:45", outcome: "answered" as const, templateUsed: "faq-responder", timestamp: "31 min ago" },
];

const mockIntegrations = [
  { integrationId: "gcal", name: "Google Calendar", icon: "📅", connected: true },
  { integrationId: "hubspot", name: "HubSpot CRM", icon: "🟠", connected: true },
  { integrationId: "sms", name: "SMS (Twilio)", icon: "💬", connected: true },
  { integrationId: "stripe", name: "Stripe", icon: "💳", connected: false },
  { integrationId: "email", name: "SendGrid Email", icon: "📧", connected: false },
  { integrationId: "sheets", name: "Google Sheets", icon: "📊", connected: false },
];

const revenueData = [
  { date: "Mon", revenue: 5200, cost: 45 },
  { date: "Tue", revenue: 6100, cost: 52 },
  { date: "Wed", revenue: 4300, cost: 38 },
  { date: "Thu", revenue: 7800, cost: 68 },
  { date: "Fri", revenue: 8200, cost: 72 },
  { date: "Sat", revenue: 3800, cost: 33 },
  { date: "Sun", revenue: 2800, cost: 24 },
];

const channelData = [
  { name: "Online (AI)", value: 87, color: "var(--color-accent)" },
  { name: "Offline (Manual)", value: 13, color: "var(--color-voice)" },
];

const tooltipStyle = {
  contentStyle: {
    background: "var(--color-bg-elevated)",
    border: "1px solid var(--color-border-default)",
    borderRadius: 8,
    fontSize: 12,
    color: "var(--color-text-primary)",
  },
};

// ── Entry type configs ──

const entryTypeConfig: Record<string, { icon: string; label: string; fields: { key: string; label: string; type: string; placeholder: string }[] }> = {
  customer: {
    icon: "👤",
    label: "Offline Customer",
    fields: [
      { key: "name", label: "Customer Name", type: "text", placeholder: "John Smith" },
      { key: "phone", label: "Phone", type: "text", placeholder: "(555) 123-4567" },
      { key: "email", label: "Email", type: "text", placeholder: "john@example.com" },
      { key: "notes", label: "Notes", type: "textarea", placeholder: "Walk-in customer..." },
    ],
  },
  appointment: {
    icon: "📅",
    label: "Offline Appointment",
    fields: [
      { key: "customer_name", label: "Customer Name", type: "text", placeholder: "Jane Doe" },
      { key: "service", label: "Service", type: "text", placeholder: "General Visit" },
      { key: "date", label: "Date", type: "date", placeholder: "" },
      { key: "time", label: "Time", type: "time", placeholder: "" },
      { key: "staff", label: "Staff Member", type: "text", placeholder: "Dr. Smith" },
      { key: "notes", label: "Notes", type: "textarea", placeholder: "Special requests..." },
    ],
  },
  call: {
    icon: "📞",
    label: "Offline Call",
    fields: [
      { key: "caller_name", label: "Caller Name", type: "text", placeholder: "Mike Johnson" },
      { key: "phone", label: "Phone", type: "text", placeholder: "(555) 987-6543" },
      { key: "duration", label: "Duration (min)", type: "text", placeholder: "5" },
      { key: "outcome", label: "Outcome", type: "select", placeholder: "" },
      { key: "summary", label: "Call Summary", type: "textarea", placeholder: "Customer called about..." },
    ],
  },
  payment: {
    icon: "💳",
    label: "Offline Payment",
    fields: [
      { key: "customer_name", label: "Customer Name", type: "text", placeholder: "Sarah Williams" },
      { key: "amount", label: "Amount ($)", type: "text", placeholder: "150.00" },
      { key: "method", label: "Payment Method", type: "select", placeholder: "" },
      { key: "description", label: "Description", type: "textarea", placeholder: "Payment for..." },
    ],
  },
  lead: {
    icon: "🎯",
    label: "Offline Lead",
    fields: [
      { key: "name", label: "Lead Name", type: "text", placeholder: "Tom Richards" },
      { key: "phone", label: "Phone", type: "text", placeholder: "(555) 444-5566" },
      { key: "email", label: "Email", type: "text", placeholder: "tom@example.com" },
      { key: "source", label: "Lead Source", type: "text", placeholder: "Walk-in, Referral..." },
      { key: "interest", label: "Interest", type: "textarea", placeholder: "Interested in..." },
    ],
  },
};

const tabs = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "agents", label: "Agents", icon: "🎙️" },
  { id: "data", label: "Data", icon: "📁" },
  { id: "profit", label: "Profit", icon: "💰" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const industryId = params.industryId as string;

  const industry = industries.find((i) => i.id === industryId);
  const config = INDUSTRY_CONFIGS[industryId];
  const bundle = industryBundles[industryId];
  const convo = sampleConversations[industryId] || [];

  const [activeTab, setActiveTab] = useState("overview");
  const [manualEntries, setManualEntries] = useState<ManualEntry[]>([
    { id: "m1", type: "customer", data: { name: "Walk-in: David Park", phone: "(555) 999-0011", email: "david@example.com", notes: "Came in for consultation" }, createdAt: "2 hours ago" },
    { id: "m2", type: "appointment", data: { customer_name: "Anna White", service: "Service", date: "2025-01-20", time: "10:00", staff: "Staff", notes: "First time" }, createdAt: "5 hours ago" },
    { id: "m3", type: "payment", data: { customer_name: "Tom Richards", amount: "250.00", method: "Cash", description: "Payment" }, createdAt: "1 day ago" },
    { id: "m4", type: "call", data: { caller_name: "Lisa Thompson", phone: "(555) 777-8899", duration: "8", outcome: "Booked", summary: "Called to book" }, createdAt: "1 day ago" },
    { id: "m5", type: "lead", data: { name: "New Lead: Mike Brown", phone: "(555) 444-5566", email: "mike@email.com", source: "Referral", interest: "General" }, createdAt: "2 days ago" },
  ]);

  const [showAddEntry, setShowAddEntry] = useState(false);
  const [addEntryType, setAddEntryType] = useState<keyof typeof entryTypeConfig>("customer");
  const [entryFormData, setEntryFormData] = useState<Record<string, string>>({});
  const [entryFilter, setEntryFilter] = useState("all");
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState(config ? `My ${industry?.name}` : "My Business");
  const [greeting, setGreeting] = useState(config?.greeting.replace("{{business_name}}", businessName) || "");
  const [period, setPeriod] = useState("7d");

  if (!industry || !config || !bundle) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-4xl mb-4">🏭</div>
        <h2 className="text-xl font-bold text-text-primary">Industry not found</h2>
        <button
          onClick={() => router.push("/panel/industries")}
          className="mt-4 text-sm text-accent hover:underline"
        >
          ← Back to industries
        </button>
      </div>
    );
  }

  const voiceTemplates = bundle.voiceTemplateIds
    .map((id) => templates.find((t) => t.id === id))
    .filter(Boolean);

  const chatTemplates = bundle.chatTemplateIds
    .map((id) => templates.find((t) => t.id === id))
    .filter(Boolean);

  const filteredEntries = entryFilter === "all"
    ? manualEntries
    : manualEntries.filter((e) => e.type === entryFilter);

  const entryTypeCounts = {
    all: manualEntries.length,
    customer: manualEntries.filter((e) => e.type === "customer").length,
    appointment: manualEntries.filter((e) => e.type === "appointment").length,
    call: manualEntries.filter((e) => e.type === "call").length,
    payment: manualEntries.filter((e) => e.type === "payment").length,
    lead: manualEntries.filter((e) => e.type === "lead").length,
  };

  const totalOfflineRevenue = manualEntries
    .filter((e) => e.type === "payment")
    .reduce((sum, e) => sum + parseFloat(e.data.amount || "0"), 0);

  const handleAddEntry = () => {
    const newEntry: ManualEntry = {
      id: `m${Date.now()}`,
      type: addEntryType as ManualEntry["type"],
      data: { ...entryFormData },
      createdAt: "just now",
    };
    setManualEntries((prev) => [newEntry, ...prev]);
    setEntryFormData({});
    setShowAddEntry(false);
  };

  const handleDeleteEntry = (id: string) => {
    setManualEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSaveSection = (sectionId: string) => {
    setEditingSection(null);
  };

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push("/panel/industries")}
        className="flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-accent"
      >
        <ChevronLeft size={14} /> Back to industries
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="flex items-center justify-center rounded-2xl text-2xl"
            style={{ background: industry.iconBg, width: 52, height: 52 }}
          >
            {industry.icon}
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary">
              {businessName}
            </h2>
            <p className="mt-0.5 text-[13.5px] text-text-secondary">
              {industry.name} Workspace
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-accent-dim px-4 py-2 text-[12px] font-semibold text-accent">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            Live
          </div>
          <button className="rounded-lg border border-border-default bg-bg-card px-4 py-2 text-[12px] font-medium text-text-secondary transition-all hover:text-accent">
            <Download size={13} className="inline mr-1" /> Export
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-bg-card p-1 border border-border-subtle w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-all",
              activeTab === tab.id
                ? "bg-bg-elevated text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            <span className="text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {/* ═══════════════════════════════════ */}
          {/* OVERVIEW TAB                        */}
          {/* ═══════════════════════════════════ */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Period Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-text-muted">Period:</span>
                {["24h", "7d", "30d", "90d"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-[11px] font-medium transition-all",
                      period === p
                        ? "bg-accent-dim text-accent"
                        : "bg-bg-card text-text-muted hover:text-text-secondary"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* KPI Row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Total Interactions"
                  value="12,847"
                  change="+23% vs last period"
                  changeType="up"
                  barPercentage={72}
                  delay={0}
                />
                <StatCard
                  label="AI Resolution Rate"
                  value="87.3%"
                  change="vs 72% industry avg"
                  changeType="up"
                  barPercentage={87}
                  delay={0.05}
                />
                <StatCard
                  label="Revenue Influenced"
                  value="$44,780"
                  change="+18% this period"
                  changeType="up"
                  barPercentage={65}
                  barColor="var(--color-chat)"
                  delay={0.1}
                />
                <StatCard
                  label="Offline Entries"
                  value={manualEntries.length.toString()}
                  change={`${totalOfflineRevenue > 0 ? `$${totalOfflineRevenue.toFixed(0)} manual revenue` : "Add offline data"}`}
                  changeType="neutral"
                  barPercentage={Math.min(manualEntries.length * 10, 100)}
                  barColor="var(--color-voice)"
                  delay={0.15}
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Panel title="Revenue vs Cost" icon="💰">
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis hide />
                      <Tooltip {...tooltipStyle} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="var(--color-accent)"
                        fill="url(#revGrad)"
                        strokeWidth={2}
                        name="Revenue ($)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Panel>

                <Panel title="Online vs Offline" icon="📊">
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={240}>
                      <RePieChart>
                        <Pie
                          data={channelData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {channelData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip {...tooltipStyle} />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-6 text-[11px] text-text-muted">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-accent" /> Online (AI): 87%
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: "var(--color-voice)" }} /> Offline (Manual): 13%
                    </span>
                  </div>
                </Panel>
              </div>

              {/* Industry Benchmarks */}
              <Panel title="Your Performance vs Industry Average" icon="🏆">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {[
                    { label: "AI Resolution Rate", yours: "87.3%", industry: "72.0%", better: true },
                    { label: "Customer Satisfaction", yours: "4.8★", industry: "4.2★", better: true },
                    { label: "Response Time", yours: "1.2s", industry: "4.5s", better: true },
                  ].map((metric) => (
                    <div key={metric.label} className="rounded-lg bg-bg-elevated p-4">
                      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        {metric.label}
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-2xl font-bold text-accent">{metric.yours}</div>
                          <div className="text-[10px] text-text-muted">You</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-text-muted">{metric.industry}</div>
                          <div className="text-[10px] text-text-muted">Industry Avg</div>
                        </div>
                      </div>
                      <div className="mt-2 text-[10px] font-semibold text-accent">
                        ↑ Above average
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Quick Actions */}
              <Panel title="Quick Actions" icon="⚡">
                <QuickActions
                  actions={[
                    { icon: "👤", label: "Add Offline Customer", onClick: () => { setAddEntryType("customer"); setShowAddEntry(true); } },
                    { icon: "📅", label: "Log Offline Appointment", onClick: () => { setAddEntryType("appointment"); setShowAddEntry(true); } },
                    { icon: "📞", label: "Log Offline Call", onClick: () => { setAddEntryType("call"); setShowAddEntry(true); } },
                    { icon: "💳", label: "Record Payment", onClick: () => { setAddEntryType("payment"); setShowAddEntry(true); } },
                    { icon: "🎯", label: "Add Offline Lead", onClick: () => { setAddEntryType("lead"); setShowAddEntry(true); } },
                    { icon: "📊", label: "View Profit Report", onClick: () => setActiveTab("profit") },
                  ]}
                />
              </Panel>
            </div>
          )}

          {/* ═══════════════════════════════════ */}
          {/* AGENTS TAB                          */}
          {/* ═══════════════════════════════════ */}
          {activeTab === "agents" && (
            <div className="space-y-5">
              {/* Voice Agent */}
              <Panel
                title="Voice Agent"
                icon="🎙️"
                action={editingSection === "voice" ? "Save" : "Edit"}
                onAction={() =>
                  editingSection === "voice"
                    ? handleSaveSection("voice")
                    : setEditingSection("voice")
                }
              >
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        Agent Name
                      </label>
                      <input
                        className="w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent"
                        defaultValue={config.agentName}
                        disabled={editingSection !== "voice"}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        Greeting Script
                      </label>
                      <textarea
                        className="w-full resize-none rounded-lg border border-border-default bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent"
                        rows={4}
                        value={greeting}
                        onChange={(e) => setGreeting(e.target.value)}
                        disabled={editingSection !== "voice"}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Active Voice Templates
                    </div>
                    <div className="space-y-2">
                      {voiceTemplates.map((tpl) => (
                        <TemplateToggle
                          key={tpl!.id}
                          icon={tpl!.icon}
                          name={tpl!.name}
                          description={tpl!.function}
                          enabled={true}
                          onToggle={() => {}}
                        />
                      ))}
                    </div>

                    <div className="mt-4">
                      <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        Sample Conversation
                      </div>
                      <ConversationPreview messages={convo} isLive={true} />
                    </div>
                  </div>
                </div>
              </Panel>

              {/* Chatbot */}
              <Panel
                title="Chatbot"
                icon="💬"
                action={editingSection === "chat" ? "Save" : "Edit"}
                onAction={() =>
                  editingSection === "chat"
                    ? handleSaveSection("chat")
                    : setEditingSection("chat")
                }
              >
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        Widget Title
                      </label>
                      <input
                        className="w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent"
                        defaultValue={`${businessName} Support`}
                        disabled={editingSection !== "chat"}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        Welcome Message
                      </label>
                      <textarea
                        className="w-full resize-none rounded-lg border border-border-default bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent"
                        rows={2}
                        defaultValue={greeting}
                        disabled={editingSection !== "chat"}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        AI Personality
                      </label>
                      <textarea
                        className="w-full resize-none rounded-lg border border-border-default bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent"
                        rows={4}
                        defaultValue={config.systemPrompt}
                        disabled={editingSection !== "chat"}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Active Chat Templates
                    </div>
                    <div className="space-y-2">
                      {chatTemplates.map((tpl) => (
                        <TemplateToggle
                          key={tpl!.id}
                          icon={tpl!.icon}
                          name={tpl!.name}
                          description={tpl!.function}
                          enabled={true}
                          onToggle={() => {}}
                          accentColor="var(--color-chat)"
                        />
                      ))}
                    </div>

                    {/* Widget Preview */}
                    <div className="mt-4 flex justify-center">
                      <div className="w-[280px] overflow-hidden rounded-2xl border border-border-default bg-bg-elevated shadow-xl">
                        <div className="flex items-center gap-2 bg-gradient-to-r from-accent to-emerald-600 px-3 py-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black/20 text-xs">🤖</div>
                          <div>
                            <div className="text-[12px] font-bold text-black">{businessName}</div>
                            <div className="text-[9px] text-black/60">Online</div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 p-3">
                          <div className="max-w-[85%] rounded-lg rounded-bl-sm bg-bg-card px-3 py-2 text-[11px]">
                            {greeting}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 border-t border-border-subtle px-3 py-2">
                          <div className="flex-1 rounded-full bg-bg-card px-3 py-1.5 text-[10px] text-text-muted">
                            Type a message...
                          </div>
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs text-black">→</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>

              {/* Knowledge Base */}
              <Panel title="Knowledge Base (Auto-Seeded)" icon="📚">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-lg bg-accent-dim px-3 py-1.5 text-[11px] font-semibold text-accent">
                    {config.sampleFAQs.length} entries auto-loaded
                  </div>
                  <button className="rounded-lg border border-border-default bg-bg-elevated px-3 py-1.5 text-[11px] font-medium text-text-secondary transition-all hover:text-accent">
                    + Add Manual Entry
                  </button>
                </div>
                <div className="space-y-2">
                  {config.sampleFAQs.map((seed, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg bg-bg-elevated p-3">
                      <span className="text-sm text-accent font-bold">Q:</span>
                      <div className="flex-1">
                        <div className="text-[12.5px] font-semibold text-text-primary">{seed.question}</div>
                        <div className="mt-0.5 text-[11.5px] text-text-muted line-clamp-2">{seed.answer}</div>
                      </div>
                      <button className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-text-muted hover:text-accent">
                        <Edit size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          )}

          {/* ═══════════════════════════════════ */}
          {/* DATA TAB (Manual + Online)          */}
          {/* ═══════════════════════════════════ */}
          {activeTab === "data" && (
            <div className="space-y-5">
              {/* Online Data */}
              <Panel title="Online Data (Auto-Synced)" icon="🌐">
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <div>
                    <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Recent Online Calls
                    </div>
                    <CallLogTable calls={mockCalls} />
                  </div>
                  <div>
                    <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Connected Integrations
                    </div>
                    <IntegrationGrid integrations={mockIntegrations} />
                  </div>
                </div>
              </Panel>

              {/* Manual Data */}
              <Panel
                title="Offline Data (Manual Entry)"
                icon="📁"
                action="+ Add Entry"
                onAction={() => setShowAddEntry(true)}
              >
                {/* Filter */}
                <div className="mb-4 flex gap-1.5">
                  {Object.entries(entryTypeCounts).map(([type, count]) => (
                    <button
                      key={type}
                      onClick={() => setEntryFilter(type)}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-[11px] font-medium transition-all",
                        entryFilter === type
                          ? "bg-accent-dim text-accent"
                          : "bg-bg-elevated text-text-muted hover:text-text-secondary"
                      )}
                    >
                      {type === "all" ? "All" : entryTypeConfig[type]?.icon} {type === "all" ? "" : entryTypeConfig[type]?.label || type} ({count})
                    </button>
                  ))}
                </div>

                {/* Entries */}
                <div className="space-y-2">
                  {filteredEntries.map((entry) => {
                    const typeConf = entryTypeConfig[entry.type];
                    return (
                      <div
                        key={entry.id}
                        className="flex items-start gap-3 rounded-lg bg-bg-elevated p-4"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg-card text-lg">
                          {typeConf?.icon || "📁"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-text-primary">
                              {entry.data.name || entry.data.customer_name || entry.data.caller_name || "Entry"}
                            </span>
                            <span className="rounded bg-bg-card px-1.5 py-0.5 text-[9px] font-semibold text-text-muted uppercase">
                              {entry.type}
                            </span>
                            <span className="text-[9px] text-text-muted">• {entry.type === "payment" ? `$${entry.data.amount}` : ""}</span>
                          </div>
                          <div className="mt-1 text-[11px] text-text-muted">
                            {Object.entries(entry.data)
                              .filter(([k]) => !["name", "customer_name", "caller_name"].includes(k))
                              .map(([k, v]) => `${k}: ${v}`)
                              .slice(0, 3)
                              .join(" • ")}
                          </div>
                          <div className="mt-1 text-[10px] text-text-muted">{entry.createdAt}</div>
                        </div>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-text-muted transition-all hover:bg-danger-dim hover:text-danger"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}

                  {filteredEntries.length === 0 && (
                    <div className="py-8 text-center text-sm text-text-muted">
                      No entries yet. Click "+ Add Entry" to add offline data.
                    </div>
                  )}
                </div>
              </Panel>
            </div>
          )}

          {/* ═══════════════════════════════════ */}
          {/* PROFIT TAB                          */}
          {/* ═══════════════════════════════════ */}
          {activeTab === "profit" && (
            <div className="space-y-5">
              {/* Profit KPIs */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Total Revenue Influenced"
                  value="$44,780"
                  change="+18% this period"
                  changeType="up"
                  icon="💰"
                  delay={0}
                />
                <StatCard
                  label="AI Platform Cost"
                  value="$333.64"
                  change="0.7% of revenue"
                  changeType="neutral"
                  icon="🤖"
                  delay={0.05}
                />
                <StatCard
                  label="Net Profit"
                  value="$44,446"
                  change="99.3% margin"
                  changeType="up"
                  barPercentage={99}
                  delay={0.1}
                />
                <StatCard
                  label="ROI"
                  value="13,320%"
                  change="Payback: 5.4 hours"
                  changeType="up"
                  barColor="var(--color-chat)"
                  delay={0.15}
                />
              </div>

              {/* Revenue Breakdown */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Panel title="Revenue Sources" icon="📈">
                  {[
                    { label: "Appointments Generated", count: 89, avg: 150, total: 13350 },
                    { label: "Leads Converted", count: 45, avg: 320, total: 14400 },
                    { label: "Repeat Customers Retained", count: 120, avg: 85, total: 10200 },
                    { label: "Upsells & Cross-sells", count: 32, avg: 65, total: 2080 },
                    { label: "After-Hours Captured", count: 38, avg: 125, total: 4750 },
                  ].map((source) => (
                    <div key={source.label} className="mb-3 last:mb-0">
                      <div className="mb-1 flex items-center justify-between text-[12px]">
                        <span className="text-text-secondary">{source.label}</span>
                        <span className="font-semibold text-accent">${source.total.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-text-muted">
                        <span>{source.count} × ${source.avg} avg</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-bg-elevated">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(source.total / 14400) * 100}%` }}
                          transition={{ duration: 0.8 }}
                          className="h-full rounded-full bg-accent"
                        />
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 flex items-center justify-between rounded-lg bg-accent-dim p-3">
                    <span className="text-[13px] font-semibold text-accent">Total Revenue Influenced</span>
                    <span className="text-lg font-bold text-accent">$44,780</span>
                  </div>
                </Panel>

                <Panel title="Cost Comparison: AI vs Human" icon="⚖️">
                  <div className="space-y-4">
                    <div className="rounded-lg bg-bg-elevated p-4">
                      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        Human Receptionist (Monthly)
                      </div>
                      <div className="space-y-2 text-[12px]">
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Salary</span>
                          <span className="text-danger font-semibold">$3,500</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Benefits</span>
                          <span className="text-danger font-semibold">$875</span>
                        </div>
                        <div className="flex justify-between border-t border-border-subtle pt-2">
                          <span className="font-semibold text-text-primary">Total</span>
                          <span className="text-danger font-bold">$4,375/mo</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Coverage</span>
                          <span className="text-text-muted">8 hours/day</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg bg-bg-elevated p-4">
                      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        Questron AI (Monthly)
                      </div>
                      <div className="space-y-2 text-[12px]">
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Subscription</span>
                          <span className="text-accent font-semibold">$299</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Overage</span>
                          <span className="text-accent font-semibold">$29.64</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Phone Number</span>
                          <span className="text-accent font-semibold">$5</span>
                        </div>
                        <div className="flex justify-between border-t border-border-subtle pt-2">
                          <span className="font-semibold text-text-primary">Total</span>
                          <span className="text-accent font-bold">$333.64/mo</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Coverage</span>
                          <span className="text-accent">24 hours/day</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-accent/30 bg-accent-dim p-4 text-center">
                      <div className="text-[13px] font-semibold text-accent mb-1">Total Monthly Savings</div>
                      <div className="text-2xl font-bold text-accent">$4,041.36</div>
                    </div>
                  </div>
                </Panel>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════ */}
          {/* SETTINGS TAB                        */}
          {/* ═══════════════════════════════════ */}
          {activeTab === "settings" && (
            <div className="space-y-5">
              <Panel title="Business Settings" icon="⚙️">
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Timezone
                    </label>
                    <select className="w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent">
                      <option>US/Eastern (EST/EDT)</option>
                      <option>US/Central (CST/CDT)</option>
                      <option>US/Pacific (PST/PDT)</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                    Support Emails
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <span className="flex items-center gap-1.5 rounded-lg bg-bg-elevated px-3 py-1.5 text-[12px] text-text-secondary">
                      hello@mybusiness.com
                      <button className="text-text-muted hover:text-danger">
                        <X size={12} />
                      </button>
                    </span>
                    <button className="flex items-center gap-1 rounded-lg border border-dashed border-border-default px-3 py-1.5 text-[12px] text-text-muted hover:text-accent">
                      <Plus size={12} /> Add
                    </button>
                  </div>
                </div>
                <div className="mt-5">
                  <button className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-black transition-all hover:brightness-110">
                    Save Changes
                  </button>
                </div>
              </Panel>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ═══════════════════════════════════ */}
      {/* ADD MANUAL ENTRY MODAL              */}
      {/* ═══════════════════════════════════ */}
      {showAddEntry && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowAddEntry(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-[480px] max-h-[80vh] overflow-y-auto rounded-2xl border border-border-default bg-bg-secondary shadow-2xl"
          >
            <div className="border-b border-border-subtle px-6 py-4">
              <h3 className="text-lg font-bold text-text-primary">Add Offline Data</h3>
              <p className="mt-1 text-[13px] text-text-secondary">
                Record data from walk-ins, phone calls, or in-person interactions
              </p>
            </div>

            {/* Entry Type Selector */}
            <div className="flex gap-1.5 border-b border-border-subtle px-6 py-3">
              {Object.entries(entryTypeConfig).map(([type, conf]) => (
                <button
                  key={type}
                  onClick={() => {
                    setAddEntryType(type as keyof typeof entryTypeConfig);
                    setEntryFormData({});
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all",
                    addEntryType === type
                      ? "bg-accent-dim text-accent"
                      : "text-text-muted hover:text-text-secondary"
                  )}
                >
                  <span>{conf.icon}</span>
                  {conf.label}
                </button>
              ))}
            </div>

            {/* Dynamic Form */}
            <div className="space-y-3 p-6">
              {entryTypeConfig[addEntryType]?.fields.map((field) => (
                <div key={field.key}>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                    {field.label}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      className="w-full resize-none rounded-lg border border-border-default bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent"
                      rows={3}
                      placeholder={field.placeholder}
                      value={entryFormData[field.key] || ""}
                      onChange={(e) =>
                        setEntryFormData((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                    />
                  ) : field.type === "select" ? (
                    <select
                      className="w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent"
                      value={entryFormData[field.key] || ""}
                      onChange={(e) =>
                        setEntryFormData((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select...</option>
                      {field.key === "outcome" && (
                        <>
                          <option>Booked</option>
                          <option>Answered</option>
                          <option>Missed</option>
                          <option>Transferred</option>
                        </>
                      )}
                      {field.key === "method" && (
                        <>
                          <option>Cash</option>
                          <option>Credit Card</option>
                          <option>Debit Card</option>
                          <option>Check</option>
                          <option>Insurance</option>
                        </>
                      )}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      className="w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent"
                      placeholder={field.placeholder}
                      value={entryFormData[field.key] || ""}
                      onChange={(e) =>
                        setEntryFormData((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 border-t border-border-subtle px-6 py-4">
              <button
                onClick={() => setShowAddEntry(false)}
                className="rounded-lg border border-border-default bg-bg-elevated px-5 py-2.5 text-sm font-medium text-text-secondary transition-all hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEntry}
                className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-black transition-all hover:brightness-110"
              >
                Save Entry
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
