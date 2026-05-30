"use client";

import { ConversaSidebar } from '@/components/conversa/ConversaSidebar';
import { AlertBanner } from '@/components/conversa/AlertBanner';
import { HubSetupCard } from '@/components/conversa/HubSetupCard';
import { PerformanceSection } from '@/components/conversa/PerformanceSection';
import { KnowledgeSection } from '@/components/conversa/KnowledgeSection';

export default function ConversaHubPage() {
    return (
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
            <ConversaSidebar />

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
