"use client";

import { BookOpen, X } from 'lucide-react';

export function BoostKnowledgeBanner() {
    return (
        <div className="bg-[#f8fafc] border border-gray-200 rounded-xl p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">

            <div className="z-10 flex-1 min-w-0 pr-4">
                <h3 className="text-gray-900 font-semibold mb-2 text-lg">Boost the AI Agent knowledge</h3>
                <p className="text-slate-400 text-sm mb-4 leading-relaxed max-w-2xl">
                    The AI Agent collects similar unanswered questions or questions previously resolved by operators and suggests answers. Just review and add them — they'll appear in <span className="font-medium text-slate-300">Knowledge &gt; Data sources</span> and help both the AI Agent and Copilot respond better.
                </p>
                <a href="#" className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-400 text-sm font-medium transition-colors">
                    <BookOpen size={18} />
                    Learn about Suggestions
                </a>
            </div>

            {/* Visual / Illustration Placeholder */}
            <div className="relative w-full md:w-80 h-32 md:h-24 bg-[#f8fafc] rounded-lg border border-gray-200 p-3 flex flex-col gap-2 opacity-80 flex-shrink-0">
                {/* Mock Checklist Item 1 */}
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm border border-slate-600"></div>
                    <div className="h-2 w-3/4 bg-slate-700 rounded"></div>
                </div>
                {/* Mock Checklist Item 2 */}
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm border border-slate-600"></div>
                    <div className="h-2 w-1/2 bg-slate-700 rounded"></div>
                </div>
                {/* Mock Checklist Item 3 */}
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm border border-slate-600"></div>
                    <div className="h-2 w-2/3 bg-slate-700 rounded"></div>
                </div>

                {/* Close icon for the banner itself, positioned absolute top right of banner */}
                <button className="absolute -top-3 -right-3 text-slate-500 hover:text-gray-900 p-1">
                    <X size={14} />
                </button>
            </div>

        </div>
    );
}
