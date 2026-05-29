"use client";

import { Moon, Sun, Bell, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

export function ModernHeader() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <header className="sticky top-0 z-[49] w-full border-b border-gray-200/60 bg-white/80 backdrop-blur-md">
            <div className="px-6 lg:px-8">
                <div className="flex h-16 items-center justify-end gap-5">
                    
                    {/* Theme Toggle */}
                    {mounted && (
                        <button
                            className="text-gray-500 hover:text-gray-900 transition-colors p-2"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        >
                            {theme === 'dark' ? <Sun className="h-[20px] w-[20px]" /> : <Moon className="h-[20px] w-[20px]" />}
                        </button>
                    )}

                    {/* Notifications */}
                    <div className="relative">
                        <button className="text-gray-500 hover:text-gray-900 transition-colors p-2">
                            <Bell className="h-[20px] w-[20px]" />
                        </button>
                        <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#ef4444] rounded-full border-2 border-white" />
                    </div>

                    {/* User Avatar */}
                    <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 p-1 rounded-xl transition-colors border border-gray-200/50 shadow-sm bg-white ml-2">
                        <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-[#101728] font-bold text-sm tracking-tight border border-gray-200 shadow-inner">
                            JD
                        </div>
                        <ChevronDown className="h-4 w-4 text-gray-400 mr-1" />
                    </div>

                    {/* Upgrade button */}
                    <Link href="/panel/upgrade" className="ml-1">
                        <Button className="bg-[#101728] hover:bg-gray-800 text-white border-0 shadow-lg shadow-[#101728]/10 text-sm font-semibold rounded-2xl px-8 h-10 transition-all hover:scale-[1.02] active:scale-[0.98]">
                            Upgrade
                        </Button>
                    </Link>

                </div>
            </div>
        </header>
    );
}
