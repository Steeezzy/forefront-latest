"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Ticket, Send, User, UserCheck, Clock, Tag,
  AlertTriangle, ArrowUp, ArrowDown, Minus, CheckCircle,
  MoreHorizontal, FileText, Hash, Copy, MessageSquare,
  ExternalLink, XCircle, ChevronDown
} from 'lucide-react';

const PRIORITY_CONFIG: Record<string, { color: string; icon: any; label: string; bg: string }> = {
  urgent: { color: 'text-red-400', icon: ArrowUp, label: 'Urgent', bg: 'bg-red-500/10' },
  high: { color: 'text-orange-400', icon: ArrowUp, label: 'High', bg: 'bg-orange-500/10' },
  normal: { color: 'text-blue-400', icon: Minus, label: 'Normal', bg: 'bg-blue-500/10' },
  low: { color: 'text-zinc-500', icon: ArrowDown, label: 'Low', bg: 'bg-zinc-500/10' },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  unassigned: { color: 'text-zinc-400', bg: 'bg-zinc-500/10', label: 'Unassigned' },
  open: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Open' },
  pending: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Pending' },
  solved: { color: 'text-green-400', bg: 'bg-green-500/10', label: 'Solved' },
  closed: { color: 'text-zinc-500', bg: 'bg-zinc-500/10', label: 'Closed' },
};

interface Comment {
  id: string;
  author_type: 'agent' | 'customer' | 'system';
  author_id?: string;
  author_name?: string;
  content: string;
  is_internal: boolean;
  created_at: string;
}

interface TicketData {
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
  conversation_id?: string;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  closed_at?: string;
}

interface TicketDetailProps {
  ticketId: string;
  onTicketUpdate?: () => void;
}

