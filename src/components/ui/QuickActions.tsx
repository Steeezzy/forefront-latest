"use client";

import { motion } from "framer-motion";

export interface QuickAction {
  icon: string;
  label: string;
  onClick: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action, i) => (
        <motion.button
          key={i}
          onClick={action.onClick}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: i * 0.05 }}
          whileHover={{ 
            scale: 1.03,
            boxShadow: "0 4px 12px rgba(10, 25, 47, 0.12)",
            borderColor: "rgba(10, 25, 47, 0.3)"
          }}
          whileTap={{ scale: 0.98 }}
          className="group relative flex items-center gap-2.5 rounded-lg border border-[#e2e8f0] bg-white px-5 py-3 text-sm font-medium text-[#64748b] transition-all hover:text-[#0a192f] overflow-hidden"
        >
          {/* Hover accent (invisible by default) */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a192f]/0 to-[#0a192f]/0 opacity-0 group-hover:opacity-5 transition-opacity" />
          
          <span className="text-lg relative z-10">{action.icon}</span>
          <span className="relative z-10">{action.label}</span>
          
          {/* Arrow icon on hover */}
          <motion.span
            initial={{ opacity: 0, x: -5 }}
            whileHover={{ opacity: 1, x: 0 }}
            className="relative z-10 text-[#0a192f]"
          >
            →
          </motion.span>
        </motion.button>
      ))}
    </div>
  );
}
