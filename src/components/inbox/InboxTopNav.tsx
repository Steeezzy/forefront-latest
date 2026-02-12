"use client";

import { Search, HelpCircle, Bell, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function InboxTopNav() {
    return (
        <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#0f1115]">
            {/* Search */}
            <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                    type="text"
                    placeholder="Search in Inbox..."
                    className="w-full h-9 pl-9 pr-4 rounded-lg bg-[#161920] border border-white/5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white/10 transition-colors"
                />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                <button className="text-slate-400 hover:text-white transition-colors">
                    <HelpCircle size={20} />
                </button>

                <div className="relative">
                    <button className="text-slate-400 hover:text-white transition-colors">
                        <Bell size={20} />
                    </button>
                    <div className="absolute -top-1 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-[#0f1115]" />
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161920] border border-white/5 text-sm font-medium text-slate-400 cursor-pointer hover:bg-white/5 transition-colors">
                    <div className="w-4 h-4 rounded-full border border-slate-600" />
                    <span>Usage and plan</span>
                </div>

                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 font-semibold h-8 text-xs px-4">
                    Upgrade
                </Button>
            </div>
        </div>
    );
}
