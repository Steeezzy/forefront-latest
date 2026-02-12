"use client";

import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { MessageSquare, UserPlus, CheckCircle, Mail, CheckSquare, Search, Filter, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function WorkflowsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'My Workflows' | 'Templates'>('My Workflows');

    const handleSidebarNav = (tab: string) => {
        if (tab === 'Workflows') return;
        const routes: Record<string, string> = {
            'Email': '/panel/settings/email',
            'Facebook': '/panel/settings/facebook',
            'Instagram': '/panel/settings/instagram',
            'WhatsApp': '/panel/settings/whatsapp',
            'Account': '/panel/settings/account',
            'Notifications': '/panel/settings/notifications',
            'Operating hours': '/panel/settings/operating-hours',
            'Macros': '/panel/settings/macros'
        };

        if (routes[tab]) {
            router.push(routes[tab]);
        } else {
            router.push('/panel/settings');
        }
    };

    const templates = [
        {
            icon: UserPlus,
            title: "Assign conversations automatically",
            description: "Automatically route conversations to agents based on predefined rules such as workload or availability.",
            tag: "Live conversations"
        },
        {
            icon: CheckCircle,
            title: "Solve conversations automatically",
            description: "Automatically resolve conversations without a visitor reply on a chat after a specified period of time, without manual intervention.",
            cta: "Learn more",
            featured: true
        },
        {
            icon: Mail,
            title: "Send automatic ticket reply",
            description: "Provide instant acknowledgment by automatically sending a predefined reply when a ticket is received.",
            tag: "Tickets"
        },
        {
            icon: CheckSquare,
            title: "Solve tickets automatically",
            description: "Automatically resolve tickets without a customer reply after a specified period of time, without manual intervention.",
            tag: "Tickets"
        },
    ];

    return (
        <div className="flex min-h-screen bg-[#0f1115] overflow-hidden h-screen">
            <div className="h-full overflow-y-auto pt-8 pl-8 pb-8">
                <SettingsSidebar activeTab="Workflows" onTabChange={handleSidebarNav} />
            </div>

            <div className="flex-1 overflow-y-auto h-full p-8 relative custom-scrollbar">
                <div className="max-w-full animate-in fade-in slide-in-from-bottom-2 duration-300">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-2">Workflows</h1>
                            <p className="text-zinc-400 text-sm">Add a Workflow to automate repetitive tasks to increase your efficiency.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500">
                                Import
                            </Button>
                            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500">
                                Create from scratch
                            </Button>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                Add from template
                            </Button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-8 border-b border-white/5 mb-8 mt-6">
                        {['My Workflows', 'Templates'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={cn(
                                    "pb-4 text-sm font-medium transition-colors border-b-2",
                                    activeTab === tab
                                        ? "text-blue-500 border-blue-500"
                                        : "text-zinc-500 border-transparent hover:text-zinc-300"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    {activeTab === 'My Workflows' && (
                        <>
                            {/* Empty State List */}
                            <div className="bg-[#18181b] border border-white/5 rounded-xl mb-12">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                                    <div className="text-sm font-medium text-white">0 Workflows</div>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                                            <input
                                                type="text"
                                                className="bg-[#0f1115] border border-zinc-800 rounded-md py-1.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-blue-500 w-48"
                                            />
                                        </div>
                                        <button className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white px-3 py-1.5 border border-zinc-800 rounded-md hover:bg-white/5">
                                            Newest first <Filter size={12} />
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-[#18181b] min-h-[160px] flex flex-col">
                                    <div className="grid grid-cols-4 px-6 py-3 border-b border-white/5 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                        <div>Name</div>
                                        <div>Applied to</div>
                                        <div>Executed ?</div>
                                        <div>Active</div>
                                    </div>
                                    <div className="flex-1 flex items-center justify-center p-12">
                                        <p className="text-zinc-500 text-sm">You don't have any Workflows yet.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Template Explorer */}
                            <div>
                                <h3 className="text-white font-semibold mb-6">Explore how you can optimize your work with our templates</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                    {templates.map((template, index) => (
                                        <div key={index} className="bg-[#18181b] border border-white/5 rounded-xl p-6 flex flex-col h-full hover:border-zinc-700 transition-colors">
                                            <div className="flex items-center gap-2 mb-4 text-zinc-400">
                                                <template.icon size={18} />
                                                <span className="text-xs uppercase tracking-wide">Auto-assign</span>
                                            </div>
                                            <h4 className="text-white font-semibold mb-3 leading-snug">{template.title}</h4>
                                            <p className="text-zinc-400 text-xs leading-relaxed mb-6 flex-1">{template.description}</p>

                                            {template.featured ? (
                                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 h-9">
                                                    {template.cta}
                                                </Button>
                                            ) : (
                                                <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 self-start text-[10px] px-2 py-0.5 border-0">
                                                    {template.tag}
                                                </Badge>
                                            )}
                                        </div>
                                    ))}

                                    {/* Explore All Card */}
                                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 flex flex-col justify-center items-start h-full hover:border-zinc-700 transition-colors group cursor-pointer">
                                        <h4 className="text-white font-semibold text-lg mb-4">Explore all templates</h4>
                                        <div className="flex items-center gap-2 text-blue-500 font-medium text-sm group-hover:gap-3 transition-all">
                                            Explore all <ArrowRight size={16} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                </div>

                {/* FAB */}
                <Button className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-900/20 flex items-center justify-center p-0 z-50">
                    <MessageSquare className="text-white" size={24} />
                </Button>
            </div>
        </div>
    );
}
