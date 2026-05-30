"use client";

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Ticket, AlertTriangle, ArrowUp, ArrowDown, Minus,
  User, Clock, Tag, Hash
} from 'lucide-react';

const PRIORITY_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  urgent: { color: 'text-red-400', icon: ArrowUp, label: 'Urgent' },
  high: { color: 'text-orange-400', icon: ArrowUp, label: 'High' },
  normal: { color: 'text-blue-400', icon: Minus, label: 'Normal' },
  low: { color: 'text-zinc-500', icon: ArrowDown, label: 'Low' },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  unassigned: { color: 'text-zinc-400', bg: 'bg-zinc-500/10', label: 'Unassigned' },
  open: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Open' },
  pending: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Pending' },
  solved: { color: 'text-green-400', bg: 'bg-green-500/10', label: 'Solved' },
  closed: { color: 'text-zinc-500', bg: 'bg-zinc-500/10', label: 'Closed' },
};

interface TicketItem {
  id: string;
  ticket_number: string;
  subject: string;
  description?: string;
  status: string;
  priority: string;
  source: string;
  assigned_to?: string;
  assignee_email?: string;
  requester_name?: string;
  requester_email?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

interface TicketListProps {
  statusFilter: string;
  searchQuery?: string;
  selectedId?: string;
  onSelectTicket?: (ticket: TicketItem) => void;
}

export function TicketList({
  statusFilter = 'open',
  searchQuery = '',
  selectedId,
  onSelectTicket,
}: TicketListProps) {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      let url: string;
      if (statusFilter === 'unassigned') {
        url = `/api/tickets?assigned_to=unassigned`;
      } else {
        url = `/api/tickets?status=${statusFilter}`;
      }
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      const res = await apiFetch(url);
      const data = res.data || res;
      setTickets(data.tickets || data || []);
    } catch (e) {
      console.error('Failed to load tickets:', e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tickets.length) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3">
          <Ticket size={20} className="text-zinc-600" />
        </div>
        <p className="text-zinc-500 text-sm">No tickets found</p>
        <p className="text-zinc-600 text-xs mt-1">
          {statusFilter === 'unassigned' ? 'All tickets are assigned' :
           statusFilter === 'solved' ? 'No solved tickets yet' :
           'Create a ticket to get started'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {tickets.map(ticket => {
        const isSelected = ticket.id === selectedId;
        const priority = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.normal;
        const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
        const PriorityIcon = priority.icon;

        return (
          <button
            key={ticket.id}
            onClick={() => onSelectTicket?.(ticket)}
            className={cn(
              "flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-gray-200",
              isSelected ? "bg-blue-500/10 border-l-2 border-l-blue-500" : "hover:bg-white/5"
            )}
          >
            {/* Priority icon */}
            <div className="mt-1 flex-shrink-0">
              <PriorityIcon size={14} className={priority.color} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] text-zinc-600 font-mono flex-shrink-0">
                    {ticket.ticket_number}
                  </span>
                  <span className={cn(
                    "text-sm truncate",
                    isSelected ? "text-gray-900 font-semibold" : "text-zinc-300"
                  )}>
                    {ticket.subject}
                  </span>
                </div>
                <span className="text-xs text-zinc-600 flex-shrink-0">
                  {formatTime(ticket.updated_at || ticket.created_at)}
                </span>
              </div>

              {/* Requester */}
              {(ticket.requester_name || ticket.requester_email) && (
                <p className="text-xs text-zinc-500 truncate mt-0.5">
                  {ticket.requester_name || ticket.requester_email}
                </p>
              )}

              {/* Status + tags */}
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className={cn(
                  "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium",
                  status.bg, status.color
                )}>
                  {status.label}
                </span>

                {ticket.priority === 'urgent' && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded text-[10px]">
                    <AlertTriangle size={10} /> Urgent
                  </span>
                )}

                {ticket.priority === 'high' && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-orange-500/10 text-orange-400 rounded text-[10px]">
                    !! High
                  </span>
                )}

                {ticket.source && ticket.source !== 'manual' && (
                  <span className="inline-flex items-center px-1.5 py-0.5 bg-zinc-800 text-zinc-500 rounded text-[10px]">
                    {ticket.source}
                  </span>
                )}

                {ticket.assignee_email && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-zinc-800 text-zinc-500 rounded text-[10px]">
                    <User size={9} />
                    {ticket.assignee_email.split('@')[0]}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
