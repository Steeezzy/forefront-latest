"use client";

import { usePathname } from 'next/navigation';
import { Bot, BookOpen, Database, ShoppingBag, Lightbulb, Compass, Zap, Play, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const menuItems = [
    { icon: Bot, label: 'Hub', href: '/panel/chatbot' },
    { icon: BookOpen, label: 'Knowledge', href: '#' },
    { icon: Database, label: 'Data sources', href: '/panel/chatbot/data-sources' },
    { icon: ShoppingBag, label: 'Products', href: '/panel/chatbot/products' },
    { icon: Lightbulb, label: 'Suggestions', href: '/panel/chatbot/suggestions' },
    { icon: Compass, label: 'Guidance', href: '#' },
    { icon: Zap, label: 'Actions', href: '/panel/chatbot/actions' },
    { icon: Play, label: 'Playground', href: '#' },
    { icon: Settings, label: 'Configure', href: '/panel/chatbot/configure' },
];

export function LyroSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 border-r border-white/5 bg-[#0f1115] flex flex-col h-full overflow-y-auto">
            {/* Header */}
            <div className="h-14 flex items-center px-4 border-b border-white/5 gap-3">
                <div className="p-1.5 bg-blue-600/10 rounded-lg">
                    <Bot className="w-5 h-5 text-blue-500" />
                </div>
                <h1 className="font-bold text-lg text-white">Lyro AI Agent</h1>
            </div>

            <div className="flex-1 py-4 px-3">
                <nav className="space-y-0.5">
                    {menuItems.map((item, idx) => {
                        const isActive = pathname === item.href;
                        return (
                            <a
                                key={idx}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                    isActive
                                        ? "bg-[#1c1f26] text-white"
                                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <item.icon size={18} className={isActive ? "text-blue-500" : "text-slate-500"} />
                                <span>{item.label}</span>
                            </a>
                        );
                    })}
                </nav>
            </div>

            <div className="p-4 border-t border-white/5">
                <div className="flex items-center justify-between text-slate-400 text-sm mb-2">
                    <span>Conversations</span>
                    <span className="text-white">↗</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-sm">
                    <span>Analytics</span>
                    <span className="text-white">↗</span>
                </div>
            </div>
        </aside>
    );
}
