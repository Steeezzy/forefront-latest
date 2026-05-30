"use client";

import { use } from 'react';
import { ActionsSequenceBuilder } from '@/components/conversa/flow/ActionsSequenceBuilder';

// We use 'use' from react for params unwrap in NextJS 15+ 
export default function SequenceBuilderPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    return (
        <div className="h-screen w-full flex flex-col m-0 p-0 overflow-hidden select-none bg-[#f8fafc]">
            <ActionsSequenceBuilder actionId={resolvedParams.id} />
        </div>
    );
}
