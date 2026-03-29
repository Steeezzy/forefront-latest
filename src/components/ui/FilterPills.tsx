"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface FilterPill {
  label: string;
  value: string;
}

interface FilterPillsProps {
  options: FilterPill[];
  activeValue: string;
  onChange: (value: string) => void;
}

export function FilterPills({ options, activeValue, onChange }: FilterPillsProps) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((opt) => {
        const isActive = activeValue === opt.value;
        
        return (
          <motion.button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "relative px-5 py-2 rounded-full text-sm font-medium transition-all overflow-hidden",
              isActive
                ? "bg-[#0a192f] text-white shadow-lg shadow-[#0a192f]/20"
                : "bg-white border border-[#e2e8f0] text-[#64748b] hover:border-[#0a192f]/40 hover:text-[#0a192f]"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activePill"
                className="absolute inset-0 bg-gradient-to-r from-[#0a192f] to-[#3b82f6]"
                style={{ opacity: 0.1 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
