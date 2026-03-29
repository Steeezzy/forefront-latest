"use client";

import { TEMPLATES } from "@/data/templates";
import { 
  Search, Sparkles, Zap, Filter, ArrowRight, CheckCircle2,
  Clock, ShieldCheck, X
} from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion } from "framer-motion";

const TYPES = [
  { label: "All Templates", value: "all" },
  { label: "Inbound Agents", value: "inbound" },
  { label: "Outbound Sales", value: "outbound" },
  { label: "Hybrid / Routing", value: "hybrid" },
];

const COMPLEXITY = ["simple", "medium", "complex"];

const categoryStyles = {
  inbound: {
    badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    badgeHover: "bg-emerald-500/15",
  },
  outbound: {
    badge: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    badgeHover: "bg-blue-500/15",
  },
  hybrid: {
    badge: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    badgeHover: "bg-purple-500/15",
  },
};

const complexityStyles = {
  simple: { color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  medium: { color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  complex: { color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
};

export default function TemplatesMarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [activeComplexity, setActiveComplexity] = useState<string[]>([]);

  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter((template) => {
      const matchesSearch = 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.function.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = activeType === "all" || template.category === activeType;
      const matchesComplexity = activeComplexity.length === 0 || activeComplexity.includes(template.complexity);

      return matchesSearch && matchesType && matchesComplexity;
    });
  }, [searchQuery, activeType, activeComplexity]);

  const toggleComplexity = (level: string) => {
    if (activeComplexity.includes(level)) {
      setActiveComplexity(activeComplexity.filter(l => l !== level));
    } else {
      setActiveComplexity([...activeComplexity, level]);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Marketplace Hero */}
      <div className="relative pt-16 pb-20 px-6 lg:px-12 bg-white border-b border-[#e2e8f0]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute top-20 right-12 opacity-5 pointer-events-none hidden lg:block"
        >
          <Sparkles className="h-40 w-40 text-[#10b981]" />
        </motion.div>

        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 mb-8"
          >
            <Zap className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Agent Marketplace</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-[#0a192f] mb-6 tracking-tight"
          >
            Deploy pre-trained <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] to-[#10b981]">
              AI agency workflows.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl text-lg text-[#64748b] leading-relaxed mb-10"
          >
            Browse our library of 30+ production-ready AI templates. Each agent comes pre-trained with 
            industry-specific logic and ready-to-use API integrations.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center gap-6"
          >
            {[
              { icon: CheckCircle2, text: "30+ Active Templates", color: "text-[#10b981]" },
              { icon: ShieldCheck, text: "Enterprise Grade", color: "text-[#3b82f6]" },
              { icon: Zap, text: "Zero latency voice", color: "text-[#8b5cf6]" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <item.icon className={`h-4 w-4 ${item.color}`} />
                <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Filter Hub */}
      <div className="sticky top-16 z-40 bg-white/80 backdrop-blur-xl border-b border-[#e2e8f0] px-6 lg:px-12 py-6">
        <div className="max-w-7xl mx-auto flex flex-col xl:flex-row items-center justify-between gap-6">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 bg-[#f8fafc] p-1 rounded-2xl border border-[#e2e8f0] w-full xl:w-auto overflow-x-auto">
            {TYPES.map((type) => (
              <motion.button
                key={type.value}
                onClick={() => setActiveType(type.value)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                  activeType === type.value
                    ? "bg-white text-[#0a192f] shadow-sm border border-[#e2e8f0]"
                    : "text-[#64748b] hover:text-[#0a192f]"
                )}
              >
                {type.label}
              </motion.button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
            {/* Complexity Filters */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#94a3b8]">Complexity:</span>
              <div className="flex gap-2">
                {COMPLEXITY.map((level) => {
                  const isActive = activeComplexity.includes(level);
                  const style = complexityStyles[level as keyof typeof complexityStyles];
                  return (
                    <motion.button
                      key={level}
                      onClick={() => toggleComplexity(level)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border",
                        isActive
                          ? `${style.bg} ${style.color} ${style.border}`
                          : "bg-[#f8fafc] text-[#94a3b8] border-[#e2e8f0]"
                      )}
                    >
                      {level}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative flex-1 md:w-80">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Search size={18} className="text-[#94a3b8]" />
              </div>
              <input 
                type="text"
                placeholder="Search agents (e.g. Booking, Triage...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-[#e2e8f0] bg-white py-3 pl-11 pr-4 text-sm font-medium text-[#0a192f] outline-none focus:border-[#0a192f] focus:ring-4 focus:ring-[#0a192f]/5 placeholder:text-[#94a3b8]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Marketplace Grid */}
      <div className="px-6 lg:px-12 py-16">
        <div className="max-w-7xl mx-auto">
          {filteredTemplates.length > 0 ? (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                >
                  <Link
                    href={`/panel/templates/${template.id}`}
                    className="group flex flex-col h-full rounded-2xl p-6 border border-[#e2e8f0] bg-white hover:border-[#0a192f]/30 transition-all duration-300 hover:shadow-xl hover:shadow-[#0a192f]/8"
                  >
                    {/* Icon */}
                    <div className="mb-6 flex items-start justify-between">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f8fafc] text-2xl transition-colors group-hover:bg-gradient-to-br group-hover:from-[#0a192f] group-hover:to-[#3b82f6]"
                      >
                        {template.icon}
                      </motion.div>
                      
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                        categoryStyles[template.category as keyof typeof categoryStyles].badge
                      )}>
                        {template.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-[#0a192f] mb-2 tracking-tight group-hover:text-[#3b82f6] transition-colors">
                      {template.name}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-[#64748b] font-medium leading-relaxed mb-6 flex-1">
                      {template.function}
                    </p>

                    {/* Meta footer */}
                    <div className="space-y-4 pt-5 border-t border-[#e2e8f0]">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-[#94a3b8]">
                          <Clock className="h-3 w-3" />
                          <span>Setup: {template.setupTime}</span>
                        </div>
                        <div className={cn(
                          "text-xs font-bold uppercase",
                          complexityStyles[template.complexity as keyof typeof complexityStyles].color
                        )}>
                          {template.complexity}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center -space-x-1.5">
                          {template.industries.slice(0, 3).map((ind, i) => (
                            <div
                              key={i}
                              className="h-6 w-6 rounded-full border-2 border-white bg-[#f8fafc] flex items-center justify-center text-[9px] font-bold text-[#64748b]"
                              title={ind}
                            >
                              {ind[0].toUpperCase()}
                            </div>
                          ))}
                          {template.industries.length > 3 && (
                            <div className="h-6 w-6 rounded-full border-2 border-white bg-white flex items-center justify-center text-[8px] font-bold text-[#94a3b8]">
                              +{template.industries.length - 3}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-xs font-semibold text-[#0a192f] group-hover:text-[#3b82f6] flex items-center gap-1 transition-colors">
                          View Details
                          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="h-20 w-20 rounded-full bg-[#f8fafc] flex items-center justify-center mb-6 border border-[#e2e8f0]">
                <Search className="h-8 w-8 text-[#94a3b8]" />
              </div>
              <h3 className="text-xl font-bold text-[#0a192f] mb-2">No agents matching your criteria</h3>
              <p className="text-sm text-[#64748b] max-w-md">
                Try clearing your filters or search query to see more results.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setSearchQuery(""); setActiveType("all"); setActiveComplexity([]); }}
                className="mt-6 px-6 py-2.5 rounded-lg bg-[#0a192f] text-white text-sm font-semibold hover:bg-[#112240] transition-colors"
              >
                Reset Filters
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
