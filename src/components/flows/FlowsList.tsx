"use client";

import { Info, Activity, MoreVertical, Check, Loader2, Trash2, Play, Pause, Pencil } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface Flow {
    id: string;
    name: string;
    description?: string;
    trigger_type?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    execution_count?: number;
    engagement_rate?: number;
}

interface FlowsListProps {
    agentId?: string;
    category?: 'all' | 'sales' | 'support' | 'leads';
    authError?: boolean;
    loading?: boolean;
    errorMessage?: string | null;
}

export function FlowsList({ agentId, category = 'all', authError = false, loading: parentLoading, errorMessage }: FlowsListProps) {
    const router = useRouter();
    const [flows, setFlows] = useState<Flow[]>([]);
    const [fetchingFlows, setFetchingFlows] = useState(false);
    const [error, setError] = useState<string | null>(authError ? 'UNAUTHORIZED' : null);

    const loading = parentLoading || fetchingFlows;

    const fetchFlows = useCallback(async () => {
        if (!agentId) {
            return;
        }

        setFetchingFlows(true);
        try {
            const res = await apiFetch(`/api/flows?agentId=${agentId}`);
            setFlows(res.flows || []);
            setError(null);
        } catch (err: any) {
            console.error('Failed to fetch flows:', err);
            setError(err.message);
        } finally {
            setFetchingFlows(false);
        }
    }, [agentId]);

    useEffect(() => {
        fetchFlows();
    }, [fetchFlows]);

    const handleToggleActive = async (flowId: string, isActive: boolean) => {
        try {
            await apiFetch(`/api/flows/${flowId}`, {
                method: 'PUT',
                body: JSON.stringify({ is_active: isActive }),
            });
            setFlows(prev => prev.map(f => f.id === flowId ? { ...f, is_active: isActive } : f));
        } catch (err) {
            console.error('Failed to toggle flow:', err);
        }
    };

    const handleDelete = async (flowId: string) => {
        if (!confirm('Are you sure you want to delete this flow?')) return;
        
        try {
            await apiFetch(`/api/flows/${flowId}`, { method: 'DELETE' });
            setFlows(prev => prev.filter(f => f.id !== flowId));
        } catch (err) {
            console.error('Failed to delete flow:', err);
        }
    };

    const handleEdit = (flowId: string) => {
        router.push(`/panel/flows/create/${flowId}`);
    };

    // Show error from parent (e.g., connection timeout) 
    if (errorMessage && !agentId) {
        return (
            <div className="bg-[#18181b] border-x border-b border-white/5 rounded-b-xl overflow-hidden min-h-[200px] flex flex-col items-center justify-center gap-3 p-6">
                <span className="text-red-400">{errorMessage}</span>
                <button 
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm"
                >
                    Refresh Page
                </button>
            </div>
        );
    }

    // Show error first (including auth error)
    if (error) {
        const isAuthError = error === 'UNAUTHORIZED';
        return (
            <div className="bg-[#18181b] border-x border-b border-white/5 rounded-b-xl overflow-hidden min-h-[200px] flex flex-col items-center justify-center gap-3 p-6">
                <span className="text-red-400">{isAuthError ? 'Session expired. Please sign in again.' : error}</span>
                {isAuthError ? (
                    <a 
                        href="/sign-in"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm"
                    >
                        Sign In
                    </a>
                ) : (
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm"
                    >
                        Refresh Page
                    </button>
                )}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-[#18181b] border-x border-b border-white/5 rounded-b-xl overflow-hidden min-h-[200px] flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-400" size={24} />
                <span className="ml-2 text-slate-400">Loading flows...</span>
            </div>
        );
    }

    const handleSeedDefaults = async () => {
        if (!agentId) return;
        setFetchingFlows(true);
        try {
            await apiFetch('/api/flows/seed-defaults', {
                method: 'POST',
                body: JSON.stringify({ agentId }),
            });
            await fetchFlows();
        } catch (err: any) {
            console.error('Failed to seed defaults:', err);
            setError(err.message);
            setFetchingFlows(false);
        }
    };

    if (flows.length === 0) {
        return (
            <div className="bg-[#18181b] border-x border-b border-white/5 rounded-b-xl overflow-hidden min-h-[200px] flex flex-col items-center justify-center p-8">
                <div className="text-slate-400 text-center">
                    <Play size={32} className="mx-auto mb-3 opacity-50" />
                    <p className="mb-2">No flows yet</p>
                    <p className="text-sm text-slate-500 mb-4">Create your first flow to automate customer interactions</p>
                    <button
                        onClick={handleSeedDefaults}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Add Starter Templates
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#18181b] border-x border-b border-white/5 rounded-b-xl overflow-hidden min-h-[200px]">
            {/* Header */}
            <div className="grid grid-cols-12 px-6 py-4 border-b border-white/5 bg-[#1f2229]">
                <div className="col-span-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</div>
                <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Executed</div>
                <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Engagement</div>
                <div className="col-span-1 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Active</div>
                <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</div>
            </div>

            {/* Flow Items */}
            {flows.map((flow) => (
                <div 
                    key={flow.id}
                    className="grid grid-cols-12 px-6 py-4 hover:bg-[#1e2025] transition-colors items-center border-b border-white/5 last:border-0 group"
                >
                    <div className="col-span-5">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-semibold">{flow.name}</span>
                            {flow.is_active && (
                                <div className="bg-blue-500/20 rounded-full p-0.5">
                                    <Check size={10} className="text-blue-400" />
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <Info size={12} className="text-zinc-500" />
                            <span>{flow.description || `Trigger: ${flow.trigger_type || 'Not set'}`}</span>
                        </div>
                    </div>

                    <div className="col-span-2 text-center text-zinc-400 text-sm">
                        {flow.execution_count ?? 0}
                    </div>

                    <div className="col-span-2 text-center text-zinc-400 text-sm">
                        {flow.engagement_rate ? `${flow.engagement_rate}%` : '—'}
                    </div>

                    <div className="col-span-1 flex justify-center">
                        <Switch 
                            checked={flow.is_active}
                            onCheckedChange={(checked) => handleToggleActive(flow.id, checked)}
                            className="data-[state=checked]:bg-blue-600" 
                        />
                    </div>

                    <div className="col-span-2 flex items-center justify-end gap-2">
                        <button 
                            onClick={() => handleEdit(flow.id)}
                            className="p-1.5 rounded text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                            title="Edit"
                        >
                            <Pencil size={16} />
                        </button>
                        <button 
                            onClick={() => handleDelete(flow.id)}
                            className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                        <button className="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-white/5 transition-colors">
                            <MoreVertical size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
