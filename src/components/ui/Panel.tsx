import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

interface PanelProps {
  title: string;
  icon?: string;
  action?: string;
  onAction?: () => void;
  children: ReactNode;
  className?: string;
}

export function Panel({
  title,
  icon,
  action,
  onAction,
  children,
  className,
}: PanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        "overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-[#e2e8f0] px-6 py-4">
        <h3 className="flex items-center gap-2.5 text-sm font-semibold text-[#0a192f]">
          {icon && <span className="text-base">{icon}</span>}
          {title}
        </h3>
        {action && (
          <motion.button
            whileHover={{ x: 2 }}
            onClick={onAction}
            className="flex items-center gap-1 text-xs font-medium text-[#3b82f6] transition-opacity hover:opacity-80"
          >
            {action}
            <ChevronRight size={12} />
          </motion.button>
        )}
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  );
}
