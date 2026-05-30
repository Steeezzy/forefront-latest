"use client";

import { ConversaSidebar } from '@/components/conversa/ConversaSidebar';
import { ActionsHeader } from '@/components/conversa/ActionsHeader';
import { ActionsTabs } from '@/components/conversa/ActionsTabs';
import { ActionsEmptyState } from '@/components/conversa/ActionsEmptyState';
import { ActionsTemplatesGrid } from '@/components/conversa/ActionsTemplatesGrid';

export default function ActionsPage() {
    return (
        <div className="flex h-full bg-[#f8fafc]">
            {/* Inner Sidebar */}
            <ConversaSidebar />

            <div className="flex-1 h-full overflow-y-auto">
                <div className="max-w-7xl mx-auto p-8 lg:p-10 flex flex-col min-h-full">
                    <ActionsHeader />
                    <ActionsTabs />
                    <ActionsEmptyState />
                    <ActionsTemplatesGrid />
                </div>
            </div>
        </div>
    );
}
