"use client";

import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface DataPoint {
    date: string;
    interactions: number;
    voiceCalls: number;
    aiResolutions: number;
    satisfaction: number;
}

const generateMockData = (): DataPoint[] => {
    const data: DataPoint[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            interactions: Math.floor(Math.random() * 500) + 200,
            voiceCalls: Math.floor(Math.random() * 100) + 50,
            aiResolutions: Math.floor(Math.random() * 300) + 100,
            satisfaction: Math.floor(Math.random() * 15) + 85,
        });
    }
    return data;
};

const CHART_CONFIG = [
    { key: 'interactions', label: 'Chat', color: '#6366f1', gradient: ['#818cf8', '#6366f1'] },
    { key: 'voiceCalls', label: 'Voice', color: '#a855f7', gradient: ['#c084fc', '#a855f7'] },
    { key: 'aiResolutions', label: 'AI Resolved', color: '#10b981', gradient: ['#34d399', '#10b981'] },
];

export function UnifiedChart() {
    const [visibleMetrics, setVisibleMetrics] = useState<Set<string>>(new Set(['interactions', 'voiceCalls']));
    const data = generateMockData();

    const toggleMetric = (key: string) => {
        setVisibleMetrics(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    return (
        <div className="h-full rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm flex flex-col">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Performance</h3>
                    <p className="text-sm text-gray-500">Last 30 days • Combined metrics</p>
                </div>

                {/* Toggle Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                    {CHART_CONFIG.map(({ key, label, color }) => (
                        <button
                            key={key}
                            onClick={() => toggleMetric(key)}
                            className={cn(
                                "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-300",
                                visibleMetrics.has(key)
                                    ? "bg-gray-900 text-white shadow-md"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            )}
                        >
                            <span className={cn(
                                "h-2 w-2 rounded-full transition-colors",
                                visibleMetrics.has(key) ? "bg-white" : ""
                            )} style={{ backgroundColor: visibleMetrics.has(key) ? 'white' : color }} />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <div className="relative flex-1 min-h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                        <defs>
                            {CHART_CONFIG.filter(c => visibleMetrics.has(c.key)).map(conf => (
                                <linearGradient key={conf.key} id={`gradient-${conf.key}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={conf.gradient[0]} stopOpacity={0.25} />
                                    <stop offset="95%" stopColor={conf.gradient[0]} stopOpacity={0} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => val}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            tickLine={false}
                            axisLine={false}
                            width={35}
                            tickFormatter={(val) => `${val / 1000}k`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: '1px solid #e5e7eb',
                                borderRadius: '12px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                padding: '12px',
                            }}
                            itemStyle={{ fontSize: 12 }}
                            formatter={(value: number, name: string) => [value, name]}
                        />
                        {CHART_CONFIG.filter(c => visibleMetrics.has(c.key)).map(conf => (
                            <Area
                                key={conf.key}
                                type="monotone"
                                dataKey={conf.key}
                                stroke={conf.color}
                                strokeWidth={2}
                                fill={`url(#gradient-${conf.key})`}
                                fillOpacity={0.4}
                            />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
                {CHART_CONFIG.filter(c => visibleMetrics.has(c.key)).map(conf => (
                    <div key={conf.key} className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: conf.color }} />
                        <span className="text-xs text-gray-600 font-medium">{conf.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
