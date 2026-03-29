"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Message {
  role: "agent" | "caller";
  text: string;
}

interface ConversationPreviewProps {
  messages: Message[];
  agentAvatar?: string;
  callerAvatar?: string;
  isLive?: boolean;
}

export function ConversationPreview({
  messages,
  agentAvatar = "🤖",
  callerAvatar = "👤",
  isLive = false,
}: ConversationPreviewProps) {
  return (
    <div className="flex flex-col gap-3">
      {messages.map((msg, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, delay: i * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
          className={cn(
            "flex gap-2.5",
            msg.role === "agent" ? "flex-row" : "flex-row-reverse"
          )}
        >
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.08 + 0.1, type: "spring", stiffness: 300 }}
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs transition-all",
              msg.role === "agent"
                ? "bg-[#0a192f]/10 text-[#0a192f] border border-[#0a192f]/20"
                : "bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20"
            )}
          >
            {msg.role === "agent" ? agentAvatar : callerAvatar}
          </motion.div>

          {/* Message Bubble */}
          <motion.div
            layout
            className={cn(
              "max-w-[80%] rounded-xl px-4 py-2.5 text-[13px] leading-relaxed shadow-sm",
              msg.role === "agent"
                ? "rounded-bl-sm bg-white border border-[#e2e8f0] text-[#0a192f]"
                : "rounded-br-sm bg-[#3b82f6] text-white"
            )}
          >
            {msg.text}
          </motion.div>
        </motion.div>
      ))}

      {/* Live Audio Wave Animation */}
      {isLive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 flex items-center gap-1.5 px-3 py-3"
        >
          <div className="flex items-center gap-1">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full bg-[#10b981]"
                animate={{
                  height: [4, 16, 4],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  delay: i * 0.06,
                  ease: "easeInOut",
                }}
                style={{ height: 4 }}
              />
            ))}
          </div>
          <span className="ml-2 text-[10px] font-semibold text-[#10b981] uppercase tracking-wider">Live</span>
        </motion.div>
      )}
    </div>
  );
}
