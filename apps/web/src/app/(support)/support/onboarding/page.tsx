'use client';

import { useState } from 'react';
import {
  Plus,
  ChevronUp,
  ChevronDown,
  Edit2,
  Trash2,
  X,
  Eye,
  CheckCircle,
  Link as LinkIcon,
  Zap,
  ListChecks,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  type: 'required' | 'optional';
  link: string | null;
  autoComplete?: string;
}

interface OnboardingFlow {
  id: string;
  name: string;
  autoTrigger: boolean;
  steps: OnboardingStep[];
}

const initialFlows: OnboardingFlow[] = [
  {
    id: '1',
    name: 'Default Onboarding',
    autoTrigger: true,
    steps: [
      { id: 's1', title: 'Connect WhatsApp', description: 'Link your WhatsApp Business number', type: 'required', link: '/panel/chatbot' },
      { id: 's2', title: 'Train your AI', description: 'Upload FAQs or website URL', type: 'required', link: '/panel/knowledge-base' },
      { id: 's3', title: 'Set up your first automation', description: 'Create a welcome message flow', type: 'optional', link: '/panel/flows' },
      { id: 's4', title: 'Go live!', description: 'Publish and start getting responses', type: 'required', link: '/panel/chatbot' },
    ],
  },
  {
    id: '2',
    name: 'E-commerce Setup',
    autoTrigger: false,
    steps: [
      { id: 's5', title: 'Connect your store', description: 'Add Shopify or native store', type: 'required', link: null },
      { id: 's6', title: 'Configure payments', description: 'Set up Razorpay', type: 'required', link: null },
      { id: 's7', title: 'Add your products', description: 'Import or add products manually', type: 'required', link: null },
    ],
  },
  {
    id: '3',
    name: 'Voice Agent Quickstart',
    autoTrigger: false,
    steps: [
      { id: 's8', title: 'Get a phone number', description: 'Claim or port a number', type: 'required', link: '/panel/numbers' },
      { id: 's9', title: 'Create voice agent', description: 'Configure your IVR and AI voice', type: 'required', link: '/panel/voice-agents' },
      { id: 's10', title: 'Test your flow', description: 'Call the number and test end-to-end', type: 'optional', link: null },
    ],
  },
];

const STEP_TYPE_BADGE: Record<'required' | 'optional', string> = {
  required: 'bg-red-100 text-red-700',
  optional: 'bg-gray-100 text-gray-500',
};

function generateId() {
  return `s-${Date.now()}`;
}

