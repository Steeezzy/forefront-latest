'use client';

import { Bot, Building2, Package, Inbox, GitBranch, Users, Network, Ticket, Star, Phone, Mic, BookOpen, Headphones, BarChart2, Puzzle, Receipt, Zap } from 'lucide-react';
import Link from 'next/link';

const agentSections = [
  {
    title: 'Chatbot',
    color: 'indigo',
    items: [
      { icon: Building2, label: 'Industries', path: '/panel/agents/industries', desc: 'Browse industry templates' },
      { icon: Package, label: 'Templates', path: '/panel/agents/templates', desc: 'Pre-built chatbot templates' },
      { icon: Inbox, label: 'Inbox', path: '/panel/agents/inbox', desc: 'Manage conversations' },
      { icon: Bot, label: 'Chatbot', path: '/panel/agents/chatbot', desc: 'Configure your chatbot' },
      { icon: GitBranch, label: 'Flows', path: '/panel/agents/flows', desc: 'Build conversation flows' },
      { icon: Users, label: 'Customers', path: '/panel/agents/customers', desc: 'Customer management' },
      { icon: Network, label: 'Workspace Core', path: '/panel/agents/workspace', desc: 'Workspace settings' },
      { icon: Ticket, label: 'Tickets', path: '/panel/agents/tickets', desc: 'Support ticket system' },
      { icon: Star, label: 'Reviews', path: '/panel/agents/reviews', desc: 'Customer reviews & ratings' },
    ],
  },
  {
    title: 'Voice',
    color: 'violet',
    items: [
      { icon: Phone, label: 'Voice Agents', path: '/panel/agents/voice-agents', desc: 'AI voice agent setup' },
      { icon: Mic, label: 'Campaigns', path: '/panel/agents/campaigns', desc: 'Outbound voice campaigns' },
      { icon: BookOpen, label: 'Knowledge Base', path: '/panel/agents/knowledge-base', desc: 'AI knowledge sources' },
      { icon: Headphones, label: 'Live Monitor', path: '/panel/agents/live-monitor', desc: 'Real-time call monitoring' },
    ],
  },
  {
    title: 'General',
    color: 'slate',
    items: [
      { icon: BarChart2, label: 'Analytics', path: '/panel/agents/analytics', desc: 'Performance analytics' },
      { icon: Puzzle, label: 'Integrations', path: '/panel/agents/integrations', desc: 'Connect your tools' },
      { icon: Receipt, label: 'Invoices', path: '/panel/agents/invoices', desc: 'Billing & invoices' },
      { icon: Zap, label: 'Automation', path: '/panel/agents/automation', desc: 'Workflow automation' },
    ],
  },
];

const colorMap: Record<string, { bg: string; icon: string; badge: string }> = {
  indigo: { bg: 'bg-indigo-50 hover:bg-indigo-100', icon: 'text-indigo-600', badge: 'bg-indigo-100 text-indigo-700' },
  violet: { bg: 'bg-violet-50 hover:bg-violet-100', icon: 'text-violet-600', badge: 'bg-violet-100 text-violet-700' },
  slate:  { bg: 'bg-slate-50 hover:bg-slate-100',   icon: 'text-slate-600',  badge: 'bg-slate-100 text-slate-700'  },
};

export default function AgentsPage() {
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <p className="text-sm text-gray-500">All your AI agent tools in one place</p>
        </div>
      </div>

      {/* Sections */}
      {agentSections.map((section) => {
        const colors = colorMap[section.color];
        return (
          <div key={section.title}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${colors.badge}`}>
                {section.title}
              </span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex flex-col gap-2 p-4 rounded-xl border border-gray-200/60 transition-all duration-150 ${colors.bg} group`}
                  >
                    <Icon className={`h-5 w-5 ${colors.icon}`} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 leading-tight">{item.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{item.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

