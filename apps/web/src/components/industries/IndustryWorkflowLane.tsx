import { ArrowRight, GitBranch, PhoneCall } from "lucide-react";
import type { MultiPromptWorkflowTemplate } from "@/components/voice-agents/template-data";
import type { IndustryWorkflowSummary } from "@/types/industry-experience";

interface IndustryWorkflowLaneProps {
  workflowSummary: IndustryWorkflowSummary;
  workflow?: MultiPromptWorkflowTemplate | null;
}

export function IndustryWorkflowLane({
  workflowSummary,
  workflow,
}: IndustryWorkflowLaneProps) {
  const specialists = workflow?.specialists.filter((item) => item.enabled) ?? [];

  return (
    <div className="rounded-3xl border border-[#dbe4f0] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
            Workflow Summary
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#0a192f]">
            {workflowSummary.headline}
          </h3>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-[#64748b]">
          {workflowSummary.description}
        </p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[0.85fr_auto_1.15fr] lg:items-stretch">
        <div className="rounded-2xl border border-[#dbe4f0] bg-[#f8fafc] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0a192f] text-white">
              <PhoneCall size={16} />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#0a192f]">Front Desk Layer</div>
              <div className="text-xs text-[#64748b]">
                {workflow?.frontDesk.responseStyle || "Structured intake"}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {(workflow?.frontDesk.steps.slice(0, 4) || workflowSummary.automationMoments).map(
              (step) => (
                <div key={step} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#2563eb]" />
                  <p className="text-sm leading-relaxed text-[#475569]">{step}</p>
                </div>
              )
            )}
          </div>
        </div>

        <div className="flex items-center justify-center text-[#94a3b8]">
          <div className="flex flex-col items-center gap-2 rounded-full border border-[#dbe4f0] px-4 py-3">
            <GitBranch size={16} />
            <ArrowRight size={16} className="hidden lg:block" />
          </div>
        </div>

        <div className="rounded-2xl border border-[#dbe4f0] bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-[#0a192f]">
                Specialist Routing
              </div>
              <div className="text-xs text-[#64748b]">
                {specialists.length > 0
                  ? `${specialists.length} enabled specialist paths`
                  : "Blueprint summary without explicit specialists"}
              </div>
            </div>
            {workflow?.router?.fallbackAgent ? (
              <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-medium text-[#4338ca]">
                Fallback: {workflow.router.fallbackAgent}
              </span>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {specialists.length > 0
              ? specialists.map((specialist) => (
                  <div
                    key={specialist.id}
                    className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4"
                  >
                    <div className="text-sm font-semibold text-[#0a192f]">
                      {specialist.label}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[#64748b]">
                      {specialist.summary}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {specialist.triggerIntents.slice(0, 2).map((intent) => (
                        <span
                          key={intent}
                          className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[#475569]"
                        >
                          {intent}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              : workflowSummary.automationMoments.map((moment) => (
                  <div
                    key={moment}
                    className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4"
                  >
                    <div className="text-sm font-semibold text-[#0a192f]">
                      Automation moment
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[#64748b]">{moment}</p>
                  </div>
                ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {workflowSummary.automationMoments.map((moment) => (
          <div
            key={moment}
            className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm text-[#475569]"
          >
            {moment}
          </div>
        ))}
      </div>
    </div>
  );
}
