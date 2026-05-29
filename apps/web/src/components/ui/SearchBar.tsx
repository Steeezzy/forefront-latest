"use client";

import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
}: SearchBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, width: "80%" }}
      animate={{ opacity: 1, width: "100%" }}
      className="relative max-w-lg w-full"
    >
      <div className="absolute left-4 top-1/2 -translate-y-1/2">
        <motion.div
          animate={{ scale: value ? [1, 1.2, 1] : 1 }}
          transition={{ duration: 0.3 }}
        >
          <Search
            size={18}
            className="text-[#64748b] group-focus-within:text-[#0a192f] transition-colors"
          />
        </motion.div>
      </div>
      
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full border border-[#e2e8f0] bg-white py-3 pl-12 pr-10 text-sm font-medium text-[#0a192f] outline-none transition-all placeholder:text-[#94a3b8] hover:border-[#0a192f]/30 focus:border-[#0a192f] focus:ring-4 focus:ring-[#0a192f]/5"
      />
      
      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0] hover:text-[#0a192f] transition-colors"
          >
            <X size={12} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
