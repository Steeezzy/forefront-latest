'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, ShoppingCart, Tag, Users, Megaphone, Percent,
  FileText, Globe2, BarChart2, Store, Bot,
  Plus, Settings, ChevronRight, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const BASE = '/hub/ecommerce/panel';

const mainNav = [
  { icon: Home,        label: 'Home',       href: `${BASE}`,           children: null },
  { icon: ShoppingCart,label: 'Orders',     href: `${BASE}/orders`,    children: [
      { label: 'Draft orders', href: `${BASE}/orders/drafts` },
    ]
  },
  { icon: Tag,         label: 'Products',   href: `${BASE}/products`,  children: [
      { label: 'Collections',     href: `${BASE}/products/collections` },
      { label: 'Inventory',       href: `${BASE}/products/inventory` },
      { label: 'Purchase orders', href: `${BASE}/products/purchase-orders` },
      { label: 'Gift cards',      href: `${BASE}/products/gift-cards` },
    ]
  },
  { icon: Users,       label: 'Customers',  href: `${BASE}/customers`, children: null },
  { icon: Megaphone,   label: 'Marketing',  href: `${BASE}/marketing`, children: [
      { label: 'Campaigns',   href: `${BASE}/marketing/campaigns` },
      { label: 'Automations', href: `${BASE}/marketing/automations` },
    ]
  },
  { icon: Percent,     label: 'Discounts',  href: `${BASE}/discounts`, children: null },
  { icon: FileText,    label: 'Content',    href: `${BASE}/content`,   children: [
      { label: 'Files', href: `${BASE}/content/files` },
    ]
  },
  { icon: Globe2,      label: 'Markets',    href: `${BASE}/markets`,   children: null },
  { icon: BarChart2,   label: 'Analytics',  href: `${BASE}/analytics`, children: [
      { label: 'Reports',   href: `${BASE}/analytics/reports` },
      { label: 'Live view', href: `${BASE}/analytics/live` },
    ]
  },
];

const salesChannels = [
  { icon: Store, label: 'Online Store', href: `${BASE}/online-store` },
  { icon: Bot,   label: 'AI Agents',   href: '/panel/agents' },
];

export function ShopifySidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string[]>([]);
  const [salesOpen, setSalesOpen] = useState(true);
  const [appsOpen, setAppsOpen] = useState(false);

  const toggle = (label: string) =>
    setExpanded(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );

  const isActive = (href: string) =>
    href === BASE ? pathname === BASE : pathname.startsWith(href);

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[200px] bg-white border-r border-[#e1e3e5] flex flex-col z-40 overflow-y-auto">
      {/* Store header */}
      <div className="px-2.5 py-3 border-b border-[#e1e3e5]">
        <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#f3f3f3] transition-colors text-left">
          <div className="w-7 h-7 rounded-md bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[11px] font-bold">MS</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-gray-900 truncate leading-tight">My Store</p>
            <p className="text-[10px] text-gray-500 truncate leading-tight">qestron.myshopify.com</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-2 py-2 space-y-px">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const open = expanded.includes(item.label);

          return (
            <div key={item.label}>
              <div
                className={cn(
                  'flex items-center gap-2 px-2.5 py-[7px] rounded-lg text-[13px] transition-colors cursor-pointer select-none',
                  active
                    ? 'bg-[#f0f0f0] text-gray-900 font-medium'
                    : 'text-gray-700 hover:bg-[#f3f3f3] hover:text-gray-900'
                )}
                onClick={() => item.children && toggle(item.label)}
              >
                <Link
                  href={item.href}
                  className="flex items-center gap-2 flex-1 min-w-0"
                  onClick={e => { if (item.children) e.preventDefault(); }}
                >
                  <Icon className="w-[15px] h-[15px] flex-shrink-0 text-gray-500" />
                  <span className="truncate">{item.label}</span>
                </Link>
                {item.children && (
                  <ChevronRight
                    className={cn(
                      'w-3 h-3 text-gray-400 transition-transform flex-shrink-0',
                      open && 'rotate-90'
                    )}
                  />
                )}
              </div>
              {item.children && open && (
                <div className="ml-6 mt-px space-y-px">
                  {item.children.map((child) => (
                    <Link
                      key={child.label}
                      href={child.href}
                      className={cn(
                        'block px-2.5 py-[6px] rounded-lg text-[12px] transition-colors',
                        pathname === child.href
                          ? 'bg-[#f0f0f0] text-gray-900 font-medium'
                          : 'text-gray-600 hover:bg-[#f3f3f3] hover:text-gray-900'
                      )}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Sales channels section */}
        <div className="pt-3 pb-1">
          <button
            onClick={() => setSalesOpen(!salesOpen)}
            className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
          >
            <span>Sales channels</span>
            <ChevronRight className={cn('w-3 h-3 transition-transform', salesOpen && 'rotate-90')} />
          </button>
          {salesOpen && (
            <div className="mt-px space-y-px">
              {salesChannels.map((ch) => {
                const Icon = ch.icon;
                return (
                  <Link
                    key={ch.label}
                    href={ch.href}
                    className={cn(
                      'flex items-center gap-2 px-2.5 py-[7px] rounded-lg text-[13px] transition-colors',
                      isActive(ch.href)
                        ? 'bg-[#f0f0f0] text-gray-900 font-medium'
                        : 'text-gray-700 hover:bg-[#f3f3f3] hover:text-gray-900'
                    )}
                  >
                    <Icon className="w-[15px] h-[15px] text-gray-500 flex-shrink-0" />
                    <span>{ch.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Apps section */}
        <div className="py-1">
          <button
            onClick={() => setAppsOpen(!appsOpen)}
            className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
          >
            <span>Apps</span>
            <ChevronRight className={cn('w-3 h-3 transition-transform', appsOpen && 'rotate-90')} />
          </button>
          {appsOpen && (
            <Link
              href={`${BASE}/apps`}
              className="flex items-center gap-2 px-2.5 py-[7px] rounded-lg text-[13px] text-gray-700 hover:bg-[#f3f3f3] transition-colors"
            >
              <Plus className="w-[15px] h-[15px] text-gray-500" />
              <span>Add</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Settings + Trial banner */}
      <div className="px-2 pb-3 pt-2 border-t border-[#e1e3e5] space-y-1">
        <Link
          href={`${BASE}/settings`}
          className={cn(
            'flex items-center gap-2 px-2.5 py-[7px] rounded-lg text-[13px] transition-colors',
            pathname.startsWith(`${BASE}/settings`)
              ? 'bg-[#f0f0f0] text-gray-900 font-medium'
              : 'text-gray-700 hover:bg-[#f3f3f3] hover:text-gray-900'
          )}
        >
          <Settings className="w-[15px] h-[15px] text-gray-500" />
          <span>Settings</span>
        </Link>

        <div className="mt-2 rounded-xl bg-[#1a1a1a] px-3 py-3 text-center">
          <p className="text-[11px] font-medium text-gray-300 mb-0.5">Trial ends in 3 days</p>
          <p className="text-[10px] text-gray-500 mb-2">Subscribe for ₹20</p>
          <button className="w-full py-1.5 rounded-lg bg-white text-gray-900 text-[12px] font-semibold hover:bg-gray-100 transition-colors">
            Select a plan
          </button>
        </div>
      </div>
    </aside>
  );
}
