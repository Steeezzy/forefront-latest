"use client";

import { Search, ChevronDown, ArrowDownUp } from 'lucide-react';

export function DataSourcesFilterBar() {
    return (
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">

            <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
                {/* Search */}
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search by keyword or URL"
                        className="w-full h-9 pl-9 pr-4 rounded-lg bg-[#f8fafc] border border-gray-200 text-sm text-gray-900 placeholder-slate-500 focus:outline-none focus:border-gray-200 transition-colors"
                    />
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                    {['Show: All', 'Sources: All', 'Used by: All', 'Audiences: All'].map((filter) => (
                        <button
                            key={filter}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#f8fafc] border border-gray-200 text-sm text-slate-400 hover:text-gray-900 hover:bg-white/10 transition-colors whitespace-nowrap"
                        >
                            <span>{filter}</span>
                            <ChevronDown size={14} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Sort */}
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#f8fafc] border border-gray-200 text-sm text-slate-400 hover:text-gray-900 hover:bg-white/10 transition-colors ml-auto lg:ml-0">
                <ArrowDownUp size={14} />
                <span>Newest first</span>
            </button>

        </div>
    );
}
