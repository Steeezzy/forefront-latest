"use client";

import { Bell, HelpCircle, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DashboardHeader() {
    return (
        <header className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>

            <div className="flex items-center gap-4">
                {/* Help */}
                <button className="text-slate-400 hover:text-white transition-colors">
                    <HelpCircle size={20} />
                </button>

                {/* Notifications */}
                <div className="relative">
                    <button className="text-slate-400 hover:text-white transition-colors">
                        <Bell size={20} />
                    </button>
                    <div className="absolute -top-1 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-[#0f1115]" />
                </div>

                {/* Usage Pill */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161920] border border-white/5 text-sm font-medium text-slate-400 cursor-pointer hover:bg-white/5 transition-colors">
                    <div className="w-4 h-4 rounded-full border border-slate-600" />
                    <span>Usage and plan</span>
                    <ChevronDown size={14} />
                </div>

                {/* Upgrade Button */}
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 font-semibold gap-2">
                    Upgrade
                </Button>
            </div>
        </header>
    );
}
