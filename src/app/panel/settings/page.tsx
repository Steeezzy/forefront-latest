"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { AppearanceView } from '@/components/settings/AppearanceView';
import { InstallationView } from '@/components/settings/InstallationView';
import { ChatPageView } from '@/components/settings/ChatPageView';
import { TranslationsView } from '@/components/settings/TranslationsView';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

export default function SettingsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('Appearance');

    const handleTabChange = (tab: string) => {
        const routes: Record<string, string> = {
            'Email': '/panel/settings/email',
            'Facebook': '/panel/settings/facebook',
            'Instagram': '/panel/settings/instagram',
            'WhatsApp': '/panel/settings/whatsapp',
            'Account': '/panel/settings/account',
            'Notifications': '/panel/settings/notifications',
            'Operating hours': '/panel/settings/operating-hours',
            'Macros': '/panel/settings/macros',
            'Workflows': '/panel/settings/workflows'
        };

        if (routes[tab]) {
            router.push(routes[tab]);
            return;
        }
        setActiveTab(tab);
    };

    return (
        <div className="flex min-h-screen bg-[#0f1115] overflow-hidden h-screen">
            {/* Sidebar */}
            <div className="h-full overflow-y-auto pt-8 pl-8 pb-8">
                <SettingsSidebar activeTab={activeTab} onTabChange={handleTabChange} />
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto h-full p-8 relative">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">{activeTab === 'Translations' ? 'Translations' : activeTab === 'Chat page' ? 'Chat page' : 'Settings'}</h1>
                </header>

                <div className="max-w-[1200px]">
                    {activeTab === 'Appearance' && <AppearanceView />}
                    {activeTab === 'Installation' && <InstallationView />}
                    {activeTab === 'Chat page' && <ChatPageView />}
                    {activeTab === 'Translations' && <TranslationsView />}
                </div>

                {/* Floating Action Button */}
                <Button className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-900/20 flex items-center justify-center p-0 z-50">
                    <MessageSquare className="text-white" size={24} />
                </Button>
            </div>
        </div>
    );
}
