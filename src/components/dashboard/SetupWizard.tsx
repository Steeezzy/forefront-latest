"use client";

import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SetupWizard() {
    return (
        <div className="bg-[#161920] border border-white/5 rounded-xl p-6 mb-6 relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-blue-500/10 transition-colors duration-500" />

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-4">
                    {/* Progress Circle */}
                    <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90">
                            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/10" />
                            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-emerald-500" strokeDasharray="125.6" strokeDashoffset="62.8" strokeLinecap="round" />
                        </svg>
                        <span className="absolute text-xs font-bold text-white">3/6</span>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">Finalize your Forefront setup</h3>
                        <p className="text-slate-400 text-sm">Let's get you setup to delight your customers. It's super easy and only takes a few minutes.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5">
                        Skip
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-500 text-white border-0 font-semibold px-6">
                        Finish setup
                    </Button>
                </div>
            </div>
        </div>
    );
}
