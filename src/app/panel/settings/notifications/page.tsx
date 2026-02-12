"use client";

import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown, Bell, MessageSquare, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

export default function NotificationsSettingsPage() {
    const router = useRouter();

    const handleSidebarNav = (tab: string) => {
        if (tab === 'Notifications') return;
        const routes: Record<string, string> = {
            'Email': '/panel/settings/email',
            'Facebook': '/panel/settings/facebook',
            'Instagram': '/panel/settings/instagram',
            'WhatsApp': '/panel/settings/whatsapp',
            'Account': '/panel/settings/account',
            'Operating hours': '/panel/settings/operating-hours',
            'Macros': '/panel/settings/macros',
            'Workflows': '/panel/settings/workflows'
        };

        if (routes[tab]) {
            router.push(routes[tab]);
        } else {
            // Default to main settings page for "General" or other tabs
            router.push('/panel/settings');
        }
    };

    const notificationTypes = [
        { label: 'New message', email: true, web: true, sound: 'Dong' },
        { label: 'New chat request', email: false, web: true, sound: 'Dong' },
        { label: 'Incoming visitor', email: false, web: false, sound: 'Dong' },
        { label: 'New ticket and ticket messages', email: false, web: true, sound: 'Dong' },
        { label: 'New mention', email: true, web: true, sound: 'Dong' },
    ];

    return (
        <div className="flex min-h-screen bg-[#0f1115] overflow-hidden h-screen">
            <div className="h-full overflow-y-auto pt-8 pl-8 pb-8">
                <SettingsSidebar activeTab="Notifications" onTabChange={handleSidebarNav} />
            </div>

            <div className="flex-1 overflow-y-auto h-full p-8 relative custom-scrollbar">
                <div className="max-w-[1000px] animate-in fade-in slide-in-from-bottom-2 duration-300">

                    {/* Alert Banner */}
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3 mb-8">
                        <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={18} />
                        <div>
                            <p className="text-red-400 text-sm font-medium">Your browser blocks notifications. You might miss some incoming chats. Read how to allow notifications in your browser.</p>
                        </div>
                    </div>

                    <h1 className="text-xl font-bold text-white mb-8">Notifications for Karthik J</h1>

                    {/* Notification Matrix */}
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 mb-8">
                        {/* Header Row */}
                        <div className="grid grid-cols-[2fr_1fr_1fr_2fr] gap-4 mb-6 px-4">
                            <div className="text-xs uppercase font-bold text-zinc-500 tracking-wider">Notification type</div>
                            <div className="text-xs uppercase font-bold text-zinc-500 tracking-wider text-center">Email ?</div>
                            <div className="text-xs uppercase font-bold text-zinc-500 tracking-wider text-center">Web notification ?</div>
                            <div className="text-xs uppercase font-bold text-zinc-500 tracking-wider">Web notification sound</div>
                        </div>

                        {/* Rows */}
                        <div className="space-y-1">
                            {notificationTypes.map((item, index) => (
                                <div key={index} className="grid grid-cols-[2fr_1fr_1fr_2fr] gap-4 items-center px-4 py-3 hover:bg-white/5 rounded-lg transition-colors">
                                    <div className="text-sm text-zinc-300 font-medium">{item.label}</div>

                                    <div className="flex justify-center">
                                        <div className={cn(
                                            "w-5 h-5 rounded border flex items-center justify-center transition-colors cursor-pointer",
                                            item.email ? "bg-blue-600 border-blue-600" : "bg-[#0f1115] border-zinc-700 hover:border-zinc-500",
                                            item.label === 'Incoming visitor' && "opacity-50 cursor-not-allowed"
                                        )}>
                                            {item.email && <Check size={14} className="text-white" />}
                                            {!item.email && item.label === 'Incoming visitor' && <span className="text-[10px] text-zinc-500">Not available</span>}
                                        </div>
                                    </div>

                                    <div className="flex justify-center">
                                        <div className={cn(
                                            "w-5 h-5 rounded border flex items-center justify-center transition-colors cursor-pointer",
                                            item.web ? "bg-blue-600 border-blue-600" : "bg-[#0f1115] border-zinc-700 hover:border-zinc-500"
                                        )}>
                                            {item.web && <Check size={14} className="text-white" />}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="relative">
                                            <select
                                                className="w-full bg-[#0f1115] border border-zinc-800 rounded-md py-2 pl-3 pr-8 text-sm text-white focus:border-blue-500 focus:outline-none appearance-none cursor-pointer"
                                                defaultValue={item.sound}
                                            >
                                                <option>Dong</option>
                                                <option>Ding</option>
                                                <option>Beep</option>
                                            </select>
                                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Forward Email Notifications */}
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-8">
                        <h2 className="text-lg font-bold text-white mb-2">Forward email notifications</h2>
                        <div className="flex items-start justify-between mb-6">
                            <p className="text-zinc-400 text-sm max-w-xl">
                                To receive email notifications to a private email, add it below. You will be notified every time someone sends a chat message when all agents are offline.
                            </p>
                            <div className="flex items-center gap-3">
                                <span className="text-zinc-400 text-sm">Enable</span>
                                <Switch checked={false} className="data-[state=checked]:bg-blue-600" />
                            </div>
                        </div>

                        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
                            Save
                        </Button>
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
