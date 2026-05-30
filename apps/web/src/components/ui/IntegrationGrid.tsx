"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, Plus } from "lucide-react";
import type { WorkspaceIntegration } from "@/types";

interface IntegrationGridProps {
  integrations: WorkspaceIntegration[];
  columns?: number;
}

export function IntegrationGrid({
  integrations,
  columns = 2,
}: IntegrationGridProps) {
  return (
    <div
      className="grid gap-3"
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
      }}
    >
      {integrations.map((int) => (
        <motion.div
          key={int.integrationId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ 
            x: 2, 
            boxShadow: "0 4px 12px rgba(10, 25, 47, 0.08)" 
          }}
          transition={{ duration: 0.2 }}
          className={cn(
            "group flex items-center gap-3 rounded-lg border border-[#e2e8f0] bg-white p-3 transition-all cursor-pointer",
            int.connected && "border-[#10b981]/30 bg-[#10b981]/5"
          )}
        >
          {/* Icon */}
          <motion.div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#f8fafc] text-[14px] border border-[#e2e8f0] group-hover:border-[#0a192f]/20 transition-colors"
            whileHover={{ scale: 1.05 }}
          >
            {int.icon}
          </motion.div>

          {/* Name */}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-[#0a192f]">{int.name}</div>
          </div>

          {/* Status Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
              int.connected
                ? "bg-[#10b981] text-white"
                : "bg-[#f8fafc] border border-[#e2e8f0] text-[#64748b] hover:border-[#0a192f] hover:text-[#0a192f]"
            )}
          >
            {int.connected ? (
              <>
                <Check size={12} />
                <span>Connected</span>
              </>
            ) : (
              <>
                <Plus size={12} />
                <span>Connect</span>
              </>
            )}
          </motion.button>
        </motion.div>
      ))}
    </div>
  );
}
