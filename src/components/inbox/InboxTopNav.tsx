"use client";

import { Search, HelpCircle, Bell, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

interface InboxTopNavProps {
  onSearchChange?: (query: string) => void;
  searchQuery?: string;
}

export function InboxTopNav({ onSearchChange, searchQuery = '' }: InboxTopNavProps) {
    const [localSearch, setLocalSearch] = useState(searchQuery);
    const [showNotifications, setShowNotifications] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    const handleSearchChange = (value: string) => {
      setLocalSearch(value);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        onSearchChange?.(value);
      }, 400);
    };

    return (
        <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#0f1115]">
            {/* Search */}
            <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                    type="text"
                    value={localSearch}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search in Inbox..."
                    className="w-full h-9 pl-9 pr-8 rounded-lg bg-[#161920] border border-white/5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
                {localSearch && (
                  <button
                    onClick={() => { setLocalSearch(''); onSearchChange?.(''); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 ml-4">
                <button className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5">
                    <HelpCircle size={18} />
                </button>

                <div className="relative">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
                    >
                        <Bell size={18} />
                    </button>
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-[#0f1115]" />

                    {showNotifications && (
                      <div className="absolute right-0 top-full mt-2 w-72 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/5">
                          <h4 className="text-sm font-semibold text-white">Notifications</h4>
                        </div>
                        <div className="p-8 text-center">
                          <Bell size={24} className="mx-auto text-zinc-700 mb-2" />
                          <p className="text-xs text-zinc-600">No new notifications</p>
                        </div>
                      </div>
                    )}
                </div>

                <Link href="/panel/settings/billing" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161920] border border-white/5 text-sm font-medium text-slate-400 cursor-pointer hover:bg-white/5 transition-colors">
                    <div className="w-4 h-4 rounded-full border border-slate-600" />
                    <span className="text-xs">Usage and plan</span>
                </Link>

                <Link href="/panel/upgrade">
                    <Button className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 font-semibold h-8 text-xs px-4">
                        Upgrade
                    </Button>
                </Link>
            </div>
        </div>
    );
}
