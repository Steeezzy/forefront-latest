"use client";

import { PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConfigureHeaderProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export function ConfigureHeader({ activeTab, onTabChange }: ConfigureHeaderProps) {
    const tabs = ['General', 'Handoff', 'Audiences', 'Copilot'];

    return (
        <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-white">Configure</h1>
                <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 gap-2 w-fit">
                    <PlayCircle size={16} />
                    Test Lyro
                </Button>
            </div>

            <div className="flex items-center gap-6 border-b border-white/5">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => onTabChange(tab)}
                        className={cn(
                            "h-10 text-sm font-medium px-1 transition-colors relative",
                            activeTab === tab
                                ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-500"
                                : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>
    );
}
