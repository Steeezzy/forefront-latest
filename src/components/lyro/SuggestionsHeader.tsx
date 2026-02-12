"use client";

import { PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SuggestionsHeader() {
    return (
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
            <div className="max-w-3xl">
                <h1 className="text-2xl font-bold text-white mb-2">Suggestions</h1>
                <p className="text-slate-400 text-sm leading-relaxed">
                    Complete suggested questions to help Lyro handle similar queries, based on unanswered customer issues and past operator Q&A.
                </p>
            </div>

            <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 gap-2 w-fit flex-shrink-0">
                <PlayCircle size={16} />
                Test Lyro
            </Button>
        </div>
    );
}
