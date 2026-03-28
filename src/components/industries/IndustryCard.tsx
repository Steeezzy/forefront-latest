"use client";

import { Industry } from "@/types";
import { ArrowRight, Users, PhoneCall, Bot, Mic } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface IndustryCardProps {
    industry: Industry;
}

export function IndustryCard({ industry }: IndustryCardProps) {
    return (
        <Link 
            href={`/panel/industries/${industry.id}`}
            className="group relative flex flex-col h-full bg-white dark:bg-[#101728] rounded-[2rem] border border-gray-100 dark:border-white/5 overflow-hidden transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:-translate-y-2"
        >
            {/* Top Background Pattern */}
            <div className={cn(
                "absolute top-0 left-0 right-0 h-32 opacity-10 dark:opacity-20 transition-opacity group-hover:opacity-20 dark:group-hover:opacity-30 bg-gradient-to-br",
                industry.iconBg
            )} />

            <div className="relative p-8 flex flex-col h-full z-10">
                {/* Icon & Category */}
                <div className="flex items-start justify-between mb-6">
                    <div className={cn(
                        "h-16 w-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 bg-gradient-to-br",
                        industry.iconBg
                    )}>
                        {industry.icon}
                    </div>
                    <div className="px-3 py-1 rounded-full bg-gray-100 dark:bg-white/5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest border border-gray-200/50 dark:border-white/10">
                        {industry.category.replace('-', ' ')}
                    </div>
                </div>

                {/* Content */}
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-[#06d6a0] transition-colors">
                        {industry.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium capitalize italic">
                        "{industry.tagline}"
                    </p>
                </div>

                {/* Capabilities / Tags */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {industry.tags.slice(0, 4).map((tag, idx) => (
                        <span 
                            key={idx}
                            className="text-[10px] px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 font-semibold border border-gray-100 dark:border-white/5"
                        >
                            {tag}
                        </span>
                    ))}
                    {industry.tags.length > 4 && (
                        <span className="text-[10px] px-2.5 py-1 text-gray-400 font-bold">+{industry.tags.length - 4}</span>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100 dark:border-white/5 mt-auto">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 mb-1">
                            <Mic className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Voice</span>
                        </div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{industry.voiceTemplates} Agents</p>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 mb-1">
                            <Bot className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Chat</span>
                        </div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{industry.chatTemplates} Modules</p>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 mb-1">
                            <Users className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Scale</span>
                        </div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{industry.businesses}+ Orgs</p>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 mb-1">
                            <PhoneCall className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Volume</span>
                        </div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{industry.callsPerMonth}</p>
                    </div>
                </div>

                {/* Action Footer */}
                <div className="absolute bottom-6 right-8 opacity-0 translate-x-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-x-0">
                    <div className="h-10 w-10 rounded-full bg-[#06d6a0] flex items-center justify-center text-[#101728] shadow-lg shadow-[#06d6a0]/20">
                        <ArrowRight className="h-5 w-5" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
