"use client";

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import {
  ArrowRight, Plus, Trash2, RotateCcw, Save, CheckCircle2,
  AlertTriangle, Loader2, ChevronDown, Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FieldMapping {
  id?: string;
  source_field: string;
  target_field: string;
  target_field_label?: string;
  is_required: boolean;
  is_default: boolean;
  transform: string;
}

interface SourceField {
  key: string;
  label: string;
  type: string;
}

interface FieldMappingEditorProps {
  integrationType: string;
  integrationLabel: string;
}

const TRANSFORMS = [
  { value: 'none', label: 'No transform' },
  { value: 'lowercase', label: 'Lowercase' },
  { value: 'uppercase', label: 'Uppercase' },
  { value: 'split_first', label: 'First word' },
  { value: 'split_last', label: 'Last word(s)' },
  { value: 'join_comma', label: 'Join with comma' },
];

export function FieldMappingEditor({ integrationType, integrationLabel }: FieldMappingEditorProps) {
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [sourceFields, setSourceFields] = useState<SourceField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [integrationType]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [mappingsRes, fieldsRes] = await Promise.all([
        apiFetch(`/api/integrations/${integrationType}/field-mappings`),
        apiFetch(`/api/integrations/field-mappings/source-fields`),
      ]);
      setMappings(mappingsRes.mappings || []);
      setSourceFields(fieldsRes.fields || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await apiFetch(`/api/integrations/${integrationType}/field-mappings`, {
        method: 'PUT',
        body: JSON.stringify({
          mappings: mappings.map(m => ({
            source_field: m.source_field,
            target_field: m.target_field,
            target_field_label: m.target_field_label,
            is_required: m.is_required,
            transform: m.transform,
          })),
        }),
      });
      setMappings(res.mappings || mappings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/integrations/${integrationType}/field-mappings/reset`, {
        method: 'POST',
      });
      setMappings(res.mappings || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function addMapping() {
    setMappings(prev => [
      ...prev,
      {
        source_field: '',
        target_field: '',
        target_field_label: '',
        is_required: false,
        is_default: false,
        transform: 'none',
      },
    ]);
    setExpandedRow(mappings.length);
  }

  function removeMapping(index: number) {
    setMappings(prev => prev.filter((_, i) => i !== index));
  }

  function updateMapping(index: number, field: string, value: any) {
    setMappings(prev =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  }

  const usedSourceFields = new Set(mappings.map(m => m.source_field));
  const availableSourceFields = sourceFields.filter(f => !usedSourceFields.has(f.key));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={18} className="animate-spin text-zinc-500" />
        <span className="ml-2 text-sm text-zinc-500">Loading field mappings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 size={16} className="text-zinc-400" />
          <h3 className="text-sm font-medium text-gray-900">Field Mapping</h3>
          <span className="text-xs text-zinc-500">Questron → {integrationLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleReset}
            variant="ghost"
            className="text-xs text-zinc-400 hover:text-gray-900 h-7 px-2"
          >
            <RotateCcw size={12} className="mr-1" />
            Reset Defaults
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "text-xs h-7 px-3",
              saved
                ? "bg-green-600 hover:bg-green-500 text-gray-900"
                : "bg-blue-600 hover:bg-blue-500 text-gray-900"
            )}
          >
            {saving ? (
              <><Loader2 size={12} className="mr-1 animate-spin" /> Saving...</>
            ) : saved ? (
              <><CheckCircle2 size={12} className="mr-1" /> Saved</>
            ) : (
              <><Save size={12} className="mr-1" /> Save Mappings</>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertTriangle size={14} className="text-red-400" />
          <span className="text-xs text-red-400">{error}</span>
        </div>
      )}

      {/* Column headers */}
      <div className="grid grid-cols-[1fr,32px,1fr,100px,40px] gap-2 px-2">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Questron Field</span>
        <span />
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">{integrationLabel} Field</span>
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Transform</span>
        <span />
      </div>

      {/* Mapping rows */}
      <div className="space-y-1.5">
        {mappings.map((mapping, idx) => (
          <div key={idx} className="group">
            <div className={cn(
              "grid grid-cols-[1fr,32px,1fr,100px,40px] gap-2 items-center rounded-lg px-2 py-2 transition-colors",
              mapping.is_required ? "bg-blue-500/5 border border-blue-500/10" : "bg-zinc-800/50 border border-gray-200 hover:border-gray-200"
            )}>
              {/* Source field */}
              <select
                value={mapping.source_field}
                onChange={(e) => updateMapping(idx, 'source_field', e.target.value)}
                disabled={mapping.is_required}
                className={cn(
                  "bg-white border border-zinc-700 rounded-md px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500 w-full",
                  mapping.is_required && "opacity-70 cursor-not-allowed"
                )}
              >
                <option value="">Select field...</option>
                {sourceFields.map(f => (
                  <option
                    key={f.key}
                    value={f.key}
                    disabled={usedSourceFields.has(f.key) && mapping.source_field !== f.key}
                  >
                    {f.label}
                  </option>
                ))}
              </select>

              {/* Arrow */}
              <div className="flex justify-center">
                <ArrowRight size={14} className="text-zinc-600" />
              </div>

              {/* Target field */}
              <input
                type="text"
                value={mapping.target_field}
                onChange={(e) => updateMapping(idx, 'target_field', e.target.value)}
                placeholder="CRM field key"
                disabled={mapping.is_required}
                className={cn(
                  "bg-white border border-zinc-700 rounded-md px-2 py-1.5 text-xs text-gray-900 placeholder-zinc-600 focus:outline-none focus:border-blue-500 w-full",
                  mapping.is_required && "opacity-70 cursor-not-allowed"
                )}
              />

              {/* Transform */}
              <select
                value={mapping.transform}
                onChange={(e) => updateMapping(idx, 'transform', e.target.value)}
                className="bg-white border border-zinc-700 rounded-md px-1.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
              >
                {TRANSFORMS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>

              {/* Delete */}
              {mapping.is_required ? (
                <div className="flex justify-center">
                  <span className="text-[9px] text-blue-400 font-semibold">REQ</span>
                </div>
              ) : (
                <button
                  onClick={() => removeMapping(idx)}
                  className="flex justify-center text-zinc-600 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add mapping button */}
      {availableSourceFields.length > 0 && (
        <button
          onClick={addMapping}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-blue-400 transition-colors px-2 py-1.5"
        >
          <Plus size={13} />
          Add field mapping
          <span className="text-zinc-600">({availableSourceFields.length} available)</span>
        </button>
      )}

      {/* Info */}
      <div className="text-[11px] text-zinc-600 px-2 space-y-1">
        <p>Required fields (marked REQ) cannot be removed. They ensure contact sync works correctly.</p>
        <p>Transform options modify the value before sending: e.g. &quot;First word&quot; extracts the first name from a full name.</p>
      </div>
    </div>
  );
}
