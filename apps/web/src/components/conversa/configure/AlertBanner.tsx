"use client";

import { AlertTriangle } from 'lucide-react';

export function AlertBanner() {
    return (
        <div className="bg-orange-900/20 border border-orange-500/20 rounded-lg p-3 flex items-start gap-3 mb-8">
            <AlertTriangle className="text-orange-400 w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-orange-400">
                <span className="font-semibold">Install Chat Widget</span> to make Conversa visible to your customers. <a href="#" className="underline hover:text-orange-300">Install chat widget</a>
            </p>
        </div>
    );
}
