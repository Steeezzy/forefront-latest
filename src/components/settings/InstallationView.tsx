"use client";

import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function InstallationView() {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Alert Banner */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-4">
                <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={20} />
                <p className="text-red-400 text-sm leading-relaxed">
                    The widget is currently not visible to your customers. Please follow the instructions below to enable it.
                </p>
            </div>

            {/* Instruction Card */}
            <div className="bg-[#18181b] border border-white/5 rounded-xl p-8">
                <div className="flex flex-col md:flex-row gap-12">
                    {/* Visual Illustration */}
                    <div className="flex-1 space-y-8">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold absolute -left-14 top-0">1</div>
                            <h3 className="text-white font-semibold mb-2">To make the Forefront Agent live chat visible...</h3>
                            <p className="text-zinc-400 text-sm mb-6">turn it on in your Shopify theme editor.</p>
                            <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                                Go to Shopify Theme Editor
                            </Button>
                        </div>

                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center font-bold absolute -left-14 top-0">2</div>
                            <h3 className="text-white font-semibold mb-2">Visit your website to check if the widget is there.</h3>
                            <Button variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:text-white hover:bg-white/5">
                                Go to your website
                            </Button>
                        </div>
                    </div>

                    {/* Graphic */}
                    <div className="flex-1 bg-[#0f1115] rounded-xl border border-white/5 p-6 flex items-center justify-center min-h-[300px]">
                        <div className="w-full max-w-[280px] bg-[#18181b] rounded-lg p-4 shadow-xl border border-white/5">
                            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                                <span className="text-zinc-400 text-xs font-medium uppercase">App embeds</span>
                                <div className="w-8 h-4 bg-zinc-700 rounded-full"></div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-500 flex items-center justify-center">
                                            <div className="w-3 h-3 bg-current rounded-sm"></div>
                                        </div>
                                        <span className="text-white text-sm">Forefront Chat</span>
                                    </div>
                                    <div className="w-10 h-5 bg-blue-600 rounded-full relative cursor-pointer">
                                        <div className="w-3 h-3 bg-white rounded-full absolute top-1 right-1"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Footer */}
                <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-center gap-3 text-zinc-500 text-sm">
                    <Loader2 className="animate-spin" size={16} />
                    <span>checking widget activation...</span>
                </div>
            </div>
        </div>
    );
}
