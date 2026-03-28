"use client";

import { TEMPLATES } from "@/data/templates";
import { 
    Search, Sparkles, SlidersHorizontal, ArrowRight,
    Zap, Clock, ShieldCheck, Filter, 
    ArrowUpRight, Info, CheckCircle2
} from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const TYPES = [
    { label: "All Templates", value: "all" },
    { label: "Inbound Agents", value: "inbound" },
    { label: "Outbound Sales", value: "outbound" },
    { label: "Hybrid / Routing", value: "hybrid" },
];

const COMPLEXITY = ["simple", "medium", "complex"];

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
        <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-[#0a0e1a]">
            {/* Marketplace Hero */}
            <div className="relative pt-16 pb-20 px-6 lg:px-12 bg-white dark:bg-[#101728] border-b border-gray-100 dark:border-white/5">
                <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
                    <Sparkles className="h-40 w-40 text-[#06d6a0]" />
                </div>
                
                <div className="max-w-7xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 mb-8">
                        <Zap className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Agent Marketplace</span>
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
                        Deploy pre-trained <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-[#06d6a0]">
                            AI agency workflows.
                        </span>
                    </h1>
                    
                    <p className="max-w-2xl text-lg text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-10">
                        Browser our library of 30+ production-ready AI templates. Each agent comes pre-trained with 
                        industry-specific logic and ready-to-use API integrations.
                    </p>

                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#06d6a0]" />
                            <span className="text-xs font-bold dark:text-gray-400 uppercase tracking-widest">30+ Active Templates</span>
                        </div>
                        <div className="h-1 w-1 rounded-full bg-gray-300 dark:bg-white/10" />
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#06d6a0]" />
                            <span className="text-xs font-bold dark:text-gray-400 uppercase tracking-widest">Sarvam AI Powered</span>
                        </div>
                        <div className="h-1 w-1 rounded-full bg-gray-300 dark:bg-white/10" />
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#06d6a0]" />
                            <span className="text-xs font-bold dark:text-gray-400 uppercase tracking-widest">Zero latency voice</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Hub */}
            <div className="sticky top-16 z-[48] bg-white/80 dark:bg-[#101728]/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5 px-6 lg:px-12 py-6">
                <div className="max-w-7xl mx-auto flex flex-col xl:flex-row items-center justify-between gap-8">
                    {/* Category Tabs */}
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200/50 dark:border-white/10 w-full xl:w-auto overflow-x-auto scrollbar-hide">
                        {TYPES.map((type) => (
                            <button
                                key={type.value}
                                onClick={() => setActiveType(type.value)}
                                className={cn(
                                    "px-6 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                                    activeType === type.value
                                        ? "bg-white dark:bg-blue-500 text-gray-900 dark:text-white shadow-sm"
                                        : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                                )}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-6 w-full xl:w-auto">
                        {/* Complexity Filters */}
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">Complexity:</span>
                            <div className="flex gap-2">
                                {COMPLEXITY.map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => toggleComplexity(level)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border",
                                            activeComplexity.includes(level)
                                                ? "bg-[#06d6a0]/10 text-[#06d6a0] border-[#06d6a0]/30"
                                                : "bg-gray-100 dark:bg-white/5 text-gray-400 border-gray-200 dark:border-white/5"
                                        )}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative flex-1 md:w-80 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input 
                                type="text"
                                placeholder="Search agents (e.g. Booking, Triage...)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-100 dark:bg-white/5 border border-transparent focus:border-blue-500/50 rounded-2xl py-3 pl-11 pr-4 text-sm font-medium focus:outline-none transition-all placeholder:text-gray-500 dark:placeholder:text-gray-600"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Marketplace Grid */}
            <div className="flex-1 px-6 lg:px-12 py-16">
                <div className="max-w-7xl mx-auto">
                    {filteredTemplates.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredTemplates.map((template) => (
                                <Link 
                                    key={template.id}
                                    href={`/panel/templates/${template.id}`}
                                    className="group bg-white dark:bg-[#101728] rounded-[2rem] p-8 border border-gray-100 dark:border-white/5 hover:border-blue-500/30 transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)] flex flex-col h-full"
                                >
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="h-14 w-14 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:bg-blue-500/10 transition-all duration-500">
                                            {template.icon}
                                        </div>
                                        <div className={cn(
                                            "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                            template.category === 'inbound' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                            template.category === 'outbound' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                            "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                        )}>
                                            {template.category}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold dark:text-white mb-3 tracking-tight group-hover:text-blue-500 transition-colors">
                                        {template.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-8 flex-1">
                                        {template.function}
                                    </p>

                                    <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-white/5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                                <Clock className="h-3 w-3" />
                                                Setup: {template.setupTime}
                                            </div>
                                            <div className={cn(
                                                "text-[9px] font-black uppercase tracking-[0.1em]",
                                                template.complexity === 'simple' ? "text-emerald-500" :
                                                template.complexity === 'medium' ? "text-blue-400" : "text-amber-500"
                                            )}>
                                                {template.complexity}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex items-center -space-x-1.5">
                                                {template.industries.slice(0, 3).map((ind, i) => (
                                                    <div key={i} className="h-6 w-6 rounded-full border-2 border-white dark:border-[#101728] bg-gray-100 dark:bg-white/10 flex items-center justify-center text-[10px]" title={ind}>
                                                        {ind[0].toUpperCase()}
                                                    </div>
                                                ))}
                                                {template.industries.length > 3 && (
                                                    <div className="h-6 w-6 rounded-full border-2 border-white dark:border-[#101728] bg-gray-50 dark:bg-white/5 flex items-center justify-center text-[8px] font-bold text-gray-400">
                                                        +{template.industries.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-[10px] font-bold text-gray-400 group-hover:text-blue-500 transition-colors flex items-center gap-1">
                                                View Repo <ArrowUpRight className="h-3 w-3" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-6">
                                <Search className="h-8 w-8 text-gray-300 dark:text-gray-700" />
                            </div>
                            <h3 className="text-xl font-bold dark:text-white mb-2">No agents matching your criteria</h3>
                            <p className="text-sm text-gray-500 font-medium">Try clearing your filters or search query to see more results.</p>
                            <Button 
                                variant="ghost" 
                                className="mt-6 text-[#06d6a0] font-bold hover:bg-[#06d6a0]/10"
                                onClick={() => { setSearchQuery(""); setActiveType("all"); setActiveComplexity([]); }}
                            >
                                Reset Marketplace
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
