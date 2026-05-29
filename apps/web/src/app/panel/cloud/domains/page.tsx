'use client';

import { useState } from 'react';
import {
  Globe, Search, Plus, RefreshCw, ArrowRightLeft,
  Shield, ShieldCheck, ShieldAlert, MoreVertical, Copy, Check,
  AlertCircle, CheckCircle2, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Switch } from '@/components/ui/switch';

type Domain = {
  id: string;
  domain: string;
  status: 'active' | 'pending' | 'expired';
  ssl: 'secured' | 'none';
  autoRenew: boolean;
  expiry: string;
  registrar: string;
};

type DnsRecord = {
  id: string;
  type: string;
  host: string;
  value: string;
  ttl: string;
};

const mockDomains: Domain[] = [
  { id: '1', domain: 'mystore.com', status: 'active', ssl: 'secured', autoRenew: true, expiry: '2025-12-01', registrar: 'Cloudflare' },
  { id: '2', domain: 'hospital-app.in', status: 'active', ssl: 'secured', autoRenew: false, expiry: '2025-08-15', registrar: 'Cloudflare' },
  { id: '3', domain: 'myblog.net', status: 'pending', ssl: 'none', autoRenew: true, expiry: '2024-03-01', registrar: 'Namecheap' },
];

const mockDnsRecords: DnsRecord[] = [
  { id: '1', type: 'A', host: '@', value: '76.76.21.21', ttl: '3600' },
  { id: '2', type: 'CNAME', host: 'www', value: 'mystore.com', ttl: '3600' },
  { id: '3', type: 'MX', host: '@', value: 'mail.qestron.io', ttl: '3600' },
  { id: '4', type: 'TXT', host: '@', value: 'v=spf1 include:mail.qestron.io ~all', ttl: '3600' },
];

const TLDS = ['.com', '.in', '.net', '.org', '.io'];

function StatusBadge({ status }: { status: Domain['status'] }) {
  const map = {
    active: { label: 'Active', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    expired: { label: 'Expired', className: 'bg-red-50 text-red-700 border-red-200' },
  };
  const { label, className } = map[status];
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>{label}</span>;
}

function SslBadge({ ssl }: { ssl: Domain['ssl'] }) {
  if (ssl === 'secured') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
        <ShieldCheck className="h-3 w-3" />
        Secured
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
      <Shield className="h-3 w-3" />
      None
    </span>
  );
}

