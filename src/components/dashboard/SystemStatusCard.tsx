"use client";

import { MessageSquare, Phone, Server, Wifi, Watch, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';

interface SystemStatus {
    chatbot: {
        status: 'healthy' | 'degraded' | 'offline';
        activeKnowledgeSources: number;
        totalVectors: number;
        lastSyncAt?: string;
    };
    voiceAgents: {
        status: 'healthy' | 'degraded' | 'offline';
        totalAgents: number;
        activeCalls: number;
        avgLatency?: number;
    };
}

export function SystemStatusCard() {
    const [status, setStatus] = useState<SystemStatus>({
        chatbot: { status: 'healthy', activeKnowledgeSources: 0, totalVectors: 0 },
        voiceAgents: { status: 'healthy', totalAgents: 0, activeCalls: 0 },
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                setStatus({
                    chatbot: {
                        status: 'healthy',
                        activeKnowledgeSources: 8,
                        totalVectors: 12453,
                        lastSyncAt: new Date().toISOString(),
                    },
                    voiceAgents: {
                        status: 'healthy',
                        totalAgents: 4,
                        activeCalls: 2,
                        avgLatency: 120,
                    },
                });
            } catch (error) {
                console.error('Failed to fetch system status:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'text-emerald-500';
            case 'degraded':
                return 'text-amber-500';
            case 'offline':
                return 'text-red-500';
            default:
                return 'text-gray-500';
        }
    };

    const getStatusBg = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'bg-emerald-500';
            case 'degraded':
                return 'bg-amber-500';
            case 'offline':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getCardBg = (type: 'chatbot' | 'voice') => {
        return 'bg-white border-slate-200/60 hover:border-slate-300';
    };

    return (
        <div className="h-full rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">System Health</h3>
                    <p className="text-sm text-gray-500">Real-time status</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                        "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    )}>
                        <Wifi className="h-3 w-3" />
                        All Operational
                    </span>
                </div>
            </div>

            <div className="space-y-4 flex-1">
                {/* Chatbot Section */}
                <div className={cn(
                    "group rounded-xl border bg-gradient-to-br p-4 transition-all duration-300",
                    "hover:shadow-lg hover:scale-[1.02]",
                    getCardBg('chatbot')
                )}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-50 shadow-sm border border-slate-100 text-[#101728]">
                                <MessageSquare className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900">Conversa AI</h4>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                    <span className="text-xs font-medium text-emerald-700">Healthy</span>
                                </div>
                            </div>
                        </div>
                        <button className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all">
                            <Watch className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                            <p className="text-xs text-slate-500 mb-1 font-medium">Knowledge</p>
                            <p className="text-xl font-bold text-gray-900">
                                {status.chatbot.activeKnowledgeSources}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1">sources active</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                            <p className="text-xs text-slate-500 mb-1 font-medium">Vectors</p>
                            <p className="text-xl font-bold text-gray-900">
                                {(status.chatbot.totalVectors / 1000).toFixed(1)}K
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1">indexed items</p>
                        </div>
                    </div>
                </div>

                {/* Voice Agents Section */}
                <div className={cn(
                    "group rounded-xl border bg-gradient-to-br p-4 transition-all duration-300",
                    "hover:shadow-lg hover:scale-[1.02]",
                    getCardBg('voice')
                )}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-50 shadow-sm border border-slate-100 text-[#101728]">
                                <Phone className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900">Voice Agents</h4>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                    <span className="text-xs font-medium text-emerald-700">Healthy</span>
                                </div>
                            </div>
                        </div>
                        <button className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all">
                            <Watch className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                            <p className="text-xs text-slate-500 mb-1 font-medium">Agents</p>
                            <p className="text-xl font-bold text-gray-900">
                                {status.voiceAgents.totalAgents}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1">configured</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                            <p className="text-xs text-slate-500 mb-1 font-medium">Active</p>
                            <p className="text-xl font-bold text-gray-900">
                                {status.voiceAgents.activeCalls}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1">live calls</p>
                        </div>
                    </div>

                    {status.voiceAgents.avgLatency && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-gray-600 bg-white/50 rounded-lg px-2.5 py-2">
                            <Server className="h-3 w-3" />
                            <span>Latency: {status.voiceAgents.avgLatency}ms</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer link */}
            <div className="mt-5 pt-4 border-t border-gray-100">
                <button className="w-full rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 group">
                    <span>Diagnostics</span>
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
