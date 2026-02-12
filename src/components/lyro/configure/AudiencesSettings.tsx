"use client";

import { BookOpen, ChevronDown, Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AudiencesSettings() {
    return (
        <>
            {/* Banner */}
            <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h3 className="text-white font-bold mb-2">Use Lyro content to specific users</h3>
                    <p className="text-slate-400 text-sm mb-3 max-w-xl">
                        Create and manage custom audiences to control which knowledge Lyro uses — ensuring consistently relevant answers.
                    </p>
                    <a href="#" className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-400 text-sm font-medium transition-colors">
                        <BookOpen size={16} />
                        How to use audiences to target Lyro
                    </a>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AUDIENCE</label>
                    <div className="relative w-48">
                        <select className="w-full h-9 pl-3 pr-8 rounded-lg bg-[#0f1115] border border-white/10 text-white text-sm appearance-none focus:outline-none focus:border-blue-500/50">
                            <option>Everyone</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>
                </div>
            </div>

            {/* List Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">Audiences: 0</h3>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
                        Manage knowledge
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-500 text-white border-0 gap-2">
                        <Plus size={16} />
                        Add audience
                    </Button>
                </div>
            </div>

            {/* Empty State Table */}
            <div className="bg-[#18181b] border border-white/5 rounded-xl overflow-hidden min-h-[400px]">
                <div className="flex items-center border-b border-white/5 px-6 py-4 bg-[#1f2229]">
                    <div className="w-1/3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Audience name</div>
                    <div className="w-2/3 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Filter size={12} />
                        Filters
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[300px]">
                    <p className="text-slate-400 text-sm">
                        You don't have any audiences yet. <a href="#" className="text-blue-500 hover:underline">Add first audience</a>
                    </p>
                </div>
            </div>
        </>
    );
}
