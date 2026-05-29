'use client';

import { useState } from 'react';
import {
  Globe, TrendingUp, Zap, Shield, ShieldCheck, ShieldAlert,
  RefreshCw, Trash2, Plus, Edit2, Activity, HardDrive, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';

type SslEntry = {
  id: string;
  domain: string;
  status: 'valid' | 'expiring' | 'expired';
  issuer: string;
  expiry: string;
};

type PageRule = {
  id: string;
  pattern: string;
  action: string;
};

const mockSslEntries: SslEntry[] = [
  { id: '1', domain: 'mystore.com', status: 'valid', issuer: "Let's Encrypt", expiry: '2025-09-01' },
  { id: '2', domain: 'hospital-app.in', status: 'expiring', issuer: "Let's Encrypt", expiry: '2025-04-10' },
  { id: '3', domain: 'myblog.net', status: 'expired', issuer: 'ZeroSSL', expiry: '2024-01-15' },
];

const mockPageRules: PageRule[] = [
  { id: '1', pattern: '/api/*', action: 'Bypass Cache' },
  { id: '2', pattern: '/static/*', action: 'Cache Everything (30d)' },
  { id: '3', pattern: '/admin/*', action: 'Security Level: High' },
];

const statCards = [
  {
    icon: Globe,
    label: 'Edge Locations',
    value: '32',
    sub: 'Worldwide PoPs',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: TrendingUp,
    label: 'Cache Hit Rate',
    value: '94.7%',
    sub: '↑ 2.3% vs last week',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: HardDrive,
    label: 'Bandwidth Used',
    value: '128 GB',
    sub: 'This month',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    icon: Shield,
    label: 'SSL Certificates',
    value: '3 Active',
    sub: '1 expiring soon',
    color: 'bg-amber-50 text-amber-600',
  },
];

function SslStatusBadge({ status }: { status: SslEntry['status'] }) {
  const map = {
    valid: { label: 'Valid', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: ShieldCheck },
    expiring: { label: 'Expiring', className: 'bg-amber-50 text-amber-700 border-amber-200', Icon: ShieldAlert },
    expired: { label: 'Expired', className: 'bg-red-50 text-red-700 border-red-200', Icon: ShieldAlert },
  };
  const { label, className, Icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

export default function CdnSslPage() {
  const [sslEntries, setSslEntries] = useState<SslEntry[]>(mockSslEntries);
  const [pageRules, setPageRules] = useState<PageRule[]>(mockPageRules);

  const [purgeUrl, setPurgeUrl] = useState('');
  const [purged, setPurged] = useState(false);
  const [purgeAllDone, setPurgeAllDone] = useState(false);

  const [ruleOpen, setRuleOpen] = useState(false);
  const [rulePattern, setRulePattern] = useState('');
  const [ruleAction, setRuleAction] = useState('Cache Everything (30d)');

  const handlePurgeAll = () => {
    setPurgeAllDone(true);
    setTimeout(() => setPurgeAllDone(false), 2000);
  };

  const handlePurgeUrl = () => {
    if (!purgeUrl.trim()) return;
    setPurged(true);
    setTimeout(() => { setPurged(false); setPurgeUrl(''); }, 2000);
  };

  const handleAddRule = () => {
    if (!rulePattern.trim()) return;
    setPageRules(prev => [...prev, { id: Date.now().toString(), pattern: rulePattern, action: ruleAction }]);
    setRuleOpen(false);
    setRulePattern('');
  };

  const handleDeleteRule = (id: string) => {
    setPageRules(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CDN & SSL</h1>
          <p className="text-sm text-gray-500 mt-1">Edge network and security for your domains</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
            <Activity className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
            <span className="text-xs font-medium text-emerald-700">Edge Network Active</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white border border-gray-200/60 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`h-9 w-9 rounded-xl ${card.color} flex items-center justify-center`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm text-gray-500">{card.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* SSL Certificates */}
      <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">SSL Certificates</h2>
            <p className="text-xs text-gray-400 mt-0.5">Auto-renewed every 90 days via Let's Encrypt</p>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="text-xs font-medium text-gray-500">Domain</TableHead>
              <TableHead className="text-xs font-medium text-gray-500">Status</TableHead>
              <TableHead className="text-xs font-medium text-gray-500">Issuer</TableHead>
              <TableHead className="text-xs font-medium text-gray-500">Expiry</TableHead>
              <TableHead className="text-xs font-medium text-gray-500 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sslEntries.map(entry => (
              <TableRow key={entry.id} className="hover:bg-gray-50/50">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900 text-sm">{entry.domain}</span>
                  </div>
                </TableCell>
                <TableCell><SslStatusBadge status={entry.status} /></TableCell>
                <TableCell className="text-sm text-gray-500">{entry.issuer}</TableCell>
                <TableCell className="text-sm text-gray-600">
                  {new Date(entry.expiry).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-3 gap-1.5"
                    disabled={entry.status === 'valid'}
                  >
                    <RefreshCw className="h-3 w-3" />
                    Renew
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Cache Management */}
      <div className="bg-white border border-gray-200/60 rounded-2xl p-6">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Cache Management</h2>
          <p className="text-xs text-gray-400 mt-0.5">Purge cached assets from the edge network</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-3">Purge all cached files across all edge locations instantly.</p>
            <Button
              variant="outline"
              className={`gap-2 transition-all ${purgeAllDone ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : ''}`}
              onClick={handlePurgeAll}
            >
              {purgeAllDone ? <Check className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
              {purgeAllDone ? 'Purged!' : 'Purge All Cache'}
            </Button>
          </div>
          <div className="w-px bg-gray-100 hidden sm:block" />
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-3">Purge a specific URL from the cache.</p>
            <div className="flex gap-2">
              <Input
                placeholder="https://mystore.com/page"
                value={purgeUrl}
                onChange={e => setPurgeUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handlePurgeUrl}
                className={purged ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : ''}
              >
                {purged ? <Check className="h-4 w-4" /> : 'Purge URL'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Page Rules */}
      <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Page Rules</h2>
            <p className="text-xs text-gray-400 mt-0.5">Control caching, redirects, and security per path pattern</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setRuleOpen(true)} className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Add Rule
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="text-xs font-medium text-gray-500">Path Pattern</TableHead>
              <TableHead className="text-xs font-medium text-gray-500">Action</TableHead>
              <TableHead className="text-xs font-medium text-gray-500 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRules.map(rule => (
              <TableRow key={rule.id} className="hover:bg-gray-50/50">
                <TableCell>
                  <code className="text-sm font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{rule.pattern}</code>
                </TableCell>
                <TableCell className="text-sm text-gray-600">{rule.action}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500">
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {pageRules.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-gray-400 text-sm">
                  No page rules. Add one to control caching behaviour.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Rule Dialog */}
      <Dialog open={ruleOpen} onOpenChange={setRuleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Page Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Path Pattern</Label>
              <Input
                placeholder="/api/* or /static/*"
                value={rulePattern}
                onChange={e => setRulePattern(e.target.value)}
              />
              <p className="text-xs text-gray-400">Use * as a wildcard. Example: /blog/* matches all blog pages.</p>
            </div>
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={ruleAction} onValueChange={setRuleAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cache Everything (30d)">Cache Everything (30 days)</SelectItem>
                  <SelectItem value="Cache Everything (1d)">Cache Everything (1 day)</SelectItem>
                  <SelectItem value="Bypass Cache">Bypass Cache</SelectItem>
                  <SelectItem value="Security Level: High">Security Level: High</SelectItem>
                  <SelectItem value="Always HTTPS">Always HTTPS</SelectItem>
                  <SelectItem value="Redirect to HTTPS">Redirect to HTTPS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleOpen(false)}>Cancel</Button>
            <Button
              className="bg-gray-900 text-white hover:bg-gray-800"
              onClick={handleAddRule}
              disabled={!rulePattern.trim()}
            >
              Add Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
