"use client";

import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function StrategiesGrid() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            {/* Card 1: Increase Sales */}
            <div className="bg-[#18181b] border border-white/5 rounded-xl p-8 flex flex-col">
                <div className="mb-6">
                    <span className="bg-yellow-500/20 text-yellow-500 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider mb-4 inline-block">
                        Inactive
                    </span>
                    <h2 className="text-2xl font-bold text-white mb-2">Increase sales</h2>
                    <p className="text-zinc-400 text-sm">Automate a buyer journey and sell more.</p>
                    <p className="text-zinc-500 text-xs mt-1">Includes: 4 Flows</p>
                </div>

                <div className="bg-[#0f1115] rounded-xl p-6 mb-8 flex-1">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-4 border-b border-white/5">
                            <span className="text-white font-medium">Increase engagement</span>
                            <CheckCircle2 className="text-emerald-500" size={18} />
                        </div>
                        <div className="flex items-center justify-between pb-4 border-b border-white/5">
                            <span className="text-white font-medium">Increase repeated purchases</span>
                        </div>
                        <div className="flex items-center justify-between pb-4 border-b border-white/5">
                            <span className="text-white font-medium">Increase conversion</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-white font-medium">Prevent cart abandonment</span>
                        </div>
                    </div>
                </div>

                <Button className="bg-blue-600 hover:bg-blue-500 text-white w-fit px-6">
                    Learn more
                </Button>
            </div>

            {/* Card 2: Solve Problems */}
            <div className="bg-[#18181b] border border-white/5 rounded-xl p-8 flex flex-col">
                <div className="mb-6">
                    <span className="bg-yellow-500/20 text-yellow-500 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider mb-4 inline-block">
                        Inactive
                    </span>
                    <h2 className="text-2xl font-bold text-white mb-2">Solve problems for Online Stores</h2>
                    <p className="text-zinc-400 text-sm">Keep in touch with your visitors when you are offline.</p>
                    <p className="text-zinc-500 text-xs mt-1">Includes: 3 Flows</p>
                </div>

                <div className="bg-[#0f1115] rounded-xl p-6 mb-8 flex-1">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-4 border-b border-white/5">
                            <span className="text-white font-medium">Reduce missed conversations</span>
                        </div>
                        <div className="flex items-center justify-between pb-4 border-b border-white/5">
                            <span className="text-white font-medium">Increase satisfaction</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-white font-medium">Decrease bounce rate</span>
                        </div>
                    </div>
                </div>

                <Button className="bg-blue-600 hover:bg-blue-500 text-white w-fit px-6">
                    Learn more
                </Button>
            </div>
        </div>
    );
}
