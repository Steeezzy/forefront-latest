"use client";

import { Bell, HelpCircle, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function DashboardHeader() {
    return (
        <header className="flex items-center justify-between mb-8">
            <h1 className="text-[20px] font-semibold text-[#09090b]">Dashboard</h1>

            <div className="flex items-center gap-4">
                {/* Help */}
                <button className="text-slate-400 hover:text-gray-900 transition-colors">
                    <HelpCircle size={20} />
                </button>

                {/* Notifications */}
                <div className="relative">
                    <button className="text-slate-400 hover:text-gray-900 transition-colors">
                        <Bell size={20} />
                    </button>
                    <div className="absolute -top-1 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-[#f8fafc]" />
                </div>

                {/* Usage Pill */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-sm font-medium text-slate-400 cursor-pointer hover:bg-gray-100 transition-colors">
                    <div className="w-4 h-4 rounded-full border border-slate-600" />
                    <span>Usage and plan</span>
                    <ChevronDown size={14} />
                </div>

                {/* Upgrade Button */}
                <Link href="/panel/upgrade">
                    <Button className="bg-[#09090b] hover:bg-[#18181b] text-[#ffffff] border-0 font-medium text-[13px] rounded-lg gap-2">
                        Upgrade
                    </Button>
                </Link>
            </div>
        </header>
    );
}
