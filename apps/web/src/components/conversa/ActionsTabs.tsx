"use client";

import { cn } from '@/lib/utils';

export function ActionsTabs() {
    return (
        <div className="flex items-center gap-6 border-b border-gray-200 mb-8">
            <button className="h-10 text-sm font-medium text-gray-900 border-b-2 border-blue-500 px-1">
                My Actions
            </button>
            <button className="h-10 text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors px-1">
                Templates
            </button>
        </div>
    );
}
