"use client";

import { useState } from 'react';
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { ShopifySettingsView } from '@/components/settings/ShopifySettingsView';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ShopifySettingsPage() {
    const router = useRouter();
    const [activeTab] = useState('Shopify');

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
            'Workflows': '/panel/settings/workflows',
            'Channels': '/panel/settings/channels',
            'Shopify': '/panel/settings/shopify',
        };

        if (routes[tab]) {
            router.push(routes[tab]);
            return;
        }
        // For tabs handled by the main settings page
        router.push('/panel/settings');
    };

    return (
        <div className="flex min-h-screen bg-[#0f1115] overflow-hidden h-screen">
            <div className="h-full overflow-y-auto pt-8 pl-8 pb-8">
                <SettingsSidebar activeTab={activeTab} onTabChange={handleTabChange} />
            </div>
            <div className="flex-1 overflow-y-auto h-full p-8 relative">
                <ShopifySettingsView />
                <Button className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-900/20 flex items-center justify-center p-0 z-50">
                    <MessageSquare className="text-white" size={24} />
                </Button>
            </div>
        </div>
    );
}
