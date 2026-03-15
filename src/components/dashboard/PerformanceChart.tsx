"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar } from 'lucide-react';

const data = [
    { name: 'Jan 09', value: 0 },
    { name: 'Jan 13', value: 0 },
    { name: 'Jan 17', value: 0 },
    { name: 'Jan 21', value: 0 },
    { name: 'Jan 25', value: 0 },
    { name: 'Jan 29', value: 0 },
    { name: 'Feb 02', value: 0 },
    { name: 'Feb 07', value: 0 },
];

const metrics = [
    { label: "Interactions", value: "0", color: "text-blue-500" },
    { label: "AI resolution rate", value: "0%", color: "text-emerald-500" },
    { label: "Sales assisted", value: "0", color: "text-purple-500" },
    { label: "Leads acquired", value: "0", color: "text-gray-900" },
];

export function PerformanceChart() {
    return (
        <div className="bg-[#ffffff] border border-[#e4e4e7] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <h3 className="text-lg font-bold text-gray-900">Performance</h3>

                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-sm text-slate-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                    <Calendar size={14} />
                    <span>09 Jan 2026 - 07 Feb 2026</span>
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 border-b border-gray-100 pb-6">
                {metrics.map((m, idx) => (
                    <div key={idx}>
                        <div className="text-[28px] font-bold mb-1 text-[#09090b]">{m.value}</div>
                        <div className="text-[#a1a1aa] text-[12px] flex items-center gap-1">
                            {m.label}
                        </div>
                    </div>
                ))}
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#374151"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="#374151"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dx={-10}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: '#111827' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#6366f1"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 mt-6">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    Replied live conversations
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    Replied tickets
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    Flows interactions
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    AI Agent conversations
                </div>
            </div>
        </div>
    );
}
