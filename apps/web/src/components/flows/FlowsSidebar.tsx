"use client";

import { usePathname } from 'next/navigation';
import { Home, Layers, GitBranch, ShoppingCart, Users, LifeBuoy } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const menuItems = [
    { icon: Home, label: 'Welcome to Flows', href: '/panel/flows/welcome' },
    { icon: Layers, label: 'My Flows', href: '/panel/flows/my-flows' },
    { icon: GitBranch, label: 'Strategies', href: '/panel/flows/strategies' },
    { icon: ShoppingCart, label: 'Sales Flows', href: '/panel/flows/sales' },
    { icon: Users, label: 'Leads Flows', href: '/panel/flows/leads' },
    { icon: LifeBuoy, label: 'Support Flows', href: '/panel/flows/support' },
];

export function FlowsSidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 border-r border-gray-200 bg-[#f8fafc] flex flex-col h-full hidden md:flex">
            <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Flows</h2>
                <nav className="space-y-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-blue-500/10 text-blue-500"
                                        : "text-zinc-400 hover:text-gray-900 hover:bg-white/5"
                                )}
                            >
                                <Icon size={18} />
                                {item.label}
                                {item.label === 'My Flows' && (
                                    <span className="ml-auto text-xs opacity-60">1</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
