"use client";

import { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface QuickActionCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    href: string;
    colorClass?: string;
    badge?: string | number;
}

const COLOR_CLASSES = [
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-purple-500 to-pink-600",
    "from-orange-500 to-amber-600",
    "from-gray-600 to-slate-700",
];

export function QuickActionCard({
    title,
    description,
    icon: Icon,
    href,
    colorClass = "from-gray-900 to-gray-700",
    badge,
}: QuickActionCardProps) {
    return (
        <Link href={href} className="group">
            <div className={cn(
                "relative h-full rounded-2xl border border-border-subtle bg-bg-card p-6 shadow-sm transition-all duration-500",
                "hover:shadow-xl hover:-translate-y-1 overflow-hidden",
                "before:absolute before:inset-0 before:bg-gradient-to-br before:opacity-0 before:duration-500 before:transition-opacity before:content-['']",
                colorClass.includes('blue') ? "before:from-blue-500/5 before:via-indigo-500/5 before:to-transparent" :
                colorClass.includes('emerald') ? "before:from-emerald-500/5 before:via-teal-500/5 before:to-transparent" :
                colorClass.includes('purple') ? "before:from-purple-500/5 before:via-pink-500/5 before:to-transparent" :
                colorClass.includes('orange') ? "before:from-orange-500/5 before:via-amber-500/5 before:to-transparent" :
                "before:from-gray-900/5 before:via-gray-700/5 before:to-transparent",
                "group-hover:before:opacity-100"
            )}>
                {/* Icon background glow */}
                <div className={cn(
                    "absolute -right-6 -top-6 h-40 w-40 rounded-full blur-3xl opacity-0 transition-all duration-700 group-hover:opacity-20",
                    colorClass.includes('blue') ? "bg-blue-500" :
                    colorClass.includes('emerald') ? "bg-emerald-500" :
                    colorClass.includes('purple') ? "bg-purple-500" :
                    colorClass.includes('orange') ? "bg-orange-500" : "bg-gray-900"
                )} />

                <div className="relative z-10 flex h-full flex-col">
                    <div className="flex items-start justify-between">
                        <div className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-xl bg-bg-elevated text-text-primary border border-border-subtle shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
                        )}>
                            <Icon className="h-6 w-6" />
                        </div>

                        {badge !== undefined && (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-900/5 transition-all group-hover:bg-gray-900 group-hover:text-white">
                                {badge}
                            </span>
                        )}
                    </div>

                    <div className="mt-5 flex-1">
                        <h4 className="text-base font-semibold text-text-primary group-hover:text-text-secondary transition-colors">
                            {title}
                        </h4>
                        <p className="mt-2 text-sm text-text-muted leading-relaxed line-clamp-2">
                            {description}
                        </p>
                    </div>

                    <div className="mt-5 flex items-center text-sm font-medium text-text-primary opacity-50 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">
                        <span>Open</span>
                        <svg className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
            </div>
        </Link>
    );
}
