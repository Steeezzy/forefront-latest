"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon?: string;
  barPercentage?: number;
  barColor?: string;
  delay?: number;
}

export function StatCard({
  label,
  value,
  change,
  changeType = "neutral",
  icon,
  barPercentage,
  barColor = "var(--color-accent)",
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#0a192f]/20 hover:shadow-xl hover:shadow-[#0a192f]/5"
    >
      {/* Subtle gradient accent on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a192f]/0 to-[#0a192f]/0 opacity-0 group-hover:opacity-5 transition-opacity duration-500" />

      <div className="relative flex items-start justify-between mb-4">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">
          {label}
        </span>
        {icon && (
          <motion.span
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="text-lg"
          >
            {icon}
          </motion.span>
        )}
      </div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: delay + 0.1 }}
        className="text-4xl font-bold tracking-tight text-[#0a192f]"
      >
        {value}
      </motion.div>

      {change && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: delay + 0.2 }}
          className={cn(
            "mt-3 flex items-center gap-1.5 text-xs font-semibold",
            changeType === "up" && "text-[#10b981]",
            changeType === "down" && "text-[#ef4444]",
            changeType === "neutral" && "text-[#64748b]"
          )}
        >
          {changeType === "up" && <TrendingUp size={13} />}
          {changeType === "down" && <TrendingDown size={13} />}
          <span>{change}</span>
        </motion.div>
      )}

      {barPercentage !== undefined && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${barPercentage}%` }}
          transition={{ duration: 1.2, delay: delay + 0.3, ease: "easeOut" }}
          className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-2xl"
          style={{ background: barColor }}
        />
      )}
    </motion.div>
  );
}