export function TicketDetail({ ticketId, onTicketUpdate }: TicketDetailProps) {
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadTicket = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/tickets/${ticketId}`);
      const data = res.data || res;
      setTicket(data.ticket || data);
      setComments(data.comments || []);
    } catch (e) {
      console.error('Failed to load ticket:', e);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    setLoading(true);
    loadTicket();
  }, [loadTicket]);

  // Poll for updates
  useEffect(() => {
    const interval = setInterval(loadTicket, 10000);
    return () => clearInterval(interval);
  }, [loadTicket]);

  // Auto-scroll on new comments
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSendComment = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await apiFetch(`/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          content: replyText,
          is_internal: isInternal,
          author_name: 'Agent',
        }),
      });
      setReplyText('');
      loadTicket();
    } catch (e) {
      console.error('Send failed:', e);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    setShowStatusDropdown(false);
    try {
      await apiFetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      loadTicket();
      onTicketUpdate?.();
    } catch (e) {
      console.error('Status update failed:', e);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    setShowPriorityDropdown(false);
    try {
      await apiFetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify({ priority: newPriority }),
      });
      loadTicket();
    } catch (e) {
      console.error('Priority update failed:', e);
    }
  };

  const handleResolve = async () => {
    setUpdatingStatus(true);
    try {
      await apiFetch(`/api/tickets/${ticketId}/resolve`, { method: 'POST' });
      loadTicket();
      onTicketUpdate?.();
    } catch (e) {
      console.error('Resolve failed:', e);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatRelative = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateStr);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-zinc-500">Ticket not found</p>
      </div>
    );
  }

  const priority = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.normal;
  const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
  const PriorityIcon = priority.icon;

  return (
    <div className="flex h-full">
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <Ticket size={16} className="text-zinc-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-600 font-mono">{ticket.ticket_number}</span>
                <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium", status.bg, status.color)}>
                  {status.label}
                </span>
                <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium", priority.bg, priority.color)}>
                  <PriorityIcon size={10} />
                  {priority.label}
                </span>
              </div>
              <h3 className="text-white font-medium text-sm truncate mt-0.5">{ticket.subject}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {ticket.status !== 'solved' && ticket.status !== 'closed' && (
              <Button
                onClick={handleResolve}
                disabled={updatingStatus}
                className="bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30 text-xs px-3 py-1 h-8"
              >
                <CheckCircle size={14} className="mr-1.5" />
                {updatingStatus ? 'Resolving...' : 'Resolve'}
              </Button>
            )}

            {/* Status dropdown */}
            <div className="relative">
              <button
                onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowPriorityDropdown(false); }}
                className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
                title="Change status"
              >
                <MoreHorizontal size={16} />
              </button>
              {showStatusDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-20 min-w-[160px] py-1">
                  <div className="px-3 py-1.5 border-b border-white/5">
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">Status</span>
                  </div>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => handleStatusChange(key)}
                      disabled={ticket.status === key}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors",
                        ticket.status === key ? "text-zinc-600 cursor-not-allowed" : "text-zinc-300 hover:bg-white/5"
                      )}
                    >
                      <span className={cn("w-2 h-2 rounded-full", cfg.bg, cfg.color === 'text-blue-400' ? 'bg-blue-400' : cfg.color === 'text-green-400' ? 'bg-green-400' : cfg.color === 'text-yellow-400' ? 'bg-yellow-400' : 'bg-zinc-400')} />
                      {cfg.label}
                      {ticket.status === key && <span className="text-[10px] text-zinc-600 ml-auto">current</span>}
                    </button>
                  ))}
                  <div className="h-px bg-white/5 my-1" />
                  <div className="px-3 py-1.5 border-b border-white/5">
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">Priority</span>
                  </div>
                  {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => handlePriorityChange(key)}
                        disabled={ticket.priority === key}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors",
                          ticket.priority === key ? "text-zinc-600 cursor-not-allowed" : "text-zinc-300 hover:bg-white/5"
                        )}
                      >
                        <Icon size={12} className={cfg.color} />
                        {cfg.label}
                        {ticket.priority === key && <span className="text-[10px] text-zinc-600 ml-auto">current</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Description + Comments ─── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {/* Ticket description */}
          {ticket.description && (
            <div className="bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={12} className="text-zinc-500" />
                <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">Description</span>
              </div>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">{ticket.description}</p>
            </div>
          )}

          {/* Ticket created system message */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2 text-[11px] text-zinc-600 bg-zinc-900/50 px-4 py-1.5 rounded-full border border-white/5">
              <Ticket size={10} />
              Ticket created {formatRelative(ticket.created_at)}
              {ticket.source !== 'manual' && ` via ${ticket.source}`}
            </div>
          </div>

          {/* Comments */}
          {comments.map((comment) => (
            <div key={comment.id}>
              {comment.author_type === 'system' ? (
                <div className="flex justify-center">
                  <div className="flex items-center gap-2 text-[11px] text-zinc-600 bg-zinc-900/50 px-4 py-1.5 rounded-full border border-white/5">
                    <Clock size={10} />
                    {comment.content}
                  </div>
                </div>
              ) : comment.is_internal ? (
                <div className="flex justify-end">
                  <div className="max-w-[70%] rounded-xl px-4 py-2.5 bg-yellow-500/5 border border-yellow-500/20 border-dashed">
                    <div className="flex items-center gap-1.5 mb-1">
                      <FileText size={11} className="text-yellow-500" />
                      <span className="text-[10px] font-medium text-yellow-500">Internal Note</span>
                      <span className="text-[10px] text-yellow-500/40 ml-auto">{comment.author_name || 'Agent'}</span>
                    </div>
                    <p className="text-sm text-yellow-200/80 whitespace-pre-wrap">{comment.content}</p>
                    <span className="text-[10px] text-yellow-500/40 mt-1 block text-right">
                      {formatTime(comment.created_at)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className={cn("flex", comment.author_type === 'customer' ? "justify-start" : "justify-end")}>
                  <div className={cn(
                    "max-w-[70%] rounded-2xl px-4 py-2.5",
                    comment.author_type === 'customer'
                      ? "bg-zinc-800/80 text-white rounded-bl-md"
                      : "bg-blue-600 text-white rounded-br-md"
                  )}>
                    <div className="flex items-center gap-1.5 mb-1">
                      {comment.author_type === 'customer' ? (
                        <User size={12} className="text-zinc-400" />
                      ) : (
                        <UserCheck size={12} className="text-blue-200" />
                      )}
                      <span className="text-[10px] font-medium opacity-70">
                        {comment.author_name || (comment.author_type === 'customer' ? ticket.requester_name || 'Customer' : 'Agent')}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                    <span className="text-[10px] opacity-40 mt-1 block text-right">
                      {formatTime(comment.created_at)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Resolved message */}
          {ticket.resolved_at && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 text-[11px] text-green-500 bg-green-500/5 px-4 py-1.5 rounded-full border border-green-500/20">
                <CheckCircle size={10} />
                Resolved {formatRelative(ticket.resolved_at)}
              </div>
            </div>
          )}

          <div ref={commentsEndRef} />
        </div>

        {/* ─── Reply Input ─── */}
        <div className="px-4 py-3 border-t border-white/5">
          {/* Internal note toggle */}
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => setIsInternal(false)}
              className={cn(
                "text-xs font-medium px-3 py-1 rounded-full transition-colors",
                !isInternal ? "bg-blue-500/20 text-blue-400" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              Reply
            </button>
            <button
              onClick={() => setIsInternal(true)}
              className={cn(
                "text-xs font-medium px-3 py-1 rounded-full transition-colors",
                isInternal ? "bg-yellow-500/20 text-yellow-400" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              Internal Note
            </button>
          </div>

          <div className={cn(
            "flex flex-col rounded-xl border transition-colors",
            isInternal
              ? "bg-yellow-500/5 border-yellow-500/20 focus-within:border-yellow-500/40"
              : "bg-[#161920] border-zinc-700 focus-within:border-blue-500"
          )}>
            <textarea
              ref={inputRef}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendComment();
                }
              }}
              placeholder={isInternal ? "Add an internal note..." : "Type your reply..."}
              rows={2}
              className={cn(
                "w-full bg-transparent py-3 px-4 text-sm text-white focus:outline-none placeholder:text-zinc-600 resize-none",
              )}
            />

            <div className="flex items-center justify-between px-3 py-2 border-t border-white/5">
              <div className="flex items-center gap-2">
                {isInternal && (
                  <span className="text-[10px] text-yellow-500/60 flex items-center gap-1">
                    <FileText size={10} /> Only visible to agents
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-600">
                  {replyText.length > 0 && `${replyText.length} chars`}
                </span>
                <Button
                  onClick={handleSendComment}
                  disabled={sending || !replyText.trim()}
                  className={cn(
                    "h-8 px-4 flex items-center gap-1.5 rounded-lg text-xs font-medium transition-all",
                    replyText.trim()
                      ? isInternal
                        ? "bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg shadow-yellow-500/20"
                        : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                      : "bg-zinc-800 text-zinc-600"
                  )}
                >
                  <Send size={13} />
                  {sending ? 'Sending...' : isInternal ? 'Add Note' : 'Send'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Sidebar: Ticket Details ─── */}
      <div className="w-72 border-l border-white/5 bg-[#0d0f13] overflow-y-auto">
        <div className="p-4 space-y-5">
          {/* Requester */}
          <div>
            <h4 className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider mb-2">Requester</h4>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                {(ticket.requester_name || ticket.requester_email || 'U')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm text-white font-medium">{ticket.requester_name || 'Unknown'}</p>
                {ticket.requester_email && (
                  <p className="text-xs text-zinc-500">{ticket.requester_email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Assignee */}
          <div>
            <h4 className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider mb-2">Assignee</h4>
            {ticket.assignee_email ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                  <UserCheck size={12} className="text-green-400" />
                </div>
                <span className="text-sm text-zinc-300">{ticket.assignee_email.split('@')[0]}</span>
              </div>
            ) : (
              <p className="text-sm text-zinc-600">Unassigned</p>
            )}
          </div>

          {/* Details */}
          <div>
            <h4 className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider mb-2">Details</h4>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Status</span>
                <span className={cn("text-xs font-medium", status.color)}>{status.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Priority</span>
                <span className={cn("text-xs font-medium flex items-center gap-1", priority.color)}>
                  <PriorityIcon size={10} />
                  {priority.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Source</span>
                <span className="text-xs text-zinc-400 capitalize">{ticket.source}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Created</span>
                <span className="text-xs text-zinc-400">{formatRelative(ticket.created_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Updated</span>
                <span className="text-xs text-zinc-400">{formatRelative(ticket.updated_at)}</span>
              </div>
              {ticket.resolved_at && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Resolved</span>
                  <span className="text-xs text-green-400">{formatRelative(ticket.resolved_at)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Comments</span>
                <span className="text-xs text-zinc-400">{comments.length}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {ticket.tags && ticket.tags.length > 0 && (
            <div>
              <h4 className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider mb-2">Tags</h4>
              <div className="flex flex-wrap gap-1.5">
                {ticket.tags.map((tag, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full text-[11px]">
                    <Tag size={9} />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Linked conversation */}
          {ticket.conversation_id && (
            <div>
              <h4 className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider mb-2">Linked Conversation</h4>
              <div className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 cursor-pointer">
                <ExternalLink size={12} />
                <span>View conversation</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
