import React from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Monitor, User } from 'lucide-react';

interface EmailHeroProps {
    title: string;
    steps: string[];
    buttonText: string;
    onButtonClick?: () => void;
    illustrationType: 'mailbox' | 'domains';
}

export function EmailHero({ title, steps, buttonText, onButtonClick, illustrationType }: EmailHeroProps) {
    return (
        <div className="bg-[#18181b] rounded-xl p-8 mb-8 flex flex-col md:flex-row items-center justify-between relative overflow-hidden border border-white/5">
            {/* Content */}
            <div className="relative z-10 max-w-lg">
                <h2 className="text-white text-lg font-semibold mb-6">{title}</h2>
                <div className="space-y-3 mb-8">
                    {steps.map((step, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 text-xs font-bold border border-white/10">
                                {index + 1}
                            </span>
                            <span className="text-zinc-400 text-sm">{step}</span>
                        </div>
                    ))}
                </div>
                <Button
                    onClick={onButtonClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6"
                >
                    {buttonText}
                </Button>
            </div>

            {/* Illustration */}
            <div className="relative mt-8 md:mt-0 md:mr-12">
                {illustrationType === 'mailbox' ? (
                    <div className="relative w-64 h-32">
                        {/* Mailbox Illustration */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg z-20 border-4 border-[#18181b]">
                            <Mail className="text-blue-600" size={32} />
                        </div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-32 h-20 bg-[#0f1115] rounded-lg border border-white/10 flex flex-col p-2 shadow-xl z-20">
                            <div className="w-full h-2 bg-zinc-800 rounded mb-2"></div>
                            <div className="w-2/3 h-2 bg-zinc-800 rounded"></div>
                        </div>
                        {/* Dotted Line */}
                        <svg className="absolute top-1/2 left-16 right-32 -translate-y-1/2 h-4 w-[calc(100%-8rem)]" overflow="visible">
                            <path d="M0,0 C40,-20 80,20 120,0" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" />
                        </svg>
                    </div>
                ) : (
                    <div className="relative w-64 h-32">
                        {/* Domains Illustration */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg z-20 border-4 border-[#18181b]">
                            <Mail className="text-blue-600" size={32} />
                        </div>

                        {/* Avatars */}
                        <div className="absolute right-0 top-0 w-10 h-10 bg-zinc-700 rounded-full border-2 border-[#18181b] z-10 flex items-center justify-center">
                            <User size={16} className="text-zinc-400" />
                        </div>
                        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-10 h-10 bg-zinc-600 rounded-full border-2 border-[#18181b] z-10 flex items-center justify-center">
                            <User size={16} className="text-zinc-300" />
                        </div>
                        <div className="absolute right-0 bottom-0 w-10 h-10 bg-zinc-500 rounded-full border-2 border-[#18181b] z-10 flex items-center justify-center">
                            <User size={16} className="text-zinc-200" />
                        </div>

                        {/* Dotted Line */}
                        <svg className="absolute top-1/2 left-16 right-10 -translate-y-1/2 h-8 w-[calc(100%-4rem)]" overflow="visible">
                            <path d="M0,0 C40,-10 80,-10 140,0" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="4 4" />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
}
