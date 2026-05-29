"use client";

import { MessageSquare, Phone, Mail, Clock, MoreHorizontal, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';

interface ActivityItem {
    id: string;
    type: 'chat' | 'voice' | 'email';
    title: string;
    description: string;
    time: string;
    status?: 'completed' | 'in-progress' | 'failed';
}

interface ActivityFeedProps {
    title?: string;
    maxItems?: number;
}

export function ActivityFeed({ title = "Recent Activity", maxItems = 5 }: ActivityFeedProps) {
    const [activities] = useState<ActivityItem[]>([
        {
            id: '1',
            type: 'chat',
            title: 'AI response delivered',
            description: 'Customer asked about API limits',
            time: '2 min ago',
            status: 'completed',
        },
        {
            id: '2',
            type: 'voice',
            title: 'Voice call ended',
            description: 'Support agent handled payment issue',
            time: '15 min ago',
            status: 'completed',
        },
        {
            id: '3',
            type: 'chat',
            title: 'Human takeover',
            description: 'Customer requested escalation to agent',
            time: '1 hour ago',
            status: 'in-progress',
        },
        {
            id: '4',
            type: 'email',
            title: 'Email processed',
            description: 'Refund request automated response sent',
            time: '2 hours ago',
            status: 'completed',
        },
        {
            id: '5',
            type: 'voice',
            title: 'Missed call',
            description: 'Inbound call not answered',
            time: '3 hours ago',
            status: 'failed',
        },
    ]);

    const getIcon = (item: ActivityItem) => {
        switch (item.type) {
            case 'chat':
                return <MessageSquare className="h-4 w-4" />;
            case 'voice':
                return <Phone className="h-4 w-4" />;
            case 'email':
                return <Mail className="h-4 w-4" />;
            default:
                return <Clock className="h-4 w-4" />;
        }
    };

    const getIconBg = (type: string) => {
        return 'bg-slate-50 text-[#101728] border border-slate-100';
    };

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="h-4 w-4 text-emerald-500" />;
            case 'failed':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'in-progress':
                return <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />;
            default:
                return null;
        }
    };

    return (
        <div className="h-full rounded-2xl border border-border-subtle bg-bg-card p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-text-primary">{title}</h3>
                <button className="rounded-lg p-1.5 text-text-muted hover:bg-bg-hover hover:text-text-primary transition-all opacity-0 group-focus-within:opacity-100">
                    <MoreHorizontal className="h-5 w-5" />
                </button>
            </div>

            {/* Activity List */}
            <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar -mx-2 px-2">
                {activities.slice(0, maxItems).map((item, idx) => (
                    <div
                        key={item.id}
                        className={cn(
                            "group flex gap-3 rounded-xl p-3.5 transition-all duration-300",
                            "hover:bg-bg-hover cursor-pointer border border-transparent hover:border-border-subtle",
                            idx === 0 && "animate-fade-in"
                        )}
                        style={{
                            animationDelay: `${idx * 50}ms`,
                            animationFillMode: 'backwards'
                        }}
                    >
                        {/* Icon */}
                        <div className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
                            "bg-bg-elevated text-text-primary border border-border-subtle"
                        )}>
                            {getIcon(item)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium text-text-primary truncate">
                                    {item.title}
                                </p>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {getStatusIcon(item.status)}
                                </div>
                            </div>
                            <p className="mt-1 text-sm text-text-secondary line-clamp-2">
                                {item.description}
                            </p>
                            <div className="mt-2 flex items-center gap-1">
                                <Clock className="h-3 w-3 text-text-muted" />
                                <span className="text-xs text-text-muted">{item.time}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Load More */}
            <div className="mt-5 pt-4 border-t border-border-subtle">
                <button className="w-full rounded-lg py-2.5 text-sm font-medium text-text-primary hover:bg-bg-hover transition-colors flex items-center justify-center gap-2 group">
                    <span>View all activity</span>
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
