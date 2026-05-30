"use client";

import { AlertTriangle } from 'lucide-react';

export function AlertBanner() {
    return (
        <div className="w-full bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-center gap-3 mb-6">
            <AlertTriangle className="text-amber-500 w-5 h-5 flex-shrink-0" />
            <span className="text-amber-500/90 text-sm font-medium">
                Install Chat Widget to make Conversa visible to your customers. <a href="#" className="underline hover:text-amber-400">Install chat widget</a>
            </span>
        </div>
    );
}
