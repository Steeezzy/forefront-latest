"use client";

import { Sparkles } from 'lucide-react';

export function SuggestionsEmptyState() {
    return (
        <div className="bg-[#ffffff] border border-gray-200 rounded-xl flex flex-col items-center justify-center min-h-[500px] p-12 text-center flex-1">

            <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-8">
                <Sparkles className="text-blue-500 w-10 h-10" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">No suggestions to review</h2>
            <p className="text-slate-400 text-base max-w-lg mb-8 leading-relaxed">
                The AI Agent will add its own unanswered customer questions or those resolved by operators. Add these suggestions to Conversa knowledge to improve resolution rates.
            </p>

            <a href="#" className="text-blue-500 hover:text-blue-400 text-base font-medium hover:underline flex items-center gap-2">
                Learn more
            </a>

        </div>
    );
}
