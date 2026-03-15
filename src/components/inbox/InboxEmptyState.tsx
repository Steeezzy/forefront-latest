"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { MessageSquare, Sparkles, ArrowRight, Loader2 } from 'lucide-react';

interface InboxEmptyStateProps {
    onSimulate?: () => void;
}

export function InboxEmptyState({ onSimulate }: InboxEmptyStateProps) {
    const [simulating, setSimulating] = useState(false);

    const handleSimulate = async () => {
        setSimulating(true);
        try {
            await apiFetch('/api/inbox/simulate', { method: 'POST' });
            onSimulate?.();
        } catch (e) {
            console.error('Simulation failed:', e);
        } finally {
            setSimulating(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-[#f8fafc] to-[#f8fafc] rounded-2xl p-8 border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl" />

            <div className="max-w-lg relative">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-blue-500/10 rounded-lg">
                        <Sparkles size={16} className="text-blue-400" />
                    </div>
                    <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">Getting Started</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">No active conversations</h2>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    Before starting a real conversation with your visitors, simulate one to see how things work!
                    Test the AI auto-reply, agent takeover, and the full conversation experience.
                </p>
                <Button
                    onClick={handleSimulate}
                    disabled={simulating}
                    className="bg-blue-600 hover:bg-blue-500 text-gray-900 font-semibold px-6 py-5 text-base rounded-xl border-0 shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98]"
                >
                    {simulating ? (
                        <>
                            <Loader2 size={18} className="mr-2 animate-spin" />
                            Creating conversation...
                        </>
                    ) : (
                        <>
                            <MessageSquare size={18} className="mr-2" />
                            Simulate a conversation
                            <ArrowRight size={16} className="ml-2" />
                        </>
                    )}
                </Button>
            </div>

            {/* Conversation Preview Visual */}
            <div className="w-full max-w-xs hidden md:block relative">
                <div className="bg-white/80 rounded-xl border border-gray-200 p-4 space-y-3 backdrop-blur-sm">
                    {/* Simulated chat bubbles */}
                    <div className="flex justify-start">
                        <div className="bg-zinc-800 rounded-2xl rounded-bl-md px-3 py-2 max-w-[80%]">
                            <p className="text-xs text-zinc-300">Hi! I need help with pricing 💬</p>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <div className="bg-blue-600/20 border border-blue-500/20 rounded-2xl rounded-br-md px-3 py-2 max-w-[80%]">
                            <div className="flex items-center gap-1 mb-0.5">
                                <Sparkles size={8} className="text-blue-400" />
                                <span className="text-[9px] text-blue-400">Conversa AI</span>
                            </div>
                            <p className="text-xs text-blue-100">I&apos;d be happy to help! We offer several plans...</p>
                        </div>
                    </div>
                    <div className="flex justify-start">
                        <div className="bg-zinc-800 rounded-2xl rounded-bl-md px-3 py-2 max-w-[80%]">
                            <p className="text-xs text-zinc-300">That sounds great! 🎉</p>
                        </div>
                    </div>
                </div>
                {/* Floating badge */}
                <div className="absolute -top-2 -right-2 bg-green-500 text-gray-900 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-green-500/30">
                    AI Powered
                </div>
            </div>
        </div>
    );
}
