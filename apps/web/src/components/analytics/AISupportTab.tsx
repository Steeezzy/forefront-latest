"use client";

import { Info, Search } from 'lucide-react';

export function AISupportTab() {
    return (
        <div className="space-y-6">
            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#ffffff] p-6 rounded-xl border border-gray-200">
                {[
                    { label: 'All conversations', value: '0' },
                    { label: 'Resolved conversations', value: '0' },
                    { label: 'Resolution rate', value: '0%' },
                    { label: 'Transferred to agent', value: '0' }
                ].map((metric, index) => (
                    <div key={index} className={`flex flex-col gap-1 ${index !== 3 ? 'md:border-r border-gray-200' : ''} px-4`}>
                        <div className="flex items-center gap-1.5 text-zinc-400 text-xs uppercase font-medium">
                            {metric.label}
                            <Info size={12} className="cursor-help" />
                        </div>
                        <div className="text-3xl font-light text-gray-900">{metric.value}</div>
                    </div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                    'Conversation resolution',
                    'Conversations resolution share'
                ].map((title, i) => (
                    <div key={i} className="bg-[#ffffff] p-6 rounded-xl border border-gray-200 min-h-[400px] flex flex-col">
                        <h3 className="text-gray-900 font-medium mb-8">{title}</h3>

                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            {/* Empty State Illustration */}
                            <div className="relative mb-6">
                                <div className="w-24 h-16 bg-white/5 rounded-lg border border-gray-200 flex items-center justify-center relative z-10">
                                    <div className="w-12 h-2 bg-white/10 rounded-full mb-2"></div>
                                    <div className="w-8 h-2 bg-white/10 rounded-full"></div>
                                </div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent rotate-12"></div>
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
                                    <Search size={14} className="text-blue-400" />
                                </div>
                            </div>

                            <p className="text-gray-900 font-semibold mb-1">We're collecting data for you.</p>
                            <p className="text-zinc-500 text-sm">Come back later for updates.</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Section */}
            <div className="bg-[#ffffff] p-6 rounded-xl border border-gray-200 min-h-[300px] flex flex-col">
                <div className="flex items-center gap-2 mb-8">
                    <h3 className="text-gray-900 font-medium">Resolution rate</h3>
                    <Info size={14} className="text-zinc-600" />
                </div>

                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    {/* Reuse Empty State Illustration */}
                    <div className="relative mb-6">
                        <div className="w-24 h-16 bg-white/5 rounded-lg border border-gray-200 flex items-center justify-center relative z-10">
                            <div className="w-12 h-2 bg-white/10 rounded-full mb-2"></div>
                            <div className="w-8 h-2 bg-white/10 rounded-full"></div>
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent -rotate-6"></div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
                            <Search size={14} className="text-blue-400" />
                        </div>
                    </div>
                    <p className="text-gray-900 font-semibold mb-1">We're collecting data for you.</p>
                    <p className="text-zinc-500 text-sm">Come back later for updates.</p>
                </div>
            </div>

        </div>
    );
}
