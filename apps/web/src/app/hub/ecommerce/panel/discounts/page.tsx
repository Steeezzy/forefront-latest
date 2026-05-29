'use client';

import { Plus, Tag, Percent } from 'lucide-react';

const discounts = [
  { code: 'WELCOME10', type: 'Percentage', value: '10% off', used: 23, status: 'Active', ends: 'Never' },
  { code: 'SUMMER25', type: 'Percentage', value: '25% off', used: 8, status: 'Active', ends: 'Jun 30, 2026' },
  { code: 'FREESHIP', type: 'Free shipping', value: 'Free shipping', used: 41, status: 'Active', ends: 'Never' },
  { code: 'FLASH50', type: 'Fixed amount', value: '₹500 off', used: 15, status: 'Expired', ends: 'May 1, 2026' },
];

export default function DiscountsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900">Discounts</h1>
          <p className="text-sm text-gray-500">{discounts.filter(d => d.status === 'Active').length} active discounts</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-[13px] font-semibold rounded-lg hover:bg-gray-700 transition-colors">
          <Plus className="w-3.5 h-3.5" />
          Create discount
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#e1e3e5] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e1e3e5]">
              <th className="w-8 px-4 py-3"><input type="checkbox" className="rounded" /></th>
              <th className="text-left px-3 py-3 text-[12px] font-medium text-gray-500">Discount code</th>
              <th className="text-left px-3 py-3 text-[12px] font-medium text-gray-500">Type</th>
              <th className="text-left px-3 py-3 text-[12px] font-medium text-gray-500">Value</th>
              <th className="text-left px-3 py-3 text-[12px] font-medium text-gray-500">Used</th>
              <th className="text-left px-3 py-3 text-[12px] font-medium text-gray-500">Status</th>
              <th className="text-left px-3 py-3 text-[12px] font-medium text-gray-500">Ends</th>
            </tr>
          </thead>
          <tbody>
            {discounts.map(d => (
              <tr key={d.code} className="border-b border-[#f3f3f3] hover:bg-[#f9f9f9] cursor-pointer transition-colors">
                <td className="px-4 py-3"><input type="checkbox" className="rounded" /></td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <Percent className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[13px] font-medium text-blue-600 font-mono">{d.code}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-[12px] text-gray-500">{d.type}</td>
                <td className="px-3 py-3 text-[13px] font-medium text-gray-900">{d.value}</td>
                <td className="px-3 py-3 text-[13px] text-gray-700">{d.used} uses</td>
                <td className="px-3 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                    d.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {d.status}
                  </span>
                </td>
                <td className="px-3 py-3 text-[12px] text-gray-500">{d.ends}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
