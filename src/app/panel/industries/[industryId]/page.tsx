"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Bot, Phone, BarChart3, Settings, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/ui/StatCard";
import { Panel } from "@/components/ui/Panel";
import { TemplateToggle } from "@/components/ui/TemplateToggle";
import { ConversationPreview } from "@/components/ui/ConversationPreview";
import { CallLogTable } from "@/components/ui/CallLogTable";
import { IntegrationGrid } from "@/components/ui/IntegrationGrid";
import { QuickActions } from "@/components/ui/QuickActions";
import { industries } from "@/data/industries";
import { templates } from "@/data/templates";
import { industryBundles } from "@/data/template-bundles";
import { sampleConversations } from "@/data/sample-conversations";

const mockCalls = [
  { id: "1", workspaceId: "", direction: "inbound" as const, callerName: "Maria Garcia", callerPhone: "(555) 234-8901", duration: "2:34", outcome: "booked" as const, templateUsed: "appointment-booking", timestamp: "2 min ago" },
  { id: "2", workspaceId: "", direction: "inbound" as const, callerName: "James Wilson", callerPhone: "(555) 876-5432", duration: "1:12", outcome: "answered" as const, templateUsed: "faq-responder", timestamp: "8 min ago" },
  { id: "3", workspaceId: "", direction: "inbound" as const, callerName: "Sarah Chen", callerPhone: "(555) 345-6789", duration: "3:01", outcome: "booked" as const, templateUsed: "appointment-booking", timestamp: "15 min ago" },
  { id: "4", workspaceId: "", direction: "inbound" as const, callerName: "Unknown", callerPhone: "(555) 000-1234", duration: "0:00", outcome: "missed" as const, templateUsed: "", timestamp: "22 min ago" },
  { id: "5", workspaceId: "", direction: "inbound" as const, callerName: "Robert Kim", callerPhone: "(555) 567-8901", duration: "1:45", outcome: "answered" as const, templateUsed: "faq-responder", timestamp: "31 min ago" },
];

const mockIntegrations = [
  { integrationId: "gcal", name: "Google Calendar", icon: "📅", connected: true },
  { integrationId: "epic", name: "Epic EHR", icon: "🏥", connected: true },
  { integrationId: "hubspot", name: "HubSpot CRM", icon: "📊", connected: true },
  { integrationId: "sms", name: "SMS (Twilio)", icon: "💬", connected: true },
  { integrationId: "email", name: "SendGrid Email", icon: "📧", connected: false },
  { integrationId: "stripe", name: "Stripe", icon: "💳", connected: false },
];

const tabs = [
  { id: "voice", label: "Voice Agent", icon: "🎙️", Icon: Phone },
  { id: "chat", label: "Chatbot", icon: "💬", Icon: Bot },
  { id: "analytics", label: "Analytics", icon: "📈", Icon: BarChart3 },
  { id: "settings", label: "Settings", icon: "⚙️", Icon: Settings },
];

