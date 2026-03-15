"use client";

import { ShoppingBag, Calendar, Share2, ArrowRight } from 'lucide-react';

export function ActionsTemplatesGrid() {
    return (
        <div>
            <div className="mb-6">
                <h3 className="text-gray-900 font-bold mb-1">Explore how Conversa can do more with templates</h3>
                <p className="text-slate-400 text-sm">
                    Templates let you get started quickly with minimal setup. Adjust them to suit your needs or create an Action from scratch for more advanced logic.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Shopify */}
                <div className="bg-[#ffffff] border border-gray-200 rounded-xl p-6 hover:bg-[#f8fafc] hover:border-gray-200 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4 text-emerald-500">
                        <ShoppingBag size={20} />
                    </div>
                    <h4 className="text-gray-900 font-semibold mb-2">Get order status from Shopify</h4>
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                        Empower customers to instantly check Shopify order status, payment fulfillment, purchased products & shipping details - right in chat. Answer this question 24/7.
                    </p>
                </div>

                {/* Calendly */}
                <div className="bg-[#ffffff] border border-gray-200 rounded-xl p-6 hover:bg-[#f8fafc] hover:border-gray-200 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4 text-blue-500">
                        <Calendar size={20} />
                    </div>
                    <h4 className="text-gray-900 font-semibold mb-2">Book a call in Calendly</h4>
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                        Turn interest into meetings. Automatically offer visitors a personalized Calendly link whenever they ask to book a call.
                    </p>
                </div>

                {/* HubSpot */}
                <div className="bg-[#ffffff] border border-gray-200 rounded-xl p-6 hover:bg-[#f8fafc] hover:border-gray-200 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4 text-orange-500">
                        <Share2 size={20} />
                    </div>
                    <h4 className="text-gray-900 font-semibold mb-2">Create a contact in HubSpot</h4>
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                        Instantly add visitors to your HubSpot CRM - capture leads details to grow your contacts database effortlessly.
                    </p>
                </div>

                {/* Explore All */}
                <div className="bg-[#ffffff] border border-gray-200 rounded-xl p-6 hover:bg-[#f8fafc] hover:border-gray-200 transition-colors cursor-pointer flex flex-col justify-center h-full min-h-[200px]">
                    <h4 className="text-gray-900 font-bold text-lg mb-4">Explore all templates</h4>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-gray-900 text-sm font-medium hover:bg-zinc-700 transition-colors w-fit">
                        Explore all
                        <ArrowRight size={14} />
                    </button>
                </div>

            </div>
        </div>
    );
}
