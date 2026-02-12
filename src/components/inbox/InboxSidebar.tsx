"use client";

import { MessageSquare, Inbox, CheckCircle, Mail, Bot, ShoppingBag, Truck, AlertTriangle, FileText, Globe, Smartphone, User, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const liveConversations = [
    { icon: User, label: 'Unassigned', count: 0, href: '#', active: false },
    { icon: Inbox, label: 'My open', count: 0, href: '#', active: true },
    { icon: CheckCircle, label: 'Solved', count: 0, href: '#', active: false },
];

const tickets = [
    { icon: User, label: 'Unassigned', count: 0, href: '#', active: false },
    { icon: Inbox, label: 'My open', count: 0, href: '#', active: false },
    { icon: CheckCircle, label: 'Solved', count: 0, href: '#', active: false },
];

const views = [
    { icon: Bot, label: 'Lyro AI Agent', href: '#' },
    { icon: ShoppingBag, label: 'Products', href: '#' },
    { icon: Truck, label: 'Order status', href: '#' },
    { icon: AlertTriangle, label: 'Order issues', href: '#' },
    { icon: FileText, label: 'Shipping policy', href: '#' },
    { icon: MessageSquare, label: 'Messenger', href: '#' },
    { icon: Smartphone, label: 'Instagram', href: '#' },
    { icon: Globe, label: 'WhatsApp', href: '#' },
];

export function InboxSidebar() {
    return (
        <aside className="w-64 border-r border-white/5 bg-[#0f1115] flex flex-col h-full overflow-y-auto">
            {/* Header */}
            <div className="h-14 flex items-center px-4 border-b border-white/5 gap-3">
                <div className="p-1.5 bg-blue-600/10 rounded-lg">
                    <Inbox className="w-5 h-5 text-blue-500" />
                </div>
                <h1 className="font-bold text-lg text-white">Inbox</h1>
            </div>

            <div className="flex-1 py-4 px-3 space-y-6">

                {/* Live Conversations */}
                <div>
                    <div className="file:flex items-center justify-between px-2 mb-2">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Conversations</h3>
                        <button className="text-slate-500 hover:text-white"><Plus size={14} /></button>
                    </div>
                    <nav className="space-y-0.5">
                        {liveConversations.map((item, idx) => (
                            <a
                                key={idx}
                                href={item.href}
                                className={cn(
                                    "flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors group",
                                    item.active
                                        ? "bg-[#1c1f26] text-white"
                                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon size={16} className={item.active ? "text-blue-500" : "text-slate-500"} />
                                    <span>{item.label}</span>
                                </div>
                                {item.count > 0 && (
                                    <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded text-slate-300">{item.count}</span>
                                )}
                            </a>
                        ))}
                    </nav>
                </div>

                {/* Tickets */}
                <div>
                    <div className="flex items-center justify-between px-2 mb-2">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tickets</h3>
                        <button className="text-slate-500 hover:text-white"><Plus size={14} /></button>
                    </div>
                    <div className="px-2 mb-3">
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                            Messages from your mailbox or offline chat widget
                        </p>
                        <a href="#" className="block mt-1 text-[10px] text-blue-500 hover:underline">Connect mailbox</a>
                    </div>

                    <nav className="space-y-0.5">
                        {tickets.map((item, idx) => (
                            <a
                                key={idx}
                                href={item.href}
                                className={cn(
                                    "flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors group",
                                    item.active
                                        ? "bg-[#1c1f26] text-white"
                                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon size={16} className={item.active ? "text-blue-500" : "text-slate-500"} />
                                    <span>{item.label}</span>
                                </div>
                            </a>
                        ))}
                    </nav>
                </div>

                {/* Views */}
                <div>
                    <div className="flex items-center justify-between px-2 mb-2">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Views</h3>
                        <button className="text-slate-500 hover:text-white"><Plus size={14} /></button>
                    </div>
                    <nav className="space-y-0.5">
                        {views.map((item, idx) => (
                            <a
                                key={idx}
                                href={item.href}
                                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
                            >
                                <item.icon size={16} className="text-slate-500" />
                                <span>{item.label}</span>
                            </a>
                        ))}
                    </nav>
                </div>

            </div>
        </aside>
    );
}
