"use client";

import { useState } from 'react';
import { MessageSquare, Mail, Globe, AlertCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DomainConnectModal } from '@/components/settings/domains/DomainConnectModal';

export function RightSidebar() {
    const [domainModalOpen, setDomainModalOpen] = useState(false);

    return (
        <div className="w-full space-y-6">

            {/* Domain Connect Modal */}
            <DomainConnectModal open={domainModalOpen} onClose={() => setDomainModalOpen(false)} />

            {/* Project Status */}
            <div className="bg-[#ffffff] border border-[#e4e4e7] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <h3 className="text-[#09090b] font-semibold text-[13px] mb-4">Project status</h3>

                <div className="space-y-5">
                    {/* Chat Widget */}
                    <div className="group">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 text-gray-900 font-medium">
                                <MessageSquare size={16} />
                                <span className="text-[13px]">Chat Widget</span>
                            </div>
                            <AlertCircle size={16} className="text-red-500" />
                        </div>
                        <p className="text-slate-400 text-xs mb-2">Chat Widget is not installed</p>
                        <a href="#" className="text-[#6366f1] text-[13px] hover:underline">Install Chat Widget</a>
                    </div>

                    {/* Mailbox */}
                    <div className="group">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 text-gray-900 font-medium">
                                <Mail size={16} />
                                <span className="text-[13px]">Mailbox</span>
                            </div>
                        </div>
                        <a href="#" className="text-[#6366f1] text-[13px] hover:underline">Connect your mailbox</a>
                    </div>

                    {/* Domains */}
                    <div className="group">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 text-gray-900 font-medium">
                                <Globe size={16} />
                                <span className="text-[13px]">Domains</span>
                            </div>
                        </div>
                        <a onClick={() => setDomainModalOpen(true)} className="text-[#6366f1] text-[13px] hover:underline cursor-pointer">Connect domain</a>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between text-slate-400 hover:text-gray-900 cursor-pointer transition-colors">
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
            <div className="bg-[#ffffff] border border-[#e4e4e7] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <h3 className="text-[#09090b] font-semibold text-[13px] mb-4">Current usage</h3>

                <div className="space-y-6">
                    {/* Customer Service */}
                    <div>
                        <div className="flex items-center justify-between mb-2 text-sm">
                            <span className="text-gray-900 font-medium">Customer service</span>
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
                            <span className="text-gray-900 font-medium">AI Agent</span>
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
                            <span className="text-gray-900 font-medium">Flows</span>
                            <span className="text-slate-400">0 / 100</span>
                        </div>
                        <p className="text-slate-400 text-xs mb-2">Visitors reached</p>
                        <div className="w-full h-1.5 bg-white/5 rounded-full">
                            <div className="h-full w-0 bg-purple-500 rounded-full" />
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 text-[10px] text-slate-500">
                    Quota resets: 28 Feb 2026
                </div>
            </div>

        </div>
    );
}
