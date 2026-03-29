"use client";

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon: LucideIcon;
    color?: 'blue' | 'emerald' | 'purple' | 'orange' | 'gray' | 'brand';
    suffix?: string;
}

const COLOR_CONFIG = {
    blue: {
        light: 'from-blue-50 to-indigo-50',
        border: 'border-blue-100',
        iconBg: 'from-blue-500 to-indigo-500',
        text: 'text-blue-600',
        glow: 'shadow-blue-500/10',
    },
    emerald: {
        light: 'from-emerald-50 to-teal-50',
        border: 'border-emerald-100',
        iconBg: 'from-emerald-500 to-teal-500',
        text: 'text-emerald-600',
        glow: 'shadow-emerald-500/10',
    },
    purple: {
        light: 'from-purple-50 to-pink-50',
        border: 'border-purple-100',
        iconBg: 'from-purple-500 to-pink-500',
        text: 'text-purple-600',
        glow: 'shadow-purple-500/10',
    },
    orange: {
        light: 'from-orange-50 to-amber-50',
        border: 'border-orange-100',
        iconBg: 'from-orange-500 to-amber-500',
        text: 'text-orange-600',
        glow: 'shadow-orange-500/10',
    },
    gray: {
        light: 'from-gray-50 to-slate-50',
        border: 'border-gray-100',
        iconBg: 'bg-slate-50',
        text: 'text-gray-600',
        glow: 'shadow-gray-500/10',
    },
    brand: {
        light: 'from-slate-50 to-gray-50',
        border: 'border-slate-200/60',
        iconBg: 'bg-slate-50',
        text: 'text-[#101728]',
        glow: 'shadow-slate-200/50',
    },
};


export function StatCard({
    title,
    value,
    change,
    changeLabel = "vs last period",
    icon: Icon,
    color = 'blue',
    suffix,
}: StatCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const config = COLOR_CONFIG[color];

    return (
        <div
            ref={cardRef}
            className={cn(
                "group relative overflow-hidden rounded-2xl border bg-bg-card p-6 shadow-sm transition-all duration-500",
                "hover:shadow-lg hover:-translate-y-0.5",
                "border-border-subtle",
                "before:absolute before:inset-0 before:bg-gradient-to-br before:opacity-0 before:transition-opacity before:duration-500 before:content-['']",
                config.light,
                "group-hover:before:opacity-100"
            )}
        >
            {/* Animated background glow */}
            <div className={cn(
                "absolute -right-4 -top-4 h-32 w-32 rounded-full blur-3xl opacity-0 transition-all duration-700 group-hover:opacity-30",
                config.iconBg
            )} />

            <div className="relative z-10">
                <div className="flex items-start justify-between">
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-text-secondary">{title}</p>
                        <div className="flex items-baseline gap-1">
                            <h3 className="text-3xl font-bold text-text-primary tracking-tight">
                                {value}
                            </h3>
                            {suffix && (
                                <span className="text-sm text-text-secondary">{suffix}</span>
                            )}
                        </div>
                        {change !== undefined && (
                            <div className="flex items-center gap-1.5 text-xs">
                                {change >= 0 ? (
                                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                    <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                                )}
                                <span className={cn(
                                    "font-semibold",
                                    change >= 0 ? "text-emerald-600" : "text-red-600"
                                )}>
                                    {Math.abs(change)}%
                                </span>
                                <span className="text-text-muted">{changeLabel}</span>
                            </div>
                        )}
                    </div>

                    {/* Icon Container */}
                    <div className={cn(
                        "flex h-14 w-14 items-center justify-center rounded-xl shadow-sm border border-gray-100",
                        config.iconBg,
                        config.text,
                        "transition-transform duration-300 group-hover:scale-110"
                    )}>
                        <Icon className="h-7 w-7" />
                    </div>
                </div>
            </div>

            {/* Bottom accent line */}
            <div className={cn(
                "absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r transform scale-x-0 transition-transform duration-500 group-hover:scale-x-100",
                config.iconBg
            )} />
        </div>
    );
}
