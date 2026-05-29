"use client";

import { useState } from 'react';
import { ConversaSidebar } from '@/components/conversa/ConversaSidebar';
import { ConfigureHeader } from '@/components/conversa/configure/ConfigureHeader';
import { AlertBanner } from '@/components/conversa/configure/AlertBanner';
import { MainSettings } from '@/components/conversa/configure/MainSettings';
import { ChannelsSettings } from '@/components/conversa/configure/ChannelsSettings';
import { LanguagesSettings } from '@/components/conversa/configure/LanguagesSettings';
import { IdentitySettings } from '@/components/conversa/configure/IdentitySettings';
import { ContactPropertiesSettings } from '@/components/conversa/configure/ContactPropertiesSettings';
import { HandoffSettings } from '@/components/conversa/configure/HandoffSettings';
import { AudiencesSettings } from '@/components/conversa/configure/AudiencesSettings';
import { CopilotSettings } from '@/components/conversa/configure/CopilotSettings';

export default function ConfigurePage() {
    const [activeTab, setActiveTab] = useState('General');

    return (
        <div className="flex h-full bg-[#f8fafc]">
            {/* Inner Sidebar */}
            <ConversaSidebar />

            <div className="flex-1 h-full overflow-y-auto">
                <div className="max-w-4xl mx-auto p-8 lg:p-10 pb-20">
                    <ConfigureHeader activeTab={activeTab} onTabChange={setActiveTab} />

                    {activeTab === 'General' && (
                        <>
                            <AlertBanner />
                            <MainSettings />
                            <ChannelsSettings />
                            <LanguagesSettings />
                            <IdentitySettings />
                            <ContactPropertiesSettings />
                        </>
                    )}

                    {activeTab === 'Handoff' && <HandoffSettings />}
                    {activeTab === 'Audiences' && <AudiencesSettings />}
                    {activeTab === 'Copilot' && <CopilotSettings />}

                </div>
            </div>
        </div>
    );
}
