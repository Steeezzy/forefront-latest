"use client";

import { MessageSquare } from 'lucide-react';

interface FlowsFABProps {
    agentId?: string | null;
}

export function FlowsFAB({ agentId }: FlowsFABProps) {
    return (
        <button className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-500 transition-colors z-50">
            <MessageSquare className="text-white" size={24} />
        </button>
    );
}
