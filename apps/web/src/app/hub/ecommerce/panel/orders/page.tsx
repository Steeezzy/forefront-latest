'use client';

import { useState } from 'react';
import { Search, Filter, ArrowUpDown, Package } from 'lucide-react';

const orders = [
  { id: '#1001', date: 'Today at 2:30 PM', customer: 'Rahul Sharma', channel: 'Online Store', total: '₹1,499', payment: 'Paid', fulfillment: 'Unfulfilled', items: 2 },
  { id: '#1002', date: 'Today at 11:15 AM', customer: 'Priya Nair', channel: 'Online Store', total: '₹3,250', payment: 'Paid', fulfillment: 'Fulfilled', items: 1 },
  { id: '#1003', date: 'Yesterday at 5:44 PM', customer: 'Ankit Mehta', channel: 'Online Store', total: '₹890', payment: 'Pending', fulfillment: 'Unfulfilled', items: 3 },
  { id: '#1004', date: 'Yesterday at 1:22 PM', customer: 'Sneha Patel', channel: 'Online Store', total: '₹5,699', payment: 'Paid', fulfillment: 'Fulfilled', items: 2 },
  { id: '#1005', date: 'May 27 at 10:08 AM', customer: 'Kiran Kumar', channel: 'Online Store', total: '₹2,100', payment: 'Refunded', fulfillment: 'Returned', items: 1 },
];

const tabs = ['All', 'Unfulfilled', 'Unpaid', 'Open', 'Closed'];

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = orders.filter(o =>
    o.customer.toLowerCase().includes(search.toLowerCase()) ||
    o.id.includes(search)
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">Manage your customer orders</p>
        </div>
        <button className="px-4 py-2 bg-gray-900 text-white text-[13px] font-semibold rounded-lg hover:bg-gray-700 transition-colors">
          Create order
        </button>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl border border-[#e1e3e5] shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-[#e1e3e5] px-4">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-3 text-[13px] font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Filters row */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e1e3e5]">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search orders"
              className="w-full pl-8 pr-3 py-1.5 text-[13px] border border-[#e1e3e5] rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e1e3e5] rounded-lg text-[13px] text-gray-600 hover:bg-gray-50 transition-colors">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e1e3e5] rounded-lg text-[13px] text-gray-600 hover:bg-gray-50 transition-colors ml-auto">
            <ArrowUpDown className="w-3.5 h-3.5" />
            Sort
          </button>
        </div>

        {/* Table */}
        {filtered.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e1e3e5]">
                <th className="w-8 px-4 py-3"><input type="checkbox" className="rounded" /></th>
                <th className="text-left px-3 py-3 text-[12px] font-medium text-gray-500">Order</th>
                <th className="text-left px-3 py-3 text-[12px] font-medium text-gray-500">Date</th>
                <th className="text-left px-3 py-3 text-[12px] font-medium text-gray-500">Customer</th>
                <th className="text-left px-3 py-3 text-[12px] font-medium text-gray-500">Channel</th>
                <th className="text-left px-3 py-3 text-[12px] font-medium text-gray-500">Total</th>
                <th className="text-left px-3 py-3 text-[12px] font-medium text-gray-500">Payment</th>
                <th className="text-left px-3 py-3 text-[12px] font-medium text-gray-500">Fulfillment</th>
                <th className="text-left px-3 py-3 text-[12px] font-medium text-gray-500">Items</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order, i) => (
                <tr key={order.id} className={`border-b border-[#f3f3f3] hover:bg-[#f9f9f9] cursor-pointer transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}>
                  <td className="px-4 py-3"><input type="checkbox" className="rounded" /></td>
                  <td className="px-3 py-3 text-[13px] font-medium text-blue-600 hover:underline">{order.id}</td>
                  <td className="px-3 py-3 text-[12px] text-gray-500 whitespace-nowrap">{order.date}</td>
                  <td className="px-3 py-3 text-[13px] text-gray-900">{order.customer}</td>
                  <td className="px-3 py-3 text-[12px] text-gray-500">{order.channel}</td>
                  <td className="px-3 py-3 text-[13px] font-medium text-gray-900">{order.total}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      order.payment === 'Paid' ? 'bg-green-100 text-green-700' :
                      order.payment === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {order.payment}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      order.fulfillment === 'Fulfilled' ? 'bg-blue-100 text-blue-700' :
                      order.fulfillment === 'Unfulfilled' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {order.fulfillment}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[12px] text-gray-500">{order.items} item{order.items > 1 ? 's' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-20 text-center">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-[14px] font-medium text-gray-500">No orders found</p>
            <p className="text-[12px] text-gray-400 mt-1">Try adjusting your search or filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
