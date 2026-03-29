"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface TemplateToggleProps {
  icon: string;
  name: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  accentColor?: string;
}

export function TemplateToggle({
  icon,
  name,
  description,
  enabled,
  onToggle,
  accentColor = "var(--color-accent)",
}: TemplateToggleProps) {
  return (
    <motion.div
      layout
      className="group flex items-center gap-3.5 rounded-xl border border-[#e2e8f0] bg-white p-4 transition-all duration-300 hover:border-[#0a192f]/30 hover:shadow-md hover:shadow-[#0a192f]/5"
    >
      {/* Icon Container */}
      <motion.div
        animate={{
          backgroundColor: enabled ? "rgba(10, 25, 47, 0.08)" : "#f8fafc",
          borderColor: enabled ? "rgba(10, 25, 47, 0.2)" : "#e2e8f0",
        }}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg transition-all duration-300"
        style={{
          border: '1px solid',
        }}
      >
        {icon}
      </motion.div>

      {/* Text Content */}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-[#0a192f]">{name}</div>
        <div className="truncate text-xs text-[#64748b]">{description}</div>
      </div>

      {/* Toggle Switch */}
      <motion.button
        onClick={onToggle}
        className={cn(
          "relative h-[24px] w-[44px] shrink-0 rounded-full transition-colors duration-300",
          enabled ? "bg-[#0a192f]" : "bg-[#e2e8f0]"
        )}
        whileTap={{ scale: 0.95 }}
      >
        <motion.span
          layout
          animate={{
            left: enabled ? "22px" : "3px",
            backgroundColor: enabled ? "#ffffff" : "#ffffff",
          }}
          className="absolute top-[3px] h-[18px] w-[18px] rounded-full shadow-md"
        />
      </motion.button>
    </motion.div>
  );
}
