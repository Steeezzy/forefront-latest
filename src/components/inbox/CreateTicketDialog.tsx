"use client";

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { X, Ticket, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface CreateTicketDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  initialSubject?: string;
  initialDescription?: string;
}

const PRIORITIES = [
  { value: 'low', label: 'Low', icon: ArrowDown, color: 'text-zinc-500' },
  { value: 'normal', label: 'Normal', icon: Minus, color: 'text-blue-400' },
  { value: 'high', label: 'High', icon: ArrowUp, color: 'text-orange-400' },
  { value: 'urgent', label: 'Urgent', icon: ArrowUp, color: 'text-red-400' },
];

const SOURCES = [
  { value: 'manual', label: 'Manual' },
  { value: 'email', label: 'Email' },
  { value: 'chat', label: 'Chat' },
  { value: 'widget', label: 'Widget' },
];

export function CreateTicketDialog({ open, onClose, onCreated, initialSubject = '', initialDescription = '' }: CreateTicketDialogProps) {
  const [subject, setSubject] = useState(initialSubject);
  const [description, setDescription] = useState(initialDescription);
  const [priority, setPriority] = useState('normal');
  const [source, setSource] = useState('manual');
  const [requesterName, setRequesterName] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  // Sync initial values if dialog is opened with new props
  useEffect(() => {
    if (open) {
      setSubject(initialSubject);
      setDescription(initialDescription);
    }
  }, [open, initialSubject, initialDescription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError('Subject is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await apiFetch('/api/tickets', {
        method: 'POST',
        body: JSON.stringify({
          subject: subject.trim(),
          description: description.trim() || undefined,
          priority,
          source,
          requester_name: requesterName.trim() || undefined,
          requester_email: requesterEmail.trim() || undefined,
          tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        }),
      });

      // Reset form
      setSubject('');
      setDescription('');
      setPriority('normal');
      setSource('manual');
      setRequesterName('');
      setRequesterEmail('');
      setTags('');

      onCreated?.();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[#f8fafc] border border-gray-200 rounded-2xl shadow-2xl w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Ticket size={16} className="text-blue-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Create Ticket</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-gray-900 hover:bg-white/5 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of the issue"
              className="w-full bg-[#f8fafc] border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the issue..."
              rows={3}
              className="w-full bg-[#f8fafc] border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          {/* Requester row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Requester Name</label>
              <input
                type="text"
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                placeholder="Customer name"
                className="w-full bg-[#f8fafc] border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Requester Email</label>
              <input
                type="email"
                value={requesterEmail}
                onChange={(e) => setRequesterEmail(e.target.value)}
                placeholder="customer@email.com"
                className="w-full bg-[#f8fafc] border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Priority + Source row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Priority</label>
              <div className="flex items-center gap-1.5">
                {PRIORITIES.map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-colors",
                        priority === p.value
                          ? "border-blue-500/30 bg-blue-500/10 text-gray-900"
                          : "border-gray-200 bg-[#f8fafc] text-zinc-500 hover:bg-white/5"
                      )}
                    >
                      <Icon size={10} className={priority === p.value ? p.color : 'text-zinc-600'} />
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full bg-[#f8fafc] border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
              >
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="bug, billing, urgent (comma-separated)"
              className="w-full bg-[#f8fafc] border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !subject.trim()}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all",
                subject.trim()
                  ? "bg-blue-600 hover:bg-blue-500 text-gray-900 shadow-lg shadow-blue-500/20"
                  : "bg-zinc-800 text-zinc-600"
              )}
            >
              <Ticket size={14} />
              {submitting ? 'Creating...' : 'Create Ticket'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
