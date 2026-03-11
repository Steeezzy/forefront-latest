"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, CheckCircle, XCircle, Clock, ArrowUpDown, ExternalLink,
  Users, Mail, Activity, AlertTriangle, Loader2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { integrationsApi, crmApi, marketingApi } from '@/lib/api';
import type { SyncLog, Integration } from '@/lib/api';

interface IntegrationSyncDashboardProps {
  integrationType: string;
  integrationName: string;
  category: 'crm' | 'marketing' | 'ecommerce' | 'support' | 'analytics' | 'other';
  onBack: () => void;
}

export function IntegrationSyncDashboard({
  integrationType,
  integrationName,
  category,
  onBack,
}: IntegrationSyncDashboardProps) {
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [syncedContacts, setSyncedContacts] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [contactsTotal, setContactsTotal] = useState(0);
  const [subscribersTotal, setSubscribersTotal] = useState(0);
  const [mailingLists, setMailingLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [page, setPage] = useState(1);

  const backendType = integrationType.replace(/-/g, '_');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [integrationRes, logsRes] = await Promise.all([
        integrationsApi.get(backendType as any),
        integrationsApi.getSyncLogs(backendType as any),
      ]);

      setIntegration(integrationRes.integration);
      setSyncLogs(logsRes.logs || []);

      // Load category-specific data
      if (category === 'crm' && integrationRes.connected) {
        try {
          const res = await fetch(`/api/proxy/api/integrations/crm/${backendType}/synced-contacts?page=${page}&limit=25`);
          const data = await res.json();
          if (data.success) {
            setSyncedContacts(data.contacts || []);
            setContactsTotal(data.total || 0);
          }
        } catch { /* ignore */ }
      }

      if (category === 'marketing' && integrationRes.connected) {
        try {
          const [subsRes, listsRes] = await Promise.all([
            fetch(`/api/proxy/api/integrations/marketing/${backendType}/subscribers?page=${page}&limit=25`).then(r => r.json()),
            marketingApi.getLists(backendType),
          ]);
          if (subsRes.success) {
            setSubscribers(subsRes.subscribers || []);
            setSubscribersTotal(subsRes.total || 0);
          }
          if (listsRes.success) {
            setMailingLists(listsRes.lists || []);
          }
        } catch { /* ignore */ }
      }
    } catch (err) {
      console.error('Failed to load integration data:', err);
    }
    setLoading(false);
  }, [backendType, category, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await integrationsApi.test(backendType as any);
      setTestResult(res.result);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    }
    setTesting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-zinc-400 hover:text-white transition">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">{integrationName}</h2>
            <div className="flex items-center gap-2 mt-1">
              {integration?.status === 'connected' ? (
                <span className="flex items-center gap-1 text-sm text-green-400">
                  <CheckCircle className="w-4 h-4" /> Connected
                </span>
              ) : integration?.status === 'error' ? (
                <span className="flex items-center gap-1 text-sm text-red-400">
                  <AlertTriangle className="w-4 h-4" /> Error: {integration.error_message}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm text-zinc-500">
                  <XCircle className="w-4 h-4" /> Not connected
                </span>
              )}
              {integration?.last_synced_at && (
                <span className="text-xs text-zinc-500 ml-3">
                  Last synced: {new Date(integration.last_synced_at).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={testing || !integration}
            className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Activity className="w-4 h-4 mr-1" />}
            Test Connection
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Test Result */}
      {testResult && (
        <div className={`p-3 rounded-lg text-sm ${testResult.success ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {testResult.success ? '✓ Connection test passed' : `✗ Connection test failed: ${testResult.error}`}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Status"
          value={integration?.status === 'connected' ? 'Active' : 'Inactive'}
          icon={<CheckCircle className="w-5 h-5" />}
          color={integration?.status === 'connected' ? 'text-green-400' : 'text-zinc-500'}
        />
        <StatCard
          label="Sync Runs"
          value={syncLogs.length.toString()}
          icon={<ArrowUpDown className="w-5 h-5" />}
          color="text-blue-400"
        />
        {category === 'crm' && (
          <StatCard label="Contacts Synced" value={contactsTotal.toString()} icon={<Users className="w-5 h-5" />} color="text-purple-400" />
        )}
        {category === 'marketing' && (
          <>
            <StatCard label="Subscribers" value={subscribersTotal.toString()} icon={<Mail className="w-5 h-5" />} color="text-yellow-400" />
            <StatCard label="Mailing Lists" value={mailingLists.length.toString()} icon={<Mail className="w-5 h-5" />} color="text-teal-400" />
          </>
        )}
        <StatCard
          label="Last Sync"
          value={integration?.last_synced_at ? new Date(integration.last_synced_at).toLocaleDateString() : 'Never'}
          icon={<Clock className="w-5 h-5" />}
          color="text-zinc-400"
        />
      </div>

      {/* CRM: Synced Contacts Table */}
      {category === 'crm' && syncedContacts.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-white">Synced Contacts</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-800/50">
                <tr>
                  <th className="px-4 py-2 text-left text-zinc-400 font-medium">Email</th>
                  <th className="px-4 py-2 text-left text-zinc-400 font-medium">Name</th>
                  <th className="px-4 py-2 text-left text-zinc-400 font-medium">Company</th>
                  <th className="px-4 py-2 text-left text-zinc-400 font-medium">External ID</th>
                  <th className="px-4 py-2 text-left text-zinc-400 font-medium">Synced</th>
                </tr>
              </thead>
              <tbody>
                {syncedContacts.map((c: any, i: number) => (
                  <tr key={i} className="border-t border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="px-4 py-2 text-zinc-300">{c.email}</td>
                    <td className="px-4 py-2 text-zinc-300">{c.name || '-'}</td>
                    <td className="px-4 py-2 text-zinc-400">{c.company || '-'}</td>
                    <td className="px-4 py-2">
                      {c.external_url ? (
                        <a href={c.external_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                          {c.external_id} <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-zinc-500">{c.external_id || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-zinc-500 text-xs">{c.synced_at ? new Date(c.synced_at).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {contactsTotal > 25 && (
            <Pagination page={page} total={contactsTotal} limit={25} onPageChange={setPage} />
          )}
        </div>
      )}

      {/* Marketing: Subscribers Table */}
      {category === 'marketing' && subscribers.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-white">Subscribers</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-800/50">
                <tr>
                  <th className="px-4 py-2 text-left text-zinc-400 font-medium">Email</th>
                  <th className="px-4 py-2 text-left text-zinc-400 font-medium">Name</th>
                  <th className="px-4 py-2 text-left text-zinc-400 font-medium">List</th>
                  <th className="px-4 py-2 text-left text-zinc-400 font-medium">Status</th>
                  <th className="px-4 py-2 text-left text-zinc-400 font-medium">Subscribed</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s: any, i: number) => (
                  <tr key={i} className="border-t border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="px-4 py-2 text-zinc-300">{s.email}</td>
                    <td className="px-4 py-2 text-zinc-300">{s.name || '-'}</td>
                    <td className="px-4 py-2 text-zinc-400">{s.list_id}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${s.status === 'subscribed' ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-zinc-500 text-xs">{s.subscribed_at ? new Date(s.subscribed_at).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {subscribersTotal > 25 && (
            <Pagination page={page} total={subscribersTotal} limit={25} onPageChange={setPage} />
          )}
        </div>
      )}

      {/* Marketing: Mailing Lists */}
      {category === 'marketing' && mailingLists.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-white">Available Mailing Lists</h3>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {mailingLists.map((list: any) => (
              <div key={list.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="text-zinc-300 text-sm">{list.name}</span>
                  <span className="text-zinc-500 text-xs ml-2">ID: {list.id}</span>
                </div>
                {list.memberCount !== undefined && (
                  <span className="text-zinc-400 text-xs">{list.memberCount.toLocaleString()} members</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sync Logs */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-white">Sync History</h3>
        </div>
        {syncLogs.length === 0 ? (
          <div className="px-4 py-8 text-center text-zinc-500 text-sm">
            No sync activity yet.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {syncLogs.slice(0, 20).map((log) => (
              <div key={log.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {log.status === 'completed' ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : log.status === 'failed' ? (
                    <XCircle className="w-4 h-4 text-red-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-yellow-400 animate-pulse" />
                  )}
                  <div>
                    <span className="text-zinc-300 text-sm capitalize">{log.sync_type?.replace(/_/g, ' ')}</span>
                    <span className="text-zinc-500 text-xs ml-2">({log.direction})</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {log.records_synced > 0 && (
                    <span className="text-green-400 text-xs">{log.records_synced} synced</span>
                  )}
                  {log.records_failed > 0 && (
                    <span className="text-red-400 text-xs">{log.records_failed} failed</span>
                  )}
                  {log.error_message && (
                    <span className="text-red-400/60 text-xs max-w-[200px] truncate" title={log.error_message}>
                      {log.error_message}
                    </span>
                  )}
                  <span className="text-zinc-500 text-xs">
                    {new Date(log.started_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-zinc-500 text-xs">{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <span className="text-white text-lg font-bold">{value}</span>
    </div>
  );
}

function Pagination({ page, total, limit, onPageChange }: { page: number; total: number; limit: number; onPageChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / limit);
  return (
    <div className="px-4 py-3 border-t border-zinc-800 flex items-center justify-between">
      <span className="text-zinc-500 text-xs">
        Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1 rounded text-zinc-400 hover:text-white disabled:text-zinc-700"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-zinc-400 text-xs px-2">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1 rounded text-zinc-400 hover:text-white disabled:text-zinc-700"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
