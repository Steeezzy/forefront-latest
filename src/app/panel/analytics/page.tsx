"use client";

import { useState } from "react";
import { Info, Calendar, Phone, PhoneCall, Clock, CheckCircle2, ChevronDown } from "lucide-react";
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// Mock Data
const callVolumeData = [
    { name: 'Mar 12', calls: 120, connected: 95 },
    { name: 'Mar 13', calls: 150, connected: 110 },
    { name: 'Mar 14', calls: 200, connected: 160 },
    { name: 'Mar 15', calls: 180, connected: 140 },
    { name: 'Mar 16', calls: 220, connected: 190 },
    { name: 'Mar 17', calls: 250, connected: 210 },
    { name: 'Mar 18', calls: 280, connected: 230 },
];

const dispositionData = [
    { name: 'Answered', value: 65, color: '#4f46e5' },
    { name: 'No Answer', value: 20, color: '#f97316' },
    { name: 'Voicemail', value: 10, color: '#0ea5e9' },
    { name: 'Busy', value: 5, color: '#ef4444' }
];

const topAgents = [
    { name: 'Aria', type: 'Outbound', calls: 840, connected: 720, rate: '85.7%' },
    { name: 'Marcus', type: 'Inbound', calls: 620, connected: 540, rate: '87.1%' },
    { name: 'Tanya', type: 'Outbound', calls: 490, connected: 420, rate: '85.7%' },
    { name: 'Priya', type: 'Webcall', calls: 350, connected: 290, rate: '82.8%' }
];

export default function AnalyticsPage() {
    const [dateRange, setDateRange] = useState("Last 7 Days");

    const stats = [
        { label: 'Total Calls', value: '1,420', icon: Phone, color: '#f3f4f6', textColor: '#09090b', trend: '+12% vs last week' },
        { label: 'Connected', value: '1,136', icon: PhoneCall, color: '#ecfdf5', textColor: '#10b981', trend: '80% Connection Rate' },
        { label: 'Avg Duration', value: '2m 14s', icon: Clock, color: '#eff6ff', textColor: '#3b82f6', trend: '+5s average' },
        { label: 'Success Rate', value: '42.5%', icon: CheckCircle2, color: '#fef2f2', textColor: '#ef4444', trend: 'Booked / Leads' }
    ];

    return (
        <div style={{ background: '#fafafa', minHeight: '100vh', width: '100%', padding: '28px 32px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#09090b' }}>Analytics</h1>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Track performance across campaigns and agents</p>
                </div>

                <button style={{
                    background: '#ffffff', border: '1px solid #e4e4e7', height: '34px', padding: '0 14px',
                    borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
                }}>
                    <Calendar size={14} style={{ color: '#6b7280' }} /> {dateRange} <ChevronDown size={14} style={{ color: '#9ca3af', marginLeft: '4px' }} />
                </button>
            </div>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {stats.map((stat, i) => (
                    <div key={i} style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '12px', padding: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</div>
                                <div style={{ fontSize: '24px', fontWeight: 700, color: '#09090b', marginTop: '4px' }}>{stat.value}</div>
                            </div>
                            <div style={{ width: '36px', height: '36px', background: stat.color, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <stat.icon size={18} style={{ color: stat.textColor === '#09090b' ? '#6b7280' : stat.textColor }} />
                            </div>
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ color: stat.textColor === '#09090b' ? '#6b7280' : stat.textColor, fontWeight: 500 }}>{stat.trend}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px' }}>
                {/* Line Chart */}
                <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#09090b' }}>Call Volume</div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>Day-over-day call metrics</div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: '8px', height: '8px', background: '#6366f1', borderRadius: '50%' }}></span> Calls
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: '8px', height: '8px', background: '#ec4899', borderRadius: '50%' }}></span> Connected
                            </div>
                        </div>
                    </div>
                    <div style={{ height: '260px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={callVolumeData}>
                                <defs>
                                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '11px', fill: '#6b7280' }} />
                                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: '8px', fontSize: '12px' }} />
                                <Area type="monotone" dataKey="calls" stroke="#6366f1" fill="url(#colorCalls)" strokeWidth={2} />
                                <Area type="monotone" dataKey="connected" stroke="#ec4899" fill="none" strokeWidth={2} strokeDasharray="4 4" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Donut Chart */}
                <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#09090b', marginBottom: '4px' }}>Call Statuses</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '20px' }}>Dispositions breakdown</div>
                    
                    <div style={{ height: '180px', display: 'flex', justifyContent: 'center' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={dispositionData} innerRadius={55} outerRadius={75} paddingAngle={2} dataKey="value">
                                    {dispositionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '16px' }}>
                        {dispositionData.map((d, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: '8px', height: '8px', background: d.color, borderRadius: '50%' }}></span>
                                <span style={{ fontSize: '12px', color: '#1f2937' }}>{d.name} <span style={{ color: '#6b7280' }}>({d.value}%)</span></span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Agents Leaderboard */}
            <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#09090b', marginBottom: '16px' }}>Top Performing Agents</div>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #f4f4f5' }}>
                            <th style={{ padding: '8px 4px', fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 500 }}>Agent</th>
                            <th style={{ padding: '8px 4px', fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 500 }}>Type</th>
                            <th style={{ padding: '8px 4px', fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 500 }}>Total Calls</th>
                            <th style={{ padding: '8px 4px', fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 500 }}>Connected</th>
                            <th style={{ padding: '8px 4px', fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 500 }}>Success Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        {topAgents.map((agent, i) => (
                            <tr key={i} style={{ borderBottom: i === topAgents.length - 1 ? 'none' : '1px solid #f9fafb' }}>
                                <td style={{ padding: '12px 4px', fontSize: '13px', color: '#09090b', fontWeight: 500 }}>{agent.name}</td>
                                <td style={{ padding: '12px 4px', fontSize: '12px', color: '#6b7280' }}>
                                    <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: agent.type === 'Outbound' ? '#e0f2fe' : '#f4f4f5', color: agent.type === 'Outbound' ? '#0369a1' : '#71717a' }}>
                                        {agent.type}
                                    </span>
                                </td>
                                <td style={{ padding: '12px 4px', fontSize: '13px', color: '#09090b' }}>{agent.calls}</td>
                                <td style={{ padding: '12px 4px', fontSize: '13px', color: '#10b981' }}>{agent.connected}</td>
                                <td style={{ padding: '12px 4px', fontSize: '13px', fontWeight: 600, color: '#09090b' }}>{agent.rate}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
