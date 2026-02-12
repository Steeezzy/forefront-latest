"use client";

import { MessageSquare, Plus, Check, Sparkles, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function WelcomeHero() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">
            <div className="bg-[#18181b] border border-white/5 rounded-xl p-12 text-center max-w-4xl w-full flex flex-col items-center">

                {/* Mock Browser Illustration */}
                <div className="w-full max-w-lg mx-auto mb-8 relative">
                    <div className="bg-zinc-800 rounded-t-lg h-6 flex items-center px-4 gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                        <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                    </div>
                    <div className="bg-[#0f1115] border-x border-b border-zinc-800 h-64 w-full rounded-b-lg relative p-4 overflow-hidden">
                        {/* Abstract content */}
                        <div className="flex gap-4 h-full">
                            <div className="w-1/3 space-y-3">
                                <div className="h-24 bg-zinc-800/50 rounded-md"></div>
                                <div className="h-24 bg-zinc-800/50 rounded-md"></div>
                            </div>
                            <div className="w-2/3 space-y-3">
                                <div className="h-8 bg-zinc-800/50 rounded-md w-3/4"></div>
                                <div className="space-y-2">
                                    <div className="h-2 bg-zinc-800/30 rounded w-full"></div>
                                    <div className="h-2 bg-zinc-800/30 rounded w-5/6"></div>
                                    <div className="h-2 bg-zinc-800/30 rounded w-4/5"></div>
                                </div>

                                {/* Chat Widget Pop */}
                                <div className="absolute bottom-6 right-6 bg-[#18181b] border border-white/10 p-4 rounded-xl shadow-2xl w-48 text-left z-10 animate-in slide-in-from-bottom duration-700">
                                    <div className="h-2 w-24 bg-zinc-700 rounded mb-2"></div>
                                    <div className="h-1.5 w-16 bg-zinc-800 rounded mb-4"></div>
                                    <div className="flex gap-2">
                                        <div className="h-6 w-full bg-blue-600/20 rounded border border-blue-500/30"></div>
                                        <div className="h-6 w-full bg-zinc-800 rounded"></div>
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                                        <MessageSquare size={14} className="text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">Reduce your support volume by 32%</h1>
                <p className="text-zinc-400 max-w-md mx-auto mb-8">
                    Encourage self-service with pre-designed conversation pathways.
                </p>

                <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-8 py-6 text-base font-medium mb-6">
                    <Plus size={18} className="mr-2" />
                    Add Support Flow
                </Button>

                <a href="#" className="flex items-center gap-2 text-blue-500 hover:text-blue-400 text-sm font-medium transition-colors mb-8">
                    <BookOpen size={16} />
                    Get to know Flows
                </a>

                {/* Footer Tip */}
                <div className="bg-[#0f1115] border border-white/5 rounded-lg p-4 flex items-start text-left gap-3 max-w-2xl w-full">
                    <Sparkles className="text-zinc-500 flex-shrink-0 mt-0.5" size={16} />
                    <div>
                        <h4 className="text-white text-sm font-semibold mb-1">Advanced Return Requests</h4>
                        <p className="text-zinc-500 text-xs leading-relaxed">
                            Optimize the return request process by efficiently collecting necessary details, evaluating eligibility, and guiding users through the return procedure.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
