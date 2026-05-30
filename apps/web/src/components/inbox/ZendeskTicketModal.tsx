"use client";

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  X, Ticket, ArrowUp, ArrowDown, Minus, Loader2,
  Check, AlertCircle, FileText, MessageSquare, Eye, EyeOff,
  User, ChevronDown
} from 'lucide-react';

interface ZendeskTicketModalProps {
  open: boolean;
  conversationId: string;
  visitorName?: string;
  visitorEmail?: string;
  messages?: Array<{ sender_type: string; content: string; created_at: string }>;
  onClose: () => void;
  onCreated?: () => void;
}

const PRIORITIES = [
  { value: 'low', label: 'Low', icon: ArrowDown, color: 'text-zinc-400 bg-zinc-500/10' },
  { value: 'normal', label: 'Normal', icon: Minus, color: 'text-blue-400 bg-blue-500/10' },
  { value: 'high', label: 'High', icon: ArrowUp, color: 'text-orange-400 bg-orange-500/10' },
  { value: 'urgent', label: 'Urgent', icon: ArrowUp, color: 'text-red-400 bg-red-500/10' },
];

const STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'open', label: 'Open' },
  { value: 'pending', label: 'Pending' },
  { value: 'solved', label: 'Solved' },
];

export function ZendeskTicketModal({
  open,
  conversationId,
  visitorName,
  visitorEmail,
  messages = [],
  onClose,
  onCreated,
}: ZendeskTicketModalProps) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');
  const [status, setStatus] = useState('new');
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  // Pre-fill subject from conversation context
  useEffect(() => {
    if (open) {
      const lastVisitorMsg = [...messages].reverse().find(m => m.sender_type === 'visitor');
      if (lastVisitorMsg) {
        const preview = lastVisitorMsg.content.slice(0, 80);
        setSubject(`Chat: ${preview}${lastVisitorMsg.content.length > 80 ? '...' : ''}`);
      } else {
        setSubject(`Chat with ${visitorName || 'visitor'}`);
      }
      setDescription('');
      setError('');
      setSuccess(false);
    }
  }, [open, messages, visitorName]);

  if (!open) return null;

  const transcript = messages
    .filter(m => m.sender_type !== 'system')
    .map(m => {
      const time = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const sender = m.sender_type === 'visitor' ? (visitorName || 'Visitor') : m.sender_type === 'ai' ? 'Conversa AI' : 'Agent';
      return `[${time}] ${sender}: ${m.content}`;
    })
    .join('\n');

  async function handleSubmit() {
    if (!subject.trim()) {
      setError('Subject is required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await apiFetch('/api/integrations/zendesk/tickets', {
        method: 'POST',
        body: JSON.stringify({
          subject: subject.trim(),
          description: description.trim() || transcript,
          priority,
          status,
          is_public: isPublic,
          requester_name: visitorName,
          requester_email: visitorEmail,
          conversation_id: conversationId,
          transcript,
        }),
      });
      setSuccess(true);
      onCreated?.();
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (e: any) {
      setError(e.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Ticket size={18} className="text-green-400" />
            </div>
            <div>
              <h2 className="text-gray-900 font-semibold text-sm">Create Zendesk Ticket</h2>
              <p className="text-zinc-500 text-[11px]">Escalate this conversation to Zendesk</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-gray-900 hover:bg-white/5 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Check size={24} className="text-green-400" />
              </div>
              <p className="text-green-400 font-medium text-sm">Ticket created in Zendesk</p>
              <p className="text-zinc-500 text-xs">The conversation will remain open in your inbox</p>
            </div>
          ) : (
            <>
              {/* Requester info */}
              <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 rounded-lg">
                <User size={13} className="text-zinc-500" />
                <span className="text-xs text-zinc-400">
                  {visitorName || 'Unknown'} {visitorEmail && `(${visitorEmail})`}
                </span>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-zinc-600 focus:outline-none focus:border-green-500"
                  placeholder="Ticket subject"
                />
              </div>

              {/* Priority & Status row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Priority</label>
                  <div className="flex gap-1">
                    {PRIORITIES.map((p) => {
                      const Icon = p.icon;
                      return (
                        <button
                          key={p.value}
                          onClick={() => setPriority(p.value)}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors border",
                            priority === p.value
                              ? `${p.color} border-current`
                              : "bg-zinc-800 text-zinc-500 border-zinc-700 hover:bg-zinc-700"
                          )}
                        >
                          <Icon size={10} />
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-[7px] text-xs text-gray-900 focus:outline-none focus:border-green-500 appearance-none"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reply type toggle */}
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Reply Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsPublic(true)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors border",
                      isPublic
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                        : "bg-zinc-800 text-zinc-500 border-zinc-700 hover:bg-zinc-700"
                    )}
                  >
                    <Eye size={12} /> Public Reply
                  </button>
                  <button
                    onClick={() => setIsPublic(false)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors border",
                      !isPublic
                        ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                        : "bg-zinc-800 text-zinc-500 border-zinc-700 hover:bg-zinc-700"
                    )}
                  >
                    <EyeOff size={12} /> Internal Note
                  </button>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Message</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details or leave empty to include chat transcript..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-zinc-600 focus:outline-none focus:border-green-500 resize-none h-24"
                />
              </div>

              {/* Transcript preview toggle */}
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <FileText size={12} />
                {showTranscript ? 'Hide' : 'Preview'} chat transcript ({messages.filter(m => m.sender_type !== 'system').length} messages)
                <ChevronDown size={12} className={cn("transition-transform", showTranscript && "rotate-180")} />
              </button>

              {showTranscript && (
                <div className="bg-zinc-800/50 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <pre className="text-[11px] text-zinc-400 whitespace-pre-wrap font-mono leading-relaxed">
                    {transcript || 'No messages to include'}
                  </pre>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle size={12} className="text-red-400" />
                  <span className="text-xs text-red-400">{error}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <p className="text-[10px] text-zinc-600">
              Creating this ticket won't close the chat
            </p>
            <div className="flex gap-2">
              <Button
                onClick={onClose}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs h-8 px-4"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !subject.trim()}
                className="bg-green-600 hover:bg-green-500 text-gray-900 text-xs h-8 px-4"
              >
                {submitting ? <Loader2 size={13} className="animate-spin mr-1" /> : <Ticket size={13} className="mr-1" />}
                Create Ticket
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
