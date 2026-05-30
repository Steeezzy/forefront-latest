'use client';

import { useState } from 'react';
import {
  Mail, Plus, Settings, Trash2, HardDrive,
  CheckCircle2, XCircle, Users, Server
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


type Mailbox = {
  id: string;
  email: string;
  name: string;
  storageUsed: number;
  storageLimit: number;
  status: 'active' | 'suspended';
};

type EmailDomain = {
  domain: string;
  spf: boolean;
  dkim: boolean;
  dmarc: boolean;
};

const mockMailboxes: Mailbox[] = [
  { id: '1', email: 'support@mystore.com', name: 'Support Team', storageUsed: 1.2, storageLimit: 5, status: 'active' },
  { id: '2', email: 'hello@mystore.com', name: 'Hello Desk', storageUsed: 0.4, storageLimit: 5, status: 'active' },
  { id: '3', email: 'orders@hospital-app.in', name: 'Orders', storageUsed: 0.8, storageLimit: 5, status: 'active' },
];

const mockEmailDomains: EmailDomain[] = [
  { domain: 'mystore.com', spf: true, dkim: true, dmarc: true },
  { domain: 'hospital-app.in', spf: true, dkim: false, dmarc: false },
];

const VERIFIED_DOMAINS = ['mystore.com', 'hospital-app.in'];

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(email: string) {
  const colors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500'];
  const idx = email.charCodeAt(0) % colors.length;
  return colors[idx];
}

function StorageBar({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min((used / limit) * 100, 100);
  const color = pct > 80 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{used} GB used</span>
        <span>{limit} GB</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function DnsCheck({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {ok
        ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        : <XCircle className="h-4 w-4 text-red-400" />
      }
      <span className={`text-sm font-medium ${ok ? 'text-emerald-700' : 'text-red-600'}`}>{label}</span>
    </div>
  );
}

export default function EmailHostingPage() {
  const [mailboxes, setMailboxes] = useState<Mailbox[]>(mockMailboxes);
  const [createOpen, setCreateOpen] = useState(false);

  const [localPart, setLocalPart] = useState('');
  const [domain, setDomain] = useState(VERIFIED_DOMAINS[0]);
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [storageLimit, setStorageLimit] = useState('5');

  const totalUsed = mailboxes.reduce((s, m) => s + m.storageUsed, 0);
  const totalLimit = mailboxes.reduce((s, m) => s + m.storageLimit, 0);

  const handleCreate = () => {
    if (!localPart || !displayName || !password) return;
    const newBox: Mailbox = {
      id: Date.now().toString(),
      email: `${localPart}@${domain}`,
      name: displayName,
      storageUsed: 0,
      storageLimit: parseInt(storageLimit),
      status: 'active',
    };
    setMailboxes(prev => [newBox, ...prev]);
    setCreateOpen(false);
    setLocalPart(''); setDisplayName(''); setPassword('');
  };

  const handleDelete = (id: string) => {
    setMailboxes(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Hosting</h1>
          <p className="text-sm text-gray-500 mt-1">Manage mailboxes, storage, and email domain health</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-gray-900 text-white hover:bg-gray-800 gap-2">
          <Plus className="h-4 w-4" />
          Create Mailbox
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200/60 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-xl bg-violet-50 flex items-center justify-center">
              <Users className="h-4.5 w-4.5 text-violet-600" />
            </div>
            <span className="text-sm text-gray-500">Total Mailboxes</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{mailboxes.length}</p>
          <p className="text-xs text-gray-400 mt-1">{mailboxes.filter(m => m.status === 'active').length} active</p>
        </div>

        <div className="bg-white border border-gray-200/60 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <HardDrive className="h-4.5 w-4.5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Storage Used</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalUsed.toFixed(1)} GB</p>
          <div className="mt-2">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${Math.min((totalUsed / totalLimit) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">of {totalLimit} GB total</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200/60 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Server className="h-4.5 w-4.5 text-emerald-600" />
            </div>
            <span className="text-sm text-gray-500">Email Domains</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{mockEmailDomains.length}</p>
          <p className="text-xs text-gray-400 mt-1">{mockEmailDomains.filter(d => d.spf && d.dkim && d.dmarc).length} fully configured</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="mailboxes">
        <TabsList className="bg-gray-100/80 rounded-xl p-1">
          <TabsTrigger value="mailboxes" className="rounded-lg text-sm">Mailboxes</TabsTrigger>
          <TabsTrigger value="health" className="rounded-lg text-sm">Domain Health</TabsTrigger>
        </TabsList>

        {/* Mailboxes Tab */}
        <TabsContent value="mailboxes" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {mailboxes.map(mb => {
              const initials = getInitials(mb.name);
              const avatarColor = getAvatarColor(mb.email);
              return (
                <div key={mb.id} className="bg-white border border-gray-200/60 rounded-2xl p-5 flex flex-col gap-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl ${avatarColor} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white text-sm font-bold">{initials}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{mb.name}</p>
                        <p className="text-xs text-gray-400 truncate">{mb.email}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${
                      mb.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {mb.status}
                    </span>
                  </div>

                  {/* Storage */}
                  <StorageBar used={mb.storageUsed} limit={mb.storageLimit} />

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs gap-1.5">
                      <Settings className="h-3.5 w-3.5" />
                      Settings
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:border-red-200 hover:bg-red-50"
                      onClick={() => handleDelete(mb.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Empty State */}
            {mailboxes.length === 0 && (
              <div className="col-span-3 text-center py-16 text-gray-400">
                <Mail className="mx-auto h-12 w-12 mb-3 text-gray-200" />
                <p className="text-sm">No mailboxes yet. Create your first mailbox to get started.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Domain Health Tab */}
        <TabsContent value="health" className="mt-4">
          <div className="space-y-3">
            {mockEmailDomains.map(ed => {
              const allGood = ed.spf && ed.dkim && ed.dmarc;
              return (
                <div key={ed.domain} className="bg-white border border-gray-200/60 rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-semibold text-gray-900">{ed.domain}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Email authentication records</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      allGood ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {allGood ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      {allGood ? 'Fully configured' : 'Action required'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">SPF</p>
                      <DnsCheck ok={ed.spf} label={ed.spf ? 'Valid' : 'Missing'} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">DKIM</p>
                      <DnsCheck ok={ed.dkim} label={ed.dkim ? 'Valid' : 'Missing'} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">DMARC</p>
                      <DnsCheck ok={ed.dmarc} label={ed.dmarc ? 'Valid' : 'Missing'} />
                    </div>
                  </div>
                  {!allGood && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-700">
                      Some DNS records are missing. Configure them to improve email deliverability and prevent spoofing.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Mailbox Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Mailbox</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="john"
                  value={localPart}
                  onChange={e => setLocalPart(e.target.value)}
                  className="flex-1"
                />
                <span className="flex items-center text-sm text-gray-500 px-2">@</span>
                <Select value={domain} onValueChange={setDomain}>
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VERIFIED_DOMAINS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                placeholder="John Smith"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Storage Limit</Label>
              <Select value={storageLimit} onValueChange={setStorageLimit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 GB</SelectItem>
                  <SelectItem value="5">5 GB</SelectItem>
                  <SelectItem value="10">10 GB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              className="bg-gray-900 text-white hover:bg-gray-800"
              onClick={handleCreate}
              disabled={!localPart || !displayName || !password}
            >
              Create Mailbox
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
