"use client";

import { Bot, CheckCircle2, AlertCircle, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface KnowledgeSource {
    id: string;
    type: 'website' | 'manual_qna';
    name: string;
    status: 'completed' | 'pending' | 'processing' | 'failed';
    stats?: { pages?: number; qna?: number; vectors?: number };
}

export function ChatbotPreview() {
    const [sources, setSources] = useState<KnowledgeSource[]>([]);
    const [stats, setStats] = useState({ totalConversations: 0, aiResolution: 0, activeSources: 0 });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Mock data - replace with real API calls
                setSources([
                    { id: '1', type: 'website', name: 'docs.example.com', status: 'completed', stats: { pages: 42, vectors: 3200 } },
                    { id: '2', type: 'manual_qna', name: 'FAQ Collection', status: 'completed', stats: { qna: 25, vectors: 450 } },
                    { id: '3', type: 'website', name: 'help.center', status: 'processing', stats: { pages: 15 } },
                ]);
                setStats({
                    totalConversations: 2847,
                    aiResolution: 73,
                    activeSources: sources.filter(s => s.status === 'completed').length,
                });
            } catch (error) {
                console.error('Failed to fetch chatbot data:', error);
            }
        };
        fetchData();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            case 'processing':
                return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'failed':
                return 'text-red-600 bg-red-50 border-red-200';
            default:
                return 'text-amber-600 bg-amber-50 border-amber-200';
        }
    };

    const getTypeIcon = (type: string) => {
        return type === 'website' ? (
            <ChevronRight className="h-4 w-4 text-gray-400" />
        ) : (
            <Plus className="h-4 w-4 text-gray-400" />
        );
    };

    return (
        <div className="h-full rounded-2xl border border-border-subtle bg-bg-card p-6 shadow-sm flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-elevated text-text-primary shadow-sm border border-border-subtle ring-1 ring-border-subtle">
                        <Bot className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-text-primary">Conversa AI</h3>
                        <p className="text-xs text-text-secondary">
                            {stats.activeSources} sources • {stats.aiResolution}% AI resolved
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-text-secondary hover:text-emerald-500 hover:bg-emerald-500/10"
                    asChild
                >
                    <a href="/panel/chatbot" className="flex items-center gap-1">
                        <span>Open Hub</span>
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </a>
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="rounded-lg bg-bg-elevated p-3.5 border border-border-subtle">
                    <p className="text-xs text-text-muted mb-1 font-medium">Conversations</p>
                    <p className="text-xl font-bold text-text-primary">
                        {stats.totalConversations.toLocaleString()}
                    </p>
                </div>
                <div className="rounded-lg bg-bg-elevated p-3.5 border border-border-subtle">
                    <p className="text-xs text-text-muted mb-1 font-medium">AI Resolved</p>
                    <p className="text-xl font-bold text-text-primary">
                        {stats.aiResolution}%
                    </p>
                </div>
            </div>

            {/* Knowledge Sources */}
            <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar -mr-2 pr-2">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-text-primary">Knowledge Sources</h4>
                    <Button variant="link" size="sm" className="h-6 text-xs text-emerald-500 p-0 hover:text-emerald-600">
                        Manage
                    </Button>
                </div>

                {sources.slice(0, 4).map((source, idx) => (
                    <div
                        key={source.id}
                        className={cn(
                            "group flex items-center justify-between rounded-lg border p-3 transition-all duration-300",
                            "hover:shadow-sm hover:border-slate-200 hover:bg-slate-50/50",
                            "animate-fade-in"
                        )}
                        style={{
                            animationDelay: `${idx * 75}ms`
                        }}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="text-text-muted">
                                {getTypeIcon(source.type)}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-text-primary truncate">
                                    {source.name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    {source.status === 'completed' && source.stats?.vectors && (
                                        <p className="text-[10px] text-text-muted">
                                            {source.stats.vectors.toLocaleString()} vectors
                                        </p>
                                    )}
                                    {source.status === 'processing' && (
                                        <span className="text-[10px] text-blue-600 flex items-center gap-1">
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                                            Processing...
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border transition-all",
                                getStatusColor(source.status)
                            )}>
                                {source.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                                {source.status === 'processing' && <AlertCircle className="h-3 w-3 animate-spin" />}
                                {source.status}
                            </span>
                        </div>
                    </div>
                ))}

                {sources.length === 0 && (
                    <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
                        <Bot className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500 mb-3">No knowledge sources</p>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/15">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Source
                        </Button>
                    </div>
                )}
            </div>

            {/* Quick Action */}
            <div className="mt-4 pt-4 border-t border-border-subtle">
                <Button
                    className="w-full bg-gray-900 dark:bg-accent hover:bg-gray-800 dark:hover:bg-accent-hover text-white dark:text-black border-0 shadow-lg"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Knowledge
                </Button>
            </div>
        </div>
    );
}
