"use client";

import { use } from "react";
import { INDUSTRIES } from "@/data/industries";
import { BUNDLE_MAPPING } from "@/data/bundle-mapping";
import { TEMPLATES } from "@/data/templates";
import { 
    Mic, Bot, LayoutDashboard, Settings2, 
    Sparkles, ArrowLeft, Plus, CheckCircle2,
    PlayCircle, ShieldCheck, Zap, BarChart3
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function IndustryWorkspacePage({ params }: { params: Promise<{ industryId: string }> }) {
    const { industryId } = use(params);
    const industry = INDUSTRIES.find(i => i.id === industryId);
    const mapping = BUNDLE_MAPPING[industryId];

    const [activeTab, setActiveTab] = useState<'overview' | 'voice' | 'chat'>('overview');

    const voiceTemplates = useMemo(() => {
        return mapping ? TEMPLATES.filter(t => mapping.voiceTemplateIds.includes(t.id)) : [];
    }, [mapping]);

    const chatTemplates = useMemo(() => {
        return mapping ? TEMPLATES.filter(t => mapping.chatTemplateIds.includes(t.id)) : [];
    }, [mapping]);

    if (!industry) return <div className="p-20 text-center">Industry not found</div>;

    const tabs = [
        { id: 'overview', label: 'Workspace Overview', icon: LayoutDashboard },
        { id: 'voice', label: 'Voice Agent', icon: Mic, badge: voiceTemplates.length },
        { id: 'chat', label: 'Chatbot Modules', icon: Bot, badge: chatTemplates.length },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-[#0a0e1a]">
            {/* Header / Breadcrumb Area */}
            <div className="px-6 lg:px-12 py-8 bg-white dark:bg-[#101728] border-b border-gray-100 dark:border-white/5">
                <div className="max-w-7xl mx-auto">
                    <Link 
                        href="/panel/industries" 
                        className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Industries
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className={cn(
                                "h-16 w-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl bg-gradient-to-br",
                                industry.iconBg
                            )}>
                                {industry.icon}
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">
                                    {industry.name} <span className="text-gray-400 font-medium ml-2 text-xl">Workspace</span>
                                </h1>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#06d6a0]/10 text-[#06d6a0] text-[10px] font-black uppercase tracking-widest border border-[#06d6a0]/20">
                                        <ShieldCheck className="h-3 w-3" />
                                        Certified Setup
                                    </div>
                                    <span className="text-sm text-gray-500 font-medium">{industry.subtitle}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="rounded-xl px-6 font-bold border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5">
                                <Settings2 className="h-4 w-4 mr-2" />
                                Settings
                            </Button>
                            <Button className="bg-[#101728] dark:bg-[#06d6a0] text-white dark:text-[#101728] hover:bg-gray-800 dark:hover:bg-[#05b88a] rounded-xl px-6 font-bold shadow-xl shadow-[#06d6a0]/10">
                                <Zap className="h-4 w-4 mr-2" />
                                Deploy Workspace
                            </Button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-8 mt-12 border-b border-gray-100 dark:border-white/5">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "flex items-center gap-2 pb-4 text-sm font-bold transition-all relative",
                                    activeTab === tab.id 
                                        ? "text-gray-900 dark:text-white" 
                                        : "text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                                )}
                            >
                                <tab.icon className={cn(
                                    "h-4 w-4",
                                    activeTab === tab.id ? "text-[#06d6a0]" : "text-gray-400"
                                )} />
                                {tab.label}
                                {tab.badge && (
                                    <span className={cn(
                                        "ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-black",
                                        activeTab === tab.id ? "bg-[#06d6a0] text-[#101728]" : "bg-gray-100 dark:bg-white/5 text-gray-500"
                                    )}>
                                        {tab.badge}
                                    </span>
                                )}
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#06d6a0] rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 px-6 lg:px-12 py-12">
                <div className="max-w-7xl mx-auto">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                {/* Welcome Card */}
                                <div className="bg-white dark:bg-[#101728] rounded-3xl p-8 border border-gray-100 dark:border-white/5 shadow-sm">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="h-10 w-10 rounded-xl bg-[#06d6a0]/10 flex items-center justify-center">
                                            <Sparkles className="h-5 w-5 text-[#06d6a0]" />
                                        </div>
                                        <h2 className="text-xl font-bold dark:text-white tracking-tight">Setup your industry environment</h2>
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed font-medium">
                                        We've pre-configured your workspace with the best agents and models for {industry.name}. 
                                        To get started, review your voice agent settings and activate the chatbot modules below.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div 
                                            onClick={() => setActiveTab('voice')}
                                            className="group p-6 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-[#06d6a0]/30 hover:bg-[#06d6a0]/5 transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <Mic className="h-6 w-6 text-[#06d6a0]" />
                                                <div className="h-8 w-8 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                                                    <PlayCircle className="h-4 w-4 text-gray-400 group-hover:text-[#06d6a0]" />
                                                </div>
                                            </div>
                                            <h3 className="font-bold dark:text-white mb-1">Verify Voice Agent</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{voiceTemplates.length} templates ready for testing.</p>
                                        </div>
                                        <div 
                                            onClick={() => setActiveTab('chat')}
                                            className="group p-6 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-[#06d6a0]/30 hover:bg-[#06d6a0]/5 transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <Bot className="h-6 w-6 text-[#06d6a0]" />
                                                <div className="h-8 w-8 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                                                    <Plus className="h-4 w-4 text-gray-400 group-hover:text-[#06d6a0]" />
                                                </div>
                                            </div>
                                            <h3 className="font-bold dark:text-white mb-1">Configure Chatbot</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{chatTemplates.length} industry modules available.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Industry Specific Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-white dark:bg-[#101728] rounded-3xl p-8 border border-gray-100 dark:border-white/5 shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6 border-b border-gray-100 dark:border-white/5 pb-4">Required Integrations</h3>
                                        <div className="space-y-4">
                                            {industry.integrations.map((integration, idx) => (
                                                <div key={idx} className="flex items-center justify-between group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-[10px] font-bold dark:text-gray-400">
                                                            {integration[0]}
                                                        </div>
                                                        <span className="text-sm font-bold dark:text-white group-hover:text-[#06d6a0] transition-colors">{integration}</span>
                                                    </div>
                                                    <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase text-[#06d6a0] hover:bg-[#06d6a0]/10 border border-transparent hover:border-[#06d6a0]/20">
                                                        Connect
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-[#101728] rounded-3xl p-8 border border-gray-100 dark:border-white/5 shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6 border-b border-gray-100 dark:border-white/5 pb-4">Environment Tags</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {industry.tags.map((tag, idx) => (
                                                <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 text-[10px] font-bold dark:text-gray-300">
                                                    <CheckCircle2 className="h-3 w-3 text-[#06d6a0]" />
                                                    {tag}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {/* Quick Stats */}
                                <div className="bg-white dark:bg-[#101728] rounded-3xl p-8 border border-gray-100 dark:border-white/5 shadow-sm">
                                    <h2 className="text-xl font-bold dark:text-white mb-8 tracking-tight">Market Benchmarks</h2>
                                    <div className="space-y-6">
                                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#0a0e1a] border border-gray-100 dark:border-white/5">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Orgs</span>
                                                <BarChart3 className="h-4 w-4 text-[#06d6a0]" />
                                            </div>
                                            <p className="text-2xl font-black dark:text-white">{industry.businesses.toLocaleString()}</p>
                                            <p className="text-[10px] text-gray-500 font-bold mt-1">Growth: +12.5% this month</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#0a0e1a] border border-gray-100 dark:border-white/5">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Monthly Volume</span>
                                                <BarChart3 className="h-4 w-4 text-blue-500" />
                                            </div>
                                            <p className="text-2xl font-black dark:text-white">{industry.callsPerMonth}</p>
                                            <p className="text-[10px] text-gray-500 font-bold mt-1">Across all workspace nodes</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Support Card */}
                                <div className="bg-gradient-to-br from-[#101728] to-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-gray-200 dark:shadow-none overflow-hidden relative group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Sparkles className="h-20 w-20" />
                                    </div>
                                    <h3 className="text-lg font-bold mb-4 relative z-10">Need a specialized build?</h3>
                                    <p className="text-xs text-gray-300 mb-8 leading-relaxed relative z-10">Our engineers can build and train custom models for your specific organizational requirements.</p>
                                    <Button className="w-full bg-[#06d6a0] hover:bg-[#05b88a] text-[#101728] font-black text-xs uppercase tracking-widest h-11 rounded-xl relative z-10">
                                        Contact Expert
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'voice' && (
                        <div className="animate-fade-in">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-black dark:text-white mb-2 tracking-tight">Voice Agent Templates</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Select and configure pre-trained voice agents for your workspace.</p>
                                </div>
                                <Button className="bg-[#101728] dark:bg-[#06d6a0] text-white dark:text-[#101728] font-bold h-10 rounded-xl">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Custom Agent
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {voiceTemplates.map((template) => (
                                    <div key={template.id} className="bg-white dark:bg-[#101728] rounded-2xl p-6 border border-gray-100 dark:border-white/5 hover:border-[#06d6a0]/30 transition-all group overflow-hidden relative">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="h-10 w-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                                {template.icon}
                                            </div>
                                            <div className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[9px] font-black uppercase tracking-widest border border-blue-500/20">
                                                {template.complexity}
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold dark:text-white mb-2">{template.name}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-6">{template.function}</p>
                                        
                                        <div className="flex items-center justify-between mt-auto">
                                            <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold">
                                                <Zap className="h-3.5 w-3.5" />
                                                {template.setupTime} setup
                                            </div>
                                            <Button variant="outline" size="sm" className="text-[10px] font-black uppercase h-8 rounded-lg">
                                                Configure
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'chat' && (
                        <div className="animate-fade-in">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-black dark:text-white mb-2 tracking-tight">Chatbot Modules</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Activate specific chat behaviors and data connectors.</p>
                                </div>
                                <Button className="bg-[#101728] dark:bg-[#06d6a0] text-white dark:text-[#101728] font-bold h-10 rounded-xl">
                                    <Plus className="h-4 w-4 mr-2" />
                                    New Module
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {chatTemplates.map((template) => (
                                    <div key={template.id} className="bg-white dark:bg-[#101728] rounded-2xl p-6 border border-gray-100 dark:border-white/5 hover:border-[#06d6a0]/30 transition-all group">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="h-10 w-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                                {template.icon}
                                            </div>
                                            <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                                                Active
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold dark:text-white mb-2">{template.name}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-6">{template.function}</p>
                                        
                                        <div className="flex items-center justify-between mt-auto">
                                            <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold">
                                                <BarChart3 className="h-3.5 w-3.5" />
                                                Live Sync
                                            </div>
                                            <Button variant="outline" size="sm" className="text-[10px] font-black uppercase h-8 rounded-lg">
                                                Manage
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
