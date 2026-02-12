"use client";

import { ArrowRight, UserCog, Filter, Combine } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TemplateExplorer() {
    return (
        <div>
            <div className="mb-6">
                <h3 className="text-white font-bold text-lg">Explore what you can achieve with all of our templates</h3>
                <p className="text-zinc-500 text-sm">Flow templates to increase sales, generate leads, and solve problems.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1 */}
                <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:bg-[#1e2025] transition-colors cursor-pointer group">
                    <div className="flex items-center gap-2 mb-4 text-zinc-400 group-hover:text-blue-500 transition-colors">
                        <UserCog size={18} />
                        <span className="text-xs uppercase font-bold tracking-wider">Self-service</span>
                    </div>
                    <h4 className="text-white font-bold mb-2">AI Responder</h4>
                    <p className="text-zinc-500 text-xs leading-relaxed line-clamp-3 mb-4">
                        Automate up to 75% repetitive questions like "Hi", "Where can I..." to save time.
                    </p>
                    <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                        <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                        16.5K uses
                    </div>
                </div>

                {/* Card 2 */}
                <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:bg-[#1e2025] transition-colors cursor-pointer group">
                    <div className="flex items-center gap-2 mb-4 text-zinc-400 group-hover:text-blue-500 transition-colors">
                        <Filter size={18} />
                        <span className="text-xs uppercase font-bold tracking-wider">Triage</span>
                    </div>
                    <h4 className="text-white font-bold mb-2">Respond to greetings (AI)</h4>
                    <p className="text-zinc-500 text-xs leading-relaxed line-clamp-3 mb-4">
                        Set up automatic greeting messages & say hello to everyone.
                    </p>
                    <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                        <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                        7.9K uses
                    </div>
                </div>

                {/* Card 3 */}
                <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 hover:bg-[#1e2025] transition-colors cursor-pointer group">
                    <div className="flex items-center gap-2 mb-4 text-zinc-400 group-hover:text-blue-500 transition-colors">
                        <Combine size={18} />
                        <span className="text-xs uppercase font-bold tracking-wider">Gather</span>
                    </div>
                    <h4 className="text-white font-bold mb-2">Lead Magnet / Subscribe Form</h4>
                    <p className="text-zinc-500 text-xs leading-relaxed line-clamp-3 mb-4">
                        Automate your lead generation and collect visitors' contact information.
                    </p>
                    <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                        <span className="bg-zinc-800 w-3 h-3 block rounded-sm"></span>
                        56.2K uses
                    </div>
                </div>

                {/* Explore All Card */}
                <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 flex flex-col justify-center items-start min-h-[200px]">
                    <h4 className="text-white font-bold text-lg mb-4">Explore all templates</h4>
                    <Button variant="secondary" className="gap-2">
                        Explore all
                        <ArrowRight size={14} />
                    </Button>
                </div>

            </div>
        </div>
    );
}
