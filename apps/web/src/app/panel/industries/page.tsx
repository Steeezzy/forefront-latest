"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Layers3, Search, Workflow } from "lucide-react";
import { IndustryCard } from "@/components/industries/IndustryCard";
import { SearchBar } from "@/components/ui/SearchBar";
import { FilterPills } from "@/components/ui/FilterPills";
import { getIndustryBlueprint } from "@/data/industry-experience";
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

  const experiences = useMemo(
    () =>
      industries
        .map((industry) => ({
          industry,
          blueprint: getIndustryBlueprint(industry.id),
        }))
        .filter(
          (
            item
          ): item is {
            industry: (typeof industries)[number];
            blueprint: NonNullable<ReturnType<typeof getIndustryBlueprint>>;
          } => Boolean(item.blueprint)
        ),
    []
  );

  const searchTerm = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    return experiences.filter(({ industry, blueprint }) => {
      const matchCategory = filter === "all" || industry.category === filter;
      if (!matchCategory) {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

      const searchableText = [
        industry.name,
        industry.subtitle,
        industry.tagline,
        ...industry.tags,
        ...industry.integrations,
        blueprint.heroOutcome,
        blueprint.heroDetail,
        ...blueprint.activeChannels,
        ...blueprint.integrationsFocus,
        ...blueprint.capabilityModules.flatMap((module) => [
          module.title,
          module.description,
          ...module.channels,
          ...module.highlights,
        ]),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchTerm);
    });
  }, [experiences, filter, searchTerm]);

  const summaryCards = useMemo(() => {
    const uniqueChannels = new Set(
      experiences.flatMap(({ blueprint }) => blueprint.activeChannels)
    );
    const readyCount = experiences.filter(
      ({ blueprint }) => blueprint.workflowReadiness.tone === "ready"
    ).length;

    return [
      {
        label: "Industries Live",
        value: String(experiences.length),
        detail: "Current catalog kept intact and reworked into blueprint-driven flows.",
      },
      {
        label: "Workflow Ready",
        value: String(readyCount),
        detail: "Industries already mapped with operational workflow guidance.",
      },
      {
        label: "Seeded Channels",
        value: String(uniqueChannels.size),
        detail: "Voice, chat, messaging, and email touchpoints represented in the catalog.",
      },
    ];
  }, [experiences]);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="border-b border-[#e2e8f0] bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_40%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 rounded-full border border-[#dbe4f0] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#2563eb]"
              >
                <Workflow size={14} />
                Industry Experience Redesign
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.05 }}
                className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-[#0a192f] md:text-5xl"
              >
                Blueprint-first industry workspaces for every signed-in vertical.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 }}
                className="mt-5 max-w-3xl text-base leading-relaxed text-[#64748b]"
              >
                Each industry now starts with a dedicated blueprint page that surfaces
                the exact capability modules, workflow design, compliance posture,
                integrations, and launch steps before you enter the build flow.
              </motion.p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {summaryCards.map((card) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45 }}
                  className="rounded-3xl border border-[#dbe4f0] bg-white p-5 shadow-sm"
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
                    {card.label}
                  </div>
                  <div className="mt-2 text-3xl font-semibold tracking-tight text-[#0a192f]">
                    {card.value}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[#64748b]">
                    {card.detail}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-10 space-y-5">
            <div className="max-w-xl">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search by industry, integration, capability, or channel..."
              />
            </div>
            <FilterPills options={categories} activeValue={filter} onChange={setFilter} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
              Catalog
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#0a192f]">
              {filtered.length} blueprint{filtered.length === 1 ? "" : "s"} matched
            </h2>
          </div>
          <div className="rounded-full border border-[#dbe4f0] bg-white px-4 py-2 text-sm text-[#64748b]">
            Catalog keeps the current 12 industries intact
          </div>
        </div>

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
                    staggerChildren: 0.05,
                  },
                },
              }}
              className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
            >
              {filtered.map(({ industry, blueprint }) => (
                <IndustryCard
                  key={industry.id}
                  industry={industry}
                  blueprint={blueprint}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-[#dbe4f0] bg-white px-6 py-20 text-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f8fafc] text-[#94a3b8]">
                <Search size={28} />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-[#0a192f]">
                No industry blueprint matched
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-[#64748b]">
                Try a broader term like an integration, a channel, or a business
                workflow. Search now spans capability modules and blueprint details.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#dbe4f0] bg-white px-5 py-2.5 text-sm font-semibold text-[#0a192f] transition-colors hover:border-[#0a192f]"
              >
                <Layers3 size={16} />
                Reset catalog filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
