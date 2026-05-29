'use client';

import { useState } from 'react';
import {
  AppWindow, Plus, Copy, Check, Eye, EyeOff, Settings2,
  BarChart2, Pause, Play, Trash2, QrCode, Users, Activity,
  Clock, Zap, ChevronRight, MoreVertical, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

type AppStatus = 'active' | 'draft' | 'paused';

type AppGateway = {
  id: string;
  name: string;
  template: string;
  description: string;
  appUrl: string;
  token: string;
  status: AppStatus;
  userCount: number;
  dailyActive: number;
  lastActivity: string;
};

const mockApps: AppGateway[] = [
  {
    id: '1',
    name: 'City Hospital Staff Portal',
    template: 'Hospital',
    description: 'Internal app for doctors, nurses, and admin staff',
    appUrl: 'https://app.qestron.io/cityhospital/staff-portal',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6IjEiLCJ3b3Jrc3BhY2VJZCI6ImNpdHlob3NwaXRhbCJ9.abc123',
    status: 'active',
    userCount: 142,
    dailyActive: 89,
    lastActivity: '2 minutes ago',
  },
  {
    id: '2',
    name: 'Spice Garden Restaurant',
    template: 'Restaurant',
    description: 'Kitchen display, order tracking, table management',
    appUrl: 'https://app.qestron.io/spicegarden/ops',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6IjIifQ.xyz789',
    status: 'active',
    userCount: 23,
    dailyActive: 18,
    lastActivity: '5 minutes ago',
  },
  {
    id: '3',
    name: 'Green Valley School',
    template: 'School',
    description: 'Attendance, grades, parent communication portal',
    appUrl: 'https://app.qestron.io/greenvalley/school-app',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6IjMifQ.def456',
    status: 'draft',
    userCount: 0,
    dailyActive: 0,
    lastActivity: 'Never',
  },
];

const templateColors: Record<string, string> = {
  Hospital: 'bg-blue-50 text-blue-700 border-blue-200',
  Restaurant: 'bg-orange-50 text-orange-700 border-orange-200',
  Retail: 'bg-purple-50 text-purple-700 border-purple-200',
  School: 'bg-green-50 text-green-700 border-green-200',
  Custom: 'bg-gray-50 text-gray-700 border-gray-200',
};

const templateEmojis: Record<string, string> = {
  Hospital: '🏥',
  Restaurant: '🍽️',
  Retail: '🛒',
  School: '🏫',
  Custom: '⚙️',
};

function StatusBadge({ status }: { status: AppStatus }) {
  const map: Record<AppStatus, { label: string; className: string }> = {
    active: { label: 'Active', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    draft: { label: 'Draft', className: 'bg-gray-50 text-gray-600 border-gray-200' },
    paused: { label: 'Paused', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  };
  const { label, className } = map[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${className}`}>
      {label}
    </span>
  );
}

function maskToken(token: string) {
  const [header] = token.split('.');
  return `${header.slice(0, 10)}...${token.slice(-6)}`;
}

function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center justify-center h-7 w-7 rounded-lg hover:bg-gray-100 transition-colors ${className}`}
      title="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-gray-400" />}
    </button>
  );
}

function QrModal({ app, open, onClose }: { app: AppGateway | null; open: boolean; onClose: () => void }) {
  if (!app) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <QrCode className="h-5 w-5 text-indigo-600" />
            QR Code — {app.name}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          {/* QR placeholder */}
          <div className="h-48 w-48 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2">
            <QrCode className="h-12 w-12 text-gray-300" />
            <p className="text-xs text-gray-400 text-center px-4">QR code generation<br />coming soon</p>
          </div>
          <div className="w-full rounded-xl bg-gray-50 border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">App URL</p>
            <p className="text-xs font-mono text-gray-800 break-all">{app.appUrl}</p>
          </div>
          <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AppCard({
  app,
  onQrOpen,
  onDelete,
  onToggleStatus,
}: {
  app: AppGateway;
  onQrOpen: (app: AppGateway) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, current: AppStatus) => void;
}) {
  const [tokenRevealed, setTokenRevealed] = useState(false);

  return (
    <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Card header */}
      <div className="flex items-start justify-between px-5 pt-5 pb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-lg flex-shrink-0">
            {templateEmojis[app.template] ?? '📱'}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate leading-tight">{app.name}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${templateColors[app.template] ?? templateColors.Custom}`}>
                {app.template}
              </span>
              <StatusBadge status={app.status} />
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0 ml-2">
              <MoreVertical className="h-4 w-4 text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild>
              <a href={`/panel/apps/${app.id}`} className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" /> Settings
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={`/panel/apps/${app.id}`} className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4" /> Analytics
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center gap-2"
              onClick={() => onToggleStatus(app.id, app.status)}
            >
              {app.status === 'paused' ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              {app.status === 'paused' ? 'Resume App' : 'Pause App'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center gap-2 text-red-600 focus:text-red-600"
              onClick={() => onDelete(app.id)}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 leading-relaxed px-5 pb-4">{app.description}</p>

      {/* URL row */}
      <div className="mx-5 mb-3 rounded-xl bg-gray-50 border border-gray-200 px-3 py-2.5 flex items-center gap-2">
        <span className="font-mono text-[11px] text-gray-700 truncate flex-1">{app.appUrl}</span>
        <CopyButton text={app.appUrl} />
      </div>

      {/* Token row */}
      <div className="mx-5 mb-4 rounded-xl bg-gray-50 border border-gray-200 px-3 py-2.5 flex items-center gap-2">
        <span className="font-mono text-[11px] text-gray-500 truncate flex-1">
          {tokenRevealed ? app.token : maskToken(app.token)}
        </span>
        <button
          onClick={() => setTokenRevealed(r => !r)}
          className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors"
          title={tokenRevealed ? 'Hide token' : 'Reveal token'}
        >
          {tokenRevealed
            ? <EyeOff className="h-3.5 w-3.5 text-gray-400" />
            : <Eye className="h-3.5 w-3.5 text-gray-400" />}
        </button>
        <CopyButton text={app.token} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100">
        <div className="px-4 py-3 text-center">
          <p className="text-sm font-bold text-gray-900">{app.userCount}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Users</p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-sm font-bold text-gray-900">{app.dailyActive}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Daily Active</p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-xs font-medium text-gray-600 leading-tight">{app.lastActivity}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Last Seen</p>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50/50">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5 text-xs h-8"
          onClick={() => onQrOpen(app)}
        >
          <QrCode className="h-3.5 w-3.5" />
          QR Code
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5 text-xs h-8"
          asChild
        >
          <a href={`/panel/apps/${app.id}`}>
            <BarChart2 className="h-3.5 w-3.5" />
            Analytics
          </a>
        </Button>
        <div className="flex-1" />
        <Button
          size="sm"
          className="flex items-center gap-1.5 text-xs h-8 bg-gray-900 hover:bg-gray-800 text-white"
          asChild
        >
          <a href={`/panel/apps/${app.id}`}>
            Settings <ChevronRight className="h-3.5 w-3.5" />
          </a>
        </Button>
      </div>
    </div>
  );
}

export default function AppsPage() {
  const [apps, setApps] = useState<AppGateway[]>(mockApps);
  const [qrTarget, setQrTarget] = useState<AppGateway | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const totalActive = apps.filter(a => a.status === 'active').length;
  const totalUsers = apps.reduce((s, a) => s + a.userCount, 0);
  const totalDailyActive = apps.reduce((s, a) => s + a.dailyActive, 0);

  const handleDelete = (id: string) => setDeleteConfirmId(id);
  const confirmDelete = () => {
    if (deleteConfirmId) {
      setApps(prev => prev.filter(a => a.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    }
  };

  const handleToggleStatus = (id: string, current: AppStatus) => {
    setApps(prev =>
      prev.map(a =>
        a.id === id
          ? { ...a, status: current === 'paused' ? 'active' : 'paused' }
          : a
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                <AppWindow className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">My Apps</h1>
            </div>
            <p className="text-sm text-gray-500 ml-12">
              Apps your team and users access via URL + token
            </p>
          </div>
          <Button
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white"
            asChild
          >
            <a href="/panel/apps/create">
              <Plus className="h-4 w-4" />
              Create App
            </a>
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: AppWindow, label: 'Active Apps', value: totalActive, color: 'text-indigo-600 bg-indigo-50' },
            { icon: Users, label: 'Total Users', value: totalUsers, color: 'text-blue-600 bg-blue-50' },
            { icon: Activity, label: 'Active Sessions', value: totalDailyActive, color: 'text-emerald-600 bg-emerald-50' },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-gray-200/60 rounded-2xl shadow-sm px-6 py-5 flex items-center gap-4">
              <div className={`h-11 w-11 rounded-xl ${stat.color} flex items-center justify-center flex-shrink-0`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Apps grid */}
        {apps.length === 0 ? (
          <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm px-8 py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
              <AppWindow className="h-8 w-8 text-indigo-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">No apps yet</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
              Create your first branded app and share it with your team or end-users.
            </p>
            <Button className="bg-gray-900 hover:bg-gray-800 text-white" asChild>
              <a href="/panel/apps/create">
                <Plus className="h-4 w-4 mr-2" /> Create your first app
              </a>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {apps.map(app => (
              <AppCard
                key={app.id}
                app={app}
                onQrOpen={setQrTarget}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        )}
      </div>

      {/* QR modal */}
      <QrModal app={qrTarget} open={!!qrTarget} onClose={() => setQrTarget(null)} />

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Delete App?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 py-2">
            This will permanently delete the app and revoke all active tokens. This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end mt-2">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={confirmDelete}
            >
              Delete App
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
