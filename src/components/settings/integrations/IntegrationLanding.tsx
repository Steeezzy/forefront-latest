import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Clock, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Feature {
    icon: any;
    title: string;
    text: string;
}

interface IntegrationLandingProps {
    platformName: string;
    icon: any; // The Platform Logo Icon
    description: string;
    buttonText: string;
    onIntegrate?: () => void;
    features?: Feature[]; // Optional, can default to standard ones
}

export function IntegrationLanding({
    platformName,
    icon: Icon,
    description,
    buttonText,
    onIntegrate,
    features
}: IntegrationLandingProps) {

    const defaultFeatures = [
        {
            icon: MessageSquare,
            title: "Direct messages and comments",
            text: "Reply to all messages and comments directly from your Tidio inbox."
        },
        {
            icon: Clock,
            title: "Reply window",
            text: "You have 24 hours to reply to messages from your customers."
        },
        {
            icon: GitBranch,
            title: "Flows",
            text: "Boost your productivity by using Flows to automate repetitive conversations."
        }
    ];

    const displayFeatures = features || defaultFeatures;

    return (
        <div className="max-w-[1000px] animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Page Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-[#18181b] flex items-center justify-center border border-white/5">
                    <Icon size={24} className="text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">{platformName} integration</h1>
            </div>

            {/* Main Hero Card */}
            <div className="bg-[#18181b] border border-white/5 rounded-xl p-12 flex flex-col items-center text-center">

                {/* Illustration area */}
                <div className="mb-8 relative w-64 h-32 opacity-80 hover:opacity-100 transition-opacity duration-500">
                    {/* Phone */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-28 bg-[#0f1115] border-2 border-zinc-700 rounded-xl flex flex-col items-center p-1 z-10 shadow-xl">
                        <div className="w-6 h-1 bg-zinc-700 rounded-full mb-2"></div>
                        <div className="w-full flex-1 bg-zinc-800/50 rounded-sm"></div>
                    </div>

                    {/* Dashboard */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-40 h-24 bg-[#0f1115] border-2 border-zinc-700 rounded-lg flex flex-col p-2 z-10 shadow-xl">
                        <div className="flex gap-2 mb-2">
                            <div className="w-1/3 h-2 bg-zinc-700 rounded-sm"></div>
                        </div>
                        <div className="flex gap-2 h-full">
                            <div className="w-1/4 h-full bg-zinc-800/50 rounded-sm"></div>
                            <div className="w-3/4 h-full bg-zinc-800/50 rounded-sm"></div>
                        </div>
                    </div>

                    {/* Connection Line */}
                    <svg className="absolute top-1/2 left-16 width-[calc(100%-4rem)] h-12 -translate-y-1/2 z-0" overflow="visible">
                        <path d="M10,0 C50,0 70,0 130,0" fill="none" stroke="#52525b" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" />
                    </svg>

                    {/* Floating Platform Icon */}
                    <div className="absolute left-[-10px] top-[-10px] bg-white p-1.5 rounded-full shadow-lg border border-zinc-200 z-20">
                        <Icon size={16} className="text-black" />
                    </div>
                </div>

                <h2 className="text-white text-lg font-semibold mb-2">Integrate {platformName} with Tidio</h2>
                <p className="text-zinc-400 max-w-2xl mb-12 text-sm leading-relaxed">
                    {description}
                </p>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 w-full max-w-4xl">
                    {displayFeatures.map((feature, index) => (
                        <div key={index} className="flex flex-col items-center text-center gap-3">
                            <feature.icon size={20} className="text-zinc-300" />
                            <h3 className="text-white text-sm font-semibold">{feature.title}</h3>
                            <p className="text-zinc-500 text-xs px-4">{feature.text}</p>
                        </div>
                    ))}
                </div>

                <Button
                    onClick={onIntegrate}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-6 text-sm font-semibold shadow-lg shadow-blue-900/20"
                >
                    {buttonText}
                </Button>
            </div>
        </div>
    );
}
