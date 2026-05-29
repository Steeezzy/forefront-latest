'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Settings, CreditCard, Users, ShoppingBag, Truck,
  Receipt, MapPin, Globe2, AppWindow, Store, Zap,
  Bell, Layers, Shield, BookOpen, FileText, ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const BASE = '/hub/ecommerce/panel/settings';

const settingsNav = [
  { icon: Settings,    label: 'General',                href: `${BASE}` },
  { icon: CreditCard,  label: 'Plan',                   href: `${BASE}/plan` },
  { icon: Receipt,     label: 'Billing',                href: `${BASE}/billing` },
  { icon: Users,       label: 'Users and permissions',  href: `${BASE}/users` },
  { icon: ShoppingBag, label: 'Payments',               href: `${BASE}/payments` },
  { icon: Store,       label: 'Checkout',               href: `${BASE}/checkout` },
  { icon: Users,       label: 'Customer accounts',      href: `${BASE}/customer-accounts` },
  { icon: Truck,       label: 'Shipping and delivery',  href: `${BASE}/shipping` },
  { icon: Receipt,     label: 'Taxes and duties',       href: `${BASE}/taxes` },
  { icon: MapPin,      label: 'Locations',              href: `${BASE}/locations` },
  { icon: Globe2,      label: 'Markets',                href: `${BASE}/markets` },
  { icon: AppWindow,   label: 'Apps',                   href: `${BASE}/apps` },
  { icon: Layers,      label: 'Sales channels',         href: `${BASE}/sales-channels` },
  { icon: Globe2,      label: 'Domains',                href: `${BASE}/domains` },
  { icon: Zap,         label: 'Customer events',        href: `${BASE}/customer-events` },
  { icon: Bell,        label: 'Notifications',          href: `${BASE}/notifications` },
  { icon: BookOpen,    label: 'Metafields and metaobjects', href: `${BASE}/metafields` },
  { icon: Globe2,      label: 'Languages',              href: `${BASE}/languages` },
  { icon: Shield,      label: 'Customer privacy',       href: `${BASE}/privacy` },
  { icon: FileText,    label: 'Policies',               href: `${BASE}/policies` },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[calc(100vh-48px)]">
      {/* Settings sidebar */}
      <div className="w-[240px] flex-shrink-0 bg-white border-r border-[#e1e3e5] flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 border-b border-[#e1e3e5]">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <span className="text-white text-[11px] font-bold">MS</span>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-gray-900">My Store</p>
              <p className="text-[10px] text-gray-500">qestron.myshopify.com</p>
            </div>
          </div>
          <input
            type="text"
            placeholder="Search"
            className="w-full px-3 py-1.5 text-[12px] border border-[#e1e3e5] rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-[#f9f9f9]"
          />
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {settingsNav.map(item => {
            const Icon = item.icon;
            const active = item.href === BASE ? pathname === BASE : pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-4 py-2 text-[13px] transition-colors',
                  active ? 'bg-[#f0f0f0] text-gray-900 font-medium' : 'text-gray-700 hover:bg-[#f7f7f7]'
                )}
              >
                <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User at bottom */}
        <div className="px-4 py-3 border-t border-[#e1e3e5]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">KJ</span>
            </div>
            <div>
              <p className="text-[12px] font-medium text-gray-900">Karthik J</p>
              <p className="text-[10px] text-gray-500">karthikj@example.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings content */}
      <div className="flex-1 bg-[#f3f3f3] overflow-auto">
        {children}
      </div>
    </div>
  );
}
