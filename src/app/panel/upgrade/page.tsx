"use client";

import { useState } from "react";
import { MessageSquare, Bot, Workflow, Lightbulb, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PricingCard } from "@/components/upgrade/PricingCard";
import { customerServicePlans, lyroAiPlans, flowsPlans } from "@/components/upgrade/PricingData";

type TabOption = 'customer-service' | 'lyro-ai' | 'flows';

export default function UpgradePage() {
    const [activeTab, setActiveTab] = useState<TabOption>('lyro-ai'); // Default per screenshot

    const renderPlans = () => {
        switch (activeTab) {
            case 'customer-service': return customerServicePlans;
            case 'lyro-ai': return lyroAiPlans;
            case 'flows': return flowsPlans;
            default: return lyroAiPlans;
        }
    };

    return (
        <div className="min-h-screen bg-[#0f1115] text-white flex flex-col font-sans">
            {/* Header */}
            <header className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-[#0f1115] sticky top-0 z-50">
                <div className="flex items-center gap-3 cursor-pointer group hover:bg-white/5 p-2 rounded-lg transition-colors" onClick={() => window.history.back()}>
                    <span className="text-slate-400 group-hover:text-white transition-colors">✕</span>
                    <h1 className="text-sm font-bold tracking-wide">Upgrade</h1>
                </div>
                <div className="flex items-center gap-4 text-sm font-semibold text-slate-400 hover:text-white transition-colors">
                    <span>Usage and plan</span>
                    <Button className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-4 h-8 text-xs border border-emerald-500/20">
                        Upgrade
                    </Button>
                </div>
            </header>

            {/* Main Content container */}
            <main className="flex-1 overflow-x-hidden flex flex-col items-center py-16 px-6">

                {/* Hero Headers */}
                <div className="text-center mb-12 max-w-2xl px-4">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Create your ultimate Customer Experience suite</h2>
                    <p className="text-slate-400 text-sm md:text-base">
                        Bundle Customer service, Lyro AI Agent, Flows and Campaigns into one powerful subscription.
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex flex-col md:flex-row gap-4 mb-20 max-w-4xl justify-center px-4 w-full">
                    {/* Tab 1: Customer service */}
                    <button
                        onClick={() => setActiveTab('customer-service')}
                        className={cn(
                            "flex items-center gap-4 flex-1 p-5 rounded-xl border text-left transition-all",
                            activeTab === 'customer-service'
                                ? "border-blue-500 bg-blue-900/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                                : "border-white/10 hover:border-white/20 bg-[#18181b]"
                        )}
                    >
                        <MessageSquare
                            size={24}
                            className={cn(activeTab === 'customer-service' ? "text-blue-500" : "text-slate-400")}
                        />
                        <div className="flex flex-col gap-0.5">
                            <span className={cn(
                                "font-semibold text-sm",
                                activeTab === 'customer-service' ? "text-white" : "text-slate-300"
                            )}>Customer service</span>
                            <span className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                Increase customer satisfaction with dedicated Helpdesk tools
                            </span>
                        </div>
                    </button>

                    {/* Tab 2: Lyro AI Agent */}
                    <button
                        onClick={() => setActiveTab('lyro-ai')}
                        className={cn(
                            "flex items-center gap-4 flex-1 p-5 rounded-xl border text-left transition-all",
                            activeTab === 'lyro-ai'
                                ? "border-blue-500 bg-blue-900/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                                : "border-white/10 hover:border-white/20 bg-[#18181b]"
                        )}
                    >
                        <Bot
                            size={24}
                            className={cn(activeTab === 'lyro-ai' ? "text-blue-500" : "text-slate-400")}
                        />
                        <div className="flex flex-col gap-0.5">
                            <span className={cn(
                                "font-semibold text-sm",
                                activeTab === 'lyro-ai' ? "text-white" : "text-slate-300"
                            )}>Lyro AI Agent</span>
                            <span className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                Solve up to 70% of customer problems with Lyro AI - the AI support agent
                            </span>
                        </div>
                    </button>

                    {/* Tab 3: Flows */}
                    <button
                        onClick={() => setActiveTab('flows')}
                        className={cn(
                            "flex items-center gap-4 flex-1 p-5 rounded-xl border text-left transition-all",
                            activeTab === 'flows'
                                ? "border-blue-500 bg-blue-900/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                                : "border-white/10 hover:border-white/20 bg-[#18181b]"
                        )}
                    >
                        <Workflow
                            size={24}
                            className={cn(activeTab === 'flows' ? "text-blue-500" : "text-slate-400")}
                        />
                        <div className="flex flex-col gap-0.5">
                            <span className={cn(
                                "font-semibold text-sm",
                                activeTab === 'flows' ? "text-white" : "text-slate-300"
                            )}>Flows</span>
                            <span className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                Achieve your goals faster with sales and customer service automation
                            </span>
                        </div>
                    </button>
                </div>

                {/* Pricing Grid */}
                <div className="w-full max-w-7xl px-4 pb-20 overflow-x-auto pb-4 custom-scrollbar">
                    <div className="flex items-stretch gap-6 min-w-max pb-4 justify-center">

                        {/* Recommendation Card */}
                        <div className="w-[300px] flex-shrink-0 bg-[#13151a] border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-start text-center h-[500px]">
                            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 border border-amber-500/20">
                                <Lightbulb size={28} className="text-amber-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4">Not sure which plan to choose?</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                Answer a few questions, and let us personalize your subscription.
                            </p>
                            <Button variant="outline" className="w-full bg-blue-600/10 text-blue-400 border-blue-500/30 hover:bg-blue-600/20">
                                Get recommendations
                            </Button>
                        </div>

                        {/* Rendering Active Tab Plans */}
                        {renderPlans().map((plan, i) => (
                            <div key={i} className="w-[340px] flex-shrink-0 relative mt-4">
                                <PricingCard tier={plan} />
                            </div>
                        ))}
                    </div>
                </div>

            </main>
        </div>
    );
}
