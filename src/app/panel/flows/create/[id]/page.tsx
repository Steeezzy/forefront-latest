"use client";

import { use } from 'react';
import { FlowCanvas } from '@/components/flows/builder/FlowCanvas';

export default function FlowBuilderPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    return (
        <div className="h-screen w-full flex flex-col m-0 p-0 overflow-hidden select-none bg-[#f8fafc]">
            <FlowCanvas flowId={resolvedParams.id} />
        </div>
    );
}
