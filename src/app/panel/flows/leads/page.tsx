"use client";

import { useState } from 'react';
import { FlowsSidebar } from '@/components/flows/FlowsSidebar';
import { LeadsHeader } from '@/components/flows/leads/LeadsHeader';
import { LeadsGrid } from '@/components/flows/leads/LeadsGrid';
import { FlowsFAB } from '@/components/flows/FlowsFAB';

export default function LeadsFlowsPage() {
    const [activeTab, setActiveTab] = useState('Gather');

    return (
        <div className="flex h-full bg-[#f8fafc]">
            <FlowsSidebar />

            <div className="flex-1 h-full overflow-y-auto relative">
                <div className="p-8 lg:p-10 pb-32 max-w-[1600px] mx-auto">
                    <LeadsHeader activeTab={activeTab} onTabChange={setActiveTab} />
                    <LeadsGrid activeTab={activeTab} />
                </div>
                <FlowsFAB />
            </div>
        </div>
    );
}
