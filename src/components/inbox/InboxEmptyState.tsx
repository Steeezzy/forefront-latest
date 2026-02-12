"use client";

import { Button } from '@/components/ui/button';

export function InboxEmptyState() {
    return (
        <div className="bg-black/20 rounded-xl p-8 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-lg">
                <h2 className="text-2xl font-bold text-white mb-4">No active conversations</h2>
                <p className="text-slate-400 text-base mb-6 leading-relaxed">
                    Before starting a real conversation with your visitors, simulate one to see how things work!
                </p>
                <Button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-5 text-base rounded-lg border-0 shadow-lg shadow-blue-500/20">
                    Simulate a conversation
                </Button>
            </div>

            {/* Simulation Graph Visual (Abstract) */}
            <div className="w-full max-w-xs h-32 relative hidden md:block opacity-50">
                <div className="absolute inset-0 border-l border-b border-slate-700"></div>
                {/* Simple SVG curve */}
                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none">
                    <path d="M0,50 Q25,50 40,30 T80,10 T100,50" fill="none" stroke="url(#gradient)" strokeWidth="1" />
                    <defs>
                        <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
                            <stop offset="50%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {/* Area fill */}
                    <path d="M0,50 Q25,50 40,30 T80,10 T100,50 L100,50 L0,50Z" fill="url(#fillGradient)" style={{ boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)' }} />
                    <defs>
                        <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
        </div>
    );
}
