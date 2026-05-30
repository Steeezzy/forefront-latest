"use client";

import { useState, useRef, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  MoreHorizontal, UserPlus, Briefcase, Building2, Ticket,
  ExternalLink, Check, Loader2, X, AlertCircle, ChevronRight,
  FileText, Copy, Ban, Flag
} from 'lucide-react';

interface ConversationActionsMenuProps {
  conversationId: string;
  visitorName?: string;
  visitorEmail?: string;
  visitorPhone?: string;
  channel: string;
  onAction?: (action: string) => void;
}

interface CrmAction {
  id: string;
  label: string;
  provider: string;
  icon: typeof UserPlus;
  color: string;
}

export function ConversationActionsMenu({
  conversationId,
  visitorName,
  visitorEmail,
  visitorPhone,
  channel,
  onAction,
}: ConversationActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [connectedCrms, setConnectedCrms] = useState<CrmAction[]>([]);
  const [hasZendesk, setHasZendesk] = useState(false);
  const [actionState, setActionState] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});
  const [showZendeskModal, setShowZendeskModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Load connected CRM integrations
  useEffect(() => {
    loadConnectedIntegrations();
  }, []);

  async function loadConnectedIntegrations() {
    try {
      const res = await apiFetch('/api/integrations');
      const integrations = res?.integrations || res || [];
      const actions: CrmAction[] = [];

      const CRM_MAP: Record<string, { label: string; actionLabel: string; color: string }> = {
        hubspot: { label: 'HubSpot', actionLabel: 'Create Contact in HubSpot', color: 'text-orange-400' },
        salesforce: { label: 'Salesforce', actionLabel: 'Create Contact in Salesforce', color: 'text-blue-400' },
        pipedrive: { label: 'Pipedrive', actionLabel: 'Create Deal in Pipedrive', color: 'text-green-400' },
        zendesk_sell: { label: 'Zendesk Sell', actionLabel: 'Create Lead in Zendesk Sell', color: 'text-emerald-400' },
        agile_crm: { label: 'Agile CRM', actionLabel: 'Add to Agile CRM', color: 'text-cyan-400' },
        zoho: { label: 'Zoho', actionLabel: 'Create Contact in Zoho', color: 'text-red-400' },
      };

      for (const integ of integrations) {
        const type = integ.integration_type || integ.type;
        const status = integ.status;
        if (status === 'connected') {
          if (CRM_MAP[type]) {
            actions.push({
              id: type,
              label: CRM_MAP[type].actionLabel,
              provider: CRM_MAP[type].label,
              icon: type === 'pipedrive' ? Briefcase : type === 'zendesk_sell' ? Flag : UserPlus,
              color: CRM_MAP[type].color,
            });
          }
          if (type === 'zendesk') {
            setHasZendesk(true);
          }
        }
      }

      setConnectedCrms(actions);
    } catch {
      // Silently fail
    }
  }

  async function handleCrmAction(crmId: string) {
    setActionState(s => ({ ...s, [crmId]: 'loading' }));
    try {
      await apiFetch(`/api/integrations/crm/${crmId}/sync-contact`, {
        method: 'POST',
        body: JSON.stringify({
          email: visitorEmail,
          name: visitorName,
          phone: visitorPhone,
          conversationId,
        }),
      });
      setActionState(s => ({ ...s, [crmId]: 'success' }));
      onAction?.(`crm_${crmId}`);
      setTimeout(() => setOpen(false), 1200);
    } catch {
      setActionState(s => ({ ...s, [crmId]: 'error' }));
    }
  }

  async function handleExportTranscript() {
    setActionState(s => ({ ...s, transcript: 'loading' }));
    try {
      const res = await apiFetch(`/api/inbox/conversations/${conversationId}`);
      const msgs = res?.data?.messages || [];
      const transcript = msgs
        .map((m: any) => `[${new Date(m.created_at).toLocaleString()}] ${m.sender_type}: ${m.content}`)
        .join('\n');
      await navigator.clipboard.writeText(transcript);
      setActionState(s => ({ ...s, transcript: 'success' }));
      setTimeout(() => setActionState(s => ({ ...s, transcript: 'idle' })), 2000);
    } catch {
      setActionState(s => ({ ...s, transcript: 'error' }));
    }
  }

  const hasAnyActions = connectedCrms.length > 0 || hasZendesk;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "p-2 rounded-lg transition-colors",
          open ? "bg-white/10 text-gray-900" : "text-zinc-500 hover:text-gray-900 hover:bg-white/5"
        )}
        title="More actions"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-gray-200">
            <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">Actions</span>
          </div>

          {/* CRM Actions */}
          {connectedCrms.length > 0 && (
            <div className="border-b border-gray-200">
              <div className="px-4 py-1.5">
                <span className="text-[10px] text-zinc-600 uppercase tracking-wider">CRM</span>
              </div>
              {connectedCrms.map((action) => {
                const state = actionState[action.id] || 'idle';
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => handleCrmAction(action.id)}
                    disabled={state === 'loading' || state === 'success' || !visitorEmail}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                      state === 'success'
                        ? "bg-green-500/5"
                        : !visitorEmail
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:bg-white/5"
                    )}
                  >
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center bg-white/5", action.color)}>
                      {state === 'loading' ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : state === 'success' ? (
                        <Check size={14} className="text-green-400" />
                      ) : state === 'error' ? (
                        <AlertCircle size={14} className="text-red-400" />
                      ) : (
                        <Icon size={14} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-zinc-300 block">{action.label}</span>
                      {state === 'success' && (
                        <span className="text-[10px] text-green-400">Created successfully</span>
                      )}
                      {state === 'error' && (
                        <span className="text-[10px] text-red-400">Failed — try again</span>
                      )}
                      {!visitorEmail && state === 'idle' && (
                        <span className="text-[10px] text-zinc-600">Requires visitor email</span>
                      )}
                    </div>
                    {state === 'idle' && visitorEmail && (
                      <ChevronRight size={14} className="text-zinc-600" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Zendesk Ticket */}
          {hasZendesk && (
            <div className="border-b border-gray-200">
              <button
                onClick={() => {
                  setOpen(false);
                  setShowZendeskModal(true);
                  onAction?.('zendesk_ticket');
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-green-500/10 text-green-400">
                  <Ticket size={14} />
                </div>
                <span className="text-sm text-zinc-300">Create Zendesk Ticket</span>
                <ChevronRight size={14} className="text-zinc-600 ml-auto" />
              </button>
            </div>
          )}

          {/* General Actions */}
          <div>
            <button
              onClick={handleExportTranscript}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 text-zinc-400">
                {actionState.transcript === 'loading' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : actionState.transcript === 'success' ? (
                  <Check size={14} className="text-green-400" />
                ) : (
                  <Copy size={14} />
                )}
              </div>
              <span className="text-sm text-zinc-300">
                {actionState.transcript === 'success' ? 'Copied!' : 'Copy Transcript'}
              </span>
            </button>
            <button
              onClick={() => {
                onAction?.('block');
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 text-zinc-400">
                <Ban size={14} />
              </div>
              <span className="text-sm text-zinc-300">Block Visitor</span>
            </button>
          </div>

          {/* No integrations hint */}
          {!hasAnyActions && (
            <div className="px-4 py-3 border-t border-gray-200">
              <p className="text-[11px] text-zinc-600">
                Connect a CRM or Zendesk integration to see additional actions here.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
