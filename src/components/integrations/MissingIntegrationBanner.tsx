"use client";

import { Button } from '@/components/ui/button';

export function MissingIntegrationBanner() {
    return (
        <div className="bg-[#18181b] rounded-xl p-8 mt-12 border border-white/5">
            <h3 className="text-white font-semibold text-lg mb-2">Can't find what you need?</h3>
            <p className="text-zinc-400 text-sm mb-6">
                Visit our OpenAPI documentation to learn about Forefront Agent capabilities. You can also submit your request and influence which integration we will develop next.
            </p>
            <div className="flex flex-wrap gap-4">
                <Button className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-0">
                    Submit a request
                </Button>
                <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/5">
                    Build your own integration
                </Button>
            </div>
        </div>
    );
}
