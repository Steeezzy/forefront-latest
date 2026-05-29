'use client';

import { Megaphone, Plus, TrendingUp, Mail, MessageSquare } from 'lucide-react';

const campaigns = [
  { name: 'Welcome Email Series', type: 'Email', status: 'Active', sent: 142, opened: '68%', revenue: '₹12,400' },
  { name: 'Abandoned Cart Recovery', type: 'Automation', status: 'Active', sent: 38, opened: '52%', revenue: '₹7,200' },
  { name: 'Summer Sale Blast', type: 'Email', status: 'Scheduled', sent: 0, opened: '—', revenue: '—' },
];

export default function MarketingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900">Marketing</h1>
          <p className="text-sm text-gray-500">Campaigns and automations</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-[13px] font-semibold rounded-lg hover:bg-gray-700 transition-colors">
          <Plus className="w-3.5 h-3.5" />
          Create campaign
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Campaign revenue', value: '₹19,600', icon: TrendingUp },
          { label: 'Emails sent', value: '180', icon: Mail },
          { label: 'SMS sent', value: '0', icon: MessageSquare },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-[#e1e3e5] p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-gray-400" />
                <p className="text-[11px] text-gray-500">{s.label}</p>
              </div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Campaigns list */}
      <div className="bg-white rounded-xl border border-[#e1e3e5] shadow-sm overflow-hidden">
        <div className="px-4 py-4 border-b border-[#e1e3e5]">
          <h2 className="text-[14px] font-semibold text-gray-900">All campaigns</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e1e3e5]">
              <th className="text-left px-4 py-3 text-[12px] font-medium text-gray-500">Campaign</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-gray-500">Type</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-gray-500">Sent</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-gray-500">Open rate</th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-gray-500">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map(c => (
              <tr key={c.name} className="border-b border-[#f3f3f3] hover:bg-[#f9f9f9] cursor-pointer transition-colors">
                <td className="px-4 py-3 text-[13px] font-medium text-blue-600">{c.name}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700">
                    {c.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                    c.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-[13px] text-gray-700">{c.sent}</td>
                <td className="px-4 py-3 text-[13px] text-gray-700">{c.opened}</td>
                <td className="px-4 py-3 text-[13px] font-medium text-gray-900">{c.revenue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
