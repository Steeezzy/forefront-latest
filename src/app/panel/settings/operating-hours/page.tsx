"use client";

import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { MessageSquare, ChevronDown } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';

export default function OperatingHoursPage() {
    const router = useRouter();
    const [isEnabled, setIsEnabled] = useState(false);

    const handleSidebarNav = (tab: string) => {
        if (tab === 'Operating hours') return;
        const routes: Record<string, string> = {
            'Email': '/panel/settings/email',
            'Facebook': '/panel/settings/facebook',
            'Instagram': '/panel/settings/instagram',
            'WhatsApp': '/panel/settings/whatsapp',
            'Account': '/panel/settings/account',
            'Notifications': '/panel/settings/notifications',
            'Macros': '/panel/settings/macros',
            'Workflows': '/panel/settings/workflows'
        };

        if (routes[tab]) {
            router.push(routes[tab]);
        } else {
            router.push('/panel/settings');
        }
    };

    return (
        <div className="flex min-h-screen bg-[#0f1115] overflow-hidden h-screen">
            <div className="h-full overflow-y-auto pt-8 pl-8 pb-8">
                <SettingsSidebar activeTab="Operating hours" onTabChange={handleSidebarNav} />
            </div>

            <div className="flex-1 overflow-y-auto h-full p-8 relative custom-scrollbar">
                <div className="max-w-[1000px] animate-in fade-in slide-in-from-bottom-2 duration-300">

                    <h1 className="text-2xl font-bold text-white mb-2">Operating hours</h1>
                    <p className="text-zinc-400 mb-8 max-w-3xl text-sm">
                        Set a schedule when you are available to receive new messages. When you are offline, you can automatically send a message to properly manage expectations.
                    </p>

                    {/* Main Container */}
                    <div className="bg-[#18181b] border border-white/5 rounded-xl p-8 min-h-[500px]">

                        {/* Controls Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <Switch
                                    checked={isEnabled}
                                    onCheckedChange={setIsEnabled}
                                    className="data-[state=checked]:bg-blue-600"
                                />
                                <span className="text-white font-medium">
                                    {isEnabled ? 'Operating hours are enabled.' : 'Operating hours are disabled.'}
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-zinc-400 text-sm">Edit for</span>
                                <div className="relative w-64">
                                    <select
                                        className="w-full bg-[#0f1115] border border-zinc-800 rounded-md py-2 pl-3 pr-8 text-sm text-white focus:border-blue-500 focus:outline-none appearance-none cursor-pointer"
                                        defaultValue="me"
                                    >
                                        <option value="me">Karthik J (You)</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        {isEnabled ? (
                            <div className="text-center py-20">
                                <p className="text-zinc-500">Schedule configuration would go here...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                {/* Visual indicator for disabled state */}
                            </div>
                        )}

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
