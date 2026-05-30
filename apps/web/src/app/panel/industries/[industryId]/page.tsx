"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  ChevronLeft,
  MessageSquareText,
  Phone,
  PlugZap,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { getIndustryWorkflow } from "@/components/voice-agents/template-data";
import { IndustryCapabilityMatrix } from "@/components/industries/IndustryCapabilityMatrix";
import { IndustryComplianceBadges } from "@/components/industries/IndustryComplianceBadges";
import { IndustryHeroStats } from "@/components/industries/IndustryHeroStats";
import { IndustryKpiStrip } from "@/components/industries/IndustryKpiStrip";
import { IndustryLaunchChecklist } from "@/components/industries/IndustryLaunchChecklist";
import { IndustryWorkflowLane } from "@/components/industries/IndustryWorkflowLane";
import { INDUSTRY_CONFIGS } from "@/data/auto-config";
import { getIndustryBlueprint } from "@/data/industry-experience";
import { industries } from "@/data/industries";
import { sampleConversations } from "@/data/sample-conversations";
import { industryBundles } from "@/data/template-bundles";

const WORKFLOW_MAP: Record<string, string> = {
  dental: "healthcare",
  salon: "hospitality",
  hvac: "logistics",
  restaurant: "hospitality",
  realestate: "realestate",
  legal: "financial",
  gym: "healthcare",
  vet: "healthcare",
  autorepair: "automotive",
  insurance: "financial",
  education: "education",
  logistics: "logistics",
};

const READINESS_STYLES = {
  ready: "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]",
  guided: "border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]",
  custom: "border-[#dbe4f0] bg-[#f8fafc] text-[#475569]",
} as const;

