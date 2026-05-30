"use client";

import { MessageSquare, Mail, Instagram, Facebook, Globe } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function PerformanceSection() {
    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Performance</h2>
                <a href="#" className="text-sm text-blue-500 hover:text-blue-400 font-medium">View full analytics ↗</a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Live Conversations Card */}
                <div className="bg-[#ffffff] border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="text-gray-900 font-semibold">Live conversations</span>
                        <span className="text-slate-500 text-xs border border-gray-200 rounded px-1.5 py-0.5">?</span>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-slate-400 text-xs mb-1">All conversations</p>
                            <p className="text-2xl font-bold text-gray-900">—</p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs mb-1">Resolved</p>
                            <p className="text-2xl font-bold text-gray-900">—</p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs mb-1">Resolution rate</p>
                            <p className="text-2xl font-bold text-gray-900">—</p>
                        </div>
                    </div>
                </div>

                {/* Emails Card */}
                <div className="bg-[#ffffff] border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="text-gray-900 font-semibold">Emails</span>
                        <span className="text-slate-500 text-xs border border-gray-200 rounded px-1.5 py-0.5">?</span>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-slate-400 text-xs mb-1">All emails</p>
                            <p className="text-2xl font-bold text-gray-900">—</p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs mb-1">Resolution rate</p>
                            <p className="text-2xl font-bold text-gray-900">—</p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs mb-1">First-answer rate</p>
                            <p className="text-2xl font-bold text-gray-900">—</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Controls */}
            <div className="bg-[#ffffff] border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Switch />
                        <span className="text-slate-300 text-sm">Conversations limit: 0 / 50</span>
                        <span className="text-slate-500 text-xs border border-gray-200 rounded px-1.5 py-0.5">?</span>
                    </div>
                    <Link href="/panel/upgrade" className="text-blue-500 text-sm hover:underline">Upgrade</Link>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-slate-400 text-sm">Conversa responds on:</span>
                    <div className="flex items-center gap-2 text-slate-500">
                        <MessageSquare size={16} />
                        <Instagram size={16} />
                        <Facebook size={16} />
                        <Globe size={16} />
                        <Mail size={16} />
                    </div>
                    <a href="#" className="text-blue-500 text-sm hover:underline ml-2">Configure</a>
                </div>
            </div>
        </div>
    );
}
