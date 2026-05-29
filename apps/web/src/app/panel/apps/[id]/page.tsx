'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  ChevronLeft, Users, Activity, Clock, BarChart2, Shield,
  RefreshCw, Trash2, Pause, Play, Check, AlertTriangle,
  Settings2, TrendingUp, Eye, EyeOff, Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';

// ─── Mock data ──────────────────────────────────────────────────────────────

const mockApp = {
  id: '1',
  name: 'City Hospital Staff Portal',
  template: 'Hospital',
  description: 'Internal app for doctors, nurses, and admin staff to manage schedules, patient queues, and communications.',
  status: 'active' as 'active' | 'paused',
  userCount: 142,
  dailyActive: 89,
  sessionsToday: 214,
  avgSessionMin: 18,
  appUrl: 'https://app.qestron.io/cityhospital/staff-portal',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6IjEiLCJ3b3Jrc3BhY2VJZCI6ImNpdHlob3NwaXRhbCJ9.abc123',
  brandColor: '#6366f1',
  features: ['Staff Directory', 'Patient Queue', 'Doctor Dashboard', 'Shift Scheduler', 'Emergency Alerts'],
  roles: [
    { name: 'Admin', count: 8 },
    { name: 'Doctor', count: 34 },
    { name: 'Nurse', count: 67 },
    { name: 'Staff', count: 33 },
  ],
  activity: [
    { day: 'Mon', sessions: 180 },
    { day: 'Tue', sessions: 210 },
    { day: 'Wed', sessions: 195 },
    { day: 'Thu', sessions: 230 },
    { day: 'Fri', sessions: 214 },
    { day: 'Sat', sessions: 120 },
    { day: 'Sun', sessions: 85 },
  ],
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={handleCopy}
      className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
    >
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-gray-400" />}
    </button>
  );
}

function maskToken(token: string) {
  const [header] = token.split('.');
  return `${header.slice(0, 14)}...${token.slice(-8)}`;
}

const templateBadgeColors: Record<string, string> = {
  Hospital: 'bg-blue-50 text-blue-700 border-blue-200',
  Restaurant: 'bg-orange-50 text-orange-700 border-orange-200',
  Retail: 'bg-purple-50 text-purple-700 border-purple-200',
  School: 'bg-green-50 text-green-700 border-green-200',
  Custom: 'bg-gray-50 text-gray-600 border-gray-200',
};

// ─── Analytics Tab ──────────────────────────────────────────────────────────