export default function OnboardingPage() {
  const [flows, setFlows] = useState<OnboardingFlow[]>(initialFlows);
  const [selectedFlowId, setSelectedFlowId] = useState<string>('1');
  const [editingStep, setEditingStep] = useState<OnboardingStep | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [createFlowOpen, setCreateFlowOpen] = useState(false);
  const [newFlowName, setNewFlowName] = useState('');

  const selectedFlow = flows.find((f) => f.id === selectedFlowId)!;

  const updateFlow = (updated: Partial<OnboardingFlow>) => {
    setFlows((prev) =>
      prev.map((f) => f.id === selectedFlowId ? { ...f, ...updated } : f)
    );
  };

  const moveStep = (stepId: string, dir: 'up' | 'down') => {
    const steps = [...selectedFlow.steps];
    const idx = steps.findIndex((s) => s.id === stepId);
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === steps.length - 1) return;
    const target = dir === 'up' ? idx - 1 : idx + 1;
    [steps[idx], steps[target]] = [steps[target], steps[idx]];
    updateFlow({ steps });
  };

  const deleteStep = (stepId: string) => {
    updateFlow({ steps: selectedFlow.steps.filter((s) => s.id !== stepId) });
  };

  const saveStep = (step: OnboardingStep) => {
    const exists = selectedFlow.steps.find((s) => s.id === step.id);
    if (exists) {
      updateFlow({ steps: selectedFlow.steps.map((s) => s.id === step.id ? step : s) });
    } else {
      updateFlow({ steps: [...selectedFlow.steps, step] });
    }
    setEditingStep(null);
  };

  const handleAddStep = () => {
    setEditingStep({ id: generateId(), title: '', description: '', type: 'required', link: null });
  };

  const handleCreateFlow = () => {
    if (!newFlowName.trim()) return;
    const newFlow: OnboardingFlow = {
      id: `f-${Date.now()}`,
      name: newFlowName.trim(),
      autoTrigger: false,
      steps: [],
    };
    setFlows((prev) => [...prev, newFlow]);
    setSelectedFlowId(newFlow.id);
    setNewFlowName('');
    setCreateFlowOpen(false);
  };

  const deleteFlow = (flowId: string) => {
    const remaining = flows.filter((f) => f.id !== flowId);
    setFlows(remaining);
    if (selectedFlowId === flowId) setSelectedFlowId(remaining[0]?.id ?? '');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Onboarding Flows</h1>
        <button
          onClick={() => setCreateFlowOpen(true)}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Flow
        </button>
      </div>

      <div className="flex gap-5 h-[calc(100vh-160px)] overflow-hidden">
        {/* Flows list sidebar */}
        <div className="w-[240px] flex-shrink-0 flex flex-col gap-2">
          {flows.map((flow) => (
            <button
              key={flow.id}
              onClick={() => setSelectedFlowId(flow.id)}
              className={`text-left px-4 py-3 rounded-xl border transition-colors ${
                selectedFlowId === flow.id
                  ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className={`text-sm font-semibold ${selectedFlowId === flow.id ? 'text-indigo-700' : 'text-gray-800'}`}>
                  {flow.name}
                </p>
                {flow.autoTrigger && (
                  <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">{flow.steps.length} steps</p>
              {flow.autoTrigger && (
                <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                  Auto-trigger
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Flow editor */}
        {selectedFlow && (
          <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between flex-wrap gap-3">
              <div className="flex-1 min-w-0">
                <input
                  className="text-lg font-bold text-gray-900 bg-transparent border-0 border-b-2 border-dashed border-gray-200 focus:border-indigo-400 focus:outline-none w-full pb-0.5"
                  value={selectedFlow.name}
                  onChange={(e) => updateFlow({ name: e.target.value })}
                />
                <p className="text-xs text-gray-400 mt-1">{selectedFlow.steps.length} steps in this flow</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Auto-trigger toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Auto-trigger</span>
                  <button
                    onClick={() => updateFlow({ autoTrigger: !selectedFlow.autoTrigger })}
                    className="transition-colors"
                  >
                    {selectedFlow.autoTrigger ? (
                      <ToggleRight className="w-8 h-8 text-indigo-600" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-300" />
                    )}
                  </button>
                </div>
                <button
                  onClick={() => setPreviewOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview Flow
                </button>
                <button
                  onClick={() => deleteFlow(selectedFlow.id)}
                  className="text-xs text-red-500 hover:text-red-700 p-1"
                  title="Delete flow"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Steps list */}
            <div className="p-6 space-y-3">
              {selectedFlow.steps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ListChecks className="w-10 h-10 text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400 mb-1">No steps yet</p>
                  <p className="text-xs text-gray-300">Add your first onboarding step below</p>
                </div>
              ) : (
                selectedFlow.steps.map((step, idx) => (
                  <div
                    key={step.id}
                    className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3.5 border border-gray-100"
                  >
                    {/* Order controls */}
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      <button
                        onClick={() => moveStep(step.id, 'up')}
                        disabled={idx === 0}
                        className="text-gray-300 hover:text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveStep(step.id, 'down')}
                        disabled={idx === selectedFlow.steps.length - 1}
                        className="text-gray-300 hover:text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Step icon */}
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0 mt-1 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-gray-400">{idx + 1}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-800">{step.title}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize ${STEP_TYPE_BADGE[step.type]}`}>
                          {step.type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                      {step.link && (
                        <div className="flex items-center gap-1 mt-1">
                          <LinkIcon className="w-3 h-3 text-indigo-400" />
                          <span className="text-[11px] text-indigo-500">{step.link}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => setEditingStep({ ...step })}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteStep(step.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}

              <button
                onClick={handleAddStep}
                className="w-full flex items-center justify-center gap-2 text-sm font-medium px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Step
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Step dialog */}
      {editingStep && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">
                {selectedFlow.steps.find((s) => s.id === editingStep.id) ? 'Edit Step' : 'Add Step'}
              </h3>
              <button onClick={() => setEditingStep(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Step Title *</label>
                <input
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="e.g. Connect WhatsApp"
                  value={editingStep.title}
                  onChange={(e) => setEditingStep({ ...editingStep, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
                <textarea
                  rows={2}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  placeholder="What should the user do in this step?"
                  value={editingStep.description}
                  onChange={(e) => setEditingStep({ ...editingStep, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Type</label>
                <select
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={editingStep.type}
                  onChange={(e) => setEditingStep({ ...editingStep, type: e.target.value as 'required' | 'optional' })}
                >
                  <option value="required">Required</option>
                  <option value="optional">Optional</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Link URL (optional)</label>
                <input
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="e.g. /panel/chatbot"
                  value={editingStep.link ?? ''}
                  onChange={(e) => setEditingStep({ ...editingStep, link: e.target.value || null })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Auto-complete Condition (optional)</label>
                <input
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="e.g. whatsapp_connected = true"
                  value={editingStep.autoComplete ?? ''}
                  onChange={(e) => setEditingStep({ ...editingStep, autoComplete: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setEditingStep(null)}
                  className="flex-1 text-sm font-medium px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveStep(editingStep)}
                  disabled={!editingStep.title.trim()}
                  className="flex-1 text-sm font-semibold px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40"
                >
                  Save Step
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {previewOpen && selectedFlow && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Preview: {selectedFlow.name}</h3>
              <button onClick={() => setPreviewOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-xs text-gray-400 mb-4">This is how your clients will see the onboarding checklist.</p>
              <div className="space-y-3">
                {selectedFlow.steps.map((step, idx) => (
                  <div key={step.id} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5 flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-gray-200" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-800">{step.title}</p>
                        {step.type === 'optional' && (
                          <span className="text-[10px] text-gray-400">(optional)</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="w-full mt-6 text-sm font-medium px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create flow modal */}
      {createFlowOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Create New Flow</h3>
              <button onClick={() => setCreateFlowOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Flow Name *</label>
                <input
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="e.g. Healthcare Onboarding"
                  value={newFlowName}
                  onChange={(e) => setNewFlowName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFlow()}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setCreateFlowOpen(false)}
                  className="flex-1 text-sm font-medium px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFlow}
                  disabled={!newFlowName.trim()}
                  className="flex-1 text-sm font-semibold px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