export default function CloudDomainsPage() {
  const [domains, setDomains] = useState<Domain[]>(mockDomains);
  const [dnsRecords, setDnsRecords] = useState<DnsRecord[]>(mockDnsRecords);

  const [registerOpen, setRegisterOpen] = useState(false);
  const [dnsOpen, setDnsOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchTld, setSearchTld] = useState('.com');
  const [availabilityResult, setAvailabilityResult] = useState<null | { available: boolean; domain: string; price: string }>(null);
  const [checking, setChecking] = useState(false);

  const [copied, setCopied] = useState<string | null>(null);

  const handleCheckAvailability = () => {
    if (!searchQuery.trim()) return;
    setChecking(true);
    setTimeout(() => {
      const domain = `${searchQuery.trim().toLowerCase()}${searchTld}`;
      const taken = domains.some(d => d.domain === domain);
      setAvailabilityResult({
        available: !taken,
        domain,
        price: searchTld === '.com' ? '$12.99/yr' : searchTld === '.io' ? '$39.99/yr' : '$9.99/yr',
      });
      setChecking(false);
    }, 800);
  };

  const toggleAutoRenew = (id: string) => {
    setDomains(prev => prev.map(d => d.id === id ? { ...d, autoRenew: !d.autoRenew } : d));
  };

  const openDns = (domain: Domain) => {
    setSelectedDomain(domain);
    setDnsOpen(true);
  };

  const copyValue = (id: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const daysUntilExpiry = (expiry: string) => {
    const diff = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000);
    return diff;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Domain Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your domains, DNS records, and SSL certificates</p>
        </div>
        <Button onClick={() => setRegisterOpen(true)} className="bg-gray-900 text-white hover:bg-gray-800 gap-2">
          <Plus className="h-4 w-4" />
          Register Domain
        </Button>
      </div>

      {/* Domain Availability Search */}
      <div className="bg-white border border-gray-200/60 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Check Domain Availability</h2>
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="yourdomain"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCheckAvailability()}
              className="pl-9"
            />
          </div>
          <Select value={searchTld} onValueChange={setSearchTld}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TLDS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={handleCheckAvailability} disabled={checking || !searchQuery.trim()} variant="outline">
            {checking ? 'Checking...' : 'Check'}
          </Button>
        </div>

        {availabilityResult && (
          <div className={`mt-4 p-4 rounded-xl border flex items-center justify-between ${
            availabilityResult.available
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              {availabilityResult.available
                ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                : <AlertCircle className="h-5 w-5 text-red-500" />
              }
              <div>
                <p className="font-semibold text-gray-900">{availabilityResult.domain}</p>
                <p className="text-sm text-gray-500">
                  {availabilityResult.available ? `Available — ${availabilityResult.price}` : 'This domain is already taken'}
                </p>
              </div>
            </div>
            {availabilityResult.available && (
              <Button size="sm" className="bg-gray-900 text-white hover:bg-gray-800">
                Register Now
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Domains Table */}
      <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Your Domains ({domains.length})</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="text-xs text-gray-500 font-medium">Domain</TableHead>
              <TableHead className="text-xs text-gray-500 font-medium">Status</TableHead>
              <TableHead className="text-xs text-gray-500 font-medium">SSL</TableHead>
              <TableHead className="text-xs text-gray-500 font-medium">Auto-Renew</TableHead>
              <TableHead className="text-xs text-gray-500 font-medium">Expiry</TableHead>
              <TableHead className="text-xs text-gray-500 font-medium">Registrar</TableHead>
              <TableHead className="text-xs text-gray-500 font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {domains.map(domain => {
              const days = daysUntilExpiry(domain.expiry);
              const isExpiringSoon = days > 0 && days < 60;
              return (
                <TableRow key={domain.id} className="hover:bg-gray-50/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-gray-900/5 flex items-center justify-center">
                        <Globe className="h-3.5 w-3.5 text-gray-600" />
                      </div>
                      <span className="font-medium text-gray-900 text-sm">{domain.domain}</span>
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge status={domain.status} /></TableCell>
                  <TableCell><SslBadge ssl={domain.ssl} /></TableCell>
                  <TableCell>
                    <Switch
                      checked={domain.autoRenew}
                      onCheckedChange={() => toggleAutoRenew(domain.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {isExpiringSoon && <Clock className="h-3.5 w-3.5 text-amber-500" />}
                      <span className={`text-sm ${isExpiringSoon ? 'text-amber-600 font-medium' : 'text-gray-600'}`}>
                        {new Date(domain.expiry).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                      {isExpiringSoon && <span className="text-xs text-amber-500">({days}d)</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{domain.registrar}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => openDns(domain)} className="h-7 text-xs px-2.5">
                        DNS
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2.5">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Renew
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2.5">
                        <ArrowRightLeft className="h-3 w-3 mr-1" />
                        Transfer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Register Domain Dialog */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Register New Domain</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Domain Name</Label>
              <Input placeholder="e.g. myawesome-store" />
            </div>
            <div className="space-y-2">
              <Label>Extension</Label>
              <Select defaultValue=".com">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TLDS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Registration Period</Label>
              <Select defaultValue="1">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Year</SelectItem>
                  <SelectItem value="2">2 Years</SelectItem>
                  <SelectItem value="5">5 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <ShieldCheck className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Free SSL included</p>
                <p className="text-blue-600 text-xs">SSL certificate will be provisioned automatically</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisterOpen(false)}>Cancel</Button>
            <Button className="bg-gray-900 text-white hover:bg-gray-800">Register Domain</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DNS Records Dialog */}
      <Dialog open={dnsOpen} onOpenChange={setDnsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-gray-600" />
              DNS Records — {selectedDomain?.domain}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Add Record
              </Button>
            </div>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="text-xs font-medium text-gray-500">Type</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500">Host</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500">Value</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500">TTL</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500 w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dnsRecords.map(rec => (
                    <TableRow key={rec.id}>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-gray-900 text-white font-mono">
                          {rec.type}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-gray-700">{rec.host}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 max-w-[220px]">
                          <span className="font-mono text-xs text-gray-600 truncate">{rec.value}</span>
                          <button
                            onClick={() => copyValue(rec.id, rec.value)}
                            className="text-gray-400 hover:text-gray-700 flex-shrink-0"
                          >
                            {copied === rec.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{rec.ttl}s</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDnsOpen(false)}>Close</Button>
            <Button className="bg-gray-900 text-white hover:bg-gray-800">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
