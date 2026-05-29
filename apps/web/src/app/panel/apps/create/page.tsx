'use client';

import { useState } from 'react';
import {
  ChevronRight, ChevronLeft, Check, Plus, X, Copy,
  Building2, UtensilsCrossed, ShoppingCart, BookOpen, Settings2,
  AppWindow, Palette, Upload, CheckCircle2, QrCode, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

// ─── Templates ────────────────────────────────────────────────────────────────

type Template = {
  id: string;
  icon: React.ReactNode;
  name: string;
  description: string;
  features: string[];
  defaultFeatures: string[];
  defaultRoles: string[];
  color: string;
  gradient: string;
};

const templates: Template[] = [
  {
    id: 'hospital',
    icon: <Building2 className="h-7 w-7" />,
    name: 'Hospital',
    description: 'Staff scheduling, patient queue, doctor dashboard, medicine reminders',
    features: ['Staff Directory', 'Patient Queue', 'Appointment Manager', 'Medicine Reminders', 'Doctor Dashboard', 'Shift Scheduler', 'Emergency Alerts', 'Lab Results'],
    defaultFeatures: ['Staff Directory', 'Patient Queue', 'Doctor Dashboard', 'Shift Scheduler'],
    defaultRoles: ['Admin', 'Doctor', 'Nurse', 'Staff'],
    color: 'border-blue-500 bg-blue-50/60',
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    id: 'restaurant',
    icon: <UtensilsCrossed className="h-7 w-7" />,
    name: 'Restaurant',
    description: 'Order tracking, table management, kitchen display system, reservations',
    features: ['Order Board', 'Table Map', 'Kitchen Display', 'Reservations', 'Staff Roster', 'Inventory Check', 'Daily Report', 'Customer Feedback'],
    defaultFeatures: ['Order Board', 'Table Map', 'Kitchen Display', 'Reservations'],
    defaultRoles: ['Admin', 'Manager', 'Chef', 'Waiter'],
    color: 'border-orange-500 bg-orange-50/60',
    gradient: 'from-orange-500 to-orange-600',
  },
  {
    id: 'retail',
    icon: <ShoppingCart className="h-7 w-7" />,
    name: 'Retail',
    description: 'Inventory scanner, POS interface, customer loyalty, sales reports',
    features: ['Inventory Scanner', 'POS Interface', 'Customer Loyalty', 'Sales Reports', 'Stock Alerts', 'Shift Manager', 'Returns Desk', 'Analytics'],
    defaultFeatures: ['Inventory Scanner', 'POS Interface', 'Customer Loyalty', 'Sales Reports'],
    defaultRoles: ['Admin', 'Manager', 'Cashier', 'Staff'],
    color: 'border-purple-500 bg-purple-50/60',
    gradient: 'from-purple-500 to-purple-600',
  },
  {
    id: 'school',
    icon: <BookOpen className="h-7 w-7" />,
    name: 'School',
    description: 'Attendance, grade portal, parent communication, timetable',
    features: ['Attendance', 'Grade Portal', 'Parent Communication', 'Timetable', 'Homework Board', 'Events', 'Library', 'Fee Manager'],
    defaultFeatures: ['Attendance', 'Grade Portal', 'Parent Communication', 'Timetable'],
    defaultRoles: ['Admin', 'Teacher', 'Student', 'Parent'],
    color: 'border-green-500 bg-green-50/60',
    gradient: 'from-green-500 to-green-600',
  },
  {
    id: 'custom',
    icon: <Settings2 className="h-7 w-7" />,
    name: 'Custom',
    description: 'Build your own app from scratch with full control over features and roles',
    features: ['Dashboard', 'User Directory', 'Notifications', 'Analytics', 'Reports', 'Settings', 'Chat', 'Documents'],
    defaultFeatures: ['Dashboard', 'Notifications'],
    defaultRoles: ['Admin', 'Staff'],
    color: 'border-gray-400 bg-gray-50/60',
    gradient: 'from-gray-600 to-gray-700',
  },
];

// ─── Stepper ──────────────────────────────────────────────────────────────────

const steps = [
  { num: 1, label: 'Choose Template' },
  { num: 2, label: 'App Details' },
  { num: 3, label: 'Features & Roles' },
  { num: 4, label: 'Review & Deploy' },
];

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => {
        const done = current > s.num;
        const active = current === s.num;
        return (
          <div key={s.num} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${done ? 'bg-indigo-600 text-white' : active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {done ? <Check className="h-4 w-4" /> : s.num}
              </div>
              <span className={`text-sm font-medium hidden sm:block transition-colors
                ${active ? 'text-gray-900' : done ? 'text-indigo-600' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px mx-4 transition-all hidden sm:block
                ${done ? 'w-8 bg-indigo-300' : 'w-8 bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Choose Template ──────────────────────────────────────────────────

function Step1({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">Choose a Template</h2>
        <p className="text-sm text-gray-500 mt-1">Pick the template that best fits your business. You can customise everything later.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(t => {
          const isSelected = selected === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={`relative text-left rounded-2xl border-2 p-5 transition-all duration-200 hover:shadow-md ${
                isSelected
                  ? `${t.color} shadow-md ring-2 ring-offset-2 ${t.id === 'hospital' ? 'ring-blue-400' : t.id === 'restaurant' ? 'ring-orange-400' : t.id === 'retail' ? 'ring-purple-400' : t.id === 'school' ? 'ring-green-400' : 'ring-gray-400'}`
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
              )}
              <div className={`inline-flex h-12 w-12 rounded-xl items-center justify-center mb-3 text-white bg-gradient-to-br ${t.gradient}`}>
                {t.icon}
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">{t.name}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">{t.description}</p>
              <ul className="space-y-1">
                {t.defaultFeatures.slice(0, 3).map(f => (
                  <li key={f} className="flex items-center gap-1.5 text-[11px] text-gray-600">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
                {t.features.length > 3 && (
                  <li className="text-[11px] text-gray-400">+{t.features.length - 3} more features</li>
                )}
              </ul>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 2: App Details ──────────────────────────────────────────────────────

type AppDetails = {
  name: string;
  slug: string;
  description: string;
  brandColor: string;
  logoUrl: string;
};

function Step2({ details, onChange }: { details: AppDetails; onChange: (d: AppDetails) => void }) {
  const set = (key: keyof AppDetails) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (key === 'name') {
      const slug = val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
      onChange({ ...details, name: val, slug: details.slug === '' ? slug : details.slug });
    } else {
      onChange({ ...details, [key]: val });
    }
  };
  const setSlug = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    onChange({ ...details, slug });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">App Details</h2>
        <p className="text-sm text-gray-500 mt-1">Name your app and configure its identity. This is what users will see.</p>
      </div>
      <div className="space-y-5 max-w-lg">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">App Name</Label>
          <Input
            value={details.name}
            onChange={set('name')}
            placeholder="e.g. City Hospital Staff Portal"
            className="rounded-xl border-gray-200 focus:border-indigo-400 focus:ring-indigo-400"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">App Slug</Label>
          <div className="flex items-center gap-0 rounded-xl border border-gray-200 overflow-hidden focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400 transition-all">
            <span className="px-3 py-2.5 text-xs text-gray-400 bg-gray-50 border-r border-gray-200 whitespace-nowrap select-none">
              app.qestron.io/workspace/
            </span>
            <input
              value={details.slug}
              onChange={setSlug}
              placeholder="staff-portal"
              className="flex-1 px-3 py-2.5 text-sm outline-none bg-white placeholder:text-gray-300 font-mono"
            />
          </div>
          <p className="text-[11px] text-gray-400">Lowercase letters, numbers and hyphens only</p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">Description</Label>
          <Textarea
            value={details.description}
            onChange={set('description')}
            placeholder="Briefly describe what this app does and who uses it"
            rows={3}
            className="rounded-xl border-gray-200 focus:border-indigo-400 focus:ring-indigo-400 resize-none"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">Brand Color</Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={details.brandColor}
              onChange={e => onChange({ ...details, brandColor: e.target.value })}
              className="h-10 w-10 rounded-xl border border-gray-200 cursor-pointer p-0.5 bg-white"
            />
            <Input
              value={details.brandColor}
              onChange={set('brandColor')}
              placeholder="#6366f1"
              className="font-mono rounded-xl border-gray-200 w-36"
              maxLength={7}
            />
            <div className="h-10 w-10 rounded-xl border border-gray-200 flex-shrink-0" style={{ backgroundColor: details.brandColor }} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">App Logo</Label>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer">
            <Upload className="h-6 w-6 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Click to upload logo</p>
            <p className="text-[11px] text-gray-400 mt-0.5">PNG, SVG — max 2MB</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Features & Roles ─────────────────────────────────────────────────

function Step3({
  template,
  features,
  roles,
  onFeaturesChange,
  onRolesChange,
}: {
  template: Template | undefined;
  features: string[];
  roles: string[];
  onFeaturesChange: (f: string[]) => void;
  onRolesChange: (r: string[]) => void;
}) {
  const [newRole, setNewRole] = useState('');

  const toggleFeature = (f: string) => {
    onFeaturesChange(features.includes(f) ? features.filter(x => x !== f) : [...features, f]);
  };

  const addRole = () => {
    const trimmed = newRole.trim();
    if (trimmed && !roles.includes(trimmed)) {
      onRolesChange([...roles, trimmed]);
      setNewRole('');
    }
  };

  const removeRole = (r: string) => onRolesChange(roles.filter(x => x !== r));

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">Features & Roles</h2>
        <p className="text-sm text-gray-500 mt-1">Select the features to enable and define user roles for this app.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Features */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Available Features</h3>
          <div className="space-y-2">
            {(template?.features ?? []).map(f => {
              const enabled = features.includes(f);
              return (
                <label
                  key={f}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                    enabled ? 'border-indigo-200 bg-indigo-50/60' : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    enabled ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                  }`}>
                    {enabled && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <input type="checkbox" checked={enabled} onChange={() => toggleFeature(f)} className="sr-only" />
                  <span className="text-sm text-gray-700">{f}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Roles */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">User Roles</h3>
          <p className="text-xs text-gray-400 mb-3">Define who can access this app and what they're called.</p>
          <div className="space-y-2 mb-4">
            {roles.map(r => (
              <div key={r} className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 bg-white">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-indigo-400" />
                  <span className="text-sm text-gray-700 font-medium">{r}</span>
                </div>
                <button
                  onClick={() => removeRole(r)}
                  className="h-7 w-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addRole()}
              placeholder="Add a role (e.g. Manager)"
              className="rounded-xl border-gray-200 focus:border-indigo-400 text-sm"
            />
            <Button
              variant="outline"
              onClick={addRole}
              className="flex items-center gap-1.5 rounded-xl flex-shrink-0"
            >
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 4: Review & Deploy ──────────────────────────────────────────────────

type ReviewProps = {
  template: Template | undefined;
  details: AppDetails;
  features: string[];
  roles: string[];
  onDeploy: () => void;
  deployed: boolean;
  deployedUrl: string;
  deployedToken: string;
};

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-gray-100 transition-colors"
    >
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-gray-400" />}
    </button>
  );
}

function Step4({ template, details, features, roles, onDeploy, deployed, deployedUrl, deployedToken }: ReviewProps) {
  if (deployed) {
    return (
      <div className="flex flex-col items-center text-center max-w-lg mx-auto py-4">
        <div className="h-20 w-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center mb-5">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your App is Ready! 🎉</h2>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          Share the URL and token below with your team or end-users. They can load the app by entering these credentials into the Qestron App.
        </p>

        <div className="w-full space-y-3 mb-6">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-left">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">App URL</p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-gray-900 break-all flex-1">{deployedUrl}</span>
              <CopyBtn text={deployedUrl} />
            </div>
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 px-4 py-4 text-left">
            <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wide mb-2">Access Token</p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-indigo-800 break-all flex-1">{deployedToken}</span>
              <CopyBtn text={deployedToken} />
            </div>
          </div>
        </div>

        {/* QR placeholder */}
        <div className="w-full rounded-2xl border-2 border-dashed border-gray-200 p-6 mb-6 flex flex-col items-center gap-2">
          <QrCode className="h-10 w-10 text-gray-300" />
          <p className="text-xs text-gray-400">QR Code for this app URL + token</p>
          <p className="text-[11px] text-gray-300">QR generation coming soon</p>
        </div>

        <Button
          className="w-full bg-gray-900 hover:bg-gray-800 text-white h-11 rounded-xl"
          asChild
        >
          <a href="/panel/apps" className="flex items-center gap-2 justify-center">
            Go to App Dashboard <ArrowRight className="h-4 w-4" />
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">Review & Deploy</h2>
        <p className="text-sm text-gray-500 mt-1">Check everything looks right before deploying your app.</p>
      </div>

      <div className="max-w-lg space-y-4 mb-8">
        {/* Summary card */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className={`h-2 w-full bg-gradient-to-r ${template?.gradient ?? 'from-indigo-500 to-indigo-600'}`} />
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-white flex-shrink-0 bg-gradient-to-br ${template?.gradient ?? 'from-indigo-500 to-indigo-600'}`}>
                {template?.icon}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{details.name || '—'}</p>
                <p className="text-xs text-gray-500 mt-0.5">{template?.name ?? 'Custom'} template</p>
              </div>
              <div className="ml-auto h-5 w-5 rounded-full border-2 border-gray-200 flex-shrink-0" style={{ backgroundColor: details.brandColor }} />
            </div>

            <div className="pt-3 border-t border-gray-100 space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span className="text-gray-400">App URL</span>
                <span className="font-mono text-gray-700 truncate max-w-[200px]">
                  app.qestron.io/workspace/{details.slug || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Description</span>
                <span className="text-gray-700 text-right max-w-[200px] truncate">{details.description || '—'}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-gray-400">Features</span>
                <span className="text-gray-700 text-right">{features.length} enabled</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-gray-400">Roles</span>
                <div className="flex gap-1 flex-wrap justify-end max-w-[200px]">
                  {roles.map(r => (
                    <span key={r} className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-medium">{r}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature list */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Enabled Features</p>
          <div className="flex flex-wrap gap-2">
            {features.length === 0 ? (
              <p className="text-xs text-gray-400">No features selected</p>
            ) : features.map(f => (
              <span key={f} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium">
                <Check className="h-3 w-3" /> {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      <Button
        onClick={onDeploy}
        disabled={!details.name || !details.slug}
        className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50"
      >
        <AppWindow className="h-4 w-4" /> Deploy App
      </Button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CreateAppPage() {
  const [step, setStep] = useState(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState('hospital');
  const [details, setDetails] = useState<AppDetails>({
    name: '',
    slug: '',
    description: '',
    brandColor: '#6366f1',
    logoUrl: '',
  });
  const [features, setFeatures] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>(['Admin', 'Staff']);
  const [deployed, setDeployed] = useState(false);
  const [deployedUrl] = useState('https://app.qestron.io/workspace/staff-portal');
  const [deployedToken] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6Im5ldy1hcHAiLCJ3b3Jrc3BhY2VJZCI6IndvcmtzcGFjZSJ9.generated-token-here');

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const handleTemplateSelect = (id: string) => {
    setSelectedTemplateId(id);
    const tpl = templates.find(t => t.id === id);
    if (tpl) {
      setFeatures(tpl.defaultFeatures);
      setRoles(tpl.defaultRoles);
    }
  };

  const canNext = () => {
    if (step === 1) return !!selectedTemplateId;
    if (step === 2) return !!details.name && !!details.slug;
    return true;
  };

  const next = () => {
    if (step === 1) {
      const tpl = templates.find(t => t.id === selectedTemplateId);
      if (tpl && features.length === 0) {
        setFeatures(tpl.defaultFeatures);
        setRoles(tpl.defaultRoles);
      }
    }
    setStep(s => Math.min(s + 1, 4));
  };
  const back = () => setStep(s => Math.max(s - 1, 1));

  const handleDeploy = () => setDeployed(true);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-800" asChild>
            <a href="/panel/apps">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to Apps
            </a>
          </Button>
          <div className="h-4 w-px bg-gray-200" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Create New App</h1>
            <p className="text-xs text-gray-500">Set up a branded app for your team or end-users</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm px-6 py-4 mb-6">
          <Stepper current={step} />
        </div>

        {/* Content */}
        <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm p-7 mb-6">
          {step === 1 && (
            <Step1 selected={selectedTemplateId} onSelect={handleTemplateSelect} />
          )}
          {step === 2 && (
            <Step2 details={details} onChange={setDetails} />
          )}
          {step === 3 && (
            <Step3
              template={selectedTemplate}
              features={features}
              roles={roles}
              onFeaturesChange={setFeatures}
              onRolesChange={setRoles}
            />
          )}
          {step === 4 && (
            <Step4
              template={selectedTemplate}
              details={details}
              features={features}
              roles={roles}
              onDeploy={handleDeploy}
              deployed={deployed}
              deployedUrl={deployedUrl}
              deployedToken={deployedToken}
            />
          )}
        </div>

        {/* Navigation */}
        {!deployed && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={back}
              disabled={step === 1}
              className="flex items-center gap-2 rounded-xl"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            {step < 4 ? (
              <Button
                onClick={next}
                disabled={!canNext()}
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl disabled:opacity-50"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
