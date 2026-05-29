"use client";

import { Info, ChevronDown } from 'lucide-react';

export function HandoffSettings() {
    return (
        <>
            {/* Section 1: Handoff Audiences */}
            <div className="bg-[#ffffff] border border-gray-200 rounded-xl p-6 mb-6">
                <h3 className="text-gray-900 font-semibold mb-1">Handoff audiences</h3>
                <p className="text-slate-400 text-sm mb-4">
                    Choose which customers to exclude from the AI Agent. Conversa will redirect them to a human if they match the selected criteria. Do not select anything if you do not want to exclude anyone.
                </p>

                <input
                    type="text"
                    placeholder="Select audience to handoff"
                    className="w-full h-10 px-4 rounded-lg bg-[#f8fafc] border border-gray-200 text-slate-400 text-sm focus:outline-none focus:border-blue-500/50"
                />
            </div>

            {/* Section 2: Handoff Behavior */}
            <div className="bg-[#ffffff] border border-gray-200 rounded-xl p-6 mb-6">
                <h3 className="text-gray-900 font-semibold mb-1">Handoff</h3>
                <p className="text-slate-400 text-sm mb-6">
                    Choose how Conversa will behave on chat when a visitor asks for agent help.
                </p>

                <div className="space-y-4 max-w-3xl">
                    <div className="flex items-center justify-between">
                        <label className="text-gray-900 text-sm">When agents are online</label>
                        <div className="relative w-2/3">
                            <select className="w-full h-10 pl-3 pr-8 rounded-lg bg-[#f8fafc] border border-gray-200 text-gray-900 text-sm appearance-none focus:outline-none focus:border-blue-500/50">
                                <option>Transfer conversation to agent</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="text-gray-900 text-sm">When agents are offline</label>
                        <div className="relative w-2/3">
                            <select className="w-full h-10 pl-3 pr-8 rounded-lg bg-[#f8fafc] border border-gray-200 text-gray-900 text-sm appearance-none focus:outline-none focus:border-blue-500/50">
                                <option>Transfer conversation to agent</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 3: Predefined Answers */}
            <div className="bg-[#ffffff] border border-gray-200 rounded-xl p-6">
                <h3 className="text-gray-900 font-semibold mb-1">Predefined answers</h3>
                <p className="text-slate-400 text-sm mb-6">Customize responses to fit your need and preferences</p>

                <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-3 flex items-start gap-3 mb-8">
                    <Info className="text-blue-200 w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-200">
                        Conversa automatically translates predefined answers into <a href="#" className="underline hover:text-blue-100">all enabled languages</a>. To customize an answer for a specific language, <a href="#" className="underline hover:text-blue-100">use Guidance</a>.
                    </p>
                </div>

                <div className="space-y-8">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-1/3 text-gray-900 text-sm pt-2">Transfer conversation<br /><span className="text-slate-500">(agents are online)</span></div>
                        <textarea
                            className="w-full md:w-2/3 h-24 p-4 rounded-lg bg-[#f8fafc] border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-blue-500/50 resize-none leading-relaxed"
                            defaultValue="Absolutely! I'm transferring you to a human right away"
                        />
                    </div>
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-1/3 text-gray-900 text-sm pt-2">Transfer conversation<br /><span className="text-slate-500">(agents are offline)</span></div>
                        <textarea
                            className="w-full md:w-2/3 h-24 p-4 rounded-lg bg-[#f8fafc] border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-blue-500/50 resize-none leading-relaxed"
                            defaultValue="Currently, the team is unavailable, so I can't connect you. 😔 I'll pass along your message to our team, and they will contact you later."
                        />
                    </div>
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-1/3 text-gray-900 text-sm pt-2">Keep conversation<br /><span className="text-slate-500">(no transfer to agent)</span></div>
                        <textarea
                            className="w-full md:w-2/3 h-24 p-4 rounded-lg bg-[#f8fafc] border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-blue-500/50 resize-none leading-relaxed"
                            defaultValue="I'm sorry, the team is unavailable, so I can't connect you. 😔 Please try asking the question differently so I can help you better."
                        />
                    </div>
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-1/3 text-gray-900 text-sm pt-2">Create a ticket<br /><span className="text-slate-500">(transfer to online/offline agents)</span></div>
                        <textarea
                            className="w-full md:w-2/3 h-24 p-4 rounded-lg bg-[#f8fafc] border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-blue-500/50 resize-none leading-relaxed"
                            defaultValue="Currently, all of our operators are unavailable, so I'll transfer your message to our team, and they will contact you via email 🤩"
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
