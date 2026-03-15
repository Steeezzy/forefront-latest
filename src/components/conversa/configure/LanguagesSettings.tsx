"use client";

import { ChevronDown, HelpCircle, X } from 'lucide-react';

export function LanguagesSettings() {
    return (
        <div className="bg-[#ffffff] border border-gray-200 rounded-xl p-6 mb-6">
            <div className="mb-6">
                <h3 className="text-gray-900 font-semibold mb-1">Languages</h3>
                <p className="text-slate-400 text-sm">
                    Conversa detects and replies in the visitor's language. Some languages are still in testing, check the <a href="#" className="text-blue-500 hover:underline">full list here</a>. If a language can't be detected, Conversa will fall back to the default one.
                </p>
            </div>

            <div className="space-y-6 max-w-2xl">
                <div>
                    <label className="block text-sm text-slate-400 mb-2">Default language</label>
                    <div className="relative">
                        <select className="w-full h-10 pl-3 pr-8 rounded-lg bg-[#f8fafc] border border-gray-200 text-gray-900 text-sm appearance-none focus:outline-none focus:border-blue-500/50">
                            <option>English</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm text-slate-400 mb-2">Supported languages</label>
                    <div className="flex items-center gap-6 mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <div className="w-4 h-4 rounded-full border border-slate-500"></div>
                            <span className="text-gray-900 text-sm">All</span>
                            <HelpCircle size={14} className="text-slate-500" />
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <div className="w-4 h-4 rounded-full border-4 border-blue-600 bg-white"></div>
                            <span className="text-gray-900 text-sm">Specific languages</span>
                        </label>
                    </div>

                    {/* Tag Input Mock */}
                    <div className="w-full min-h-[40px] rounded-lg bg-[#f8fafc] border border-gray-200 p-1 flex items-center">
                        <span className="bg-[#f8fafc] text-gray-900 text-sm px-2 py-1 rounded flex items-center gap-1">
                            English
                            <X size={14} className="cursor-pointer hover:text-red-400" />
                        </span>
                    </div>

                </div>
            </div>
        </div>
    );
}
