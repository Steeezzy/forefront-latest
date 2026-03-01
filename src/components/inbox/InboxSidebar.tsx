"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Inbox, CheckCircle, Mail, Globe,
  Phone, Instagram, Facebook,
  ChevronDown, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

export type InboxView = 'conversations' | 'tickets';

export type ConversationStatusFilter = 'unassigned' | 'open' | 'solved';
export type TicketStatusFilter = 'unassigned' | 'open' | 'solved';

interface InboxSidebarProps {
  activeView: InboxView;
  onViewChange: (view: InboxView) => void;
  conversationStatus: ConversationStatusFilter;
  ticketStatus: TicketStatusFilter;
  onConversationStatusChange: (status: ConversationStatusFilter) => void;
  onTicketStatusChange: (status: TicketStatusFilter) => void;
  channelFilter?: string;
  onChannelFilterChange?: (channel: string) => void;
}

interface ConversationStats {
  open_count: number;
  closed_count: number;
  snoozed_count: number;
  unassigned_count: number;
  unread_count: number;
}

interface TicketStats {
  open_count: string;
  pending_count: string;
  solved_count: string;
  closed_count: string;
  unassigned_count: string;
  urgent_open: string;
  high_open: string;
  total: string;
}

const channelFilters = [
  { id: 'all', icon: Inbox, label: 'All Channels' },
  { id: 'web', icon: Globe, label: 'Web Chat', color: 'text-purple-400' },
  { id: 'whatsapp', icon: Phone, label: 'WhatsApp', color: 'text-green-400' },
  { id: 'instagram', icon: Instagram, label: 'Instagram', color: 'text-pink-400' },
  { id: 'messenger', icon: Facebook, label: 'Messenger', color: 'text-blue-400' },
  { id: 'email', icon: Mail, label: 'Email', color: 'text-yellow-400' },
];

