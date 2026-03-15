"use client";

import { ConversaSidebar } from '@/components/conversa/ConversaSidebar';
import { SuggestionsHeader } from '@/components/conversa/SuggestionsHeader';
import { BoostKnowledgeBanner } from '@/components/conversa/BoostKnowledgeBanner';
import { SuggestionsEmptyState } from '@/components/conversa/SuggestionsEmptyState';

export default function SuggestionsPage() {
    return (
        <div className="flex h-full bg-[#f8fafc]">
            {/* Inner Sidebar */}
            <ConversaSidebar />

            <div className="flex-1 h-full overflow-y-auto">
                <div className="max-w-6xl mx-auto p-8 lg:p-10 flex flex-col h-full">
                    <SuggestionsHeader />
                    <BoostKnowledgeBanner />
                    <SuggestionsEmptyState />
                </div>
            </div>
        </div>
    );
}
