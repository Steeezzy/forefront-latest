"use client";

import { useState } from 'react';
import { FlowsSidebar } from '@/components/flows/FlowsSidebar';
import { SupportHeader } from '@/components/flows/support/SupportHeader';
import { SupportGrid } from '@/components/flows/support/SupportGrid';
import { FlowsFAB } from '@/components/flows/FlowsFAB';

export default function SupportFlowsPage() {
    const [activeTab, setActiveTab] = useState('Self-service');

    return (
        <div className="flex h-full bg-[#f8fafc]">
            <FlowsSidebar />

            <div className="flex-1 h-full overflow-y-auto relative">
                <div className="p-8 lg:p-10 pb-32 max-w-[1600px] mx-auto">
                    <SupportHeader activeTab={activeTab} onTabChange={setActiveTab} />
                    <SupportGrid activeTab={activeTab} />
                </div>
                <FlowsFAB />
            </div>
        </div>
    );
}
