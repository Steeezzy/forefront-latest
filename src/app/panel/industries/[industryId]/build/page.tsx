"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Loader2, ArrowRight, Sparkles, Phone, Bot } from "lucide-react";
import { industries } from "@/data/industries";
import { INDUSTRY_CONFIGS } from "@/data/auto-config";
import { industryBundles } from "@/data/template-bundles";
import { cn } from "@/lib/utils";
import { buildProxyUrl } from "@/lib/backend-url";

const SETUP_TASKS = [
  "Assigning templates...",
  "Configuring voice agent...",
  "Setting up chatbot...",
  "Writing greeting scripts...",
  "Seeding knowledge...",
  "Building flows...",
  "Setting up departments...",
  "Configuring analytics...",
];

export default function BuildWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const industryId = params.industryId as string;

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    businessName: "",
    phone: "",
    timezone: "Asia/Kolkata",
  });
  const [activeTask, setActiveTask] = useState(0);

  const industry = industries.find((i) => i.id === industryId);
  const config = INDUSTRY_CONFIGS[industryId];
  const bundle = industryBundles[industryId];

  useEffect(() => {
    if (step === 2) {
      const interval = setInterval(() => {
        setActiveTask((prev) => {
          if (prev >= SETUP_TASKS.length - 1) {
            clearInterval(interval);
            setTimeout(() => setStep(3), 600);
            return prev;
          }
          return prev + 1;
        });
      }, 800);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleCreateWorkspace = async () => {
    try {
      await fetch(buildProxyUrl("/api/workspace/create"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industryId,
          businessName: formData.businessName,
          phone: formData.phone,
        }),
      });
    } catch (error) {
      console.error("Failed to create workspace in backend", error);
    }
    setStep(2);
  };

  if (!industry || !config) return <div className="p-8 text-[var(--text-primary)]">Loading config...</div>;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6 lg:p-10 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-3xl">
        
        {/* Progress Bar */}
        <div className="mb-8 flex gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-500",
                s <= step ? "bg-[var(--accent)]" : "bg-[var(--border-default)]"
              )}
            />
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 shadow-2xl"
        >
          {/* STEP 1: INFO */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-b border-[var(--border-subtle)] pb-6">
                <div 
                  className="flex h-14 w-14 items-center justify-center rounded-xl text-3xl shadow-lg"
                  style={{ background: industry.iconBg }}
                >
                  {industry.icon}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[var(--text-primary)]">Build {industry.name} Workspace</h1>
                  <p className="text-[var(--text-secondary)]">Let's set up your automated agents.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Business Name</label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                    placeholder="e.g. Sunrise Clinic"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Business Phone</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                    placeholder="+91..."
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Timezone</label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="US/Eastern">US/Eastern</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleCreateWorkspace}
                disabled={!formData.businessName || !formData.phone}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3.5 font-semibold text-black transition-all hover:brightness-110 disabled:opacity-50"
              >
                Start Auto-Setup <Sparkles size={18} />
              </button>
            </div>
          )}

          {/* STEP 2: AUTO-SETUP */}
          {step === 2 && (
            <div className="space-y-6 py-4">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Building your AI Agents</h2>
                <p className="text-[var(--text-secondary)] text-sm mt-1">Applying {industry.name} blueprints...</p>
              </div>

              <div className="space-y-4">
                {SETUP_TASKS.map((task, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                      {i < activeTask ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-[var(--accent)]">
                          <Check size={20} />
                        </motion.div>
                      ) : i === activeTask ? (
                        <Loader2 size={18} className="animate-spin text-[var(--text-primary)]" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-[var(--border-default)]" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-sm font-medium transition-colors",
                        i < activeTask ? "text-[var(--text-primary)]" : i === activeTask ? "text-[var(--text-primary)] animate-pulse" : "text-[var(--text-muted)]"
                      )}
                    >
                      {task}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: CONNECT */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Connect Tools</h2>
              <p className="text-[var(--text-secondary)] text-sm mb-6">Required integrations for {industry.name}</p>

              <div className="grid grid-cols-2 gap-4">
                {bundle?.recommendedIntegrations.map((integration, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-card)] text-xl">
                        {integration.includes("HubSpot") ? "🏢" : integration.includes("Calendar") ? "📅" : integration.includes("Stripe") ? "💰" : "🔌"}
                      </div>
                      <span className="text-sm font-medium text-[var(--text-primary)]">{integration}</span>
                    </div>
                    <Check size={18} className="text-[var(--accent)]" />
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep(4)}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3.5 font-semibold text-black transition-all hover:brightness-110"
              >
                Continue to Testing <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* STEP 4: TEST */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Test Your Agents</h2>
              <p className="text-[var(--text-secondary)] text-sm mb-6">Your agents are localized for {config.language}.</p>

              <div className="grid grid-cols-2 gap-6">
                <div className="rounded-xl border border-[var(--voice-dim)] bg-[var(--bg-elevated)] p-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--voice-dim)] text-[var(--voice)]">
                    <Phone size={28} />
                  </div>
                  <h3 className="mb-2 font-bold text-[var(--text-primary)]">Call {config.agentName}</h3>
                  <p className="mb-6 text-xs text-[var(--text-secondary)]">Test the voice assistant.</p>
                  <button className="w-full rounded-lg bg-[var(--voice)] py-2 text-sm font-semibold text-white hover:brightness-110">
                    Initiate Test Call
                  </button>
                </div>

                <div className="rounded-xl border border-[var(--chat-dim)] bg-[var(--bg-elevated)] p-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--chat-dim)] text-[var(--chat)]">
                    <Bot size={28} />
                  </div>
                  <h3 className="mb-2 font-bold text-[var(--text-primary)]">Chat Preview</h3>
                  <p className="mb-6 text-xs text-[var(--text-secondary)]">Test the web widget.</p>
                  <button className="w-full rounded-lg bg-[var(--chat)] py-2 text-sm font-semibold text-white hover:brightness-110">
                    Open Chat
                  </button>
                </div>
              </div>

              <button
                onClick={() => setStep(5)}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3.5 font-semibold text-black transition-all hover:brightness-110"
              >
                Finalize Workspace <Check size={18} />
              </button>
            </div>
          )}

          {/* STEP 5: LIVE */}
          {step === 5 && (
            <div className="space-y-6 text-center py-6">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent-dim)] text-[var(--accent)]">
                <Sparkles size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">Workspace Live!</h2>
                <p className="mt-2 text-[var(--text-secondary)]">
                  Your automated {industry.name} suite is ready.
                </p>
              </div>

              <div className="mx-auto grid max-w-sm grid-cols-2 gap-4 py-6">
                <div className="rounded-xl bg-[var(--bg-elevated)] p-4 border border-[var(--border-subtle)]">
                  <div className="text-xl font-bold text-[var(--text-primary)] font-mono">{industry.voiceTemplates}</div>
                  <div className="text-xs text-[var(--text-secondary)]">Voice Flows</div>
                </div>
                <div className="rounded-xl bg-[var(--bg-elevated)] p-4 border border-[var(--border-subtle)]">
                  <div className="text-xl font-bold text-[var(--text-primary)] font-mono">{industry.chatTemplates}</div>
                  <div className="text-xs text-[var(--text-secondary)]">Chat Flows</div>
                </div>
              </div>

              <button
                onClick={() => router.push(`/panel/industries/${industryId}/workspace`)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3.5 font-semibold text-black transition-all hover:brightness-110"
              >
                Open Dashboard <ArrowRight size={18} />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
