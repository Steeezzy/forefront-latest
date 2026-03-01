"use client";

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  User, Mail, Phone, Globe, MapPin, Clock, Tag,
  X, ChevronDown, ChevronUp, Edit2, Check, ExternalLink,
  MessageSquare, Calendar, Monitor, Smartphone, AlertTriangle,
  Star, UserPlus, Copy, MoreHorizontal
} from 'lucide-react';

interface VisitorInfo {
  id: string;
  visitor_name?: string;
  visitor_email?: string;
  visitor_phone?: string;
  channel: string;
  status: string;
  priority: string;
  tags: string[];
  assigned_user_id?: string;
  assigned_user_name?: string;
  assigned_user_avatar?: string;
  created_at: string;
  last_message_at?: string;
  visitor_metadata?: Record<string, any>;
  message_count?: number;
  is_read?: boolean;
  was_escalated?: boolean;
  ai_resolved?: boolean;
  agent_takeover?: boolean;
}

interface VisitorInfoPanelProps {
  conversationId: string;
  onClose?: () => void;
  onUpdate?: () => void;
}

export function VisitorInfoPanel({ conversationId, onClose, onUpdate }: VisitorInfoPanelProps) {
  const [info, setInfo] = useState<VisitorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [noteText, setNoteText] = useState('');

  const loadInfo = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/inbox/conversations/${conversationId}`);
      const conv = res.data?.conversation || res.data || res;
      setInfo(conv);
      setEditName(conv.visitor_name || '');
      setEditEmail(conv.visitor_email || '');
    } catch (e) {
      console.error('Failed to load visitor info:', e);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => { loadInfo(); }, [loadInfo]);

  const updateField = async (field: string, value: any) => {
    try {
      await apiFetch(`/api/inbox/conversations/${conversationId}`, {
        method: 'PATCH',
        body: JSON.stringify({ [field]: value }),
      });
      loadInfo();
      onUpdate?.();
    } catch (e) {
      console.error('Update failed:', e);
    }
  };

  const handleSaveName = () => {
    updateField('visitorName', editName);
    setEditingName(false);
  };

  const handleSaveEmail = () => {
    updateField('visitorEmail', editEmail);
    setEditingEmail(false);
  };

  const handleAddTag = () => {
    if (newTag.trim() && info) {
      const tags = [...(info.tags || []), newTag.trim()];
      updateField('tags', tags);
      setNewTag('');
      setShowTagInput(false);
    }
  };

  const handleRemoveTag = (tag: string) => {
    if (info) {
      const tags = (info.tags || []).filter(t => t !== tag);
      updateField('tags', tags);
    }
  };

  const handlePriorityChange = (priority: string) => {
    updateField('priority', priority);
  };

  const handleStatusChange = (status: string) => {
    updateField('status', status);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="w-80 border-l border-white/5 bg-[#0f1115] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!info) return null;

  const priorityColors: Record<string, string> = {
    low: 'text-zinc-400 bg-zinc-500/10',
    normal: 'text-blue-400 bg-blue-500/10',
    high: 'text-orange-400 bg-orange-500/10',
    urgent: 'text-red-400 bg-red-500/10',
  };

  return (
    <div className="w-80 border-l border-white/5 bg-[#0f1115] flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-white/5 flex-shrink-0">
        <h3 className="text-sm font-semibold text-white">Visitor Details</h3>
        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Avatar & Name */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {(info.visitor_name || 'V')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex items-center gap-1">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white w-full focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                  <button onClick={handleSaveName} className="text-green-400 hover:text-green-300">
                    <Check size={14} />
                  </button>
                  <button onClick={() => setEditingName(false)} className="text-zinc-500 hover:text-white">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 group">
                  <h4 className="text-white font-medium text-sm truncate">
                    {info.visitor_name || 'Unknown Visitor'}
                  </h4>
                  <button
                    onClick={() => setEditingName(true)}
                    className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-white transition-opacity"
                  >
                    <Edit2 size={12} />
                  </button>
                </div>
              )}

              {editingEmail ? (
                <div className="flex items-center gap-1 mt-1">
                  <input
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEmail()}
                    className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white w-full focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                  <button onClick={handleSaveEmail} className="text-green-400 hover:text-green-300">
                    <Check size={12} />
                  </button>
                  <button onClick={() => setEditingEmail(false)} className="text-zinc-500 hover:text-white">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 group">
                  <p className="text-xs text-zinc-500 truncate">
                    {info.visitor_email || 'No email'}
                  </p>
                  <button
                    onClick={() => setEditingEmail(true)}
                    className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-white transition-opacity"
                  >
                    <Edit2 size={10} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusChange(info.status === 'open' ? 'closed' : 'open')}
              className={cn(
                "flex-1 text-xs font-medium py-2 rounded-lg transition-colors",
                info.status === 'open'
                  ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                  : "bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20"
              )}
            >
              {info.status === 'open' ? 'Resolve' : 'Reopen'}
            </button>
            <button
              onClick={() => {
                const copy = `Name: ${info.visitor_name || 'N/A'}\nEmail: ${info.visitor_email || 'N/A'}\nChannel: ${info.channel}`;
                navigator.clipboard.writeText(copy);
              }}
              className="px-3 py-2 bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20 rounded-lg transition-colors"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>

        {/* Status & Priority */}
        <div className="p-4 border-b border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Status</span>
            <select
              value={info.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="snoozed">Snoozed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Priority</span>
            <div className="flex gap-1">
              {['low', 'normal', 'high', 'urgent'].map(p => (
                <button
                  key={p}
                  onClick={() => handlePriorityChange(p)}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-medium capitalize transition-colors",
                    info.priority === p ? priorityColors[p] : "text-zinc-600 hover:text-zinc-400"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {info.assigned_user_name && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Assigned to</span>
              <span className="text-xs text-white">{info.assigned_user_name}</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="border-b border-white/5">
          <button
            onClick={() => setDetailsExpanded(!detailsExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hover:text-zinc-300 transition-colors"
          >
            <span>Contact Details</span>
            {detailsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {detailsExpanded && (
            <div className="px-4 pb-4 space-y-3">
              <div className="flex items-center gap-2">
                <Mail size={13} className="text-zinc-600 flex-shrink-0" />
                <span className="text-xs text-zinc-300 truncate">
                  {info.visitor_email || 'Not provided'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-zinc-600 flex-shrink-0" />
                <span className="text-xs text-zinc-300">
                  {info.visitor_phone || 'Not provided'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Globe size={13} className="text-zinc-600 flex-shrink-0" />
                <span className="text-xs text-zinc-300 capitalize">{info.channel}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={13} className="text-zinc-600 flex-shrink-0" />
                <span className="text-xs text-zinc-300">{formatDate(info.created_at)}</span>
              </div>
              {info.last_message_at && (
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-zinc-600 flex-shrink-0" />
                  <span className="text-xs text-zinc-300">Last msg: {formatDate(info.last_message_at)}</span>
                </div>
              )}
              {info.message_count != null && (
                <div className="flex items-center gap-2">
                  <MessageSquare size={13} className="text-zinc-600 flex-shrink-0" />
                  <span className="text-xs text-zinc-300">{info.message_count} messages</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tags</span>
            <button
              onClick={() => setShowTagInput(!showTagInput)}
              className="text-zinc-500 hover:text-blue-400 transition-colors"
            >
              <Tag size={13} />
            </button>
          </div>

          {showTagInput && (
            <div className="flex items-center gap-1 mb-2">
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Add tag..."
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <button onClick={handleAddTag} className="text-blue-400 hover:text-blue-300">
                <Check size={14} />
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {(info.tags || []).length > 0 ? (
              (info.tags || []).map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[11px] group"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-xs text-zinc-600">No tags</span>
            )}
          </div>
        </div>

        {/* Internal Notes */}
        <div className="border-b border-white/5">
          <button
            onClick={() => setNotesExpanded(!notesExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hover:text-zinc-300 transition-colors"
          >
            <span>Internal Notes</span>
            {notesExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {notesExpanded && (
            <div className="px-4 pb-4">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note about this visitor..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 resize-none h-20"
              />
              <Button
                onClick={async () => {
                  if (noteText.trim()) {
                    try {
                      await apiFetch(`/api/inbox/conversations/${conversationId}/messages`, {
                        method: 'POST',
                        body: JSON.stringify({
                          content: noteText,
                          sender_type: 'agent',
                          message_type: 'note',
                          is_internal: true,
                        }),
                      });
                      setNoteText('');
                    } catch (e) {
                      console.error('Failed to add note:', e);
                    }
                  }
                }}
                disabled={!noteText.trim()}
                className="mt-2 w-full bg-zinc-700 hover:bg-zinc-600 text-white text-xs h-7"
              >
                Add Note
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
