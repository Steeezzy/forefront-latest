"use client";

import { cn } from "@/lib/utils";
import { Play } from "lucide-react";
import { motion } from "framer-motion";
import type { Call } from "@/types";

interface CallLogTableProps {
  calls: Call[];
  showRecording?: boolean;
}

const outcomeStyles: Record<
  string,
  { bg: string; text: string; label: string; border: string }
> = {
  booked: { 
    bg: "bg-[#0a192f]/5", 
    text: "text-[#0a192f]", 
    border: "border-[#0a192f]/10",
    label: "✓ Booked" 
  },
  answered: { 
    bg: "bg-[#3b82f6]/5", 
    text: "text-[#3b82f6]", 
    border: "border-[#3b82f6]/10",
    label: "✓ Answered" 
  },
  missed: { 
    bg: "bg-[#ef4444]/5", 
    text: "text-[#ef4444]", 
    border: "border-[#ef4444]/10",
    label: "✕ Missed" 
  },
  transferred: { 
    bg: "bg-[#8b5cf6]/5", 
    text: "text-[#8b5cf6]", 
    border: "border-[#8b5cf6]/10",
    label: "→ Transferred" 
  },
};

export function CallLogTable({
  calls,
  showRecording = true,
}: CallLogTableProps) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-3 grid grid-cols-[2fr_1fr_1fr_1fr_50px] px-2 text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">
        <span>Caller</span>
        <span>Duration</span>
        <span>Outcome</span>
        <span>Time</span>
        <span />
      </div>

      {/* Rows */}
      {calls.map((call, index) => {
        const style = outcomeStyles[call.outcome] || outcomeStyles.answered;

        return (
          <motion.div
            key={call.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="group grid grid-cols-[2fr_1fr_1fr_1fr_50px] items-center border-b border-[#f1f5f9] px-2 py-3 transition-all hover:bg-[#f8fafc] last:border-0"
          >
            {/* Caller */}
            <div>
              <div className="text-[12.5px] font-semibold text-[#0a192f]">
                {call.callerName}
              </div>
              <div className="font-mono text-[10.5px] text-[#64748b]">
                {call.callerPhone}
              </div>
            </div>

            {/* Duration */}
            <span className="font-mono text-[12px] text-[#64748b]">
              {call.duration}
            </span>

            {/* Outcome */}
            <span
              className={cn(
                "inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold border",
                style.bg,
                style.text,
                style.border
              )}
            >
              {style.label}
            </span>

            {/* Time */}
            <span className="text-[11px] text-[#94a3b8]">
              {call.timestamp}
            </span>

            {/* Play */}
            {showRecording && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-[#e2e8f0] bg-white text-[#64748b] shadow-sm transition-all hover:border-[#0a192f] hover:text-[#0a192f]"
              >
                <Play size={10} />
              </motion.button>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
