"use client";

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Phone, Instagram, Facebook, Mail, Globe, Bot,
  UserCheck, Clock, AlertTriangle, ArrowRightLeft
} from 'lucide-react';

const CHANNEL_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  whatsapp: { icon: Phone, color: 'text-green-400', label: 'WhatsApp' },
  instagram: { icon: Instagram, color: 'text-pink-400', label: 'Instagram' },
  messenger: { icon: Facebook, color: 'text-blue-400', label: 'Messenger' },
  email: { icon: Mail, color: 'text-yellow-400', label: 'Email' },
  web: { icon: Globe, color: 'text-purple-400', label: 'Web' },
};

interface Conversation {
  id: string;
  visitor_name: string;
  visitor_email?: string;
  channel: string;
  status: string;
  last_message_preview: string;
  last_message_at: string;
  is_read: boolean;
  ai_resolved: boolean;
  agent_takeover: boolean;
  auto_reply_paused: boolean;
  was_escalated: boolean;
  priority: string;
}

interface ConversationListProps {
  onSelectConversation?: (conv: Conversation) => void;
  selectedId?: string;
  channelFilter?: string;
  statusFilter?: string;
  searchQuery?: string;
}

export function ConversationList({
  onSelectConversation,
  selectedId,
  channelFilter,
  statusFilter = 'open',
  searchQuery = ''
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      let url = `/api/inbox/conversations?status=${statusFilter}`;
      if (channelFilter && channelFilter !== 'all') {
        url += `&channel=${channelFilter}`;
      }
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      const res = await apiFetch(url);
      setConversations(res.data || res.conversations || []);
    } catch (e) {
      console.error('Failed to load conversations:', e);
    } finally {
      setLoading(false);
    }
  }, [channelFilter, statusFilter, searchQuery]);

  useEffect(() => { load(); }, [load]);

  // Refresh every 10 seconds for near-real-time updates
  useEffect(() => {
    const interval = setInterval(load, 10000);
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
    return `${diffDays}d`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!conversations.length) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-zinc-500 text-sm">No conversations found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {conversations.map(conv => {
        const ch = CHANNEL_CONFIG[conv.channel] || CHANNEL_CONFIG.web;
        const ChannelIcon = ch.icon;
        const isSelected = conv.id === selectedId;

        return (
          <button
            key={conv.id}
            onClick={() => onSelectConversation?.(conv)}
            className={cn(
              "flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-gray-200",
              isSelected ? "bg-blue-500/10 border-l-2 border-l-blue-500" : "hover:bg-white/5",
              !conv.is_read && "bg-white/[0.02]"
            )}
          >
            {/* Channel Icon */}
            <div className="mt-1 flex-shrink-0">
              <ChannelIcon size={16} className={ch.color} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={cn(
                  "text-sm truncate",
                  !conv.is_read ? "text-gray-900 font-semibold" : "text-zinc-300"
                )}>
                  {conv.visitor_name || conv.visitor_email || 'Visitor'}
                </span>
                <span className="text-xs text-zinc-600 flex-shrink-0">
                  {formatTime(conv.last_message_at)}
                </span>
              </div>

              <p className="text-xs text-zinc-500 truncate mt-0.5">
                {conv.last_message_preview || 'No messages yet'}
              </p>

              {/* Status badges */}
              <div className="flex items-center gap-1.5 mt-1.5">
                {conv.ai_resolved && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px]">
                    <Bot size={10} /> AI
                  </span>
                )}
                {conv.agent_takeover && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-orange-500/10 text-orange-400 rounded text-[10px]">
                    <UserCheck size={10} /> Agent
                  </span>
                )}
                {conv.was_escalated && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded text-[10px]">
                    <AlertTriangle size={10} /> Escalated
                  </span>
                )}
                {conv.priority === 'high' && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded text-[10px]">
                    !!
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
