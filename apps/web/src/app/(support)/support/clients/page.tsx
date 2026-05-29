'use client';

import { useState } from 'react';
import {
  Search,
  Building2,
  ChevronDown,
  X,
  AlertTriangle,
  ExternalLink,
  Shield,
  Users,
  IndianRupee,
  Calendar,
  Globe,
} from 'lucide-react';

type Plan = 'Starter' | 'Pro' | 'Enterprise';
type WorkspaceStatus = 'active' | 'suspended';

interface Workspace {
  id: string;
  name: string;
  owner: string;
  plan: Plan;
  created: string;
  domain: string | null;
  agents: number;
  revenue: number;
  status: WorkspaceStatus;
}

const mockWorkspaces: Workspace[] = [
  { id: '1', name: 'City Hospital', owner: 'admin@cityhospital.com', plan: 'Enterprise', created: '2023-06-15', domain: 'cityhospital.com', agents: 12, revenue: 29999, status: 'active' },
  { id: '2', name: 'Spice Garden', owner: 'owner@spicegarden.in', plan: 'Pro', created: '2023-09-20', domain: 'spicegarden.in', agents: 4, revenue: 4999, status: 'active' },
  { id: '3', name: 'Green Valley School', owner: 'it@greenvalley.edu', plan: 'Starter', created: '2024-01-05', domain: null, agents: 1, revenue: 999, status: 'active' },
  { id: '4', name: 'TechZone India', owner: 'cto@techzone.in', plan: 'Pro', created: '2023-11-12', domain: 'techzone.in', agents: 6, revenue: 4999, status: 'active' },
  { id: '5', name: 'Divya Retail', owner: 'dev@divyaretail.com', plan: 'Pro', created: '2024-02-18', domain: null, agents: 3, revenue: 4999, status: 'active' },
  { id: '6', name: 'MedCare Hospitals', owner: 'admin@medcare.in', plan: 'Enterprise', created: '2023-04-30', domain: 'medcare.in', agents: 18, revenue: 29999, status: 'active' },
  { id: '7', name: 'Priya Hospitals', owner: 'billing@priyahospitals.com', plan: 'Enterprise', created: '2022-12-01', domain: 'priyahospitals.com', agents: 15, revenue: 29999, status: 'suspended' },
  { id: '8', name: 'SunTech Pvt Ltd', owner: 'admin@suntech.co.in', plan: 'Starter', created: '2024-05-02', domain: null, agents: 1, revenue: 999, status: 'active' },
];

const PLAN_BADGE: Record<Plan, string> = {
  Starter: 'bg-gray-100 text-gray-600',
  Pro: 'bg-indigo-100 text-indigo-700',
  Enterprise: 'bg-violet-100 text-violet-700',
};

const STATUS_BADGE: Record<WorkspaceStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  suspended: 'bg-red-100 text-red-700',
};

