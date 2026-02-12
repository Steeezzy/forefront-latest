"use client";

import { Lightbulb, Globe, MessageSquare, Database, BookOpen, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const dataSources = [
    {
        icon: Lightbulb,
        title: "Suggestions",
        desc: "Knowledge to add from unanswered questions and past inbox over weeks",
        status: "0 questions to review",
        button: "Manage"
    },
    {
        icon: Globe,
        title: "Website URL",
        desc: "Content imported from URLs, like knowledge bases or websites",
        status: "1 page",
        button: "Manage"
    },
    {
        icon: MessageSquare,
        title: "Q&A",
        desc: "Question and answers content",
        status: "0 questions and answers",
        button: "Manage"
    },
    {
        icon: Database,
        title: "Product database",
        desc: "Content from your products used for product recommendation",
        status: "0 products",
        button: "Manage"
    }
];

export function KnowledgeSection() {
    return (
        <div>
            <h2 className="text-xl font-bold text-white mb-4">Knowledge</h2>

            {/* Score Banner */}
            <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    {/* Gauge Visual */}
                    <div className="relative w-32 h-16 overflow-hidden">
                        <div className="absolute top-0 left-0 w-32 h-32 rounded-full border-[12px] border-white/10 border-b-0 border-l-0 border-r-0 rotate-180" />
                        <div className="absolute top-0 left-0 w-32 h-32 rounded-full border-[12px] border-slate-600 border-b-0 border-l-0 border-r-0 rotate-180 clip-path-half" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)', transform: 'rotate(180deg)' }} />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full" />
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-semibold">We're gathering knowledge score data</span>
                            <span className="text-slate-500 text-xs border border-white/10 rounded px-1.5 py-0.5">?</span>
                        </div>
                        <p className="text-slate-400 text-sm">The score will appear once Lyro encounters questions it can't answer. Check back later!</p>
                    </div>
                </div>

                <Button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold">
                    Add knowledge
                </Button>
            </div>

            {/* Data Source List */}
            <div className="space-y-4 mb-8">
                {dataSources.map((item, idx) => (
                    <div key={idx} className="bg-[#18181b] border border-white/5 rounded-xl p-4 flex items-center justify-between hover:bg-[#1c1f26] transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-white/5 rounded-lg text-slate-400 group-hover:text-white transition-colors">
                                <item.icon size={20} />
                            </div>
                            <div>
                                <h4 className="text-white font-medium text-sm mb-0.5">{item.title}</h4>
                                <p className="text-slate-500 text-xs hidden md:block">{item.desc}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <span className="text-white text-sm font-medium">{item.status}</span>
                            <Button variant="outline" size="sm" className="border-white/10 text-white hover:bg-white/5 h-8">
                                {item.button}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-2 text-blue-500 text-sm font-medium hover:underline cursor-pointer">
                <BookOpen size={16} />
                <span>How to effectively add data sources</span>
            </div>
        </div>
    );
}
