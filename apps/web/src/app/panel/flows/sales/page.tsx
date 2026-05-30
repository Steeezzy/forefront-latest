"use client";

import { useState } from 'react';
import { FlowsSidebar } from '@/components/flows/FlowsSidebar';
import { SalesHeader } from '@/components/flows/sales/SalesHeader';
import { SalesGrid } from '@/components/flows/sales/SalesGrid';
import { FlowsFAB } from '@/components/flows/FlowsFAB';

export default function SalesFlowsPage() {
    const [activeTab, setActiveTab] = useState('Close deals');

    return (
        <div className="flex h-full bg-[#f8fafc]">
            <FlowsSidebar />

            <div className="flex-1 h-full overflow-y-auto relative">
                <div className="p-8 lg:p-10 pb-32 max-w-[1600px] mx-auto">
                    <SalesHeader activeTab={activeTab} onTabChange={setActiveTab} />
                    <SalesGrid activeTab={activeTab} />
                </div>
                <FlowsFAB />
            </div>
        </div>
    );
}
