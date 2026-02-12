"use client";

import { LucideIcon, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface IntegrationCardProps {
    name: string;
    description: string;
    icon?: LucideIcon;
    iconColor?: string;
    installed?: boolean;
    // For integrations without a specific icon component, we can use a fallback
    fallbackInitial?: string;
}

export function IntegrationCard({ name, description, icon: Icon, iconColor, installed, fallbackInitial }: IntegrationCardProps) {
    return (
        <div className="group bg-[#18181b] border border-white/5 rounded-xl p-6 flex flex-col hover:border-white/10 transition-all cursor-pointer h-full relative">
            {installed && (
                <div className="absolute top-4 right-4 bg-green-500/10 text-green-400 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle size={10} />
                    Installed
                </div>
            )}

            <div className="mb-4">
                {Icon ? (
                    <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center bg-white/5", iconColor)}>
                        <Icon size={24} className="text-current" />
                    </div>
                ) : (
                    <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center text-white font-bold text-lg">
                        {fallbackInitial || name.charAt(0)}
                    </div>
                )}
            </div>

            <h3 className="text-white font-bold text-lg mb-2">{name}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
                {description}
            </p>
        </div>
    );
}
