'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const salesData = [
  { day: 'Mon', sales: 0 }, { day: 'Tue', sales: 0 }, { day: 'Wed', sales: 0 },
  { day: 'Thu', sales: 0 }, { day: 'Fri', sales: 0 }, { day: 'Sat', sales: 0 }, { day: 'Sun', sales: 0 },
];

const sessionData = [
  { day: 'Mon', sessions: 12 }, { day: 'Tue', sessions: 18 }, { day: 'Wed', sessions: 8 },
  { day: 'Thu', sessions: 24 }, { day: 'Fri', sessions: 35 }, { day: 'Sat', sessions: 41 }, { day: 'Sun', sessions: 29 },
];

export default function AnalyticsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-[22px] font-semibold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500">Last 7 days</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total sales', value: '₹0', change: '—', color: 'text-gray-400' },
          { label: 'Sessions', value: '167', change: '+12%', color: 'text-green-600' },
          { label: 'Conversion rate', value: '0%', change: '—', color: 'text-gray-400' },
          { label: 'Avg. order value', value: '₹0', change: '—', color: 'text-gray-400' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-[#e1e3e5] p-4 shadow-sm">
            <p className="text-[11px] text-gray-500 mb-2">{k.label}</p>
            <p className="text-xl font-bold text-gray-900">{k.value}</p>
            <p className={`text-[11px] mt-0.5 font-medium ${k.color}`}>{k.change}</p>
          </div>
        ))}
      </div>

      {/* Sales chart */}
      <div className="bg-white rounded-xl border border-[#e1e3e5] p-5 shadow-sm">
        <h2 className="text-[14px] font-semibold text-gray-900 mb-4">Sales over time</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={salesData} barSize={24}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, border: '1px solid #e1e3e5', borderRadius: 8 }}
              cursor={{ fill: '#f3f3f3' }}
            />
            <Bar dataKey="sales" fill="#1a1a1a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-center text-[12px] text-gray-400 mt-4">No sales data yet. Add products and start selling to see data here.</p>
      </div>

      {/* Sessions chart */}
      <div className="bg-white rounded-xl border border-[#e1e3e5] p-5 shadow-sm">
        <h2 className="text-[14px] font-semibold text-gray-900 mb-4">Online store sessions</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={sessionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #e1e3e5', borderRadius: 8 }} />
            <Line type="monotone" dataKey="sessions" stroke="#008060" strokeWidth={2} dot={{ fill: '#008060', r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top products */}
      <div className="bg-white rounded-xl border border-[#e1e3e5] p-5 shadow-sm">
        <h2 className="text-[14px] font-semibold text-gray-900 mb-4">Top products by units sold</h2>
        <div className="py-10 text-center">
          <p className="text-[13px] text-gray-400">No data yet. Products will appear here once you start making sales.</p>
        </div>
      </div>
    </div>
  );
}
