"use client";

import { Checkbox } from '@/components/ui/checkbox';
import { MoreVertical, Globe, ChevronRight, Loader2, MessageSquare, BookOpen, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { shopifyApi, apiFetch } from '@/lib/api';

interface DataSource {
    id: string;
    name: string;
    type: string;
    source: string;
    lastUpdated: string;
    status: string;
}

export function DataSourcesTable() {
    const [sources, setSources] = useState<DataSource[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAllSources() {
            setLoading(true);
            try {
                const allSources: DataSource[] = [];

                // 1. Fetch Shopify Stores
                try {
                    const storeData = await shopifyApi.getStores();
                    if (storeData?.success && storeData.stores) {
                        storeData.stores.forEach((store: any) => {
                            allSources.push({
                                id: store.id,
                                name: store.shop_domain,
                                type: 'Shopify',
                                source: 'E-commerce',
                                lastUpdated: store.updated_at || store.installed_at,
                                status: store.is_active ? 'connected' : 'disconnected'
                            });
                        });
                    }
                } catch (err) {
                    console.error("Failed to fetch Shopify stores:", err);
                }

                // 2. Fetch Knowledge Sources
                try {
                    const agentData = await apiFetch("/agents/primary");
                    if (agentData?.id) {
                        const knowledgeData = await apiFetch(`/knowledge/sources?agentId=${agentData.id}`);
                        if (knowledgeData?.data) {
                            knowledgeData.data.forEach((source: any) => {
                                allSources.push({
                                    id: source.id,
                                    name: source.name || source.url || 'Untitled Source',
                                    type: source.type.charAt(0).toUpperCase() + source.type.slice(1),
                                    source: source.type === 'website' ? 'Website' : 'QA',
                                    lastUpdated: source.updated_at || source.created_at,
                                    status: source.status
                                });
                            });
                        }
                    }
                } catch (err) {
                    console.error("Failed to fetch knowledge sources:", err);
                }

                setSources(allSources);
            } catch (err) {
                console.error("Error fetching all data sources:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchAllSources();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 bg-[#161920] border border-white/5 rounded-xl">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin mr-3" />
                <span className="text-slate-400">Loading data sources...</span>
            </div>
        );
    }

    return (
        <div className="border border-white/5 rounded-xl overflow-hidden bg-[#161920]">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Results: {sources.length}</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="p-4 w-10">
                                <Checkbox />
                            </th>
                            <th className="p-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                            <th className="p-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Source</th>
                            <th className="p-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Used by</th>
                            <th className="p-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Audience</th>
                            <th className="p-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Last updated</th>
                            <th className="p-4 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {sources.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-slate-500 text-sm">
                                    No data sources found.
                                </td>
                            </tr>
                        ) : (
                            sources.map((source) => (
                                <tr key={source.id} className="group hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <Checkbox />
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-white font-medium">
                                            <span>{source.name}</span>
                                            <ChevronRight size={14} className="text-slate-500" />
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-slate-300 text-sm bg-white/5 px-2 py-1 rounded inline-flex">
                                            {source.type === 'Shopify' ? <ShoppingBag size={14} /> : (source.source === 'Website' ? <Globe size={14} /> : <MessageSquare size={14} />)}
                                            <span>{source.type}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-1 rounded bg-emerald-900/40 text-emerald-400 text-xs font-medium border border-emerald-900/60 flex items-center gap-1">
                                                ✓ Lyro
                                            </span>
                                            <span className="px-2 py-1 rounded bg-emerald-900/40 text-emerald-400 text-xs font-medium border border-emerald-900/60 flex items-center gap-1">
                                                ✓ Copilot
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded bg-[#27272a] text-slate-300 text-xs font-medium border border-white/5">
                                            Everyone
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-400 text-sm">
                                        {new Date(source.lastUpdated).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
                                            <MoreVertical size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
