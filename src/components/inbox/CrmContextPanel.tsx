"use client";

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import {
  Building2, Mail, Phone, DollarSign, ExternalLink, RefreshCw,
  ChevronDown, ChevronUp, UserCheck, Clock, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CrmContact {
  email: string;
  name?: string;
  company?: string;
  external_id?: string;
  external_url?: string;
  synced_at?: string;
  provider?: string;
}

interface CrmIntegration {
  type: string;
  status: string;
  config?: Record<string, any>;
  last_synced_at?: string;
}

interface CrmContextPanelProps {
  visitorEmail?: string;
  conversationId: string;
  workspaceId?: string;
}

const CRM_LABELS: Record<string, { name: string; color: string }> = {
  hubspot: { name: 'HubSpot', color: 'text-orange-400' },
  salesforce: { name: 'Salesforce', color: 'text-blue-400' },
  pipedrive: { name: 'Pipedrive', color: 'text-green-400' },
  zoho: { name: 'Zoho', color: 'text-red-400' },
  agile_crm: { name: 'Agile CRM', color: 'text-cyan-400' },
  zendesk_sell: { name: 'Zendesk Sell', color: 'text-emerald-400' },
};

export function CrmContextPanel({ visitorEmail, conversationId }: CrmContextPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [crmIntegration, setCrmIntegration] = useState<CrmIntegration | null>(null);
  const [syncedContact, setSyncedContact] = useState<CrmContact | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCrmData();
  }, [visitorEmail, conversationId]);

  async function loadCrmData() {
    setLoading(true);
    setError(null);
    try {
      // 1. Check if any CRM is connected
      const integrations = await apiFetch('/api/integrations');
      const crmTypes = ['hubspot', 'salesforce', 'pipedrive', 'zoho', 'agile_crm', 'zendesk_sell'];
      const connected = (integrations || []).find(
        (i: any) => crmTypes.includes(i.type) && i.status === 'connected'
      );

      if (!connected) {
        setCrmIntegration(null);
        setLoading(false);
        return;
      }

      setCrmIntegration(connected);

      // 2. Check if this contact was synced to CRM
      if (visitorEmail) {
        const resp = await apiFetch(`/api/integrations/crm/${connected.type}/synced-contacts?limit=100`);
        const contacts = resp?.contacts || [];
        const match = contacts.find(
          (c: any) => c.email?.toLowerCase() === visitorEmail.toLowerCase()
        );
        setSyncedContact(match || null);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function syncToCrm() {
    if (!crmIntegration || !visitorEmail) return;
    setSyncing(true);
    try {
      await apiFetch(`/api/integrations/crm/${crmIntegration.type}/sync-contact`, {
        method: 'POST',
        body: JSON.stringify({
          email: visitorEmail,
          // Additional fields will be pulled from conversation context
        }),
      });
      await loadCrmData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  }

  // Don't render if no CRM is connected
  if (!loading && !crmIntegration) return null;

  const label = crmIntegration ? CRM_LABELS[crmIntegration.type] || { name: crmIntegration.type, color: 'text-zinc-400' } : null;

  return (
    <div className="border-b border-white/5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hover:text-zinc-300 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Building2 size={13} />
          CRM {label && <span className={cn('normal-case text-[10px]', label.color)}>({label.name})</span>}
        </span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          {loading ? (
            <div className="flex items-center gap-2 py-2">
              <RefreshCw size={12} className="animate-spin text-zinc-500" />
              <span className="text-xs text-zinc-500">Loading CRM data...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 py-2">
              <AlertCircle size={12} className="text-red-400" />
              <span className="text-xs text-red-400">{error}</span>
            </div>
          ) : syncedContact ? (
            <div className="space-y-3">
              {/* Synced indicator */}
              <div className="flex items-center gap-1.5">
                <UserCheck size={12} className="text-green-400" />
                <span className="text-[11px] text-green-400 font-medium">Synced to {label?.name}</span>
              </div>

              {/* Contact details from CRM */}
              {syncedContact.name && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 w-16">Name</span>
                  <span className="text-xs text-zinc-300">{syncedContact.name}</span>
                </div>
              )}
              {syncedContact.email && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 w-16">Email</span>
                  <span className="text-xs text-zinc-300 truncate">{syncedContact.email}</span>
                </div>
              )}
              {syncedContact.company && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 w-16">Company</span>
                  <span className="text-xs text-zinc-300">{syncedContact.company}</span>
                </div>
              )}
              {syncedContact.synced_at && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 w-16">Synced</span>
                  <span className="text-xs text-zinc-400">
                    {new Date(syncedContact.synced_at).toLocaleDateString()}
                  </span>
                </div>
              )}

              {/* External link to CRM */}
              {syncedContact.external_url && (
                <a
                  href={syncedContact.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ExternalLink size={11} />
                  View in {label?.name}
                </a>
              )}

              {/* Re-sync button */}
              <button
                onClick={syncToCrm}
                disabled={syncing}
                className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={11} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Syncing...' : 'Re-sync contact'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Not synced */}
              <p className="text-xs text-zinc-500">
                {visitorEmail
                  ? 'This contact is not yet synced to your CRM.'
                  : 'No email address available for CRM lookup.'}
              </p>
              {visitorEmail && (
                <button
                  onClick={syncToCrm}
                  disabled={syncing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-[11px] text-zinc-300 transition-colors disabled:opacity-50"
                >
                  <UserCheck size={11} />
                  {syncing ? 'Syncing...' : `Sync to ${label?.name}`}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
