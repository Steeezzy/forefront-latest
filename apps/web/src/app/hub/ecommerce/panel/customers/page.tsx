'use client';

import { useState } from 'react';
import { Search, Plus, Users, Mail, MapPin } from 'lucide-react';

const customers = [
  { id: 1, name: 'Rahul Sharma', email: 'rahul@example.com', location: 'Mumbai, MH', orders: 3, spent: '₹5,247', since: 'Mar 2024' },
  { id: 2, name: 'Priya Nair', email: 'priya@example.com', location: 'Bangalore, KA', orders: 1, spent: '₹3,250', since: 'Apr 2024' },
  { id: 3, name: 'Ankit Mehta', email: 'ankit@example.com', location: 'Delhi, DL', orders: 5, spent: '₹12,890', since: 'Jan 2024' },
  { id: 4, name: 'Sneha Patel', email: 'sneha@example.com', location: 'Ahmedabad, GJ', orders: 2, spent: '₹8,699', since: 'Feb 2024' },
  { id: 5, name: 'Kiran Kumar', email: 'kiran@example.com', location: 'Chennai, TN', orders: 7, spent: '₹21,450', since: 'Dec 2023' },
];

export default function CustomersPage() {
  const [search, setSearch] = useState('');

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500">{customers.length} customers</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-[#e1e3e5] text-gray-700 text-[13px] font-medium rounded-lg hover:bg-gray-50 transition-colors">
            Export
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-[13px] font-semibold rounded-lg hover:bg-gray-700 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Add customer
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total customers', value: '5', sub: 'All time' },
          { label: 'Repeat customers', value: '4', sub: '80% retention' },
          { label: 'Avg. order value', value: '₹2,107', sub: 'Per customer' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-[#e1e3e5] p-4 shadow-sm">
            <p className="text-[11px] text-gray-500 mb-1">{card.label}</p>
            <p className="text-xl font-bold text-gray-900">{card.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#e1e3e5] shadow-sm overflow-hidden">
        {/* Search */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e1e3e5]">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search customers"
              className="w-full pl-8 pr-3 py-1.5 text-[13px] border border-[#e1e3e5] rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e1e3e5]">
              <th className="w-8 px-4 py-3"><input type="checkbox" className="rounded" /></th>
              <th className="text-left px-3 py-3 text-[12px] font-medium text-gray-500">Customer name</th>
              <th className="text-left px-3 py-3 text-[12px] font-medium text-gray-500">Email</th>
              <th className="text-left px-3 py-3 text-[12px] font-medium text-gray-500">Location</th>
              <th className="text-left px-3 py-3 text-[12px] font-medium text-gray-500">Orders</th>
              <th className="text-left px-3 py-3 text-[12px] font-medium text-gray-500">Amount spent</th>
              <th className="text-left px-3 py-3 text-[12px] font-medium text-gray-500">Customer since</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(customer => (
              <tr key={customer.id} className="border-b border-[#f3f3f3] hover:bg-[#f9f9f9] cursor-pointer transition-colors">
                <td className="px-4 py-3"><input type="checkbox" className="rounded" /></td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                      <span className="text-white text-[11px] font-bold">{customer.name[0]}</span>
                    </div>
                    <span className="text-[13px] font-medium text-blue-600 hover:underline">{customer.name}</span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1 text-[12px] text-gray-500">
                    <Mail className="w-3 h-3" />
                    {customer.email}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1 text-[12px] text-gray-500">
                    <MapPin className="w-3 h-3" />
                    {customer.location}
                  </div>
                </td>
                <td className="px-3 py-3 text-[13px] text-gray-900">{customer.orders}</td>
                <td className="px-3 py-3 text-[13px] font-medium text-gray-900">{customer.spent}</td>
                <td className="px-3 py-3 text-[12px] text-gray-500">{customer.since}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
