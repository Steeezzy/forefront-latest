'use client';

import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Bot, Phone, GitBranch, Users,
  BarChart2, Puzzle, Settings, Headphones,
  Mic, BookOpen, Inbox, Zap, Building2, Package, CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const allNavItems = [
  {
    category: 'Main',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/panel/dashboard' },
      { icon: Building2, label: 'Industries', path: '/panel/industries', badge: '12' },
      { icon: Package, label: 'Templates', path: '/panel/templates', badge: '30' },
      { icon: Puzzle, label: 'Integrations', path: '/panel/integrations' },
    ]
  },
  {
    category: 'Agents',
    items: [
      { icon: Phone, label: 'Voice Agents', path: '/panel/voice-agents' },
      { icon: Bot, label: 'Chatbot', path: '/panel/chatbot' },
      { icon: GitBranch, label: 'Flows', path: '/panel/flows' },
    ]
  },
  {
    category: 'Support',
    items: [
      { icon: Inbox, label: 'Inbox', path: '/panel/inbox' },
      { icon: Users, label: 'Customers', path: '/panel/customers' },
      { icon: BookOpen, label: 'Knowledge Base', path: '/panel/knowledge-base' },
    ]
  },
  {
    category: 'Operations',
    items: [
      { icon: Mic, label: 'Campaigns', path: '/panel/campaigns' },
      { icon: Headphones, label: 'Live Monitor', path: '/panel/live-monitor' },
      { icon: BarChart2, label: 'Analytics', path: '/panel/analytics' },
    ]
  },
  {
    category: 'Settings',
    items: [
      { icon: Settings, label: 'Settings', path: '/panel/settings' },
      { icon: CreditCard, label: 'Billing', path: '/panel/billing' },
    ]
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActivePath = (itemPath: string) => {
    return pathname === itemPath || pathname.startsWith(itemPath + '/');
  };

  return (
    <div className="fixed left-0 top-0 bottom-0 bg-white dark:bg-[#101728] border-r border-gray-200/60 dark:border-white/5 z-40 flex flex-col w-[72px] lg:w-64 transition-colors duration-300">
      {/* Brand header */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-200/60 dark:border-white/5 flex-shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 dark:bg-white flex-shrink-0 shadow-lg shadow-gray-200 dark:shadow-none">
          <span className="text-white dark:text-[#101728] font-black text-lg">Q</span>
        </div>
        <div className="hidden lg:block overflow-hidden">
          <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate">Questron</p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">Agent Panel</p>
        </div>
      </div>

      {/* Scrollable nav */}
      <div className="flex-1 overflow-y-auto py-6 px-3">
        {allNavItems.map((section, sectionIdx) => (
          <div key={sectionIdx} className="mb-6">
            <div className="mb-2 px-3">
              <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] hidden lg:block">
                {section.category}
              </h3>
            </div>
            <nav className="space-y-1">
              {section.items.map((item) => {
                const active = isActivePath(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                      active
                        ? "bg-gray-900 dark:bg-[#06d6a0] text-white dark:text-[#101728] shadow-lg shadow-gray-200 dark:shadow-none"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    <Icon className={cn(
                      "h-5 w-5 flex-shrink-0",
                      active ? "text-white dark:text-[#101728]" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                    )} />
                    <span className="truncate flex-1 hidden lg:inline">{item.label}</span>
                    
                    {item.badge && (
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-md font-bold hidden lg:inline",
                        active ? "bg-white/20 dark:bg-[#101728] text-white" : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                      )}>
                        {item.badge}
                      </span>
                    )}

                    {active && (
                      <div className="absolute left-0 top-2 bottom-2 w-1 bg-white dark:bg-[#101728] rounded-r-full hidden lg:block" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* User Section - Quick Mock */}
      <div className="p-4 border-t border-gray-200/60 dark:border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3 lg:justify-start justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 p-2 rounded-xl transition-all">
          <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-900 dark:text-white font-bold text-xs border border-gray-200 dark:border-white/10">
            JD
          </div>
          <div className="hidden lg:block overflow-hidden">
            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">John Doe</p>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-500">Pro Plan</span>
              <div className="h-1 w-1 rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
