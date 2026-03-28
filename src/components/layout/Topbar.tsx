"use client";

import { Moon, Sun, Bell, ChevronDown, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function TopBar() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Generate breadcrumbs from pathname
    const pathSegments = pathname.split('/').filter(segment => segment !== '');
    const breadcrumbs = pathSegments.map((segment, index) => {
        const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
        const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
        return { label, href, isLast: index === pathSegments.length - 1 };
    });

    return (
        <header className="sticky top-0 z-[49] w-full border-b border-gray-200/60 dark:border-white/5 bg-white/80 dark:bg-[#101728]/80 backdrop-blur-md transition-colors duration-300">
            <div className="px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between gap-5">
                    
                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-2 text-sm font-medium">
                        <Link href="/panel/dashboard" className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                            Home
                        </Link>
                        {breadcrumbs.length > 1 && breadcrumbs.slice(1).map((crumb, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <span className="text-gray-300 dark:text-gray-700">/</span>
                                <Link 
                                    href={crumb.href} 
                                    className={cn(
                                        "transition-colors capitalize",
                                        crumb.isLast 
                                            ? "text-gray-900 dark:text-white font-bold" 
                                            : "text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white"
                                    )}
                                >
                                    {crumb.label}
                                </Link>
                            </div>
                        ))}
                    </nav>

                    <div className="flex items-center gap-5">
                        {/* Industries Link */}
                        <Link href="/panel/industries" className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all border border-transparent hover:border-gray-200 dark:hover:border-white/10">
                            <Briefcase className="h-[18px] w-[18px]" />
                            <span className="text-[13px] font-semibold tracking-tight hidden sm:inline">Industries</span>
                        </Link>

                        {/* Theme Toggle */}
                        {mounted && (
                            <button
                                className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors p-2"
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            >
                                {theme === 'dark' ? <Sun className="h-[20px] w-[20px]" /> : <Moon className="h-[20px] w-[20px]" />}
                            </button>
                        )}

                        {/* Notifications */}
                        <div className="relative">
                            <button className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors p-2">
                                <Bell className="h-[20px] w-[20px]" />
                            </button>
                            <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#ef4444] rounded-full border-2 border-white dark:border-[#101728]" />
                        </div>

                        {/* User Avatar */}
                        <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 p-1 rounded-xl transition-colors border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 ml-2">
                            <div className="h-8 w-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-gray-900 dark:text-white font-bold text-xs tracking-tight border border-gray-200 dark:border-white/10">
                                JD
                            </div>
                            <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-1" />
                        </div>

                        {/* Upgrade button */}
                        <Link href="/panel/upgrade" className="ml-1">
                            <Button className="bg-gray-900 dark:bg-[#06d6a0] hover:bg-gray-800 dark:hover:bg-[#05b88a] text-white dark:text-[#101728] border-0 shadow-lg shadow-gray-200 dark:shadow-[#06d6a0]/10 text-xs font-bold rounded-xl px-6 h-9 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                Upgrade
                            </Button>
                        </Link>
                    </div>

                </div>
            </div>
        </header>
    );
}
