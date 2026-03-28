"use client";

import { INDUSTRIES } from "@/data/industries";
import { IndustryCard } from "@/components/industries/IndustryCard";
import { Search, SlidersHorizontal, Building2, Sparkles, Filter } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
    { label: "All Industries", value: "all" },
    { label: "Healthcare", value: "healthcare" },
    { label: "Home Services", value: "home-services" },
    { label: "Hospitality", value: "hospitality" },
    { label: "Professional", value: "professional" },
    { label: "Retail", value: "retail" },
    { label: "Education", value: "education" },
];

export default function IndustriesPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");

    const filteredIndustries = useMemo(() => {
        return INDUSTRIES.filter((industry) => {
            const matchesSearch = 
                industry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                industry.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
                industry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
            
            const matchesCategory = activeCategory === "all" || industry.category === activeCategory;

            return matchesSearch && matchesCategory;
        });
    }, [searchQuery, activeCategory]);

    return (
        <div className="flex flex-col min-h-screen">
            {/* Bold Hero Section */}
            <div className="relative pt-16 pb-20 px-6 lg:px-12 overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#06d6a0]/10 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] translate-y-1/2 pointer-events-none" />

                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#06d6a0]/10 text-[#06d6a0] border border-[#06d6a0]/20 mb-8 animate-fade-in">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-[11px] font-black uppercase tracking-widest">Industry Market</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight leading-[1.1]">
                        AI built for <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06d6a0] to-blue-500">
                          your exact business.
                        </span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                        Choose your industry to launch pre-trained agents, custom-tailored knowledge bases, 
                        and industry-specific automation workflows in minutes.
                    </p>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="sticky top-16 z-[48] bg-white/80 dark:bg-[#101728]/80 backdrop-blur-xl border-y border-gray-100 dark:border-white/5 px-6 lg:px-12">
                <div className="max-w-7xl mx-auto py-5 flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Category Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide w-full md:w-auto">
                        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200/50 dark:border-white/10">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.value}
                                    onClick={() => setActiveCategory(cat.value)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                                        activeCategory === cat.value
                                            ? "bg-white dark:bg-[#06d6a0] text-gray-900 dark:text-[#101728] shadow-sm"
                                            : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                                    )}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search Field */}
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#06d6a0] transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search industries, tags, or use cases..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-white/5 border border-transparent focus:border-[#06d6a0]/50 rounded-2xl py-3 pl-11 pr-4 text-sm font-medium focus:outline-none transition-all placeholder:text-gray-500 dark:placeholder:text-gray-600"
                        />
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="flex-1 bg-gray-50/50 dark:bg-[#0a0e1a] px-6 lg:px-12 py-16">
                <div className="max-w-7xl mx-auto">
                    {filteredIndustries.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {filteredIndustries.map((industry) => (
                                <IndustryCard key={industry.id} industry={industry} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                            <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-6">
                                <Search className="h-8 w-8 text-gray-300 dark:text-gray-700" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No industries found</h3>
                            <p className="text-gray-500 max-w-xs mx-auto">Try adjusting your search or filters to find what you're looking for.</p>
                        </div>
                    )}

                    {/* Footer Tip */}
                    <div className="mt-20 flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-4">
                            <Building2 className="h-4 w-4 text-[#06d6a0]" />
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Don't see your industry?</span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-6">
                            We're constantly adding new specialized environments. You can also build your own from scratch.
                        </p>
                        <button className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-bold text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
                            Request Custom Deployment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
