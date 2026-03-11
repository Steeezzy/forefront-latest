"use client";

import { Button } from '@/components/ui/button';
import { ExternalLink, Code2, MessageSquarePlus } from 'lucide-react';

export function MissingIntegrationBanner() {
    return (
        <div className="bg-gradient-to-r from-[#18181b] to-[#1e1e24] rounded-xl p-8 mt-12 border border-white/5 relative overflow-hidden">
            {/* Subtle decorative glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl" />

            <div className="relative">
                <h3 className="text-white font-semibold text-lg mb-2 flex items-center gap-2">
                    <MessageSquarePlus size={20} className="text-blue-400" />
                    Can&apos;t find what you need?
                </h3>
                <p className="text-zinc-400 text-sm mb-6 max-w-xl">
                    Visit our OpenAPI documentation to learn about Forefront Agent capabilities. You can also submit your request and influence which integration we build next.
                </p>
                <div className="flex flex-wrap gap-3">
                    <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white border-0 gap-1.5"
                        onClick={() => window.open('https://docs.forefront.ai/integrations', '_blank')}
                    >
                        <ExternalLink size={14} />
                        Submit a request
                    </Button>
                    <Button
                        variant="ghost"
                        className="text-zinc-400 hover:text-white hover:bg-white/5 gap-1.5"
                        onClick={() => window.open('https://docs.forefront.ai/api', '_blank')}
                    >
                        <Code2 size={14} />
                        Build your own integration
                    </Button>
                </div>
            </div>
        </div>
    );
}
