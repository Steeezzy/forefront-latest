"use client";

import { Search, ArrowUpDown, LayoutGrid, DollarSign, ShoppingCart, ArrowLeft, Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SalesHeaderProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export function SalesHeader({ activeTab, onTabChange }: SalesHeaderProps) {
    const tabs = [
        { id: 'All', icon: LayoutGrid, label: 'All' },
        { id: 'Upsell', icon: DollarSign, label: 'Upsell' },
        { id: 'Close deals', icon: ShoppingCart, label: 'Close deals' },
        { id: 'Win back', icon: ArrowLeft, label: 'Win back' },
        { id: 'Re-engage', icon: Sparkles, label: 'Re-engage' },
    ];

    return (
        <div className="mb-10">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-white">Sales Flows</h1>

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
                {activeTab === 'Win back'
                    ? "Rekindle customer interest with targeted win-back campaigns! Win-Back templates enable you to re-engage with dormant or lost customers effectively, revitalizing relationships and driving revenue growth."
                    : activeTab === 'Close deals'
                        ? "Achieve precision in sealing deals! Our Close Deals templates equip you with the necessary tools to navigate the final stages of the sales process adeptly, empowering your team to secure successful outcomes."
                        : "Revitalize customer relationships with proactive re-engagement strategies..."
                }
            </p>

        </div>
    );
}
