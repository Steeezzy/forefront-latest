"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Bot, Network, Phone, PlugZap } from "lucide-react";
import type { Industry } from "@/types";
import type { IndustryBlueprint } from "@/types/industry-experience";

interface IndustryCardProps {
  industry: Industry;
  blueprint: IndustryBlueprint;
  delay?: number;
}

const READINESS_STYLES = {
  ready: "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]",
  guided: "border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]",
  custom: "border-[#dbe4f0] bg-[#f8fafc] text-[#475569]",
} as const;

export function IndustryCard({
  industry,
  blueprint,
  delay = 0,
}: IndustryCardProps) {
  const router = useRouter();
  const readinessClass = READINESS_STYLES[blueprint.workflowReadiness.tone];

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={() => router.push(`/panel/industries/${industry.id}`)}
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-[#dbe4f0] bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[#0a192f]/20 hover:shadow-2xl hover:shadow-[#0a192f]/10"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0a192f] via-[#2563eb] to-[#38bdf8] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-lg"
            style={{ background: industry.iconBg }}
          >
            {industry.icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-[#0a192f]">
              {industry.name}
            </h3>
            <p className="mt-1 text-sm font-medium text-[#64748b]">
              {industry.subtitle}
            </p>
          </div>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${readinessClass}`}
        >
          {blueprint.workflowReadiness.label}
        </span>
      </div>

      <p className="mt-5 text-sm leading-relaxed text-[#475569]">
        {blueprint.heroOutcome}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5">
          <div className="flex items-center gap-2 text-[#0a192f]">
            <Phone size={14} />
            <span className="text-xs font-semibold uppercase tracking-[0.16em]">
              Voice
            </span>
          </div>
          <div className="mt-2 text-lg font-semibold text-[#0a192f]">
            {industry.voiceTemplates}
          </div>
          <p className="mt-1 text-xs text-[#64748b]">Seeded voice workflows</p>
        </div>

        <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5">
          <div className="flex items-center gap-2 text-[#0a192f]">
            <Bot size={14} />
            <span className="text-xs font-semibold uppercase tracking-[0.16em]">
              Chat
            </span>
          </div>
          <div className="mt-2 text-lg font-semibold text-[#0a192f]">
            {blueprint.activeChannels.length}
          </div>
          <p className="mt-1 text-xs text-[#64748b]">Active blueprint channels</p>
        </div>

        <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5">
          <div className="flex items-center gap-2 text-[#0a192f]">
            <PlugZap size={14} />
            <span className="text-xs font-semibold uppercase tracking-[0.16em]">
              Apps
            </span>
          </div>
          <div className="mt-2 text-lg font-semibold text-[#0a192f]">
            {industry.integrations.length}
          </div>
          <p className="mt-1 text-xs text-[#64748b]">Priority integrations</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {blueprint.activeChannels.slice(0, 4).map((channel) => (
          <span
            key={channel}
            className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-medium text-[#4338ca]"
          >
            {channel}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#2563eb] shadow-sm">
          <Network size={15} />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#0a192f]">
            {blueprint.capabilityModules[0]?.title}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[#64748b]">
            {blueprint.workflowReadiness.note}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4 border-t border-[#e2e8f0] pt-5">
        <div>
          <p className="text-sm font-semibold text-[#0a192f]">Explore Blueprint</p>
          <p className="mt-1 text-xs text-[#64748b]">
            Review capabilities, workflow, ROI, and launch plan
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0a192f] text-white transition-transform duration-300 group-hover:translate-x-1">
          <ArrowRight size={16} />
        </div>
      </div>
    </motion.button>
  );
}
