"use client";

import { Info } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'Jan 10', uv: 0, pv: 0, amt: 0 },
    { name: 'Jan 14', uv: 0, pv: 0, amt: 0 },
    { name: 'Jan 18', uv: 0, pv: 0, amt: 0 },
    { name: 'Jan 22', uv: 0, pv: 0, amt: 0 },
    { name: 'Jan 26', uv: 0, pv: 0, amt: 0 },
    { name: 'Jan 30', uv: 0, pv: 0, amt: 0 },
    { name: 'Feb 3', uv: 0, pv: 0, amt: 0 },
    { name: 'Feb 7', uv: 0, pv: 0, amt: 0 },
];

export function OverviewTab() {
    return (
        <div className="space-y-6">
            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#ffffff] p-6 rounded-xl border border-gray-200">
                {[
                    { label: 'Interactions', value: '0' },
                    { label: 'Conversa AI Agent resolution rate', value: '0%' },
                    { label: 'Sales assisted', value: '0' },
                    { label: 'Leads acquired', value: '0' }
                ].map((metric, index) => (
                    <div key={index} className={`flex flex-col gap-1 ${index !== 3 ? 'md:border-r border-gray-200' : ''} px-4`}>
                        <div className="flex items-center gap-1.5 text-zinc-400 text-xs uppercase font-medium">
                            {metric.label}
                            <Info size={12} className="cursor-help" />
                        </div>
                        <div className="text-3xl font-light text-gray-900">{metric.value}</div>
                    </div>
                ))}
            </div>

            {/* Main Chart */}
            <div className="bg-[#ffffff] p-6 rounded-xl border border-gray-200 min-h-[400px]">
                {/* Legend */}
                <div className="flex flex-wrap items-center gap-6 mb-8">
                    {[
                        { label: 'Replied live conversations', color: 'bg-blue-600' },
                        { label: 'Replied tickets', color: 'bg-amber-500' },
                        { label: 'Flows interactions', color: 'bg-cyan-500' },
                        { label: 'Conversa AI Agent conversations', color: 'bg-pink-500' },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${item.color}`}></span>
                            <span className="text-zinc-400 text-sm">{item.label}</span>
                            <Info size={12} className="text-zinc-600 cursor-help" />
                        </div>
                    ))}
                </div>

                {/* Chart */}
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f9fafb" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#71717a', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#71717a', fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', color: '#111827' }}
                                itemStyle={{ color: '#a1a1aa' }}
                            />
                            <Area type="monotone" dataKey="uv" stroke="#2563eb" fillOpacity={0} strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
