"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, Phone, Bot, Database, Activity, Stethoscope,
  TrendingUp, TrendingDown, Clock, Search, Filter, Plus, Trash2, Edit2, Check
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { cn } from "@/lib/utils";
import { industries } from "@/data/industries";
import { INDUSTRY_CONFIGS, getIndustryConfig } from "@/data/auto-config";
import { StatCard } from "@/components/ui/StatCard";

// Mock Data
const revenueData = [
  { day: 'Mon', revenue: 4200, offline: 1200 },
  { day: 'Tue', revenue: 5100, offline: 1500 },
  { day: 'Wed', revenue: 4800, offline: 1300 },
  { day: 'Thu', revenue: 6200, offline: 1800 },
  { day: 'Fri', revenue: 8400, offline: 2100 },
  { day: 'Sat', revenue: 9500, offline: 2500 },
  { day: 'Sun', revenue: 7100, offline: 2000 },
];

const pieData = [
  { name: 'Online / AI', value: 75 },
  { name: 'Offline / Manual', value: 25 },
];
const pieColors = ["var(--accent)", "var(--voice)"];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const industryId = params.industryId as string;

  const [activeTab, setActiveTab] = useState("overview");

  const industry = industries.find(i => i.id === industryId);
  const config = getIndustryConfig(industryId);

  // States for Editable Fields
  const [isEditingVoice, setIsEditingVoice] = useState(false);
  const [voiceForm, setVoiceForm] = useState({ name: config?.agentName || "", greeting: config?.greeting || "", afterHours: "We're currently unavailable." });
  
  const [isEditingChat, setIsEditingChat] = useState(false);
  const [chatForm, setChatForm] = useState({ title: "Widget", welcome: "How can I help you?", personality: "Professional" });

  if (!industry || !config) return <div className="p-8 text-[var(--text-primary)]">Loading Workspace...</div>;

  const isMedical = industry.category === "healthcare"; // Actually, prompt said "medical, dental, and veterinary", which maps to category "healthcare" in industries.ts

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "agents", label: "Agents", icon: Bot },
    { id: "data", label: "Data", icon: Database },
    { id: "profit", label: "Profit", icon: TrendingUp },
    ...(isMedical ? [{ id: "medical", label: "Medical", icon: Stethoscope }] : [])
  ];

  return (
    <div className="flex h-screen flex-col bg-[var(--bg-primary)] font-sans text-[var(--text-primary)]">
      
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-card)] px-6">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg" style={{ background: industry.iconBg, fontSize: '1.2rem' }}>
            {industry.icon}
          </div>
          <div>
            <h1 className="text-lg font-bold">{industry.name} Workspace</h1>
            <p className="text-xs text-[var(--text-secondary)]">Powered by Sarvam AI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                activeTab === t.id ? "bg-[var(--accent-dim)] text-[var(--accent)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
              )}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Scrollable Area */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {/* ================= OVERVIEW TAB ================= */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                
                {/* 4 KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase text-[var(--text-secondary)]">Total Interactions</p>
                    <div className="mt-2 text-3xl font-bold font-mono">1,429</div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--accent)]"><TrendingUp size={14}/> +12% this week</div>
                    <div className="mt-3 h-1 w-full bg-[var(--border-default)] rounded-full overflow-hidden"><div className="h-full bg-[var(--accent)] w-[70%]" /></div>
                  </div>
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase text-[var(--text-secondary)]">AI Resolution Rate</p>
                    <div className="mt-2 text-3xl font-bold font-mono">84%</div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--accent)]"><TrendingUp size={14}/> +4% this week</div>
                    <div className="mt-3 h-1 w-full bg-[var(--border-default)] rounded-full overflow-hidden"><div className="h-full bg-[var(--voice)] w-[84%]" /></div>
                  </div>
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase text-[var(--text-secondary)]">Revenue Influenced</p>
                    <div className="mt-2 text-3xl font-bold font-mono">₹4,52K</div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--accent)]"><TrendingUp size={14}/> +9% this week</div>
                    <div className="mt-3 h-1 w-full bg-[var(--border-default)] rounded-full overflow-hidden"><div className="h-full bg-[var(--chat)] w-[50%]" /></div>
                  </div>
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase text-[var(--text-secondary)]">Offline Entries</p>
                    <div className="mt-2 text-3xl font-bold font-mono">312</div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--danger)]"><TrendingDown size={14}/> -2% this week</div>
                    <div className="mt-3 h-1 w-full bg-[var(--border-default)] rounded-full overflow-hidden"><div className="h-full bg-[var(--text-muted)] w-[30%]" /></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Revenue Chart */}
                  <div className="lg:col-span-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm">
                    <h3 className="text-sm font-bold mb-4">Revenue Trend (Last 7 Days)</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData}>
                          <defs>
                            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" strokeOpacity={0.3} vertical={false} />
                          <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                          <Tooltip 
                            contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)" }}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill="url(#revGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right Column: Pie Chart + Benchmarks */}
                  <div className="space-y-6">
                    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm flex flex-col items-center justify-center">
                      <h3 className="text-sm font-bold mb-2 w-full text-left">Source Distribution</h3>
                      <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                              {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: 8, fontSize: 12 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex gap-4 text-xs mt-2">
                        <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-[var(--accent)]"/> Online</span>
                        <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-[var(--voice)]"/> Offline</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm">
                      <h3 className="text-sm font-bold mb-4">Quick Actions</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {["Log Appointment", "Record Payment", "Add Lead", "Add Customer", "Log Call", "View Profit"].map(a => (
                          <button key={a} className="flex h-10 items-center justify-center rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-medium hover:bg-[var(--border-default)] transition-colors">
                            {a}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ================= AGENTS TAB ================= */}
            {activeTab === "agents" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Voice Section */}
                <div className="rounded-xl border border-[var(--voice-dim)] bg-[var(--bg-card)] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--voice-dim)] text-[var(--voice)]">
                        <Phone size={20} />
                      </div>
                      <h2 className="text-lg font-bold">Voice Agent</h2>
                    </div>
                    <button onClick={() => setIsEditingVoice(!isEditingVoice)} className="text-xs flex items-center gap-1 text-[var(--voice)] font-medium hover:brightness-125">
                      {isEditingVoice ? <><Check size={14}/> Save</> : <><Edit2 size={14}/> Edit</>}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Agent Name</label>
                      <input disabled={!isEditingVoice} value={voiceForm.name} onChange={e => setVoiceForm({...voiceForm, name: e.target.value})} className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] disabled:opacity-70 disabled:border-transparent outline-none focus:border-[var(--voice)]" />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Greeting</label>
                      <textarea disabled={!isEditingVoice} value={voiceForm.greeting} onChange={e => setVoiceForm({...voiceForm, greeting: e.target.value})} className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] disabled:opacity-70 disabled:border-transparent outline-none focus:border-[var(--voice)] min-h-[80px]" />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">After Hours Notice</label>
                      <textarea disabled={!isEditingVoice} value={voiceForm.afterHours} onChange={e => setVoiceForm({...voiceForm, afterHours: e.target.value})} className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] disabled:opacity-70 disabled:border-transparent outline-none focus:border-[var(--voice)] min-h-[60px]" />
                    </div>
                  </div>

                  {/* Active Templates List */}
                  <div className="mt-8">
                    <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Active Voice Templates</h3>
                    <div className="space-y-2">
                      {config.features.slice(0, 3).map((f, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg bg-[var(--bg-elevated)] px-3 py-2 border border-[var(--border-subtle)]">
                          <span className="text-sm">{f}</span>
                          <div className="h-4 w-8 rounded-full bg-[var(--voice)] relative"><div className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full bg-white"/></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Chat Section */}
                <div className="rounded-xl border border-[var(--chat-dim)] bg-[var(--bg-card)] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--chat-dim)] text-[var(--chat)]">
                        <Bot size={20} />
                      </div>
                      <h2 className="text-lg font-bold">Chatbot</h2>
                    </div>
                    <button onClick={() => setIsEditingChat(!isEditingChat)} className="text-xs flex items-center gap-1 text-[var(--chat)] font-medium hover:brightness-125">
                      {isEditingChat ? <><Check size={14}/> Save</> : <><Edit2 size={14}/> Edit</>}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Widget Title</label>
                      <input disabled={!isEditingChat} value={chatForm.title} onChange={e => setChatForm({...chatForm, title: e.target.value})} className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] disabled:opacity-70 disabled:border-transparent outline-none focus:border-[var(--chat)]" />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Welcome Message</label>
                      <textarea disabled={!isEditingChat} value={chatForm.welcome} onChange={e => setChatForm({...chatForm, welcome: e.target.value})} className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] disabled:opacity-70 disabled:border-transparent outline-none focus:border-[var(--chat)] min-h-[60px]" />
                    </div>
                  </div>

                  {/* Chat Preview */}
                  <div className="mt-8 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] overflow-hidden w-full max-w-[280px] mx-auto shadow-lg">
                    <div className="bg-[var(--chat)] px-4 py-3 text-white font-bold text-sm text-center">
                      {chatForm.title}
                    </div>
                    <div className="p-4 bg-[var(--bg-card)] h-32 flex items-end">
                      <div className="bg-[var(--bg-elevated)] text-sm p-3 rounded-2xl rounded-bl-sm border border-[var(--border-default)] shadow-sm text-[var(--text-primary)] max-w-[90%]">
                        {chatForm.welcome}
                      </div>
                    </div>
                    <div className="border-t border-[var(--border-subtle)] p-2 bg-[var(--bg-elevated)] text-xs text-center text-[var(--text-muted)]">
                      Type your message here...
                    </div>
                  </div>
                </div>

                {/* Knowledge Base */}
                <div className="lg:col-span-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold">Knowledge Seeds</h2>
                    <button className="flex items-center gap-1.5 text-xs bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 hover:bg-[var(--border-default)]">
                      <Plus size={14}/> Add Entry
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {config.sampleFAQs.map((faq, i) => (
                      <div key={i} className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4 relative group">
                        <button className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-muted)] hover:text-white"><Edit2 size={14}/></button>
                        <h4 className="font-semibold text-sm mb-1 pr-6">{faq.question}</h4>
                        <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================= DATA TAB ================= */}
            {activeTab === "data" && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Offline Data Panel (Manual) */}
                <div className="xl:col-span-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden flex flex-col h-[700px]">
                  <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold">Offline Registry</h2>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">Manual logs & operations</p>
                    </div>
                    <button className="bg-[var(--accent)] text-black font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:brightness-110">
                      <Plus size={14}/> Add Entry
                    </button>
                  </div>
                  <div className="flex gap-2 border-b border-[var(--border-subtle)] p-3 bg-[var(--bg-elevated)] overflow-x-auto hide-scrollbar">
                    {["All", "Customer", "Appointment", "Call", "Payment", "Lead"].map(filter => (
                      <button key={filter} className="shrink-0 rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--text-muted)] hover:text-white">
                        {filter}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                    {/* Mock Offline List */}
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} className="flex items-center justify-between p-3 mb-2 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--border-default)] bg-[var(--bg-elevated)] group">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)]">
                            <Activity size={16} className="text-[var(--text-muted)]"/>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">Offline Customer {i}</span>
                              <span className="text-[10px] bg-[var(--border-default)] px-1.5 py-0.5 rounded text-[var(--text-secondary)]">Customer</span>
                            </div>
                            <div className="text-xs text-[var(--text-muted)] mt-0.5">Added 2 hours ago</div>
                          </div>
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 p-1.5 text-[var(--text-muted)] hover:text-[var(--danger)] transition-all">
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Online Data Panel */}
                <div className="space-y-6">
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
                    <h2 className="font-bold mb-4">Integrations Sync</h2>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm py-2">
                        <div className="flex items-center gap-2"><span className="text-[18px]">📅</span> Google Calendar</div>
                        <span className="text-[10px] bg-[var(--accent-dim)] text-[var(--accent)] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Synced</span>
                      </div>
                      <div className="flex items-center justify-between text-sm py-2">
                        <div className="flex items-center gap-2"><span className="text-[18px]">💬</span> Twilio Webhooks</div>
                        <span className="text-[10px] bg-[var(--accent-dim)] text-[var(--accent)] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Active</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 h-80 flex flex-col">
                    <h2 className="font-bold mb-4">Latest Call Log</h2>
                    <div className="flex-1 overflow-y-auto space-y-2">
                      <div className="text-center text-xs text-[var(--text-muted)] pt-10">
                        <Phone size={24} className="mx-auto mb-2 opacity-50"/>
                        Logs appear here natively from Twilio webhooks
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ================= MEDICAL TAB (Conditional) ================= */}
            {activeTab === "medical" && isMedical && (
              <div className="space-y-6">
                
                {/* Reminders Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Form */}
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm">
                    <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><Stethoscope size={20} className="text-[var(--accent)]"/> Schedule Reminder</h2>
                    <p className="text-xs text-[var(--text-secondary)] mb-6">Automated SMS scheduling via Twilio Cron.</p>
                    
                    <div className="space-y-4">
                      <input className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" placeholder="Patient Name" />
                      <input className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" placeholder="+91 Phone Number" />
                      
                      <div className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-elevated)] rounded-lg space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-[var(--text-secondary)]">MEDICINE 1</span>
                        </div>
                        <input className="w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" placeholder="Medicine Name (e.g. Paracetamol 500mg)" />
                        <select className="w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]">
                          <option>1x / Day</option>
                          <option>2x / Day</option>
                          <option>3x / Day</option>
                          <option>As needed</option>
                        </select>
                        <input className="w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" placeholder="Number of Days (e.g. 5)" type="number" />
                      </div>
                      
                      <div className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-elevated)] rounded-lg space-y-3">
                        <span className="text-xs font-semibold text-[var(--text-secondary)] block">FOLLOW UP OPTS</span>
                        <input className="w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" placeholder="Doctor Name" />
                        <input className="w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-1.5 text-[var(--text-muted)] outline-none" type="date" />
                      </div>

                       <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-3 font-semibold text-black transition-all hover:brightness-110">
                        Start Automation <Clock size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Active List */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
                       <h2 className="text-lg font-bold mb-4">Active Compliance Tracks</h2>
                       <div className="space-y-4">
                         {/* Mock adherence card */}
                         <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4 relative">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-bold text-sm">Rahul Sharma</h3>
                                <p className="text-xs text-[var(--text-secondary)]">Amoxicillin 250mg • 2x/Day</p>
                              </div>
                              <span className="text-[10px] bg-[var(--accent-dim)] text-[var(--accent)] px-2 py-0.5 rounded-full font-bold">85% Compliant</span>
                            </div>
                            <div className="h-1.5 w-full bg-[var(--border-subtle)] rounded-full overflow-hidden mb-3"><div className="h-full bg-[var(--accent)] w-[85%]" /></div>
                            <div className="flex gap-2">
                               <button className="flex-1 text-[11px] font-medium py-1.5 border border-[var(--accent)] text-[var(--accent)] rounded hover:bg-[var(--accent-dim)] transition-colors">Mark Log. Taken</button>
                               <button className="flex-1 text-[11px] font-medium py-1.5 border border-[var(--danger)] text-[var(--danger)] rounded hover:bg-[var(--danger-dim)] transition-colors">Mark Log. Missed</button>
                            </div>
                         </div>
                       </div>
                    </div>

                    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
                       <h2 className="text-lg font-bold mb-4">Upcoming Follow-Ups</h2>
                       <div className="overflow-x-auto">
                         <table className="w-full text-left text-sm whitespace-nowrap">
                           <thead className="text-[10px] uppercase text-[var(--text-secondary)] border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                             <tr>
                               <th className="px-4 py-2 font-medium">Patient</th>
                               <th className="px-4 py-2 font-medium">Doctor</th>
                               <th className="px-4 py-2 font-medium">Date</th>
                               <th className="px-4 py-2 font-medium">Action</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-[var(--border-subtle)] text-[13px]">
                             <tr className="hover:bg-[var(--bg-elevated)] transition-colors text-[var(--text-muted)] text-center">
                               <td colSpan={4} className="py-6">No scheduled follow-ups pending.</td>
                             </tr>
                           </tbody>
                         </table>
                       </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Profit and Settings empty tabs for completion */}
            {(activeTab === "profit" || activeTab === "settings") && (
              <div className="flex h-64 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
                <span className="text-[var(--text-muted)] text-sm">This module is under construction.</span>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  );
}
