"use client";

import { PieChart, Monitor, Bot, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AnalyticsSidebarProps {
    currentView: string;
    onNavigate: (view: string) => void;
}

export function AnalyticsSidebar({ currentView, onNavigate }: AnalyticsSidebarProps) {
    const navItems = [
        { id: 'Overview', label: 'Overview', icon: PieChart },
        { id: 'Human support', label: 'Human support', icon: Users },
        { id: 'AI support', label: 'AI support', icon: Bot },
        { id: 'Sales & Leads', label: 'Sales & Leads', icon: Monitor },
    ];

    return (
        <div className="w-64 border-r border-white/5 bg-[#0f1115] flex flex-col h-[calc(100vh-64px)] p-4">
            <div className="space-y-1">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            currentView === item.id
                                ? "bg-transparent text-blue-500"
                                : "text-zinc-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <item.icon size={18} />
                            <span>{item.label}</span>
                        </div>
                        {currentView === item.id && (
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
