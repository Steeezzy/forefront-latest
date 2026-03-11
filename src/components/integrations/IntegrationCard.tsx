"use client";

import { LucideIcon, CheckCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getIntegrationMeta, TAG_COLORS } from '@/lib/integration-metadata';

interface IntegrationCardProps {
    id?: string;
    name: string;
    description: string;
    icon?: LucideIcon;
    iconColor?: string;
    installed?: boolean;
    fallbackInitial?: string;
    onClick?: () => void;
}

export function IntegrationCard({ id, name, description, icon: Icon, iconColor, installed, fallbackInitial, onClick }: IntegrationCardProps) {
    const meta = id ? getIntegrationMeta(id) : null;
    const tags = meta?.tags || [];

    return (
        <div
            className="group bg-[#18181b] border border-white/5 rounded-xl p-6 flex flex-col hover:border-white/10 hover:shadow-lg hover:shadow-blue-500/5 transition-all cursor-pointer h-full relative"
            onClick={onClick}
        >
            {/* Installed badge */}
            {installed && (
                <div className="absolute top-4 right-4 bg-green-500/10 text-green-400 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle size={10} />
                    Installed
                </div>
            )}

            {/* Hover action hint */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                {!installed && (
                    <div className="bg-blue-500/10 text-blue-400 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ExternalLink size={10} />
                        Details
                    </div>
                )}
            </div>

            {/* Icon */}
            <div className="mb-4">
                {Icon ? (
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 group-hover:scale-105 transition-transform", iconColor)}>
                        <Icon size={24} className="text-current" />
                    </div>
                ) : (
                    <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-white font-bold text-lg group-hover:scale-105 transition-transform">
                        {fallbackInitial || name.charAt(0)}
                    </div>
                )}
            </div>

            {/* Name */}
            <h3 className="text-white font-bold text-lg mb-2">{name}</h3>

            {/* Description */}
            <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
                {description}
            </p>

            {/* Category tags */}
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
                    {tags.slice(0, 3).map((tag) => (
                        <span
                            key={tag}
                            className={cn(
                                "text-[10px] font-medium px-2 py-0.5 rounded-full",
                                TAG_COLORS[tag] || "bg-zinc-700/50 text-zinc-400"
                            )}
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
