"use client";

import { LyroSidebar } from '@/components/lyro/LyroSidebar';
import { AlertBanner } from '@/components/lyro/AlertBanner';
import { HubSetupCard } from '@/components/lyro/HubSetupCard';
import { PerformanceSection } from '@/components/lyro/PerformanceSection';
import { KnowledgeSection } from '@/components/lyro/KnowledgeSection';

export default function LyroHubPage() {
    return (
        <div className="flex h-screen bg-[#0f1115] overflow-hidden">
            <LyroSidebar />

            <main className="flex-1 overflow-y-auto w-full">
                <div className="max-w-5xl mx-auto p-4 md:p-8">
                    {/* Top Alert Banner */}
                    <AlertBanner />

                    {/* Main Hub Setup Card */}
                    <HubSetupCard />

                    {/* Performance Section */}
                    <PerformanceSection />

                    {/* Knowledge Section */}
                    <KnowledgeSection />
                </div>
            </main>
        </div>
    );
}
