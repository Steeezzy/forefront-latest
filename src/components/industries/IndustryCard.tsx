"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronRight, Zap, Users, Bot, Phone } from "lucide-react";
import type { Industry } from "@/types";

interface IndustryCardProps {
  industry: Industry;
  delay?: number;
}

export function IndustryCard({ industry, delay = 0 }: IndustryCardProps) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={() => router.push(`/panel/industries/${industry.id}/build`)}
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-[#e2e8f0] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#0a192f]/30 hover:shadow-xl hover:shadow-[#0a192f]/8"
    >
      {/* Top accent line that slides in on hover */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.3 }}
        className="absolute left-0 right-0 top-0 h-0.5 bg-gradient-to-r from-[#0a192f] to-[#3b82f6] origin-left"
      />

      {/* Arrow */}
      <motion.div
        initial={{ x: 0 }}
        whileHover={{ x: 4 }}
        transition={{ duration: 0.2 }}
        className="absolute right-5 top-6 text-[#94a3b8] group-hover:text-[#0a192f]"
      >
        <ChevronRight size={18} />
      </motion.div>

      {/* Header */}
      <div className="mb-4 flex items-start gap-3.5">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl"
          style={{ background: industry.iconBg }}
        >
          {industry.icon}
        </motion.div>
        <div>
          <h3 className="text-[15px] font-semibold text-[#0a192f]">{industry.name}</h3>
          <div className="text-[12px] text-[#64748b] font-medium">{industry.subtitle}</div>
        </div>
      </div>

      {/* Tagline */}
      <p className="mb-4 line-clamp-2 text-[13px] leading-relaxed text-[#64748b]">
        {industry.tagline}
      </p>

      {/* Stats */}
      <div className="mb-4 flex gap-4 text-xs">
        <div className="flex items-center gap-1.5 text-[#64748b]">
          <div className="flex items-center gap-1">
            <Phone size={12} className="text-[#0a192f]" />
            <span className="font-medium">{industry.voiceTemplates}</span>
          </div>
          <span className="text-[#94a3b8]">voice</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#64748b]">
          <div className="flex items-center gap-1">
            <Bot size={12} className="text-[#3b82f6]" />
            <span className="font-medium">{industry.chatTemplates}</span>
          </div>
          <span className="text-[#94a3b8]">chat</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#64748b]">
          <div className="flex items-center gap-1">
            <Users size={12} className="text-[#10b981]" />
            <span className="font-medium">{industry.businesses}</span>
          </div>
          <span className="text-[#94a3b8]">businesses</span>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {industry.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-[#f8fafc] px-2.5 py-1 text-[10.5px] font-medium text-[#64748b] border border-[#e2e8f0]"
          >
            {tag}
          </span>
        ))}
        {industry.tags.length > 3 && (
          <span className="rounded-full bg-[#f8fafc] px-2.5 py-1 text-[10.5px] font-medium text-[#94a3b8] border border-[#e2e8f0]">
            +{industry.tags.length - 3} more
          </span>
        )}
      </div>
    </motion.div>
  );
}
