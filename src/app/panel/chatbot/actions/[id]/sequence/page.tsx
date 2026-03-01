"use client";

import { use } from 'react';
import { ActionsSequenceBuilder } from '@/components/lyro/flow/ActionsSequenceBuilder';

// We use 'use' from react for params unwrap in NextJS 15+ 
export default function SequenceBuilderPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    return (
        <div className="h-screen w-full flex flex-col m-0 p-0 overflow-hidden select-none bg-[#0f1115]">
            <ActionsSequenceBuilder actionId={resolvedParams.id} />
        </div>
    );
}
