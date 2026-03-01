"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { apiFetch } from '@/lib/api';
import {
  MessageSquare, Phone, Instagram, Facebook, Mail, Globe,
  Save, ChevronDown, Clock, Shield, Zap, AlertTriangle,
  Bot, UserCheck, Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ChannelType = 'whatsapp' | 'instagram' | 'messenger' | 'email' | 'web';

interface ChannelSettings {
  id: string;
  workspace_id: string;
  channel_type: ChannelType;
  auto_reply: boolean;
  tone: string;
  reply_delay_seconds: number;
  business_hours_only: boolean;
  timezone: string;
  business_hours: Record<string, any>;
  escalation_rules: {
    on_low_confidence: boolean;
    on_angry_sentiment: boolean;
    on_keyword: string[];
    confidence_threshold: number;
    escalate_to: string;
  };
  fallback_message: string;
  out_of_hours_message: string;
  welcome_message: string;
  max_reply_length: number;
}

const CHANNELS: { id: ChannelType; label: string; icon: any; color: string }[] = [
  { id: 'whatsapp', label: 'WhatsApp', icon: Phone, color: 'text-green-400' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-400' },
  { id: 'messenger', label: 'Messenger', icon: Facebook, color: 'text-blue-400' },
  { id: 'email', label: 'Email', icon: Mail, color: 'text-yellow-400' },
  { id: 'web', label: 'Web Widget', icon: Globe, color: 'text-purple-400' },
];

const TONES = [
  { value: 'friendly', label: 'Friendly', desc: 'Warm and approachable' },
  { value: 'professional', label: 'Professional', desc: 'Business-appropriate' },
  { value: 'warm', label: 'Warm', desc: 'Empathetic and caring' },
  { value: 'casual', label: 'Casual', desc: 'Relaxed and natural' },
  { value: 'formal', label: 'Formal', desc: 'Corporate and proper' },
];

export default function ChannelsSettingsPage() {
  const router = useRouter();
  const [activeChannel, setActiveChannel] = useState<ChannelType>('whatsapp');
  const [settings, setSettings] = useState<Record<string, ChannelSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');

  const loadSettings = useCallback(async () => {
    try {
      const res = await apiFetch('/api/channels/settings');
      const map: Record<string, ChannelSettings> = {};
      for (const s of res.data || []) {
        map[s.channel_type] = s;
      }
      setSettings(map);
    } catch (e) {
      console.error('Failed to load channel settings:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const current = settings[activeChannel];

  const updateField = (field: string, value: any) => {
    if (!current) return;
    setSettings(prev => ({
      ...prev,
      [activeChannel]: { ...prev[activeChannel], [field]: value },
    }));
    setSaved(false);
  };

  const updateEscalationRule = (field: string, value: any) => {
    if (!current) return;
    setSettings(prev => ({
      ...prev,
      [activeChannel]: {
        ...prev[activeChannel],
        escalation_rules: { ...prev[activeChannel].escalation_rules, [field]: value },
      },
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!current) return;
    setSaving(true);
    try {
      await apiFetch(`/api/channels/${activeChannel}/settings`, {
        method: 'PUT',
        body: JSON.stringify({
          auto_reply: current.auto_reply,
          tone: current.tone,
          reply_delay_seconds: current.reply_delay_seconds,
          business_hours_only: current.business_hours_only,
          timezone: current.timezone,
          business_hours: current.business_hours,
          escalation_rules: current.escalation_rules,
          fallback_message: current.fallback_message,
          out_of_hours_message: current.out_of_hours_message,
          welcome_message: current.welcome_message,
          max_reply_length: current.max_reply_length,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('Failed to save:', e);
    } finally {
      setSaving(false);
    }
  };

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (!kw || !current) return;
    const existing = current.escalation_rules.on_keyword || [];
    if (!existing.includes(kw)) {
      updateEscalationRule('on_keyword', [...existing, kw]);
    }
    setKeywordInput('');
  };

  const removeKeyword = (kw: string) => {
    if (!current) return;
    updateEscalationRule('on_keyword', (current.escalation_rules.on_keyword || []).filter((k: string) => k !== kw));
  };

  const handleSidebarNav = (tab: string) => {
    const routes: Record<string, string> = {
      'Email': '/panel/settings/email',
      'Facebook': '/panel/settings/facebook',
      'Instagram': '/panel/settings/instagram',
      'WhatsApp': '/panel/settings/whatsapp',
      'Account': '/panel/settings/account',
      'Notifications': '/panel/settings/notifications',
      'Operating hours': '/panel/settings/operating-hours',
      'Macros': '/panel/settings/macros',
      'Workflows': '/panel/settings/workflows',
    };
    if (tab === 'Channels' || tab === 'Auto-Reply') return;
    if (routes[tab]) router.push(routes[tab]);
    else router.push('/panel/settings');
  };

  return (
    <div className="flex min-h-screen bg-[#0f1115] overflow-hidden h-screen">
      <div className="h-full overflow-y-auto pt-8 pl-8 pb-8">
        <SettingsSidebar activeTab="Channels" onTabChange={handleSidebarNav} />
      </div>

      <div className="flex-1 overflow-y-auto h-full p-8 relative custom-scrollbar">
        <div className="max-w-[1000px] animate-in fade-in slide-in-from-bottom-2 duration-300">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Channel Auto-Reply Settings</h1>
              <p className="text-zinc-400 text-sm">Configure how the AI chatbot responds on each channel</p>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || saved}
              className={cn(
                "px-6 rounded-lg flex items-center gap-2",
                saved ? "bg-green-600 hover:bg-green-600" : "bg-blue-600 hover:bg-blue-700"
              )}
            >
              <Save size={16} />
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
            </Button>
          </div>

          {/* Channel Tabs */}
          <div className="flex items-center gap-2 mb-8 border-b border-white/5 pb-0">
            {CHANNELS.map(ch => {
              const Icon = ch.icon;
              const isActive = activeChannel === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannel(ch.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
                    isActive
                      ? "text-white border-blue-500"
                      : "text-zinc-500 border-transparent hover:text-zinc-300"
                  )}
                >
                  <Icon size={16} className={isActive ? ch.color : ''} />
                  {ch.label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : current ? (
            <div className="space-y-6">

              {/* ─── Auto-Reply Toggle ─── */}
              <div className="bg-[#18181b] border border-white/5 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bot size={20} className="text-blue-400" />
                    <div>
                      <h3 className="text-white font-medium">Auto-Reply</h3>
                      <p className="text-zinc-500 text-sm">AI will automatically respond to incoming messages on this channel</p>
                    </div>
                  </div>
                  <Switch
                    checked={current.auto_reply}
                    onCheckedChange={(v) => updateField('auto_reply', v)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
              </div>

              {current.auto_reply && (
                <>
                  {/* ─── Tone ─── */}
                  <div className="bg-[#18181b] border border-white/5 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Settings2 size={18} className="text-purple-400" />
                      <h3 className="text-white font-medium">Response Tone</h3>
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                      {TONES.map(t => (
                        <button
                          key={t.value}
                          onClick={() => updateField('tone', t.value)}
                          className={cn(
                            "p-3 rounded-lg border text-left transition-all",
                            current.tone === t.value
                              ? "border-blue-500 bg-blue-500/10"
                              : "border-white/5 hover:border-white/20 bg-[#0f1115]"
                          )}
                        >
                          <span className="text-sm font-medium text-white">{t.label}</span>
                          <p className="text-xs text-zinc-500 mt-1">{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ─── Timing ─── */}
                  <div className="bg-[#18181b] border border-white/5 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Clock size={18} className="text-yellow-400" />
                      <h3 className="text-white font-medium">Timing & Hours</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm text-zinc-400 mb-2 block">Reply Delay (seconds)</label>
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={current.reply_delay_seconds}
                          onChange={(e) => updateField('reply_delay_seconds', parseInt(e.target.value) || 0)}
                          className="w-full bg-[#0f1115] border border-zinc-800 rounded-md py-2 px-3 text-white text-sm focus:border-blue-500 focus:outline-none"
                        />
                        <p className="text-xs text-zinc-600 mt-1">Add a delay to feel more human-like</p>
                      </div>

                      <div>
                        <label className="text-sm text-zinc-400 mb-2 block">Max Reply Length</label>
                        <input
                          type="number"
                          min={100}
                          max={100000}
                          value={current.max_reply_length}
                          onChange={(e) => updateField('max_reply_length', parseInt(e.target.value) || 500)}
                          className="w-full bg-[#0f1115] border border-zinc-800 rounded-md py-2 px-3 text-white text-sm focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                      <div>
                        <span className="text-white text-sm font-medium">Business Hours Only</span>
                        <p className="text-zinc-500 text-xs">Only auto-reply during business hours</p>
                      </div>
                      <Switch
                        checked={current.business_hours_only}
                        onCheckedChange={(v) => updateField('business_hours_only', v)}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </div>

                    {current.business_hours_only && (
                      <div className="mt-4">
                        <label className="text-sm text-zinc-400 mb-2 block">Timezone</label>
                        <div className="relative">
                          <select
                            value={current.timezone}
                            onChange={(e) => updateField('timezone', e.target.value)}
                            className="w-full bg-[#0f1115] border border-zinc-800 rounded-md py-2 pl-3 pr-8 text-sm text-white focus:border-blue-500 focus:outline-none appearance-none cursor-pointer"
                          >
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">Eastern Time</option>
                            <option value="America/Chicago">Central Time</option>
                            <option value="America/Denver">Mountain Time</option>
                            <option value="America/Los_Angeles">Pacific Time</option>
                            <option value="Europe/London">London</option>
                            <option value="Europe/Berlin">Berlin</option>
                            <option value="Asia/Kolkata">India (IST)</option>
                            <option value="Asia/Tokyo">Tokyo</option>
                            <option value="Australia/Sydney">Sydney</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ─── Escalation Rules ─── */}
                  <div className="bg-[#18181b] border border-white/5 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Shield size={18} className="text-red-400" />
                      <h3 className="text-white font-medium">Escalation Rules</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-white text-sm">Escalate on low AI confidence</span>
                          <p className="text-zinc-500 text-xs">Hand off to agent when AI isn&apos;t sure</p>
                        </div>
                        <Switch
                          checked={current.escalation_rules.on_low_confidence}
                          onCheckedChange={(v) => updateEscalationRule('on_low_confidence', v)}
                          className="data-[state=checked]:bg-blue-600"
                        />
                      </div>

                      {current.escalation_rules.on_low_confidence && (
                        <div className="pl-4 border-l-2 border-blue-500/30">
                          <label className="text-sm text-zinc-400 mb-2 block">Confidence Threshold (%)</label>
                          <input
                            type="number"
                            min={10}
                            max={99}
                            value={Math.round(current.escalation_rules.confidence_threshold * 100)}
                            onChange={(e) => updateEscalationRule('confidence_threshold', (parseInt(e.target.value) || 75) / 100)}
                            className="w-32 bg-[#0f1115] border border-zinc-800 rounded-md py-2 px-3 text-white text-sm focus:border-blue-500 focus:outline-none"
                          />
                          <p className="text-xs text-zinc-600 mt-1">
                            Below this threshold, the AI will escalate to a human agent
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <div>
                          <span className="text-white text-sm">Escalate on angry sentiment</span>
                          <p className="text-zinc-500 text-xs">Detect frustration and route to human</p>
                        </div>
                        <Switch
                          checked={current.escalation_rules.on_angry_sentiment}
                          onCheckedChange={(v) => updateEscalationRule('on_angry_sentiment', v)}
                          className="data-[state=checked]:bg-blue-600"
                        />
                      </div>

                      <div className="pt-3 border-t border-white/5">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-white text-sm">Escalation Keywords</span>
                            <p className="text-zinc-500 text-xs">When visitor says these words, escalate immediately</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mb-3">
                          <input
                            type="text"
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                            placeholder="Type a keyword and press Enter"
                            className="flex-1 bg-[#0f1115] border border-zinc-800 rounded-md py-2 px-3 text-white text-sm focus:border-blue-500 focus:outline-none placeholder:text-zinc-600"
                          />
                          <Button onClick={addKeyword} className="bg-zinc-800 hover:bg-zinc-700 text-sm px-4">
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(current.escalation_rules.on_keyword || []).map((kw: string) => (
                            <span
                              key={kw}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full text-xs"
                            >
                              {kw}
                              <button onClick={() => removeKeyword(kw)} className="ml-1 text-zinc-500 hover:text-red-400 text-sm">&times;</button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ─── Messages ─── */}
                  <div className="bg-[#18181b] border border-white/5 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <MessageSquare size={18} className="text-green-400" />
                      <h3 className="text-white font-medium">Auto-Reply Messages</h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-zinc-400 mb-2 block">Fallback Message</label>
                        <textarea
                          value={current.fallback_message}
                          onChange={(e) => updateField('fallback_message', e.target.value)}
                          rows={2}
                          className="w-full bg-[#0f1115] border border-zinc-800 rounded-md py-2 px-3 text-white text-sm focus:border-blue-500 focus:outline-none resize-none"
                          placeholder="Message sent when AI can't answer confidently"
                        />
                        <p className="text-xs text-zinc-600 mt-1">Sent when AI confidence is too low or escalation is triggered</p>
                      </div>

                      <div>
                        <label className="text-sm text-zinc-400 mb-2 block">Out-of-Hours Message</label>
                        <textarea
                          value={current.out_of_hours_message}
                          onChange={(e) => updateField('out_of_hours_message', e.target.value)}
                          rows={2}
                          className="w-full bg-[#0f1115] border border-zinc-800 rounded-md py-2 px-3 text-white text-sm focus:border-blue-500 focus:outline-none resize-none"
                          placeholder="Message sent outside business hours"
                        />
                      </div>

                      <div>
                        <label className="text-sm text-zinc-400 mb-2 block">Welcome Message</label>
                        <textarea
                          value={current.welcome_message}
                          onChange={(e) => updateField('welcome_message', e.target.value)}
                          rows={2}
                          className="w-full bg-[#0f1115] border border-zinc-800 rounded-md py-2 px-3 text-white text-sm focus:border-blue-500 focus:outline-none resize-none"
                          placeholder="First message sent to new visitors"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-zinc-500">
              No settings found for this channel. Save to create defaults.
            </div>
          )}
        </div>

        <Button className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-900/20 flex items-center justify-center p-0 z-50">
          <MessageSquare className="text-white" size={24} />
        </Button>
      </div>
    </div>
  );
}
