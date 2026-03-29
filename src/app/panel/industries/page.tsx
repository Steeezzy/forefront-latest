"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { SearchBar } from "@/components/ui/SearchBar";
import { FilterPills } from "@/components/ui/FilterPills";
import { IndustryCard } from "@/components/industries/IndustryCard";
import { industries } from "@/data/industries";

const categories = [
  { label: "All Industries", value: "all" },
  { label: "Healthcare", value: "healthcare" },
  { label: "Home Services", value: "home-services" },
  { label: "Hospitality", value: "hospitality" },
  { label: "Professional", value: "professional" },
  { label: "Retail & Commerce", value: "retail" },
  { label: "Education", value: "education" },
];

export default function IndustriesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = industries.filter((ind) => {
    const matchCat = filter === "all" || ind.category === filter;
    const matchSearch =
      !search ||
      ind.name.toLowerCase().includes(search.toLowerCase()) ||
      ind.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="pt-16 pb-16 px-6 lg:px-12 bg-white border-b border-[#e2e8f0]"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl md:text-4xl font-bold tracking-tight text-[#0a192f]"
            >
              Industry <span className="text-[#3b82f6]">Workspaces</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto mt-3 max-w-2xl text-sm text-[#64748b] leading-relaxed"
            >
              Pre-configured AI agent environments for every industry. Each workspace includes
              a ready-to-deploy voice agent and chatbot with industry-specific templates.
            </motion.p>
          </div>

          {/* Search & Filters */}
          <div className="max-w-3xl mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex justify-center"
            >
              <div className="w-full max-w-md">
                <SearchBar
                  value={search}
                  onChange={setSearch}
                  placeholder="Search industries, templates, features..."
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex justify-center"
            >
              <FilterPills options={categories} activeValue={filter} onChange={setFilter} />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Grid */}
      <div className="px-6 lg:px-12 py-16">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {filtered.length > 0 ? (
              <motion.div
                key="grid"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.06,
                    },
                  },
                }}
                className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
              >
                {filtered.map((industry) => (
                  <IndustryCard key={industry.id} industry={industry} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="h-16 w-16 rounded-full bg-[#f8fafc] flex items-center justify-center mb-4 border border-[#e2e8f0]">
                  <Search className="h-8 w-8 text-[#94a3b8]" />
                </div>
                <h3 className="text-lg font-semibold text-[#0a192f] mb-2">No industries found</h3>
                <p className="text-sm text-[#64748b] max-w-md">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setSearch(""); setFilter("all"); }}
                  className="mt-4 px-5 py-2 rounded-lg bg-white border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:border-[#0a192f] hover:text-[#0a192f] transition-colors"
                >
                  Clear filters
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