export default function IndustryWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const industryId = params.industryId as string;
  const [activeTab, setActiveTab] = useState("voice");

  const industry = industries.find((i) => i.id === industryId);
  const bundle = industryBundles[industryId];
  const convo = sampleConversations[industryId] || [];

  if (!industry || !bundle) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center">
        <div className="text-5xl mb-6">🏭</div>
        <h2 className="text-2xl font-bold text-[#0a192f] mb-2">Industry not found</h2>
        <p className="text-[#64748b] mb-6">This workspace doesn&apos;t exist or has been removed.</p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push("/panel/industries")}
          className="px-6 py-2.5 rounded-lg bg-white border border-[#e2e8f0] text-sm font-medium text-[#0a192f] hover:bg-[#f8fafc] shadow-sm"
        >
          ← Back to all industries
        </motion.button>
      </div>
    );
  }

  const voiceTemplates = bundle.voiceTemplateIds
    .map((id) => templates.find((t) => t.id === id))
    .filter(Boolean);

  const chatTemplates = bundle.chatTemplateIds
    .map((id) => templates.find((t) => t.id === id))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-xl border-b border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-5">
          <button
            onClick={() => router.push("/panel/industries")}
            className="flex items-center gap-1 text-xs text-[#64748b] hover:text-[#0a192f] transition-colors mb-4 font-medium"
          >
            <ChevronLeft size={14} /> Back to all industries
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-md"
                style={{ background: industry.iconBg }}
              >
                {industry.icon}
              </motion.div>
              <div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-2xl font-bold tracking-tight text-[#0a192f]"
                >
                  {industry.name}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-0.5 text-sm text-[#64748b] font-medium"
                >
                  {industry.tagline}
                </motion.p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="hidden sm:flex items-center gap-2 rounded-full bg-[#0a192f]/5 px-4 py-2 text-xs font-semibold text-[#0a192f]"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10b981] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10b981]" />
              </span>
              {voiceTemplates.length + chatTemplates.length} Templates Active
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
        {/* Tabs */}
        <div className="flex gap-2 rounded-xl bg-white p-1 border border-[#e2e8f0] w-fit mb-8 shadow-sm">
          {tabs.map((tab) => {
            const Icon = tab.Icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-[#f8fafc] text-[#0a192f] shadow-sm"
                    : "text-[#64748b] hover:text-[#0a192f]"
                )}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {/* ═══ VOICE TAB ═══ */}
            {activeTab === "voice" && (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard label="Calls Today" value="247" change="+12% vs yesterday" changeType="up" barPercentage={72} delay={0} />
                  <StatCard label="Answered" value="231" change="93.5% answer rate" changeType="up" barPercentage={93} delay={0.05} />
                  <StatCard label="Appointments Booked" value="89" change="+8% conversion" changeType="up" barPercentage={36} barColor="var(--color-voice)" delay={0.1} />
                  <StatCard label="Avg Handle Time" value="2:14" change="18s improvement" changeType="down" barPercentage={45} barColor="var(--color-chat)" delay={0.15} />
                </div>

                {/* Templates + Convo */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <Panel title="Active Voice Templates" icon="📋" action="Manage">
                    <div className="flex flex-col gap-3">
                      {voiceTemplates.map((tpl, idx) => (
                        <TemplateToggle
                          key={tpl!.id}
                          icon={tpl!.icon}
                          name={tpl!.name}
                          description={tpl!.function}
                          enabled={true}
                          onToggle={() => {}}
                          delay={idx * 0.05}
                        />
                      ))}
                    </div>
                  </Panel>

                  <Panel title="Live Call Preview" icon="🎙️" action="Full Transcript">
                    <ConversationPreview messages={convo} isLive={true} />
                  </Panel>
                </div>

                {/* Calls + Integrations */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <Panel title="Recent Calls" icon="📞" action="View All">
                    <CallLogTable calls={mockCalls} />
                  </Panel>

                  <Panel title="Connected Integrations" icon="🔌" action="+ Add">
                    <IntegrationGrid integrations={mockIntegrations} />
                  </Panel>
                </div>

                {/* Quick Actions */}
                <Panel title="Quick Actions" icon="⚡">
                  <QuickActions
                    actions={[
                      { icon: "🧪", label: "Test Agent", onClick: () => router.push("/panel/voice-agents") },
                      { icon: "📝", label: "Edit Greeting", onClick: () => {} },
                      { icon: "📞", label: "Forward Number", onClick: () => {} },
                      { icon: "🕐", label: "Set Hours", onClick: () => {} },
                      { icon: "🔊", label: "Change Voice", onClick: () => {} },
                      { icon: "📤", label: "Export Logs", onClick: () => {} },
                    ]}
                  />
                </Panel>
              </div>
            )}

            {/* ═══ CHAT TAB ═══ */}
            {activeTab === "chat" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard label="Chats Today" value="1,084" change="+23% vs yesterday" changeType="up" barPercentage={85} barColor="var(--color-chat)" delay={0} />
                  <StatCard label="Auto-Resolved" value="962" change="88.7% resolution rate" changeType="up" barPercentage={88} delay={0.05} />
                  <StatCard label="Leads Captured" value="127" change="+15% this week" changeType="up" barPercentage={42} barColor="var(--color-voice)" delay={0.1} />
                  <StatCard label="Avg Response" value="1.2s" change="0.3s faster" changeType="up" barPercentage={20} delay={0.15} />
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <Panel title="Chatbot Templates" icon="💬" action="Manage">
                    <div className="flex flex-col gap-3">
                      {chatTemplates.map((tpl, idx) => (
                        <TemplateToggle
                          key={tpl!.id}
                          icon={tpl!.icon}
                          name={tpl!.name}
                          description={tpl!.function}
                          enabled={true}
                          onToggle={() => {}}
                          accentColor="var(--color-chat)"
                          delay={idx * 0.05}
                        />
                      ))}
                    </div>
                  </Panel>

                  <Panel title="Widget Preview" icon="🖥️" action="Customize">
                    <div className="flex items-center justify-center py-6">
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="w-[320px] overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-2xl"
                      >
                        <div
                          className="flex items-center gap-3 px-4 py-3"
                          style={{ background: "linear-gradient(135deg, var(--color-accent), #059669)" }}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-sm">🤖</div>
                          <div>
                            <div className="text-[12px] font-bold text-white">{industry.name} Assistant</div>
                            <div className="text-[10px] text-white/70">Online • Replies instantly</div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-3 p-4">
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="max-w-[85%] rounded-xl rounded-bl-sm bg-[#f8fafc] px-3.5 py-2.5 text-[12px] border border-[#e2e8f0]"
                          >
                            Hi! How can I help you today? 😊
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="ml-auto max-w-[85%] rounded-xl rounded-br-sm bg-[#0a192f] px-3.5 py-2.5 text-[12px] text-white"
                          >
                            I'd like to book an appointment
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 }}
                            className="max-w-[85%] rounded-xl rounded-bl-sm bg-[#f8fafc] px-3.5 py-2.5 text-[12px] border border-[#e2e8f0]"
                          >
                            Great! What service do you need?
                          </motion.div>
                        </div>
                        <div className="flex items-center gap-2 border-t border-[#e2e8f0] px-4 py-3">
                          <div className="flex-1 rounded-full bg-[#f8fafc] px-4 py-2 text-[11px] text-[#94a3b8]">
                            Type a message...
                          </div>
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0a192f] text-sm text-white">
                            →
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </Panel>
                </div>
              </div>
            )}

            {/* ═══ ANALYTICS TAB ═══ */}
            {activeTab === "analytics" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard label="Total Interactions" value="8,429" change="+31% this month" changeType="up" delay={0} />
                  <StatCard label="Revenue Influenced" value="$47.2K" change="+18% this month" changeType="up" delay={0.05} />
                  <StatCard label="Satisfaction" value="4.8★" change="312 ratings" changeType="up" barPercentage={96} barColor="var(--color-chat)" delay={0.1} />
                  <StatCard label="Cost Savings" value="$12.8K" change="vs human receptionist" changeType="up" delay={0.15} />
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <Panel title="Outcomes Breakdown" icon="🎯">
                    {[
                      { label: "Appointments Booked", pct: 34, color: "var(--color-accent)" },
                      { label: "Questions Answered", pct: 28, color: "var(--color-chat)" },
                      { label: "Leads Captured", pct: 22, color: "var(--color-voice)" },
                      { label: "Transferred to Human", pct: 11, color: "var(--color-text-muted)" },
                      { label: "Voicemail / Missed", pct: 5, color: "var(--color-danger)" },
                    ].map((item, idx) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1, duration: 0.4 }}
                        className="mb-3 last:mb-0"
                      >
                        <div className="mb-1.5 flex justify-between text-xs">
                          <span className="text-[#64748b]">{item.label}</span>
                          <span className="font-semibold" style={{ color: item.color }}>{item.pct}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.pct}%` }}
                            transition={{ duration: 1.2, delay: idx * 0.15, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{ background: item.color }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </Panel>

                  <Panel title="Top Caller Intents" icon="🗣️">
                    {[
                      { icon: "📅", label: "Book an appointment", count: "412 calls" },
                      { icon: "🕐", label: "Office hours inquiry", count: "287 calls" },
                      { icon: "💊", label: "Prescription refill", count: "198 calls" },
                      { icon: "❓", label: "Insurance questions", count: "156 calls" },
                    ].map((intent, idx) => (
                      <motion.div
                        key={intent.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="mb-2 flex items-center gap-3 rounded-lg bg-[#f8fafc] px-3 py-2.5 last:mb-0 hover:bg-[#f1f5f9] transition-colors"
                      >
                        <span className="text-sm">{intent.icon}</span>
                        <span className="flex-1 text-sm text-[#0a192f]">{intent.label}</span>
                        <span className="text-sm font-semibold text-[#3b82f6]">{intent.count}</span>
                      </motion.div>
                    ))}
                  </Panel>
                </div>
              </div>
            )}

            {/* ═══ SETTINGS TAB ═══ */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <Panel title="Voice Agent Settings" icon="🎙️">
                    <div className="space-y-5">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#64748b]">Agent Name</label>
                        <input className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#0a192f] outline-none focus:border-[#0a192f] focus:ring-4 focus:ring-[#0a192f]/10 transition-all" defaultValue="Sarah" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#64748b]">Voice</label>
                        <select className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#0a192f] outline-none focus:border-[#0a192f] focus:ring-4 focus:ring-[#0a192f]/10 transition-all">
                          <option>Priya — Friendly Female</option>
                          <option>Shubh — Warm Male</option>
                          <option>Ananya — Cheerful Female</option>
                          <option>Tarun — Confident Male</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#64748b]">Greeting Script</label>
                        <textarea className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#0a192f] outline-none focus:border-[#0a192f] focus:ring-4 focus:ring-[#0a192f]/10 transition-all resize-none" rows={3} defaultValue={`Thank you for calling ${industry.name}. This is Sarah, your virtual assistant. How may I help you today?`} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#64748b]">Language Detection</label>
                        <select className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#0a192f] outline-none focus:border-[#0a192f] focus:ring-4 focus:ring-[#0a192f]/10 transition-all">
                          <option>Auto-detect (22 Indian Languages + English)</option>
                          <option>English only</option>
                          <option>Hindi only</option>
                          <option>Tamil only</option>
                        </select>
                      </div>
                    </div>
                  </Panel>

                  <Panel title="Chatbot Settings" icon="💬">
                    <div className="space-y-5">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#64748b]">Widget Title</label>
                        <input className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#0a192f] outline-none focus:border-[#3b82f6] focus:ring-4 focus:ring-[#3b82f6]/10 transition-all" defaultValue={`${industry.name} Assistant`} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#64748b]">Welcome Message</label>
                        <textarea className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#0a192f] outline-none focus:border-[#3b82f6] focus:ring-4 focus:ring-[#3b82f6]/10 transition-all resize-none" rows={2} defaultValue="Hi! 👋 How can I help you today?" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#64748b]">Position</label>
                        <select className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#0a192f] outline-none focus:border-[#3b82f6] focus:ring-4 focus:ring-[#3b82f6]/10 transition-all">
                          <option>Bottom-right</option>
                          <option>Bottom-left</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#64748b]">Collect Leads</label>
                        <select className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#0a192f] outline-none focus:border-[#3b82f6] focus:ring-4 focus:ring-[#3b82f6]/10 transition-all">
                          <option>After first message</option>
                          <option>Before conversation</option>
                          <option>Only on booking</option>
                          <option>Never</option>
                        </select>
                      </div>
                    </div>
                  </Panel>
                </div>

                <Panel title="Business Profile" icon="🏢">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#64748b]">Business Name</label>
                      <input className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#0a192f] outline-none focus:border-[#0a192f] focus:ring-4 focus:ring-[#0a192f]/10 transition-all" defaultValue={`Sunrise ${industry.name}`} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#64748b]">Phone Number</label>
                      <input className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 font-mono text-sm text-[#0a192f] outline-none focus:border-[#0a192f] focus:ring-4 focus:ring-[#0a192f]/10 transition-all" defaultValue="+1 (555) 234-5678" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#64748b]">Timezone</label>
                      <select className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#0a192f] outline-none focus:border-[#0a192f] focus:ring-4 focus:ring-[#0a192f]/10 transition-all">
                        <option>US/Eastern (EST/EDT)</option>
                        <option>US/Central (CST/CDT)</option>
                        <option>US/Pacific (PST/PDT)</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#64748b]">Industry</label>
                      <input className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#0a192f] bg-[#f8fafc]" value={industry.name} readOnly />
                    </div>
                  </div>
                  <div className="mt-8 flex gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="rounded-xl bg-[#0a192f] px-8 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#112240] shadow-lg shadow-[#0a192f]/20"
                    >
                      Save Changes
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="rounded-xl border border-[#e2e8f0] bg-white px-8 py-2.5 text-sm font-medium text-[#64748b] transition-all hover:border-[#0a192f] hover:text-[#0a192f]"
                    >
                      Reset
                    </motion.button>
                  </div>
                </Panel>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
