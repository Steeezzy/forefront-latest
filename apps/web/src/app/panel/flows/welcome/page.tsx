"use client";

import { FlowsSidebar } from '@/components/flows/FlowsSidebar';
import { WelcomeHero } from '@/components/flows/welcome/WelcomeHero';

export default function WelcomeFlowsPage() {
    return (
        <div className="flex h-full bg-[#f8fafc]">
            <FlowsSidebar />

            <div className="flex-1 h-full overflow-y-auto">
                <div className="p-8">
                    <WelcomeHero />
                </div>
            </div>
        </div>
    );
}
