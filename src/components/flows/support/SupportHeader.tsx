"use client";

import { Search, ArrowUpDown, LayoutGrid, Shield, Zap, Split, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SupportHeaderProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export function SupportHeader({ activeTab, onTabChange }: SupportHeaderProps) {
    const tabs = [
        { id: 'All', icon: LayoutGrid, label: 'All' },
        { id: 'Deflect', icon: Shield, label: 'Deflect' },
        { id: 'Initiate', icon: Zap, label: 'Initiate' },
        { id: 'Triage', icon: Split, label: 'Triage' },
        { id: 'Self-service', icon: Sparkles, label: 'Self-service' },
    ];

    return (
        <div className="mb-10">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-white">Support Flows</h1>

                <div className="flex-1 max-w-xl mx-8 relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search for template..."
                        className="w-full h-10 pl-10 pr-4 rounded-lg bg-[#18181b] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <button className="h-10 w-10 flex items-center justify-center rounded-lg bg-[#18181b] border border-white/10 text-zinc-400 hover:text-white transition-colors">
                        <ArrowUpDown size={16} />
                    </button>
                    <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 gap-2">
                        Create from scratch
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-6">
                <div className="flex items-center gap-8 border-b border-transparent">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={cn(
                                    "flex flex-col items-center gap-2 pb-3 px-2 border-b-2 transition-all",
                                    activeTab === tab.id
                                        ? "border-blue-500 text-blue-500"
                                        : "border-transparent text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                <Icon size={20} />
                                <span className="text-xs font-medium">{tab.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            <p className="text-zinc-500 text-center text-sm max-w-2xl mx-auto">
                {activeTab === 'Initiate'
                    ? "Proactively engage with customers for superior support! These templates facilitate meaningful interactions, providing timely assistance and proactive guidance to enhance customer engagement and satisfaction."
                    : activeTab === 'Triage'
                        ? "Efficiently manage and prioritize customer inquiries! Triage templates optimize the process by gathering pertinent information upfront, ensuring swift and accurate resolution of issues, thus prioritizing tasks effectively to deliver timely resolutions."
                        : activeTab === 'Self-service'
                            ? "Empower customers with self-reliant solutions! Self-Service templates equip users with comprehensive resources to address common queries independently, enhancing user experience and reducing support overheads."
                            : "Enhance efficiency in issue resolution! Our Deflect templates direct inquiries towards swift solutions, significantly reducing ticket volume and freeing up your team's time for complex queries."
                }
            </p>

        </div>
    );
}
