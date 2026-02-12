"use client";

import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { MessageSquare, Plus, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function MacrosPage() {
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState('All');

    const handleSidebarNav = (tab: string) => {
        if (tab === 'Macros') return;
        const routes: Record<string, string> = {
            'Email': '/panel/settings/email',
            'Facebook': '/panel/settings/facebook',
            'Instagram': '/panel/settings/instagram',
            'WhatsApp': '/panel/settings/whatsapp',
            'Account': '/panel/settings/account',
            'Notifications': '/panel/settings/notifications',
            'Operating hours': '/panel/settings/operating-hours',
            'Workflows': '/panel/settings/workflows'
        };

        if (routes[tab]) {
            router.push(routes[tab]);
        } else {
            router.push('/panel/settings');
        }
    };

    const categories = [
        { label: 'All', count: 7 },
        { label: '#brb', count: 1 },
        { label: '#love', count: 1 },
        { label: '#flows', count: 1 },
        { label: '#hi', count: 1 },
        { label: '#info', count: 1 },
        { label: '#lead', count: 2 },
        { label: '#offer', count: 1 },
        { label: '#wait', count: 1 },
    ];

    const macros = [
        { id: 1, text: "Hello there 👋 What can I help you with?", category: '#hi' },
        { id: 2, text: "Let me check that for you real quick. I'll be back in a moment!", category: '#brb' },
        { id: 3, text: "In the meantime, could you please leave your email address so I can get back to you in case we're disconnected?", category: '#lead' },
        { id: 4, text: "By the way, we have an awesome sales going on for a limited time", category: '#offer' },
        { id: 5, text: "I can send you an email with more details if you'd like. What email should I send it to?", category: '#info' },
        { id: 6, text: "You're welcome, please let me know if there's anything else I can help with!", category: '#love' },
    ];

    return (
        <div className="flex min-h-screen bg-[#0f1115] overflow-hidden h-screen">
            <div className="h-full overflow-y-auto pt-8 pl-8 pb-8">
                <SettingsSidebar activeTab="Macros" onTabChange={handleSidebarNav} />
            </div>

            <div className="flex-1 overflow-y-auto h-full p-8 relative custom-scrollbar">
                <div className="max-w-[1200px] animate-in fade-in slide-in-from-bottom-2 duration-300">

                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-2xl font-bold text-white">Macros</h1>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 flex items-center gap-2">
                            <Plus size={18} />
                            Create a new macro
                        </Button>
                    </div>
                    <p className="text-zinc-400 mb-8 max-w-3xl text-sm">
                        Macros are responses to your most common customer questions, with or without a set of actions, that can be applied to Tickets or Live conversations.
                    </p>

                    {/* Main Container */}
                    <div className="bg-[#18181b] border border-white/5 rounded-xl flex min-h-[600px] overflow-hidden">

                        {/* Sidebar */}
                        <div className="w-64 border-r border-white/5 bg-[#18181b]/50">
                            <div className="p-2 space-y-1">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.label}
                                        onClick={() => setActiveCategory(cat.label)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-colors",
                                            activeCategory === cat.label
                                                ? "bg-blue-500/10 text-blue-400 font-medium"
                                                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                                        )}
                                    >
                                        <span>{cat.label}</span>
                                        <span className="text-xs text-zinc-500">{cat.count}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 bg-[#18181b]">
                            {macros.map((macro) => (
                                <div key={macro.id} className="group flex items-start justify-between p-6 border-b border-white/5 hover:bg-white/[0.02] transition-colors relative">
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <p className="text-white text-sm leading-relaxed">{macro.text}</p>
                                            <p className="text-white text-sm leading-relaxed font-medium">{macro.text.split('?')[0] + '?'}</p>
                                        </div>
                                        <p className="text-zinc-500 text-xs italic">No actions on send</p>
                                    </div>

                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 absolute right-6 top-6">
                                        <button className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                                            <Pencil size={16} />
                                        </button>
                                        <button className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>

                {/* FAB */}
                <Button className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-900/20 flex items-center justify-center p-0 z-50">
                    <MessageSquare className="text-white" size={24} />
                </Button>
            </div>
        </div>
    );
}
