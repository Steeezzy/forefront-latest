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

export function ConversaSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 border-r border-gray-200 bg-[#f8fafc] flex flex-col h-full overflow-y-auto">
            {/* Header */}
            <div className="h-14 flex items-center px-4 border-b border-gray-200 gap-3">
                <div className="p-1.5 bg-blue-600/10 rounded-lg">
                    <Bot className="w-5 h-5 text-blue-500" />
                </div>
                <h1 className="font-bold text-lg text-gray-900">Conversa AI Agent</h1>
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
                                        ? "bg-[#f8fafc] text-gray-900"
                                        : "text-slate-400 hover:bg-white/5 hover:text-gray-900"
                                )}
                            >
                                <item.icon size={18} className={isActive ? "text-blue-500" : "text-slate-500"} />
                                <span>{item.label}</span>
                            </a>
                        );
                    })}
                </nav>
            </div>

            <div className="p-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-slate-400 text-sm mb-2">
                    <span>Conversations</span>
                    <span className="text-gray-900">↗</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-sm">
                    <span>Analytics</span>
                    <span className="text-gray-900">↗</span>
                </div>
            </div>
        </aside>
    );
}
