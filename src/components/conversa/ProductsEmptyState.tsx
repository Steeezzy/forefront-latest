"use client";

import { ShoppingBag, Box, Webhook, RefreshCw, ChevronDown } from 'lucide-react';

export function ProductsEmptyState() {
    return (
        <div className="bg-[#ffffff] border border-gray-200 rounded-xl p-8 lg:p-12 flex flex-col items-center justify-center min-h-[500px]">

            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Conversa doesn't know your product listing, yet!</h2>

            <div className="w-full max-w-2xl">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Business model</label>
                <div className="relative mb-8">
                    <select className="w-full h-12 pl-4 pr-10 rounded-lg bg-[#f9fafb] border border-gray-200 text-gray-900 appearance-none focus:outline-none focus:border-gray-200 transition-colors cursor-pointer">
                        <option>E-commerce (online store)</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Shopify Card (Incompatible) */}
                    <div className="bg-[#f9fafb]/40 border border-gray-200 rounded-xl p-6 opacity-60 cursor-not-allowed">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2.5 bg-white/5 rounded-lg text-slate-400">
                                <ShoppingBag size={24} />
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 uppercase">Incompatible</span>
                        </div>
                        <h3 className="text-gray-900 font-semibold mb-2">Shopify product sync</h3>
                        <p className="text-slate-400 text-sm mb-6">Sync your Shopify product database to respond to product questions.</p>
                        <div className="flex items-center gap-2 text-slate-500 text-xs">
                            <RefreshCw size={12} />
                            <span>Automatically updates</span>
                        </div>
                    </div>

                    {/* API Card (Active) */}
                    <div className="bg-[#f9fafb] border border-gray-200 rounded-xl p-6 hover:border-blue-500/30 transition-colors cursor-pointer group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2.5 bg-blue-600/10 rounded-lg text-blue-500 group-hover:text-blue-400 transition-colors">
                                <Webhook size={24} />
                            </div>
                        </div>
                        <h3 className="text-gray-900 font-semibold mb-2">Add products via API</h3>
                        <p className="text-slate-400 text-sm mb-6">Upload a large number of products and make frequent updates with ease. This method requires technical knowledge.</p>
                    </div>
                </div>
            </div>

        </div>
    );
}
