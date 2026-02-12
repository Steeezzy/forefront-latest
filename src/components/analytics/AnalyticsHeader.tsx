"use client";

import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AnalyticsHeaderProps {
    currentView: string;
    aiTab?: string;
    setAiTab?: (tab: string) => void;
}

export function AnalyticsHeader({ currentView, aiTab, setAiTab }: AnalyticsHeaderProps) {
    return (
        <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-6">{currentView}</h1>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Tabs for AI Support */}
                {currentView === 'AI support' ? (
                    <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-lg border border-white/5 w-fit">
                        {['Live conversations', 'Emails', 'Knowledge performance'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setAiTab?.(tab)}
                                className={cn(
                                    "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                                    aiTab === tab
                                        ? "bg-white/10 text-blue-500 shadow-sm"
                                        : "text-zinc-400 hover:text-white"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div></div> // Spacer or Breadcrumbs
                )}

                {/* Controls: Date Picker & Interval */}
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 bg-[#18181b] border border-white/5 text-white px-4 py-2 rounded-lg text-sm hover:border-white/10 transition-colors">
                        <Calendar size={16} className="text-zinc-400" />
                        <span>10 Jan 2026 - 08 Feb 2026</span>
                        <ChevronDown size={14} className="text-zinc-500 ml-2" />
                    </button>

                    {currentView === 'AI support' && (
                        <button className="flex items-center gap-2 bg-[#18181b] border border-white/5 text-white px-4 py-2 rounded-lg text-sm hover:border-white/10 transition-colors w-24 justify-between">
                            <span>Daily</span>
                            <ChevronDown size={14} className="text-zinc-500" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
