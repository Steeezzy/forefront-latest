"use client";

import { HelpCircle, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

interface FlowsStatsProps {
    agentId?: string | null;
}

interface Stats {
    executed: number;
    engagement: number;
    salesAssisted: number;
    leadsGenerated: number;
    support: number;
}

export function FlowsStats({ agentId }: FlowsStatsProps) {
    const [stats, setStats] = useState<Stats>({
        executed: 0,
        engagement: 0,
        salesAssisted: 0,
        leadsGenerated: 0,
        support: 0,
    });

    useEffect(() => {
        if (!agentId) return;
        
        const fetchStats = async () => {
            try {
                // TODO: Implement stats endpoint
                // const data = await apiFetch(`/api/flows/stats?agentId=${agentId}`);
                // setStats(data);
            } catch (err) {
                console.error('Failed to fetch flow stats:', err);
            }
        };
        fetchStats();
    }, [agentId]);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">

            {/* Executed */}
            <div className="bg-[#ffffff] border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-zinc-400 text-sm">Executed</span>
                    <HelpCircle size={14} className="text-zinc-500" />
                </div>
                <div className="text-3xl font-light text-gray-900">0</div>
            </div>

            {/* Engagement */}
            <div className="bg-[#ffffff] border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-zinc-400 text-sm">Engagement</span>
                    <HelpCircle size={14} className="text-zinc-500" />
                </div>
                <div className="text-3xl font-light text-gray-900">0%</div>
            </div>

            {/* Sales assisted */}
            <div className="bg-[#ffffff] border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-zinc-400 text-sm">Sales assisted</span>
                    <HelpCircle size={14} className="text-zinc-500" />
                </div>
                <div className="text-3xl font-light text-gray-900 mb-2">$0</div>
                <a href="#" className="text-blue-500 text-xs hover:underline flex items-center gap-1">
                    Add Sales Flow <ArrowRight size={10} />
                </a>
            </div>

            {/* Leads generated */}
            <div className="bg-[#ffffff] border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-zinc-400 text-sm">Leads generated</span>
                    <HelpCircle size={14} className="text-zinc-500" />
                </div>
                <div className="text-3xl font-light text-gray-900 mb-2">0</div>
                <a href="#" className="text-blue-500 text-xs hover:underline flex items-center gap-1">
                    Add Lead Flow <ArrowRight size={10} />
                </a>
            </div>

            {/* Support */}
            <div className="bg-[#ffffff] border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-zinc-400 text-sm">Support</span>
                    <HelpCircle size={14} className="text-zinc-500" />
                </div>
                <div className="text-3xl font-light text-gray-900 mb-2">0</div>
                <a href="#" className="text-blue-500 text-xs hover:underline flex items-center gap-1">
                    Add Support Flow <ArrowRight size={10} />
                </a>
            </div>
        </div>
    );
}
