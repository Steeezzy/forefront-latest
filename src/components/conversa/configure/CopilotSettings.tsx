"use client";

import { Info, BookOpen } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export function CopilotSettings() {
    return (
        <>
            {/* Copilot Banner */}
            <div className="bg-[#ffffff] border border-gray-200 rounded-xl mb-6 relative overflow-hidden flex flex-col md:flex-row">
                <div className="p-8 md:w-2/3 z-10">
                    <h3 className="text-gray-900 font-bold text-xl mb-3">Copilot</h3>
                    <p className="text-slate-400 text-sm mb-6 max-w-lg leading-relaxed">
                        Copilot is your AI assistant powered by the knowledge you've added. It learns from your data to suggest replies to customers, helping you solve tickets faster. Only you can see Copilot's suggestions.
                    </p>
                    <div className="flex items-center gap-6">
                        <a href="#" className="text-blue-500 hover:underline text-sm font-medium">Manage Copilot knowledge</a>
                        <a href="#" className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-400 text-sm font-medium transition-colors">
                            <BookOpen size={16} />
                            Learn about Copilot
                        </a>
                    </div>
                </div>

                {/* Abstract Visual Right Side */}
                <div className="hidden md:block md:w-1/3 relative bg-gradient-to-r from-[#ffffff] to-blue-900/10">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 bg-[#f8fafc] border border-gray-200 rounded-lg p-3 shadow-2xl skew-y-6 opacity-80">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                            <div className="h-1.5 w-16 bg-slate-700 rounded"></div>
                        </div>
                        <div className="space-y-1">
                            <div className="h-1.5 w-full bg-slate-800 rounded"></div>
                            <div className="h-1.5 w-2/3 bg-slate-800 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Auto-suggestions */}
            <div className="bg-[#ffffff] border border-gray-200 rounded-xl p-6 mb-6">
                <h3 className="text-gray-900 font-semibold mb-1">Auto-suggestions</h3>
                <p className="text-slate-400 text-sm mb-6">
                    Automatically generates suggested replies in your Inbox when you open a conversation.
                </p>
                <div className="flex items-center gap-3">
                    <Switch defaultChecked className="data-[state=checked]:bg-blue-600" />
                    <span className="text-gray-900 text-sm">Auto-suggestions</span>
                </div>
            </div>

            {/* Sources of suggestions */}
            <div className="bg-[#ffffff] border border-gray-200 rounded-xl p-6">
                <h3 className="text-gray-900 font-semibold mb-1">Sources of suggestions</h3>
                <p className="text-slate-400 text-sm mb-6">
                    Choose what Copilot uses to suggest replies to your customers.
                </p>

                <div className="space-y-4 max-w-xl">
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="mt-0.5 w-4 h-4 rounded-full border-2 border-blue-500 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        </div>
                        <div>
                            <span className="text-gray-900 text-sm font-medium block mb-0.5">Knowledge + AI improvisations</span>
                            <span className="text-slate-500 text-xs">Copilot uses your knowledge and general AI intelligence to suggest specific answers.</span>
                        </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="mt-0.5 w-4 h-4 rounded-full border-2 border-slate-600 group-hover:border-slate-500"></div>
                        <div>
                            <span className="text-zinc-400 group-hover:text-gray-900 text-sm font-medium block mb-0.5 transition-colors">Knowledge</span>
                            <span className="text-slate-500 text-xs">Copilot only suggests answers based on the knowledge you've provided.</span>
                        </div>
                    </label>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-slate-400 text-xs">
                        To review or update your sources <a href="#" className="text-blue-500 hover:underline">manage Copilot knowledge</a>.
                    </p>
                </div>
            </div>
        </>
    );
}
