"use client";

import { use } from 'react';
import { ChatbotFlowCanvas } from '@/components/flows/builder/ChatbotFlowCanvas';
import { useParams } from 'next/navigation';

export default function ChatbotFlowBuilderPage({ params }: { params: Promise<{ industryId: string; flowId: string }> }) {
    const resolvedParams = use(params);
    return (
        <div className="h-screen w-full flex flex-col m-0 p-0 overflow-hidden select-none bg-[#f8fafc]">
            <ChatbotFlowCanvas flowId={resolvedParams.flowId} workspaceId={resolvedParams.industryId} />
        </div>
    );
}
