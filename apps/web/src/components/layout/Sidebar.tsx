'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Bot, Phone, GitBranch, Users,
  BarChart2, Puzzle, Settings, Headphones,
  Mic, BookOpen, Inbox, Zap, Building2, Package, Ticket, Receipt, Network, Star,
  Globe, AppWindow, Globe2, ShoppingBag, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Agent sub-panel items ──────────────────────────────────────────────────
const agentSubItems = [
  { icon: Building2, label: 'Industries',     path: '/panel/agents/industries',    group: 'Chatbot' },
  { icon: Package,   label: 'Templates',      path: '/panel/agents/templates',     group: 'Chatbot' },
  { icon: Inbox,     label: 'Inbox',          path: '/panel/agents/inbox',         group: 'Chatbot' },
  { icon: Bot,       label: 'Chatbot',        path: '/panel/agents/chatbot',       group: 'Chatbot' },
  { icon: GitBranch, label: 'Flows',          path: '/panel/agents/flows',         group: 'Chatbot' },
  { icon: Users,     label: 'Customers',      path: '/panel/agents/customers',     group: 'Chatbot' },
  { icon: Network,   label: 'Workspace Core', path: '/panel/agents/workspace',     group: 'Chatbot' },
  { icon: Ticket,    label: 'Tickets',        path: '/panel/agents/tickets',       group: 'Chatbot' },
  { icon: Star,      label: 'Reviews',        path: '/panel/agents/reviews',       group: 'Chatbot' },
  { icon: Phone,     label: 'Voice Agents',   path: '/panel/agents/voice-agents',  group: 'Voice'   },
  { icon: Mic,       label: 'Campaigns',      path: '/panel/agents/campaigns',     group: 'Voice'   },
  { icon: BookOpen,  label: 'Knowledge Base', path: '/panel/agents/knowledge-base',group: 'Voice'   },
  { icon: Headphones,label: 'Live Monitor',   path: '/panel/agents/live-monitor',  group: 'Voice'   },
  { icon: BarChart2, label: 'Analytics',      path: '/panel/agents/analytics',     group: 'General' },
  { icon: Puzzle,    label: 'Integrations',   path: '/panel/agents/integrations',  group: 'General' },
  { icon: Receipt,   label: 'Invoices',       path: '/panel/agents/invoices',      group: 'General' },
  { icon: Zap,       label: 'Automation',     path: '/panel/agents/automation',    group: 'General' },
];

const agentGroups = ['Chatbot', 'Voice', 'General'] as const;

// ─── Primary nav items ──────────────────────────────────────────────────────
const primaryNav = [
  { icon: LayoutDashboard, label: 'Dashboard',  path: '/panel/dashboard' },
  { icon: Bot,             label: 'Agents',     path: '/panel/agents',   isAgents: true },
  { icon: ShoppingBag,     label: 'Store',      path: '/panel/store' },
  { icon: Globe2,          label: 'Websites',   path: '/panel/websites' },
  { icon: AppWindow,       label: 'Apps',       path: '/panel/apps' },
  { icon: Globe,           label: 'Cloud',      path: '/panel/cloud/domains' },
  { icon: Settings,        label: 'Settings',   path: '/panel/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const isOnAgentPath = pathname === '/panel/agents' || pathname.startsWith('/panel/agents/');
  const [agentPanelOpen, setAgentPanelOpen] = useState(isOnAgentPath);

  const isActive = (p: string) => pathname === p || pathname.startsWith(p + '/');

  // Close agent panel when navigating away from agent paths
  useEffect(() => {
    if (!isOnAgentPath) setAgentPanelOpen(false);
  }, [isOnAgentPath]);

  const MAIN_W = 'w-[72px] lg:w-16'; // icon-only main rail
  const SECOND_W = 'w-56';            // second panel width

  return (
    <>
      {/* ── Main sidebar rail ─────────────────────────────────────────── */}
      <div className={cn(
        "fixed left-0 top-0 bottom-0 bg-white border-r border-gray-200/60 z-40 flex flex-col transition-all duration-300",
        MAIN_W
      )}>
        {/* Brand */}
        <div className="flex items-center justify-center h-16 border-b border-gray-200/60 flex-shrink-0">
          <Link href="/panel/dashboard">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
          </Link>
        </div>

        {/* Nav icons */}
        <nav className="flex-1 py-4 flex flex-col items-center gap-1 overflow-y-auto">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const active = item.isAgents ? isOnAgentPath : isActive(item.path);
            const isAgentsBtn = !!item.isAgents;

            return (
              <button
                key={item.path}
                title={item.label}
                onClick={() => {
                  if (isAgentsBtn) {
                    setAgentPanelOpen(o => !o);
                  } else {
                    window.location.href = item.path;
                  }
                }}
                className={cn(
                  "flex flex-col items-center gap-1 w-12 py-2 rounded-xl text-xs font-medium transition-all duration-150 group",
                  active || (isAgentsBtn && agentPanelOpen)
                    ? "bg-gray-900 text-white shadow-lg"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5",
                  active || (isAgentsBtn && agentPanelOpen) ? "text-white" : "text-gray-500 group-hover:text-gray-700"
                )} />
                <span className="text-[9px] leading-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Status dot */}
        <div className="p-3 border-t border-gray-200/60 flex justify-center flex-shrink-0">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Systems Operational" />
        </div>
      </div>

      {/* ── Second sidebar panel (Agents) ────────────────────────────── */}
      <div className={cn(
        "fixed top-0 bottom-0 bg-white border-r border-gray-200/60 z-30 flex flex-col transition-all duration-300 overflow-hidden",
        "left-[72px] lg:left-16",
        agentPanelOpen ? SECOND_W : 'w-0'
      )}>
        {/* Panel header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200/60 flex-shrink-0 min-w-[224px]">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-indigo-600" />
            <span className="font-semibold text-sm text-gray-900">Agents</span>
          </div>
          <button
            onClick={() => setAgentPanelOpen(false)}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Panel nav */}
        <div className="flex-1 overflow-y-auto py-3 px-3 min-w-[224px]">
          {/* Link to agents overview */}
          <Link
            href="/panel/agents"
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium mb-3 transition-all",
              pathname === '/panel/agents'
                ? "bg-indigo-600 text-white shadow"
                : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-700"
            )}
          >
            <Bot className="h-4 w-4 flex-shrink-0" />
            <span>All Agents</span>
          </Link>

          {agentGroups.map(group => {
            const items = agentSubItems.filter(i => i.group === group);
            const groupColors: Record<string, string> = {
              Chatbot: 'text-indigo-500',
              Voice: 'text-violet-500',
              General: 'text-slate-500',
            };
            return (
              <div key={group} className="mb-4">
                <p className={cn("text-[10px] font-bold uppercase tracking-widest px-3 mb-1", groupColors[group])}>
                  {group}
                </p>
                <nav className="space-y-0.5">
                  {items.map(item => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-150",
                          active
                            ? "bg-gray-900 text-white font-medium shadow"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 flex-shrink-0", active ? "text-white" : "text-gray-400")} />
                        <span className="truncate">{item.label}</span>
                        {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white/70" />}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main content offset spacer ────────────────────────────────── */}
      <div className={cn(
        "flex-shrink-0 transition-all duration-300",
        "w-[72px] lg:w-16",
        agentPanelOpen && "lg:ml-56"
      )} />
    </>
  );
}