export default function IndustryBlueprintPage() {
  const params = useParams();
  const router = useRouter();
  const industryId = params.industryId as string;

  const industry = industries.find((item) => item.id === industryId);
  const config = INDUSTRY_CONFIGS[industryId];
  const bundle = industryBundles[industryId];
  const blueprint = getIndustryBlueprint(industryId);
  const workflowKey = WORKFLOW_MAP[industryId];
  const workflow = workflowKey ? getIndustryWorkflow(workflowKey) : null;
  const conversation = sampleConversations[industryId] ?? [];

  if (!industry || !config || !bundle || !blueprint) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8fafc] px-6 text-center">
        <div className="text-5xl">🏭</div>
        <h1 className="mt-5 text-2xl font-semibold text-[#0a192f]">
          Industry blueprint not found
        </h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-[#64748b]">
          The selected industry is missing its blueprint data. Go back to the
          industry catalog and choose another workspace.
        </p>
        <button
          type="button"
          onClick={() => router.push("/panel/industries")}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#dbe4f0] bg-white px-5 py-2.5 text-sm font-semibold text-[#0a192f]"
        >
          <ChevronLeft size={16} />
          Back to catalog
        </button>
      </div>
    );
  }

  const readinessClass = READINESS_STYLES[blueprint.workflowReadiness.tone];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="sticky top-16 z-30 border-b border-[#e2e8f0] bg-white/85 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4 lg:px-12">
          <button
            type="button"
            onClick={() => router.push("/panel/industries")}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#64748b] transition-colors hover:text-[#0a192f]"
          >
            <ChevronLeft size={16} />
            Back to all industries
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-10 px-6 py-8 lg:px-12">
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="overflow-hidden rounded-[32px] border border-[#dbe4f0] bg-white shadow-sm"
          >
            <div
              className="border-b border-white/10 p-7 text-white"
              style={{ background: industry.iconBg }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-black/15 text-3xl backdrop-blur">
                    {industry.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
                      Industry Blueprint
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                      {industry.name}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80">
                      {blueprint.heroOutcome}
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${readinessClass}`}
                >
                  {blueprint.workflowReadiness.label}
                </span>
              </div>

              <p className="mt-6 max-w-3xl text-sm leading-relaxed text-white/85">
                {blueprint.heroDetail}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {blueprint.activeChannels.map((channel) => (
                  <span
                    key={channel}
                    className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white"
                  >
                    {channel}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-5 p-7 md:grid-cols-2">
              <div className="rounded-3xl border border-[#e2e8f0] bg-[#f8fafc] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
                  Outcome
                </p>
                <p className="mt-3 text-base font-semibold leading-relaxed text-[#0a192f]">
                  {blueprint.heroOutcome}
                </p>
              </div>

              <div className="rounded-3xl border border-[#e2e8f0] bg-[#f8fafc] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
                  Workflow Readiness
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#475569]">
                  {blueprint.workflowReadiness.note}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-[#e2e8f0] p-7">
              <button
                type="button"
                onClick={() => router.push(`/panel/industries/${industryId}/build`)}
                className="inline-flex items-center gap-2 rounded-full bg-[#0a192f] px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                Build this workspace
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => router.push(`/panel/industries/${industryId}/workspace`)}
                className="inline-flex items-center gap-2 rounded-full border border-[#dbe4f0] bg-white px-5 py-3 text-sm font-semibold text-[#0a192f]"
              >
                Open existing dashboard
              </button>
            </div>
          </motion.div>

          <IndustryHeroStats items={blueprint.heroStats} />
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
              Capability Matrix
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#0a192f]">
              What the industry section now exposes before build
            </h2>
          </div>
          <IndustryCapabilityMatrix modules={blueprint.capabilityModules} />
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
              Voice / Chat Preview
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#0a192f]">
              Seeded conversations and knowledge surfaces
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[32px] border border-[#dbe4f0] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#2563eb]">
                  <Phone size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#0a192f]">
                    Voice journey preview
                  </div>
                  <div className="text-xs text-[#64748b]">
                    Greeting, qualification, and next-step handoff
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-3xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
                <p className="text-sm leading-relaxed text-[#475569]">
                  {config.greeting}
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {conversation.slice(0, 4).map((message, index) => (
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
                    Chat and knowledge preview
                  </div>
                  <div className="text-xs text-[#64748b]">
                    Sample FAQs and seeded knowledge topics for the widget
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-[28px] border border-[#e2e8f0] bg-[#f8fafc] p-5">
                <div className="flex items-center gap-3 border-b border-[#e2e8f0] pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0a192f] text-white">
                    🤖
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#0a192f]">
                      {industry.name} Assistant
                    </div>
                    <div className="text-xs text-[#64748b]">Online and blueprint-seeded</div>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  {config.sampleFAQs.slice(0, 3).map((faq) => (
                    <div key={faq.question} className="rounded-2xl bg-white p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">
                        <MessageSquareText size={14} />
                        FAQ Prompt
                      </div>
                      <p className="mt-2 text-sm font-medium text-[#0a192f]">
                        {faq.question}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-[#64748b]">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {config.knowledgeBaseTopics.slice(0, 4).map((topic) => (
                    <span
                      key={topic}
                      className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#475569]"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
              Agentic Workflow
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#0a192f]">
              Multi-step orchestration before you launch
            </h2>
          </div>
          <IndustryWorkflowLane
            workflow={workflow}
            workflowSummary={blueprint.workflowSummary}
          />
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
              Analytics &amp; ROI
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#0a192f]">
              Static rollout metrics for the industry blueprint
            </h2>
          </div>

          <IndustryKpiStrip items={blueprint.kpiSnapshot} />

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[32px] border border-[#dbe4f0] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#2563eb]">
                  <Workflow size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#0a192f]">
                    Blueprint scope
                  </div>
                  <div className="text-xs text-[#64748b]">
                    These numbers are presentation-only rollout guidance
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#f8fafc] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">
                    Businesses modeled
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-[#0a192f]">
                    {industry.businesses}
                  </div>
                </div>
                <div className="rounded-2xl bg-[#f8fafc] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">
                    Monthly call load
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-[#0a192f]">
                    {industry.callsPerMonth}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-[#dbe4f0] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#4338ca]">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#0a192f]">
                    What this blueprint already packages
                  </div>
                  <div className="text-xs text-[#64748b]">
                    No new backend contract is required for this redesign
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4 text-sm text-[#475569]">
                  {bundle.voiceTemplateIds.length} voice flows and {bundle.chatTemplateIds.length} chat flows are already selected for this industry.
                </div>
                <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4 text-sm text-[#475569]">
                  The blueprint keeps analytics static here and leaves live workspace analytics untouched.
                </div>
                <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4 text-sm text-[#475569]">
                  Existing workspace and medicine routes stay operational after this catalog-to-build reroute.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
              Governance &amp; Compliance
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#0a192f]">
              Readiness notes before traffic reaches the workspace
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <IndustryComplianceBadges items={blueprint.complianceBadges} />

            <div className="rounded-[32px] border border-[#dbe4f0] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f8fafc] text-[#0a192f]">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#0a192f]">
                    Industry guardrails
                  </div>
                  <div className="text-xs text-[#64748b]">
                    The redesign exposes review points without changing backend governance
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-[#f8fafc] p-4 text-sm leading-relaxed text-[#475569]">
                  {config.systemPrompt.split("\n").slice(0, 4).join(" ")}
                </div>
                <div className="rounded-2xl border border-dashed border-[#dbe4f0] p-4 text-sm leading-relaxed text-[#64748b]">
                  Launch reviewers should confirm disclosures, escalation language,
                  and any industry-specific claims before enabling production traffic.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
              Integrations
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#0a192f]">
              Priority connections surfaced in the blueprint
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[32px] border border-[#dbe4f0] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#2563eb]">
                  <PlugZap size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#0a192f]">
                    Recommended integrations
                  </div>
                  <div className="text-xs text-[#64748b]">
                    Directly reused from the existing industry bundle
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {bundle.recommendedIntegrations.map((integration) => (
                  <div
                    key={integration}
                    className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4"
                  >
                    <div className="text-sm font-semibold text-[#0a192f]">
                      {integration}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[#64748b]">
                      Included as a priority connection in the build checklist.
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-[#dbe4f0] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#4338ca]">
                  <PlugZap size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#0a192f]">
                    Why these integrations matter
                  </div>
                  <div className="text-xs text-[#64748b]">
                    Industry-specific connection priorities surfaced before build
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {blueprint.integrationsFocus.map((focus) => (
                  <div
                    key={focus}
                    className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4 text-sm text-[#475569]"
                  >
                    {focus}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
              Launch CTA
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#0a192f]">
              Move from blueprint review into the existing build wizard
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <IndustryLaunchChecklist items={blueprint.launchChecklist} />

            <div className="rounded-[32px] border border-[#dbe4f0] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0a192f] text-white">
                  <Workflow size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#0a192f]">
                    Next step
                  </div>
                  <div className="text-xs text-[#64748b]">
                    The build wizard keeps the same workspace creation request
                  </div>
                </div>
              </div>

              <p className="mt-5 text-sm leading-relaxed text-[#475569]">
                Review the checklist, then move into the five-step industry build
                flow. The final route still opens the existing workspace page, so
                no downstream workspace or settings screens are changed.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => router.push(`/panel/industries/${industryId}/build`)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0a192f] px-5 py-3 text-sm font-semibold text-white"
                >
                  Continue to build wizard
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/panel/industries/${industryId}/workspace`)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#dbe4f0] bg-white px-5 py-3 text-sm font-semibold text-[#0a192f]"
                >
                  Open existing workspace
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
