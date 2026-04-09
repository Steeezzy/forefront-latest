'use client';

import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Bot, Phone, GitBranch, Users,
  BarChart2, Puzzle, Settings, Headphones,
  Mic, BookOpen, Inbox, Zap, Building2, Package, Ticket, Receipt, Network, Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

const allNavItems = [
  {
    category: 'Chatbot',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/panel/dashboard' },
      { icon: Building2, label: 'Industries', path: '/panel/industries' },
      { icon: Package, label: 'Templates', path: '/panel/templates' },
      { icon: Inbox, label: 'Inbox', path: '/panel/inbox' },
      { icon: Bot, label: 'Chatbot', path: '/panel/chatbot' },
      { icon: GitBranch, label: 'Flows', path: '/panel/flows' },
      { icon: Users, label: 'Customers', path: '/panel/customers' },
      { icon: Network, label: 'Workspace Core', path: '/panel/workspace/core' },
      { icon: Ticket, label: 'Tickets', path: '/panel/tickets' },
      { icon: Star, label: 'Reviews', path: '/panel/reviews' },
    ]
  },
  {
    category: 'Voice',
    items: [
      { icon: Phone, label: 'Voice Agents', path: '/panel/voice-agents' },
      { icon: Mic, label: 'Campaigns', path: '/panel/campaigns' },
      { icon: BookOpen, label: 'Knowledge Base', path: '/panel/knowledge-base' },
      { icon: Headphones, label: 'Live Monitor', path: '/panel/live' },
    ]
  },
  {
    category: 'General',
    items: [
      { icon: BarChart2, label: 'Analytics', path: '/panel/analytics' },
      { icon: Puzzle, label: 'Integrations', path: '/panel/integrations' },
      { icon: Receipt, label: 'Invoices', path: '/panel/invoices' },
      { icon: Settings, label: 'Settings', path: '/panel/settings' },
      { icon: Zap, label: 'Automation', path: '/panel/automations' },
    ]
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActivePath = (itemPath: string) => {
    if (itemPath === '/panel/automations') {
      return (
        pathname === '/panel/automation' ||
        pathname.startsWith('/panel/automation/') ||
        pathname === itemPath ||
        pathname.startsWith(itemPath + '/')
      );
    }

    return pathname === itemPath || pathname.startsWith(itemPath + '/');
  };

  return (
    <div className="fixed left-0 top-0 bottom-0 bg-white border-r border-gray-200/60 z-40 flex flex-col w-[72px] lg:w-64">
      {/* Brand header */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-200/60 flex-shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 flex-shrink-0">
          <span className="text-white font-bold text-sm">Q</span>
        </div>
        <div className="hidden lg:block overflow-hidden">
          <p className="text-sm font-bold text-gray-900 leading-tight truncate">Questron</p>
          <p className="text-xs text-gray-500 leading-tight">Agent Panel</p>
        </div>
      </div>

      {/* Scrollable nav */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        {allNavItems.map((section, sectionIdx) => (
          <div key={sectionIdx} className="mb-6">
            <div className="mb-2 px-3">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden lg:block">
                {section.category}
              </h3>
            </div>
            <nav className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActivePath(item.path);
                const Icon = item.icon;
                return (
                  <a
                    key={item.path}
                    href={item.path}
                    title={item.label}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                      active
                        ? "bg-gray-900 text-white shadow-lg"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <Icon className={cn(
                      "h-5 w-5 flex-shrink-0",
                      active ? "text-white" : "text-gray-500 group-hover:text-gray-700"
                    )} />
                    <span className="truncate flex-1 hidden lg:inline">{item.label}</span>
                    {active && (
                      <div className="h-1.5 w-1.5 rounded-full bg-white/70 hidden lg:block" />
                    )}
                  </a>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Status */}
      <div className="p-4 border-t border-gray-200/60 flex-shrink-0">
        <div className="flex items-center gap-2 text-xs lg:justify-start justify-center">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <span className="text-gray-500 hidden lg:inline">Systems Operational</span>
        </div>
      </div>
    </div>
  );
}