const PLAN_LIMITS: Record<Plan, { chatbots: number; voiceAgents: number; apiCalls: string }> = {
  Starter: { chatbots: 1, voiceAgents: 0, apiCalls: '1,000/day' },
  Pro: { chatbots: 5, voiceAgents: 2, apiCalls: '5,000/day' },
  Enterprise: { chatbots: 999, voiceAgents: 10, apiCalls: 'Unlimited' },
};

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [workspaces, setWorkspaces] = useState<Workspace[]>(mockWorkspaces);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [editPlan, setEditPlan] = useState<Plan | ''>('');
  const [impersonateConfirm, setImpersonateConfirm] = useState(false);

  const filtered = workspaces.filter((w) => {
    if (search && !w.name.toLowerCase().includes(search.toLowerCase()) && !w.owner.toLowerCase().includes(search.toLowerCase())) return false;
    if (planFilter !== 'all' && w.plan !== planFilter) return false;
    return true;
  });

  const openSlideOver = (ws: Workspace) => {
    setSelectedWorkspace(ws);
    setEditPlan(ws.plan);
  };

  const handleUpdatePlan = () => {
    if (!selectedWorkspace || !editPlan) return;
    setWorkspaces((prev) => prev.map((w) => w.id === selectedWorkspace.id ? { ...w, plan: editPlan as Plan } : w));
    setSelectedWorkspace((prev) => prev ? { ...prev, plan: editPlan as Plan } : null);
  };

  const handleToggleStatus = () => {
    if (!selectedWorkspace) return;
    const newStatus: WorkspaceStatus = selectedWorkspace.status === 'active' ? 'suspended' : 'active';
    setWorkspaces((prev) => prev.map((w) => w.id === selectedWorkspace.id ? { ...w, status: newStatus } : w));
    setSelectedWorkspace((prev) => prev ? { ...prev, status: newStatus } : null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Client Workspaces</h1>
        <span className="text-sm text-gray-500">{filtered.length} workspaces</span>
      </div>

      {/* Search + filter */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            placeholder="Search workspaces..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <select
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
          >
            <option value="all">All Plans</option>
            <option value="Starter">Starter</option>
            <option value="Pro">Pro</option>
            <option value="Enterprise">Enterprise</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Workspace</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Owner</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Domain</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Agents</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Revenue</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((ws) => (
                <tr key={ws.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                        {ws.name[0]}
                      </div>
                      <span className="font-medium text-gray-900">{ws.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{ws.owner}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLAN_BADGE[ws.plan]}`}>{ws.plan}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{ws.created}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{ws.domain ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-center text-gray-700 text-sm font-medium">{ws.agents}</td>
                  <td className="px-4 py-3 text-right text-gray-800 text-sm font-semibold">
                    ₹{ws.revenue.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[ws.status]}`}>
                      {ws.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openSlideOver(ws)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over */}
      {selectedWorkspace && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelectedWorkspace(null)} />
          <div className="fixed right-0 top-0 h-full w-[420px] bg-white z-50 shadow-2xl overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700">
                  {selectedWorkspace.name[0]}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedWorkspace.name}</h3>
                  <p className="text-xs text-gray-400">{selectedWorkspace.owner}</p>
                </div>
              </div>
              <button onClick={() => setSelectedWorkspace(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Workspace config */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5" /> Workspace Config
                </h4>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                  {[
                    { label: 'Name', value: selectedWorkspace.name, icon: <Building2 className="w-3.5 h-3.5 text-gray-400" /> },
                    { label: 'Owner', value: selectedWorkspace.owner, icon: <Users className="w-3.5 h-3.5 text-gray-400" /> },
                    { label: 'Plan', value: selectedWorkspace.plan, icon: <IndianRupee className="w-3.5 h-3.5 text-gray-400" /> },
                    { label: 'Created', value: selectedWorkspace.created, icon: <Calendar className="w-3.5 h-3.5 text-gray-400" /> },
                    { label: 'Domain', value: selectedWorkspace.domain ?? 'Not configured', icon: <Globe className="w-3.5 h-3.5 text-gray-400" /> },
                  ].map(({ label, value, icon }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        {icon}
                        {label}
                      </div>
                      <span className="text-xs font-medium text-gray-800">{value}</span>
                    </div>
                  ))}
                  {/* Limits */}
                  <div className="border-t border-gray-200 pt-2.5 mt-1 space-y-1.5">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Plan Limits</p>
                    {Object.entries(PLAN_LIMITS[selectedWorkspace.plan]).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-medium text-gray-700">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Edit plan */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Edit Plan</h4>
                <div className="flex gap-2">
                  <select
                    className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={editPlan}
                    onChange={(e) => setEditPlan(e.target.value as Plan)}
                  >
                    <option value="Starter">Starter — ₹999/mo</option>
                    <option value="Pro">Pro — ₹4,999/mo</option>
                    <option value="Enterprise">Enterprise — ₹29,999/mo</option>
                  </select>
                  <button
                    onClick={handleUpdatePlan}
                    className="text-sm font-semibold px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    Update
                  </button>
                </div>
              </div>

              {/* Suspend/Activate toggle */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Account Status</h4>
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {selectedWorkspace.status === 'active' ? 'Account Active' : 'Account Suspended'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {selectedWorkspace.status === 'active' ? 'Workspace is live and accessible' : 'Workspace is locked'}
                    </p>
                  </div>
                  <button
                    onClick={handleToggleStatus}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                      selectedWorkspace.status === 'active'
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    }`}
                  >
                    {selectedWorkspace.status === 'active' ? 'Suspend' : 'Activate'}
                  </button>
                </div>
              </div>

              {/* Impersonate */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Admin Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button className="flex items-center justify-center gap-2 text-xs font-medium px-3 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-700">
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
                    View Workspace
                  </button>
                  <button
                    onClick={() => setImpersonateConfirm(true)}
                    className="flex items-center justify-center gap-2 text-xs font-medium px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors text-amber-700"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Impersonate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Impersonate modal */}
      {impersonateConfirm && selectedWorkspace && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Impersonate Login</h3>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              You will be logged into <strong>{selectedWorkspace.name}</strong> as admin.{' '}
              <span className="text-amber-700 font-medium">All actions will be logged.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setImpersonateConfirm(false)}
                className="flex-1 text-sm font-medium px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setImpersonateConfirm(false)}
                className="flex-1 text-sm font-semibold px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
              >
                Confirm & Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