function AnalyticsTab({ app }: { app: typeof mockApp }) {
  const maxSessions = Math.max(...app.activity.map(d => d.sessions));

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Total Users', value: app.userCount, color: 'text-indigo-600 bg-indigo-50' },
          { icon: Activity, label: 'Daily Active', value: app.dailyActive, color: 'text-emerald-600 bg-emerald-50' },
          { icon: TrendingUp, label: 'Sessions Today', value: app.sessionsToday, color: 'text-blue-600 bg-blue-50' },
          { icon: Clock, label: 'Avg Session', value: `${app.avgSessionMin}m`, color: 'text-amber-600 bg-amber-50' },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-gray-200/60 rounded-2xl p-5">
            <div className={`h-9 w-9 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="h-4 w-4" />
            </div>
            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Activity chart */}
      <div className="bg-white border border-gray-200/60 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Session Activity</h3>
            <p className="text-xs text-gray-400 mt-0.5">Last 7 days</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live tracking
          </span>
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-3 h-36">
          {app.activity.map(d => {
            const pct = (d.sessions / maxSessions) * 100;
            return (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] text-gray-400">{d.sessions}</span>
                <div className="w-full rounded-t-lg bg-indigo-100 hover:bg-indigo-200 transition-colors relative" style={{ height: `${pct}%`, minHeight: '4px' }}>
                  <div className="absolute inset-x-0 bottom-0 rounded-t-lg bg-indigo-500 opacity-80" style={{ height: '100%' }} />
                </div>
                <span className="text-[10px] text-gray-500 font-medium">{d.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Roles breakdown */}
      <div className="bg-white border border-gray-200/60 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">User Roles Breakdown</h3>
        <div className="space-y-4">
          {app.roles.map(role => {
            const pct = Math.round((role.count / app.userCount) * 100);
            return (
              <div key={role.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-gray-700 font-medium">{role.name}</span>
                  <span className="text-sm text-gray-500">{role.count} <span className="text-xs text-gray-400">({pct}%)</span></span>
                </div>
                <Progress value={pct} className="h-2 bg-gray-100" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Settings Tab ───────────────────────────────────────────────────────────

function SettingsTab({
  app,
  onStatusChange,
  onDelete,
}: {
  app: typeof mockApp;
  onStatusChange: (s: 'active' | 'paused') => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(app.name);
  const [description, setDescription] = useState(app.description);
  const [tokenVisible, setTokenVisible] = useState(false);
  const [token, setToken] = useState(app.token);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRegen = () => {
    const newToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6IjEiLCJpYXQiOiR{Date.now()}fQ.regenerated-${Math.random().toString(36).slice(2)}`;
    setToken(newToken);
    setShowRegenConfirm(false);
  };

  const isPaused = app.status === 'paused';

  return (
    <div className="space-y-6">
      {/* App Details */}
      <div className="bg-white border border-gray-200/60 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-gray-400" /> App Details
        </h3>
        <div className="space-y-4 max-w-lg">
          <div className="space-y-1.5">
            <Label className="text-sm text-gray-700 font-medium">App Name</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              className="rounded-xl border-gray-200"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-gray-700 font-medium">Description</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="rounded-xl border-gray-200 resize-none"
            />
          </div>
          <Button
            onClick={handleSave}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
          >
            {saved ? <Check className="h-4 w-4" /> : null}
            {saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Token Management */}
      <div className="bg-white border border-gray-200/60 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Shield className="h-4 w-4 text-gray-400" /> Token Management
        </h3>
        <p className="text-xs text-gray-400 mb-5">The access token is shared with end-users to authenticate into this app.</p>

        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 mb-4 max-w-lg">
          <span className="font-mono text-xs text-gray-600 flex-1 break-all">
            {tokenVisible ? token : maskToken(token)}
          </span>
          <button
            onClick={() => setTokenVisible(v => !v)}
            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            {tokenVisible ? <EyeOff className="h-3.5 w-3.5 text-gray-400" /> : <Eye className="h-3.5 w-3.5 text-gray-400" />}
          </button>
          <CopyButton text={token} />
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2 rounded-xl text-sm"
            onClick={() => setShowRegenConfirm(true)}
          >
            <RefreshCw className="h-4 w-4" /> Regenerate Token
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2 rounded-xl text-sm text-amber-600 border-amber-200 hover:bg-amber-50"
            onClick={() => setShowRevokeConfirm(true)}
          >
            <Shield className="h-4 w-4" /> Revoke All Sessions
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white border border-red-100 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-red-700 mb-1 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> Danger Zone
        </h3>
        <p className="text-xs text-gray-400 mb-5">These actions are irreversible or disruptive. Proceed with care.</p>
        <div className="flex gap-3 flex-wrap">
          <Button
            variant="outline"
            className="flex items-center gap-2 rounded-xl text-sm text-amber-600 border-amber-200 hover:bg-amber-50"
            onClick={() => setShowPauseConfirm(true)}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {isPaused ? 'Resume App' : 'Pause App'}
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2 rounded-xl text-sm text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4" /> Delete App
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={showRegenConfirm} onOpenChange={setShowRegenConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-amber-500" /> Regenerate Token?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 py-2">
            The current token will be invalidated immediately. All existing sessions using the old token will be logged out.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRegenConfirm(false)}>Cancel</Button>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handleRegen}>
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRevokeConfirm} onOpenChange={setShowRevokeConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Revoke All Sessions?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 py-2">
            All currently active sessions for this app will be terminated. Users will need to re-authenticate.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRevokeConfirm(false)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => setShowRevokeConfirm(false)}>
              Revoke All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPauseConfirm} onOpenChange={setShowPauseConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {isPaused ? 'Resume App?' : 'Pause App?'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 py-2">
            {isPaused
              ? 'The app will be made accessible to users again.'
              : 'Users will no longer be able to log in. Existing sessions will be terminated.'}
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPauseConfirm(false)}>Cancel</Button>
            <Button
              className={isPaused ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'}
              onClick={() => {
                onStatusChange(isPaused ? 'active' : 'paused');
                setShowPauseConfirm(false);
              }}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" /> Delete App?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 py-2">
            This will permanently delete the app and revoke all tokens and sessions. This action <strong>cannot be undone</strong>.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => { onDelete(); setShowDeleteConfirm(false); }}>
              Delete Forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AppDetailPage() {
  const params = useParams();
  const [app, setApp] = useState(mockApp);

  const handleStatusChange = (status: 'active' | 'paused') => {
    setApp(prev => ({ ...prev, status }));
  };

  const handleDelete = () => {
    window.location.href = '/panel/apps';
  };

  const statusBadge = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    draft: 'bg-gray-50 text-gray-600 border-gray-200',
    paused: 'bg-amber-50 text-amber-700 border-amber-200',
  }[app.status];

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-800 mb-4 -ml-2" asChild>
            <a href="/panel/apps">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to Apps
            </a>
          </Button>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl flex-shrink-0">
                {app.template === 'Hospital' ? '🏥' : app.template === 'Restaurant' ? '🍽️' : app.template === 'Retail' ? '🛒' : app.template === 'School' ? '🏫' : '⚙️'}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{app.name}</h1>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${templateBadgeColors[app.template] ?? templateBadgeColors.Custom}`}>
                    {app.template}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge}`}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">{app.appUrl}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="analytics">
          <TabsList className="bg-white border border-gray-200/60 rounded-xl p-1 mb-6 w-fit">
            <TabsTrigger
              value="analytics"
              className="rounded-lg text-sm font-medium data-[state=active]:bg-gray-900 data-[state=active]:text-white px-5"
            >
              <BarChart2 className="h-4 w-4 mr-2" /> Analytics
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="rounded-lg text-sm font-medium data-[state=active]:bg-gray-900 data-[state=active]:text-white px-5"
            >
              <Settings2 className="h-4 w-4 mr-2" /> Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <AnalyticsTab app={app} />
          </TabsContent>
          <TabsContent value="settings">
            <SettingsTab app={app} onStatusChange={handleStatusChange} onDelete={handleDelete} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