export function InboxSidebar({
  activeView,
  onViewChange,
  conversationStatus,
  ticketStatus,
  onConversationStatusChange,
  onTicketStatusChange,
  channelFilter = 'all',
  onChannelFilterChange,
}: InboxSidebarProps) {
  const [convStats, setConvStats] = useState<ConversationStats | null>(null);
  const [ticketStatsData, setTicketStatsData] = useState<TicketStats | null>(null);
  const [convExpanded, setConvExpanded] = useState(true);
  const [ticketsExpanded, setTicketsExpanded] = useState(true);
  const [channelsExpanded, setChannelsExpanded] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const [convRes, ticketRes] = await Promise.all([
        apiFetch('/api/inbox/stats').catch(() => null),
        apiFetch('/api/tickets/stats').catch(() => null),
      ]);
      if (convRes) setConvStats(convRes.data || convRes);
      if (ticketRes) setTicketStatsData(ticketRes.data || ticketRes);
    } catch (e) {
      // Stats are optional
    }
  }, []);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [loadStats]);

  const convUnassigned = convStats?.unassigned_count || 0;
  const convOpen = convStats?.open_count || 0;
  const convSolved = convStats?.closed_count || 0;

  const tktUnassigned = parseInt(ticketStatsData?.unassigned_count || '0');
  const tktOpen = parseInt(ticketStatsData?.open_count || '0') + parseInt(ticketStatsData?.pending_count || '0');
  const tktSolved = parseInt(ticketStatsData?.solved_count || '0') + parseInt(ticketStatsData?.closed_count || '0');

  const CountBadge = ({ count, active }: { count: number; active: boolean }) => {
    if (count <= 0) return null;
    return (
      <span className={cn(
        "text-xs font-medium tabular-nums px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
        active ? "bg-blue-500/20 text-blue-400" : "bg-zinc-800 text-zinc-500"
      )}>
        {count}
      </span>
    );
  };

  return (
    <aside className="w-64 border-r border-white/5 bg-[#0f1115] flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="h-14 flex items-center px-4 border-b border-white/5 gap-3">
        <div className="p-1.5 bg-blue-600/10 rounded-lg">
          <Inbox className="w-5 h-5 text-blue-500" />
        </div>
        <h1 className="font-bold text-lg text-white">Inbox</h1>
        {convStats && convStats.unread_count > 0 && (
          <span className="ml-auto text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
            {convStats.unread_count}
          </span>
        )}
      </div>

      <div className="flex-1 py-3 px-3 space-y-1">

        {/* ─── Live conversations section ─── */}
        <div>
          <button
            onClick={() => setConvExpanded(!convExpanded)}
            className="w-full flex items-center justify-between px-2 py-2 group"
          >
            <div className="flex items-center gap-2">
              {convExpanded ? (
                <ChevronDown size={14} className="text-zinc-500" />
              ) : (
                <ChevronRight size={14} className="text-zinc-500" />
              )}
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Live conversations
              </span>
            </div>
          </button>

          {convExpanded && (
            <nav className="space-y-0.5 ml-1">
              <button
                onClick={() => { onViewChange('conversations'); onConversationStatusChange('unassigned'); }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  activeView === 'conversations' && conversationStatus === 'unassigned'
                    ? "bg-[#1c1f26] text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base leading-none">👋</span>
                  <span>Unassigned</span>
                </div>
                <CountBadge count={convUnassigned} active={activeView === 'conversations' && conversationStatus === 'unassigned'} />
              </button>

              <button
                onClick={() => { onViewChange('conversations'); onConversationStatusChange('open'); }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  activeView === 'conversations' && conversationStatus === 'open'
                    ? "bg-[#1c1f26] text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base leading-none">📬</span>
                  <span>My open</span>
                </div>
                <CountBadge count={convOpen} active={activeView === 'conversations' && conversationStatus === 'open'} />
              </button>

              <button
                onClick={() => { onViewChange('conversations'); onConversationStatusChange('solved'); }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  activeView === 'conversations' && conversationStatus === 'solved'
                    ? "bg-[#1c1f26] text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base leading-none">✅</span>
                  <span>Solved</span>
                </div>
                <CountBadge count={convSolved} active={activeView === 'conversations' && conversationStatus === 'solved'} />
              </button>
            </nav>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-white/5 mx-2 my-2" />

        {/* ─── Tickets section ─── */}
        <div>
          <button
            onClick={() => setTicketsExpanded(!ticketsExpanded)}
            className="w-full flex items-center justify-between px-2 py-2 group"
          >
            <div className="flex items-center gap-2">
              {ticketsExpanded ? (
                <ChevronDown size={14} className="text-zinc-500" />
              ) : (
                <ChevronRight size={14} className="text-zinc-500" />
              )}
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tickets
              </span>
            </div>
          </button>

          {ticketsExpanded && (
            <nav className="space-y-0.5 ml-1">
              <button
                onClick={() => { onViewChange('tickets'); onTicketStatusChange('unassigned'); }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  activeView === 'tickets' && ticketStatus === 'unassigned'
                    ? "bg-[#1c1f26] text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base leading-none">👋</span>
                  <span>Unassigned</span>
                </div>
                <CountBadge count={tktUnassigned} active={activeView === 'tickets' && ticketStatus === 'unassigned'} />
              </button>

              <button
                onClick={() => { onViewChange('tickets'); onTicketStatusChange('open'); }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  activeView === 'tickets' && ticketStatus === 'open'
                    ? "bg-[#1c1f26] text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base leading-none">📬</span>
                  <span>My open</span>
                </div>
                <CountBadge count={tktOpen} active={activeView === 'tickets' && ticketStatus === 'open'} />
              </button>

              <button
                onClick={() => { onViewChange('tickets'); onTicketStatusChange('solved'); }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  activeView === 'tickets' && ticketStatus === 'solved'
                    ? "bg-[#1c1f26] text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base leading-none">✅</span>
                  <span>Solved</span>
                </div>
                <CountBadge count={tktSolved} active={activeView === 'tickets' && ticketStatus === 'solved'} />
              </button>
            </nav>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-white/5 mx-2 my-2" />

        {/* ─── Channels filter ─── */}
        <div>
          <button
            onClick={() => setChannelsExpanded(!channelsExpanded)}
            className="w-full flex items-center justify-between px-2 py-2 group"
          >
            <div className="flex items-center gap-2">
              {channelsExpanded ? (
                <ChevronDown size={14} className="text-zinc-500" />
              ) : (
                <ChevronRight size={14} className="text-zinc-500" />
              )}
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Channels
              </span>
            </div>
          </button>

          {channelsExpanded && (
            <nav className="space-y-0.5 ml-1">
              {channelFilters.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onChannelFilterChange?.(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    channelFilter === item.id
                      ? "bg-[#1c1f26] text-white"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon size={16} className={channelFilter === item.id ? (item.color || "text-blue-500") : "text-slate-500"} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          )}
        </div>
      </div>
    </aside>
  );
}
