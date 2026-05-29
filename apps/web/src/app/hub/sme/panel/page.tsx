'use client';
import { TrendingUp, Users, FileText, Package } from 'lucide-react';

const stats = [
  { icon: TrendingUp, label: 'Revenue (month)', value: '₹2,84,500', trend: '+18%', color: 'text-amber-500' },
  { icon: Users, label: 'Active Customers', value: '342', trend: '+7 new', color: 'text-blue-400' },
  { icon: FileText, label: 'Pending Invoices', value: '12', trend: '₹48,200 due', color: 'text-rose-400' },
  { icon: Package, label: 'Products Listed', value: '89', trend: '6 low stock', color: 'text-emerald-400' },
];

const recentInvoices = [
  { id: '#INV-2024', customer: 'Sharma Stores', amount: '₹12,500', status: 'Paid', date: 'May 28' },
  { id: '#INV-2023', customer: 'Ravi Enterprises', amount: '₹8,200', status: 'Pending', date: 'May 27' },
  { id: '#INV-2022', customer: 'Meena Textiles', amount: '₹23,750', status: 'Paid', date: 'May 26' },
  { id: '#INV-2021', customer: 'Kumar Trading', amount: '₹5,000', status: 'Overdue', date: 'May 25' },
  { id: '#INV-2020', customer: 'Patel & Sons', amount: '₹15,300', status: 'Paid', date: 'May 24' },
];

const statusColors: Record<string,string> = {
  'Paid': 'bg-green-100 text-green-700',
  'Pending': 'bg-amber-100 text-amber-700',
  'Overdue': 'bg-red-100 text-red-700',
};

export default function SMEPanelHome() {
  return (
    <div className="max-w-5xl mx-auto px-5 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Good morning, Karthik 👋</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your business dashboard · May 2026</p>
        </div>
        <div className="bg-[#25d366] text-white text-[12px] font-semibold px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-[#1db954]">
          <span>📱</span> WhatsApp CRM
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <Icon className={`w-5 h-5 mb-3 ${s.color}`} />
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-[11px] font-medium text-gray-600 mt-0.5">{s.label}</p>
              <p className="text-[10px] text-gray-400 mt-1">{s.trend}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-gray-800">Recent Invoices</h2>
          <button className="text-[12px] text-amber-600 font-medium hover:text-amber-700">View all →</button>
        </div>
        <table className="w-full">
          <thead><tr className="bg-gray-50 text-[11px] text-gray-500 uppercase tracking-wide">
            <th className="text-left px-5 py-2.5">Invoice ID</th>
            <th className="text-left px-5 py-2.5">Customer</th>
            <th className="text-left px-5 py-2.5">Amount</th>
            <th className="text-left px-5 py-2.5">Status</th>
            <th className="text-left px-5 py-2.5">Date</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {recentInvoices.map(inv => (
              <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 text-[12px] font-mono text-gray-600">{inv.id}</td>
                <td className="px-5 py-3 text-[13px] font-medium text-gray-800">{inv.customer}</td>
                <td className="px-5 py-3 text-[13px] font-semibold text-gray-900">{inv.amount}</td>
                <td className="px-5 py-3"><span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusColors[inv.status]}`}>{inv.status}</span></td>
                <td className="px-5 py-3 text-[12px] text-gray-500">{inv.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
