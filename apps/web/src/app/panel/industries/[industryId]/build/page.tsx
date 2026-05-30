"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Check,
  ChevronLeft,
  Loader2,
  Phone,
  PlugZap,
  Sparkles,
  Workflow,
} from "lucide-react";
import { buildProxyUrl } from "@/lib/backend-url";
import { cn } from "@/lib/utils";
import { IndustryHeroStats } from "@/components/industries/IndustryHeroStats";
import { IndustryLaunchChecklist } from "@/components/industries/IndustryLaunchChecklist";
import { INDUSTRY_CONFIGS } from "@/data/auto-config";
import { getIndustryBlueprint } from "@/data/industry-experience";
import { industries } from "@/data/industries";
import { sampleConversations } from "@/data/sample-conversations";
import { industryBundles } from "@/data/template-bundles";

const STEP_TITLES = [
  "Business Profile",
  "Provisioning",
  "Integrations",
  "Test Previews",
  "Launch Summary",
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

  const industry = industries.find((item) => item.id === industryId);
  const config = INDUSTRY_CONFIGS[industryId];
  const bundle = industryBundles[industryId];
  const blueprint = getIndustryBlueprint(industryId);
  const conversation = sampleConversations[industryId] ?? [];

  const provisioningTasks = useMemo(() => {
    if (!bundle || !config || !blueprint) {
      return [];
    }

    return [
      `Provisioning ${bundle.voiceTemplateIds.length} voice flows and ${bundle.chatTemplateIds.length} chat flows`,
      `Applying ${config.agentName}'s greeting, language, and persona defaults`,
      `Seeding ${config.knowledgeBaseTopics.length} knowledge topics and sample FAQs`,
      `Preparing ${bundle.recommendedIntegrations.length} integration checkpoints`,
      `Configuring ${blueprint.workflowSummary.automationMoments.length} workflow automation moments`,
    ];
  }, [blueprint, bundle, config]);

  useEffect(() => {
    if (step !== 2 || provisioningTasks.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      setActiveTask((previous) => {
        if (previous >= provisioningTasks.length - 1) {
          clearInterval(interval);
          setTimeout(() => setStep(3), 650);
          return previous;
        }

        return previous + 1;
      });
    }, 850);

    return () => clearInterval(interval);
  }, [provisioningTasks.length, step]);

  const handleCreateWorkspace = async () => {
    try {
      await fetch(buildProxyUrl("/api/workspace/create"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industryId,
          businessName: formData.businessName,
          phone: formData.phone,
          timezone: formData.timezone,
        }),
      });
    } catch (error) {
      console.error("Failed to create workspace in backend", error);
    }

    setActiveTask(0);
    setStep(2);
  };

  if (!industry || !config || !bundle || !blueprint) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-6">
        <div className="text-center">
          <div className="text-5xl">🏗️</div>
          <h1 className="mt-5 text-2xl font-semibold text-[#0a192f]">
            Industry build data not found
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-[#64748b]">
            Go back to the blueprint page and choose a valid industry workspace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] px-6 py-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => router.push(`/panel/industries/${industryId}`)}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#64748b] transition-colors hover:text-[#0a192f]"
        >
          <ChevronLeft size={16} />
          Back to blueprint
        </button>

        <div className="mt-6 rounded-[36px] border border-[#dbe4f0] bg-white shadow-sm">
          <div className="border-b border-[#e2e8f0] px-6 py-6 lg:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-[24px] text-3xl shadow-lg"
                  style={{ background: industry.iconBg }}
                >
                  {industry.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
                    Industry Build Wizard
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#0a192f]">
                    {industry.name}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748b]">
                    The build flow now mirrors the blueprint review: business profile,
                    provisioning, integrations, test previews, and launch summary.
                  </p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-5">
                {STEP_TITLES.map((title, index) => {
                  const current = index + 1;
                  const active = current <= step;

                  return (
                    <div key={title} className="min-w-[100px]">
                      <div
                        className={cn(
                          "h-1.5 rounded-full transition-colors",
                          active ? "bg-[#0a192f]" : "bg-[#e2e8f0]"
                        )}
                      />
                      <div
                        className={cn(
                          "mt-2 text-xs font-medium",
                          active ? "text-[#0a192f]" : "text-[#94a3b8]"
                        )}
                      >
                        {title}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="px-6 py-8 lg:px-8"
          >
            {step === 1 && (
              <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
                      Step 1
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-[#0a192f]">
                      Business profile
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#64748b]">
                      Keep the existing workspace creation request, but package it
                      inside the redesigned industry onboarding flow.
                    </p>
                  </div>

                  <div className="space-y-4 rounded-[28px] border border-[#dbe4f0] bg-[#f8fafc] p-5">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#0a192f]">
                        Business name
                      </label>
                      <input
                        type="text"
                        value={formData.businessName}
                        onChange={(event) =>
                          setFormData((previous) => ({
                            ...previous,
                            businessName: event.target.value,
                          }))
                        }
                        placeholder={`e.g. Sunrise ${industry.name}`}
                        className="w-full rounded-2xl border border-[#dbe4f0] bg-white px-4 py-3 text-sm text-[#0a192f] outline-none transition-colors focus:border-[#0a192f]"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#0a192f]">
                        Business phone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(event) =>
                          setFormData((previous) => ({
                            ...previous,
                            phone: event.target.value,
                          }))
                        }
                        placeholder="+91..."
                        className="w-full rounded-2xl border border-[#dbe4f0] bg-white px-4 py-3 text-sm text-[#0a192f] outline-none transition-colors focus:border-[#0a192f]"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#0a192f]">
                        Timezone
                      </label>
                      <select
                        value={formData.timezone}
                        onChange={(event) =>
                          setFormData((previous) => ({
                            ...previous,
                            timezone: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-[#dbe4f0] bg-white px-4 py-3 text-sm text-[#0a192f] outline-none transition-colors focus:border-[#0a192f]"
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="US/Eastern">US/Eastern</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateWorkspace}
                    disabled={!formData.businessName || !formData.phone}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0a192f] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Start provisioning
                    <ArrowRight size={16} />
                  </button>
                </div>

                <div className="space-y-6">
                  <IndustryHeroStats items={blueprint.heroStats} />
                  <IndustryLaunchChecklist items={blueprint.launchChecklist.slice(0, 3)} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
                      Step 2
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-[#0a192f]">
                      Provisioning progress
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#64748b]">
                      The provisioning step mirrors the blueprint sections instead of
                      the older generic setup copy.
                    </p>
                  </div>

                  <div className="space-y-4 rounded-[28px] border border-[#dbe4f0] bg-[#f8fafc] p-5">
                    {provisioningTasks.map((task, index) => (
                      <div key={task} className="flex items-start gap-4">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                          {index < activeTask ? (
                            <Check size={18} className="text-[#15803d]" />
                          ) : index === activeTask ? (
                            <Loader2 size={18} className="animate-spin text-[#0a192f]" />
                          ) : (
                            <div className="h-2.5 w-2.5 rounded-full bg-[#cbd5e1]" />
                          )}
                        </div>
                        <p
                          className={cn(
                            "text-sm leading-relaxed",
                            index <= activeTask ? "text-[#0a192f]" : "text-[#64748b]"
                          )}
                        >
                          {task}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[32px] border border-[#dbe4f0] bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#4338ca]">
                      <Workflow size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#0a192f]">
                        Blueprint context applied
                      </div>
                      <div className="text-xs text-[#64748b]">
                        This step packages the new industry review into setup tasks
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {blueprint.capabilityModules.map((module) => (
                      <div
                        key={module.id}
                        className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4"
                      >
                        <div className="text-sm font-semibold text-[#0a192f]">
                          {module.title}
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-[#64748b]">
                          {module.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
                    Step 3
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-[#0a192f]">
                    Integration checklist
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#64748b]">
                    Recommended integrations stay the same, but the build flow now
                    explains why each connection matters for this industry.
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {bundle.recommendedIntegrations.map((integration, index) => (
                    <div
                      key={integration}
                      className="rounded-[28px] border border-[#dbe4f0] bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#2563eb]">
                            <PlugZap size={18} />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[#0a192f]">
                              {integration}
                            </div>
                            <div className="text-xs text-[#64748b]">
                              {blueprint.integrationsFocus[index % blueprint.integrationsFocus.length]}
                            </div>
                          </div>
                        </div>
                        <span className="rounded-full bg-[#f0fdf4] px-3 py-1 text-xs font-semibold text-[#15803d]">
                          required
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#0a192f] px-5 py-3 text-sm font-semibold text-white"
                >
                  Continue to test previews
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
                    Step 4
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-[#0a192f]">
                    Test previews
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#64748b]">
                    Preview the seeded voice and chat experience before you move into
                    the final launch summary.
                  </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-[32px] border border-[#dbe4f0] bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#2563eb]">
                        <Phone size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#0a192f]">
                          Voice preview
                        </div>
                        <div className="text-xs text-[#64748b]">
                          Greeting and first-turn handling
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-3xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
                      <p className="text-sm leading-relaxed text-[#475569]">
                        {config.greeting}
                      </p>
                    </div>

                    <div className="mt-5 space-y-3">
                      {conversation.slice(0, 3).map((message, index) => (
                        <div
                          key={`${message.role}-${index}`}
                          className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            message.role === "agent"
                              ? "rounded-bl-md bg-[#f8fafc] text-[#0a192f]"
                              : "ml-auto rounded-br-md bg-[#0a192f] text-white"
                          }`}
                        >
                          {message.text}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[32px] border border-[#dbe4f0] bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#4338ca]">
                        <Bot size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#0a192f]">
                          Chat preview
                        </div>
                        <div className="text-xs text-[#64748b]">
                          Knowledge-driven widget checks
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      {config.sampleFAQs.slice(0, 3).map((faq) => (
                        <div key={faq.question} className="rounded-2xl bg-[#f8fafc] p-4">
                          <div className="text-sm font-semibold text-[#0a192f]">
                            {faq.question}
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-[#64748b]">
                            {faq.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#0a192f] px-5 py-3 text-sm font-semibold text-white"
                >
                  Open launch summary
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {step === 5 && (
              <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-6">
                  <div className="rounded-[32px] border border-[#dbe4f0] bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0a192f] text-white">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
                          Step 5
                        </p>
                        <h2 className="mt-1 text-2xl font-semibold text-[#0a192f]">
                          Launch summary
                        </h2>
                      </div>
                    </div>

                    <p className="mt-5 text-sm leading-relaxed text-[#475569]">
                      Your industry build is provisioned inside the redesigned flow.
                      The next action still opens the existing workspace route, so no
                      downstream workspace screens are changed by this pass.
                    </p>

                    <div className="mt-6">
                      <IndustryHeroStats items={blueprint.heroStats} />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push(`/panel/industries/${industryId}/workspace`)}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0a192f] px-5 py-3 text-sm font-semibold text-white"
                  >
                    Open existing workspace
                    <ArrowRight size={16} />
                  </button>
                </div>

                <IndustryLaunchChecklist items={blueprint.launchChecklist} />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
