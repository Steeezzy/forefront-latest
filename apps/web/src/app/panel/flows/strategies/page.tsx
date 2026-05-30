"use client";

import { FlowsSidebar } from '@/components/flows/FlowsSidebar';
import { StrategiesHeader } from '@/components/flows/strategies/StrategiesHeader';
import { StrategiesGrid } from '@/components/flows/strategies/StrategiesGrid';
import { TemplateExplorer } from '@/components/flows/strategies/TemplateExplorer';
import { FlowsFAB } from '@/components/flows/FlowsFAB';

export default function StrategiesPage() {
    return (
        <div className="flex h-full bg-[#f8fafc]">
            <FlowsSidebar />

            <div className="flex-1 h-full overflow-y-auto relative">
                <div className="p-8 lg:p-10 pb-32 max-w-[1600px] mx-auto">
                    <StrategiesHeader />
                    <StrategiesGrid />
                    <TemplateExplorer />
                </div>
                <FlowsFAB />
            </div>
        </div>
    );
}
