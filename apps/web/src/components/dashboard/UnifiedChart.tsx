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
        <div className="h-full rounded-2xl border border-border-subtle bg-bg-card p-6 shadow-sm flex flex-col">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-bold text-text-primary">Performance</h3>
                    <p className="text-sm text-text-secondary">Last 30 days • Combined metrics</p>
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
                                    ? "bg-gray-900 dark:bg-accent text-white dark:text-black shadow-md"
                                    : "bg-bg-elevated text-text-secondary hover:bg-bg-hover"
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
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => val}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                            tickLine={false}
                            axisLine={false}
                            width={35}
                            tickFormatter={(val) => `${val / 1000}k`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--color-bg-elevated)',
                                border: '1px solid var(--color-border-default)',
                                borderRadius: '12px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                padding: '12px',
                                color: 'var(--color-text-primary)',
                            }}
                            itemStyle={{ fontSize: 12, color: 'var(--color-text-primary)' }}
                            formatter={(value: any, name: any) => [value, name]}
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
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border-subtle">
                {CHART_CONFIG.filter(c => visibleMetrics.has(c.key)).map(conf => (
                    <div key={conf.key} className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: conf.color }} />
                        <span className="text-xs text-text-secondary font-medium">{conf.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
