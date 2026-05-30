"use client";

import { useState, useMemo } from "react";
import Navbar from "@/components/sections/navbar";
import Footer from "@/components/sections/footer";
import { AGENT_TEMPLATES, INDUSTRIES } from "@/components/voice-agents/template-data";
import { Search, Filter, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { AgentTemplate, IndustryDefinition } from "@/components/voice-agents/template-data";

const DIRECTION_LABELS = {
    inbound: "Inbound",
    outbound: "Outbound",
    webcall: "Webcall",
};

const MODE_LABELS = {
    single: "Single Prompt",
    multi: "Multi Prompt",
};

export default function TemplatesPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
    const [selectedDirection, setSelectedDirection] = useState<string>("all");
    const [selectedMode, setSelectedMode] = useState<string>("all");

    // Use static data
    const templates = AGENT_TEMPLATES;
    const industries = INDUSTRIES;

    const filteredTemplates = useMemo(() => {
        return templates.filter((t) => {
            const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                                t.summary.toLowerCase().includes(search.toLowerCase());
            const matchIndustry = selectedIndustry === "all" || t.industryId === selectedIndustry;
            const matchDirection = selectedDirection === "all" || t.direction === selectedDirection;
            const matchMode = selectedMode === "all" || t.mode === selectedMode;
            return matchSearch && matchIndustry && matchDirection && matchMode;
        });
    }, [templates, search, selectedIndustry, selectedDirection, selectedMode]);

    const industryMap = useMemo(() => {
        const map: Record<string, IndustryDefinition> = {};
        industries.forEach((ind) => {
            map[ind.id] = ind;
        });
        return map;
    }, [industries]);

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="pt-24 pb-16 px-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Voice Agent Templates
                    </h1>
                    <p className="text-lg text-gray-600">
                        Browse our library of pre-built voice agent blueprints for every industry.
                        Pick a template, customize it, and deploy in minutes.
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-gray-50 rounded-2xl p-6 mb-12">
                    <div className="grid md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="relative md:col-span-4">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search templates..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Industry Filter */}
                        <div>
                            <select
                                value={selectedIndustry}
                                onChange={(e) => setSelectedIndustry(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white"
                            >
                                <option value="all">All Industries</option>
                                {industries.map((ind) => (
                                    <option key={ind.id} value={ind.id}>{ind.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Direction Filter */}
                        <div>
                            <select
                                value={selectedDirection}
                                onChange={(e) => setSelectedDirection(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white"
                            >
                                <option value="all">All Directions</option>
                                <option value="inbound">Inbound</option>
                                <option value="outbound">Outbound</option>
                                <option value="webcall">Webcall</option>
                            </select>
                        </div>

                        {/* Mode Filter */}
                        <div>
                            <select
                                value={selectedMode}
                                onChange={(e) => setSelectedMode(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white"
                            >
                                <option value="all">All Modes</option>
                                <option value="single">Single Prompt</option>
                                <option value="multi">Multi Prompt</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Templates Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredTemplates.map((template) => {
                        const industry = industryMap[template.industryId] || industryMap["blank"];
                        return (
                            <div
                                key={template.id}
                                className="group bg-white rounded-3xl p-8 border border-gray-200 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 cursor-pointer"
                                onClick={() => router.push(`/templates/${template.id}`)}
                            >
                                {/* Icon */}
                                <div
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-6"
                                    style={{
                                        background: `linear-gradient(135deg, ${industry?.accentFrom || "#111827"} 0%, ${industry?.accentTo || "#4b5563"} 100%)`,
                                    }}
                                >
                                    🤖
                                </div>

                                {/* Meta */}
                                <div className="flex items-center gap-2 mb-3 flex-wrap">
                                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                        {industry?.label || template.industryId}
                                    </span>
                                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                        {DIRECTION_LABELS[template.direction]}
                                    </span>
                                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                        {MODE_LABELS[template.mode]}
                                    </span>
                                </div>

                                {/* Title */}
                                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                                    {template.name}
                                </h3>

                                {/* Summary */}
                                <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                                    {template.summary}
                                </p>

                                {/* First message preview */}
                                <div className="bg-gray-50 rounded-xl p-4 mb-8">
                                    <p className="text-xs text-gray-500 mb-1">Opening line:</p>
                                    <p className="text-sm text-gray-800 italic">
                                        &ldquo;{template.firstMessage}&rdquo;
                                    </p>
                                </div>

                                {/* Variables */}
                                <div className="flex items-center gap-2 mb-6 flex-wrap">
                                    {template.variables.slice(0, 4).map((v) => (
                                        <span
                                            key={v}
                                            className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md font-mono"
                                        >
                                            {'{' + v + '}'}
                                        </span>
                                    ))}
                                    {template.variables.length > 4 && (
                                        <span className="text-xs text-gray-400">
                                            +{template.variables.length - 4} more
                                        </span>
                                    )}
                                </div>

                                {/* CTA */}
                                <div className="flex items-center justify-between mt-auto">
                                    <span className="text-sm font-medium text-indigo-600 group-hover:underline flex items-center gap-1">
                                        View details <ArrowRight size={14} />
                                    </span>
                                    <button
                                        className="p-2 rounded-full bg-gray-100 hover:bg-indigo-100 text-gray-600 hover:text-indigo-600 transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredTemplates.length === 0 && (
                    <div className="text-center py-20">
                        <Filter size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No templates found</h3>
                        <p className="text-gray-500">Try adjusting your filters</p>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
