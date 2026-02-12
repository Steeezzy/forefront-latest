"use client";

import { CheckCircle2, Circle, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HubSetupCard() {
    return (
        <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Hub</h2>
                <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 gap-2">
                    <PlayCircle size={16} />
                    Test Lyro
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center bg-[#0f1115] rounded-xl p-6 border border-white/5">
                {/* Left: Progress */}
                <div className="flex flex-col items-center gap-4 flex-shrink-0 md:border-r border-white/5 md:pr-8">
                    <div className="relative w-20 h-20 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90">
                            <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/10" />
                            <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-emerald-500" strokeDasharray="201" strokeDashoffset="150" strokeLinecap="round" />
                        </svg>
                        <span className="absolute text-sm font-bold text-white">1/4</span>
                    </div>
                    <p className="text-white font-semibold text-center w-40 leading-tight">Follow these steps to complete Lyro setup</p>
                </div>

                {/* Right: Checklist */}
                <div className="flex-1 space-y-4 w-full">
                    {/* Step 1: Done */}
                    <div className="flex items-center gap-3 opacity-50">
                        <CheckCircle2 className="text-emerald-500 w-5 h-5 flex-shrink-0" />
                        <span className="text-slate-400 line-through decoration-slate-600">Add knowledge by providing the URL of your site</span>
                    </div>

                    {/* Step 2: Active */}
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center">
                            <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                        </div>
                        <span className="text-white font-medium">Test Lyro AI Agent</span>
                    </div>

                    {/* Step 3: Pending */}
                    <div className="flex items-center gap-3 opacity-40">
                        <Circle className="text-slate-600 w-5 h-5 flex-shrink-0" />
                        <span className="text-slate-400">Activate Lyro AI Agent</span>
                    </div>

                    {/* Step 4: Pending */}
                    <div className="flex items-center gap-3 opacity-40">
                        <Circle className="text-slate-600 w-5 h-5 flex-shrink-0" />
                        <span className="text-slate-400">Use suggestions to enhance your knowledge base</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
