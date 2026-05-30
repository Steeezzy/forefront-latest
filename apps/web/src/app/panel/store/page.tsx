'use client';

import { useState } from 'react';
import {
  TrendingUp, ShoppingCart, Package, DollarSign,
  Plus, List, Settings, BarChart3, ArrowRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const recentOrders = [
  { id: '#1047', customer: 'Raj Kumar', items: 3, amount: 2450, status: 'paid', date: '2024-01-15' },
  { id: '#1046', customer: 'Priya Singh', items: 1, amount: 899, status: 'pending', date: '2024-01-15' },
  { id: '#1045', customer: 'Amit Patel', items: 5, amount: 4200, status: 'paid', date: '2024-01-14' },
  { id: '#1044', customer: 'Sunita Sharma', items: 2, amount: 1599, status: 'failed', date: '2024-01-14' },
  { id: '#1043', customer: 'Vikram Nair', items: 1, amount: 750, status: 'refunded', date: '2024-01-13' },
];

const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  refunded: 'bg-gray-100 text-gray-600 border-gray-200',
};

function formatINR(v: number) {
  return `₹${v.toLocaleString('en-IN')}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function StoreDashboardPage() {
  const [_loading] = useState(false);

  const stats = [
    {
      label: 'Total Revenue',
      value: formatINR(98420),
      sub: '+12.4% from last month',
      positive: true,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Orders',
      value: '247',
      sub: '+8 today',
      positive: true,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Products',
      value: '38',
      sub: '6 draft, 32 active',
      positive: null,
      icon: Package,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'Avg Order Value',
      value: formatINR(398),
      sub: '-2.1% from last month',
      positive: false,
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ];

  const quickActions = [
    { label: 'Add Product', icon: Plus, href: '/panel/store/products' },
    { label: 'View All Orders', icon: List, href: '/panel/store/orders' },
    { label: 'Manage Inventory', icon: BarChart3, href: '/panel/store/inventory' },
    { label: 'Store Settings', icon: Settings, href: '/panel/store/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Online Store</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your products, orders, and store settings</p>
        </div>
        <Button asChild className="bg-gray-900 text-white hover:bg-gray-800 rounded-xl">
          <a href="/panel/store/products">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </a>
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500 font-medium">{s.label}</span>
                <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center', s.bg)}>
                  <Icon className={cn('h-5 w-5', s.color)} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className={cn('text-xs mt-1', s.positive === true ? 'text-emerald-600' : s.positive === false ? 'text-red-500' : 'text-gray-400')}>
                {s.sub}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="xl:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Recent Orders</h2>
            <a href="/panel/store/orders" className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">Order</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Items</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-medium text-gray-900">{order.id}</td>
                    <td className="px-4 py-3.5 text-gray-700">{order.customer}</td>
                    <td className="px-4 py-3.5 text-gray-500">{order.items}</td>
                    <td className="px-4 py-3.5 font-semibold text-gray-900">{formatINR(order.amount)}</td>
                    <td className="px-4 py-3.5">
                      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize', STATUS_STYLES[order.status])}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 text-xs">{formatDate(order.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <a
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all group"
                >
                  <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-900 transition-colors">
                    <Icon className="h-4 w-4 text-gray-600 group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{action.label}</span>
                  <ArrowRight className="h-4 w-4 text-gray-300 ml-auto group-hover:text-gray-600 transition-colors" />
                </a>
              );
            })}
          </div>

          {/* Mini summary */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">This Month</p>
            <div className="space-y-2">
              {[
                { label: 'Orders fulfilled', value: '182 / 247' },
                { label: 'Return rate', value: '2.3%' },
                { label: 'Low stock items', value: '3 products' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{item.label}</span>
                  <span className="text-xs font-semibold text-gray-700">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
