"use client";

import { MessageSquare, Mail, Globe, AlertCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RightSidebar() {
    return (
        <div className="w-full space-y-6">

            {/* Project Status */}
            <div className="bg-[#161920] border border-white/5 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-4">Project status</h3>

                <div className="space-y-5">
                    {/* Chat Widget */}
                    <div className="group">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 text-white font-medium">
                                <MessageSquare size={16} />
                                <span>Chat Widget</span>
                            </div>
                            <AlertCircle size={16} className="text-red-500" />
                        </div>
                        <p className="text-slate-400 text-xs mb-2">Chat Widget is not installed</p>
                        <a href="#" className="text-blue-500 text-sm hover:underline">Install Chat Widget</a>
                    </div>

                    {/* Mailbox */}
                    <div className="group">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 text-white font-medium">
                                <Mail size={16} />
                                <span>Mailbox</span>
                            </div>
                        </div>
                        <a href="#" className="text-blue-500 text-sm hover:underline">Connect your mailbox</a>
                    </div>

                    {/* Domains */}
                    <div className="group">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 text-white font-medium">
                                <Globe size={16} />
                                <span>Domains</span>
                            </div>
                        </div>
                        <a href="#" className="text-blue-500 text-sm hover:underline">Connect domain</a>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between text-slate-400 hover:text-white cursor-pointer transition-colors">
                            <span className="text-xs">Add a channel:</span>
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
                                    <Plus size={12} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Current Usage */}
            <div className="bg-[#161920] border border-white/5 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-4">Current usage</h3>

                <div className="space-y-6">
                    {/* Customer Service */}
                    <div>
                        <div className="flex items-center justify-between mb-2 text-sm">
                            <span className="text-white font-medium">Customer service</span>
                            <span className="text-slate-400">0 / 50</span>
                        </div>
                        <p className="text-slate-400 text-xs mb-2">Billable conversations</p>
                        <div className="w-full h-1.5 bg-white/5 rounded-full mb-3">
                            <div className="h-full w-0 bg-blue-500 rounded-full" />
                        </div>
                        <a href="#" className="text-blue-500 text-xs hover:underline">Install Chat Widget</a>
                    </div>

                    {/* AI Agent */}
                    <div>
                        <div className="flex items-center justify-between mb-2 text-sm">
                            <span className="text-white font-medium">AI Agent</span>
                            <span className="text-slate-400">0 / 50</span>
                        </div>
                        <p className="text-slate-400 text-xs mb-2">AI Agent conversations</p>
                        <div className="w-full h-1.5 bg-white/5 rounded-full mb-2">
                            <div className="h-full w-0 bg-emerald-500 rounded-full" />
                        </div>
                        <p className="text-slate-500 text-[10px]">Lifetime quota</p>
                    </div>

                    {/* Flows */}
                    <div>
                        <div className="flex items-center justify-between mb-2 text-sm">
                            <span className="text-white font-medium">Flows</span>
                            <span className="text-slate-400">0 / 100</span>
                        </div>
                        <p className="text-slate-400 text-xs mb-2">Visitors reached</p>
                        <div className="w-full h-1.5 bg-white/5 rounded-full">
                            <div className="h-full w-0 bg-purple-500 rounded-full" />
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 text-[10px] text-slate-500">
                    Quota resets: 28 Feb 2026
                </div>
            </div>

        </div>
    );
}
