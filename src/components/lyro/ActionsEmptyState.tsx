"use client";

import { Button } from '@/components/ui/button';

export function ActionsEmptyState() {
    return (
        <div className="bg-[#18181b] border border-white/5 rounded-xl flex flex-col items-center justify-center min-h-[320px] p-8 text-center mb-12">

            <h2 className="text-xl font-bold text-white mb-2">You have no Actions yet</h2>
            <p className="text-slate-400 text-sm mb-8">
                Start creating your first Action or use one of our templates
            </p>

            <div className="flex items-center gap-3">
                <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
                    Create from scratch
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-500 text-white border-0">
                    Explore templates
                </Button>
            </div>

        </div>
    );
}
