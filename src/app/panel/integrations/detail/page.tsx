"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { IntegrationSyncDashboard } from '@/components/integrations/IntegrationSyncDashboard';
import { IntegrationConnectModal } from '@/components/integrations/IntegrationConnectModal';
import { FieldMappingEditor } from '@/components/integrations/FieldMappingEditor';
import { integrationsApi, oauthApi } from '@/lib/api';
import { getIntegrationMeta, TAG_COLORS } from '@/lib/integration-metadata';
import {
  ArrowLeft, Settings, BarChart3, Link2, Unlink, Loader2, CheckCircle,
  XCircle, RefreshCw, Zap, ExternalLink, ChevronDown, ChevronRight, HelpCircle,
  Sparkles, ListChecks, BookOpen, Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Category mapping
const CATEGORY_MAP: Record<string, 'crm' | 'marketing' | 'ecommerce' | 'support' | 'analytics' | 'other'> = {
  hubspot: 'crm', salesforce: 'crm', pipedrive: 'crm', zoho: 'crm',
  'agile-crm': 'crm', 'zendesk-sell': 'crm',
  mailchimp: 'marketing', klaviyo: 'marketing', activecampaign: 'marketing',
  omnisend: 'marketing', mailerlite: 'marketing', brevo: 'marketing',
  shopify: 'ecommerce', woocommerce: 'ecommerce', bigcommerce: 'ecommerce',
  'adobe-commerce': 'ecommerce', prestashop: 'ecommerce', wordpress: 'ecommerce',
  zendesk: 'support', judgeme: 'support',
  'google-analytics': 'analytics', 'google-tag-manager': 'analytics',
  zapier: 'other', slack: 'other',
  facebook: 'other', email: 'other', instagram: 'other', whatsapp: 'other',
};

const INTEGRATION_NAMES: Record<string, string> = {
  hubspot: 'HubSpot', salesforce: 'Salesforce', pipedrive: 'Pipedrive', zoho: 'Zoho CRM',
  'agile-crm': 'Agile CRM', 'zendesk-sell': 'Zendesk Sell',
  mailchimp: 'Mailchimp', klaviyo: 'Klaviyo', activecampaign: 'ActiveCampaign',
  omnisend: 'Omnisend', mailerlite: 'MailerLite', brevo: 'Brevo',
  shopify: 'Shopify', woocommerce: 'WooCommerce', bigcommerce: 'BigCommerce',
  'adobe-commerce': 'Adobe Commerce', prestashop: 'PrestaShop', wordpress: 'WordPress',
  zendesk: 'Zendesk', judgeme: 'Judge.me',
  'google-analytics': 'Google Analytics', 'google-tag-manager': 'Google Tag Manager',
  zapier: 'Zapier', slack: 'Slack',
  facebook: 'Facebook', email: 'Email', instagram: 'Instagram', whatsapp: 'WhatsApp',
};

type TabType = 'overview' | 'settings' | 'sync';

export default function IntegrationDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const integrationId = searchParams.get('type') || '';

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [connected, setConnected] = useState(false);
  const [integration, setIntegration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [configValues, setConfigValues] = useState<Record<string, any>>({});
  const [savingConfig, setSavingConfig] = useState(false);
  const [startingOAuth, setStartingOAuth] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const backendType = integrationId.replace(/-/g, '_');
  const category = CATEGORY_MAP[integrationId] || 'other';
  const name = INTEGRATION_NAMES[integrationId] || integrationId;
  const meta = getIntegrationMeta(integrationId);

  const OAUTH_TYPES = ['hubspot', 'salesforce', 'pipedrive'];
  const supportsOAuth = OAUTH_TYPES.includes(backendType);

  const loadIntegration = useCallback(async () => {
    setLoading(true);
    try {
      const res = await integrationsApi.get(backendType as any);
      setConnected(res.connected);
      setIntegration(res.integration);
      if (res.integration?.config) {
        setConfigValues(res.integration.config);
      }
    } catch {
      // keep defaults
    }
    setLoading(false);
  }, [backendType]);

  useEffect(() => {
    if (integrationId) loadIntegration();
  }, [integrationId, loadIntegration]);

  const handleDisconnect = async () => {
    if (!confirm(`Are you sure you want to disconnect ${name}?`)) return;
    setDisconnecting(true);
    try {
      await integrationsApi.disconnect(backendType as any);
      setConnected(false);
      setIntegration(null);
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
    setDisconnecting(false);
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      await integrationsApi.updateConfig(backendType as any, configValues);
    } catch (err) {
      console.error('Failed to save config:', err);
    }
    setSavingConfig(false);
  };

  if (!integrationId) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500 min-h-screen bg-[#f8fafc]">
        No integration selected.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] overflow-y-auto h-screen">
      {/* ─── Hero Section ─── */}
      <div className="bg-gradient-to-b from-zinc-900/80 to-[#f8fafc] border-b border-zinc-800/50">
        <div className="max-w-5xl mx-auto px-8 pt-6 pb-8">
          {/* Back nav */}
          <Link href="/panel/integrations" className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-gray-900 text-sm transition mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Integrations
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-5">
              {/* Brand initial badge */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-2xl font-bold text-gray-900 shrink-0 shadow-lg shadow-blue-500/20">
                {name.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{meta?.headline || `${name} Integration`}</h1>
                <p className="text-zinc-400 text-sm max-w-2xl">{meta?.subtitle || `Connect Questron with ${name}.`}</p>
                {/* Tags */}
                {meta?.tags && meta.tags.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {meta.tags.map(tag => (
                      <span key={tag} className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${TAG_COLORS[tag] || 'bg-zinc-700 text-zinc-300'}`}>
                        {tag}
                      </span>
                    ))}
                    {connected && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Connected
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {connected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                >
                  {disconnecting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Unlink className="w-4 h-4 mr-1" />}
                  Disconnect
                </Button>
              ) : (
                <>
                  {supportsOAuth && (
                    <Button
                      size="sm"
                      onClick={async () => {
                        setStartingOAuth(true);
                        try {
                          const res = await oauthApi.authorize(backendType);
                          if (res.authorizeUrl) {
                            window.location.href = res.authorizeUrl;
                          }
                        } catch (err) {
                          console.error('OAuth start failed:', err);
                        }
                        setStartingOAuth(false);
                      }}
                      disabled={startingOAuth}
                      className="bg-blue-600 hover:bg-blue-700 text-gray-900"
                    >
                      {startingOAuth ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <ExternalLink className="w-4 h-4 mr-1" />}
                      Connect with OAuth
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={supportsOAuth ? 'outline' : 'default'}
                    onClick={() => setShowConnectModal(true)}
                    className={supportsOAuth ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'bg-blue-600 hover:bg-blue-700 text-gray-900'}
                  >
                    <Link2 className="w-4 h-4 mr-1" />
                    {supportsOAuth ? 'Connect with API Key' : 'Connect'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div className="max-w-5xl mx-auto px-8">
        <div className="flex gap-1 mt-6 mb-6 bg-white/50 rounded-lg p-1 w-fit">
          {(['overview', 'sync', 'settings'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === tab
                ? 'bg-zinc-800 text-gray-900'
                : 'text-zinc-500 hover:text-zinc-300'
                }`}
            >
              {tab === 'overview' && <BookOpen className="w-4 h-4 inline mr-1.5" />}
              {tab === 'sync' && <RefreshCw className="w-4 h-4 inline mr-1.5" />}
              {tab === 'settings' && <Settings className="w-4 h-4 inline mr-1.5" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ─── Overview Tab ─── */}
        {activeTab === 'overview' && (
          <div className="space-y-8 pb-12">
            {/* Not connected banner */}
            {!connected && (
              <div className="p-4 rounded-xl bg-white/50 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-zinc-500" />
                  <div>
                    <p className="text-zinc-300 text-sm font-medium">{name} is not connected</p>
                    <p className="text-zinc-500 text-xs">Connect your {name} account to start syncing data.</p>
                  </div>
                </div>
                {integrationId === 'shopify' ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      const shop = prompt('Enter your Shopify store domain (e.g. my-store.myshopify.com):');
                      if (!shop) return;
                      const domain = shop.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
                      const finalDomain = domain.includes('.myshopify.com') ? domain : `${domain}.myshopify.com`;

                      fetch(`/api/proxy/api/shopify/install?shop=${encodeURIComponent(finalDomain)}`)
                        .then(res => res.json())
                        .then(data => {
                          if (data.authorizeUrl) {
                            window.location.href = data.authorizeUrl;
                          } else {
                            alert(data.error || 'Failed to generate install URL');
                          }
                        })
                        .catch(err => {
                          console.error(err);
                          alert('Failed to connect to Shopify');
                        });
                    }}
                    className="bg-green-600 hover:bg-green-500 text-gray-900"
                  >
                    Connect Now
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setShowConnectModal(true)} className="bg-blue-600 hover:bg-blue-700 text-gray-900">
                    Connect Now
                  </Button>
                )}
              </div>
            )}

            {/* Overview & Key Features */}
            {meta && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Overview text */}
                <div className="lg:col-span-3 bg-white/50 border border-zinc-800 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-400" /> Overview
                  </h2>
                  <p className="text-zinc-400 text-sm leading-relaxed">{meta.overviewText}</p>
                </div>

                {/* Key Features */}
                <div className="lg:col-span-2 bg-white/50 border border-zinc-800 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-400" /> Key Features
                  </h2>
                  <ul className="space-y-2.5">
                    {meta.keyFeatures.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-400">
                        <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Setup Steps */}
            {meta && meta.setupSteps.length > 0 && (
              <div className="bg-white/50 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-blue-400" /> How to Set Up
                </h2>
                <div className="space-y-3">
                  {meta.setupSteps.map((step, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-sm font-bold shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-zinc-400 text-sm pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sync Dashboard (when connected) */}
            {connected && (
              <IntegrationSyncDashboard
                integrationType={integrationId}
                integrationName={name}
                category={category}
                onBack={() => { }}
              />
            )}

            {/* GA4 / GTM — Tracked Events Table */}
            {(integrationId === 'google-analytics' || integrationId === 'google-tag-manager') && (
              <div className="bg-white/50 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-400" /> Tracked Events
                </h2>
                <p className="text-zinc-500 text-sm mb-4">
                  These events are automatically sent to {integrationId === 'google-analytics' ? 'Google Analytics' : 'your GTM dataLayer'} when visitors interact with the Questron widget.
                </p>
                <div className="border border-zinc-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-zinc-800/50">
                        <th className="px-4 py-2.5 text-[11px] text-zinc-400 uppercase font-semibold tracking-wider">Event Name</th>
                        <th className="px-4 py-2.5 text-[11px] text-zinc-400 uppercase font-semibold tracking-wider">Triggered When</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {[
                        { event: 'questron_widget_opened', desc: 'Visitor opens the chat widget' },
                        { event: 'questron_widget_closed', desc: 'Visitor closes the chat widget' },
                        { event: 'questron_conversation_started', desc: 'Visitor sends their first message' },
                        { event: 'questron_message_sent', desc: 'Any message is sent by the visitor' },
                        { event: 'questron_message_received', desc: 'Agent or AI sends a reply' },
                        { event: 'questron_conversation_rated', desc: 'Visitor rates the conversation' },
                        { event: 'questron_lead_captured', desc: 'Visitor submits email/phone via pre-chat form' },
                        { event: 'questron_flow_triggered', desc: 'A Flow automation is triggered' },
                        { event: 'questron_flow_completed', desc: 'Visitor completes all steps of a Flow' },
                        { event: 'questron_cta_clicked', desc: 'Visitor clicks a CTA button in a message' },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-4 py-2.5">
                            <code className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded font-mono">{row.event}</code>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-zinc-400">{row.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* FAQ */}
            {meta && meta.faq.length > 0 && (
              <div className="bg-white/50 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-purple-400" /> Frequently Asked Questions
                </h2>
                <div className="divide-y divide-zinc-800">
                  {meta.faq.map((item, i) => (
                    <div key={i}>
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                        className="w-full flex items-center justify-between py-4 text-left"
                      >
                        <span className="text-sm font-medium text-zinc-300">{item.question}</span>
                        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${expandedFaq === i ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedFaq === i && (
                        <p className="text-zinc-500 text-sm pb-4 -mt-1">{item.answer}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Integrations */}
            {meta && meta.relatedIds.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Discover More Integrations</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {meta.relatedIds.map(rid => {
                    const rName = INTEGRATION_NAMES[rid];
                    const rMeta = getIntegrationMeta(rid);
                    if (!rName) return null;
                    return (
                      <button
                        key={rid}
                        onClick={() => router.push(`/panel/integrations/detail?type=${rid}`)}
                        className="bg-white/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-600 transition text-left group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/30 to-blue-400/30 flex items-center justify-center text-lg font-bold text-blue-400 mb-3">
                          {rName.charAt(0)}
                        </div>
                        <p className="text-gray-900 text-sm font-medium group-hover:text-blue-400 transition">{rName}</p>
                        <p className="text-zinc-500 text-xs mt-1 line-clamp-2">{rMeta?.subtitle || ''}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom integration CTA */}
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-800/30 rounded-xl p-6 flex items-center justify-between">
              <div>
                <h3 className="text-gray-900 font-semibold mb-1">Looking for customer service automation that fits your business?</h3>
                <p className="text-zinc-400 text-sm">We build custom API integrations to streamline your most important workflows.</p>
              </div>
              <Button variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 shrink-0">
                Contact Sales
              </Button>
            </div>
          </div>
        )}

        {/* ─── Sync Tab ─── */}
        {activeTab === 'sync' && (
          <div className="pb-12">
            {connected ? (
              <IntegrationSyncDashboard
                integrationType={integrationId}
                integrationName={name}
                category={category}
                onBack={() => setActiveTab('overview')}
              />
            ) : (
              <div className="text-center py-16 text-zinc-500">
                Connect {name} to see your sync dashboard and analytics.
              </div>
            )}
          </div>
        )}

        {/* ─── Settings Tab ─── */}
        {activeTab === 'settings' && (
          <div className="space-y-6 pb-12">
            {/* Auto-sync settings for CRM */}
            {category === 'crm' && (
              <div className="bg-white/50 border border-zinc-800 rounded-xl p-6 space-y-4">
                <h3 className="text-gray-900 font-semibold">Sync Settings</h3>
                <ToggleSetting
                  label="Auto-sync contacts"
                  description="Automatically push new contacts from chat conversations to your CRM"
                  checked={configValues.autoSync !== false}
                  onChange={(v) => setConfigValues({ ...configValues, autoSync: v })}
                />
                <ToggleSetting
                  label="Create deals/leads"
                  description="Automatically create a deal or lead when a new contact is synced"
                  checked={configValues.createDeals === true}
                  onChange={(v) => setConfigValues({ ...configValues, createDeals: v })}
                />
                <ToggleSetting
                  label="Sync conversation history"
                  description="Attach chat transcript as a note when syncing contacts"
                  checked={configValues.syncHistory === true}
                  onChange={(v) => setConfigValues({ ...configValues, syncHistory: v })}
                />
              </div>
            )}

            {/* Auto-subscribe for Marketing */}
            {category === 'marketing' && (
              <div className="bg-white/50 border border-zinc-800 rounded-xl p-6 space-y-4">
                <h3 className="text-gray-900 font-semibold">Marketing Settings</h3>
                <ToggleSetting
                  label="Auto-subscribe from pre-chat forms"
                  description="Automatically add visitors who fill pre-chat forms to your mailing list"
                  checked={configValues.autoSubscribe === true}
                  onChange={(v) => setConfigValues({ ...configValues, autoSubscribe: v })}
                />
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Default Mailing List ID</label>
                  <input
                    type="text"
                    value={configValues.defaultListId || ''}
                    onChange={(e) => setConfigValues({ ...configValues, defaultListId: e.target.value })}
                    placeholder="Enter default list ID"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-300 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <ToggleSetting
                  label="Add 'questron-chat' tag"
                  description="Tag subscribers added from Questron Agent"
                  checked={configValues.addSourceTag !== false}
                  onChange={(v) => setConfigValues({ ...configValues, addSourceTag: v })}
                />
              </div>
            )}

            {/* Slack notification preferences */}
            {integrationId === 'slack' && (
              <div className="bg-white/50 border border-zinc-800 rounded-xl p-6 space-y-4">
                <h3 className="text-gray-900 font-semibold">Notification Settings</h3>
                <ToggleSetting
                  label="New conversations"
                  description="Get notified when a new chat conversation starts"
                  checked={configValues.notifyNewConversation !== false}
                  onChange={(v) => setConfigValues({ ...configValues, notifyNewConversation: v })}
                />
                <ToggleSetting
                  label="New tickets"
                  description="Get notified when a new support ticket is created"
                  checked={configValues.notifyNewTicket !== false}
                  onChange={(v) => setConfigValues({ ...configValues, notifyNewTicket: v })}
                />
                <ToggleSetting
                  label="Conversation ratings"
                  description="Get notified when a visitor rates a conversation"
                  checked={configValues.notifyConversationRated !== false}
                  onChange={(v) => setConfigValues({ ...configValues, notifyConversationRated: v })}
                />
                <ToggleSetting
                  label="Offline messages"
                  description="Get notified when a visitor leaves a message while you're offline"
                  checked={configValues.notifyOfflineMessage !== false}
                  onChange={(v) => setConfigValues({ ...configValues, notifyOfflineMessage: v })}
                />
              </div>
            )}

            {/* Zapier settings */}
            {integrationId === 'zapier' && (
              <div className="bg-white/50 border border-zinc-800 rounded-xl p-6 space-y-4">
                <h3 className="text-gray-900 font-semibold">Zapier Triggers</h3>
                <p className="text-zinc-400 text-sm">
                  Zapier can receive events when things happen in Questron. Register webhook URLs for each trigger event.
                </p>
                <div className="space-y-2 text-sm">
                  {[
                    { event: 'conversation_started', label: 'New Conversation' },
                    { event: 'conversation_closed', label: 'Conversation Closed' },
                    { event: 'conversation_rated', label: 'Conversation Rated' },
                    { event: 'contact_created', label: 'New Contact' },
                    { event: 'message_received', label: 'Message Received' },
                    { event: 'prechat_form_submitted', label: 'Pre-chat Form Submitted' },
                    { event: 'operator_replied', label: 'Agent Replied' },
                  ].map(({ event, label }) => (
                    <div key={event} className="flex items-center justify-between py-2 border-b border-zinc-800/50">
                      <div>
                        <span className="text-zinc-300">{label}</span>
                        <span className="text-zinc-600 text-xs ml-2">{event}</span>
                      </div>
                      <Zap className="w-4 h-4 text-orange-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* E-commerce widget settings */}
            {category === 'ecommerce' && integrationId !== 'shopify' && (
              <div className="bg-white/50 border border-zinc-800 rounded-xl p-6 space-y-4">
                <h3 className="text-gray-900 font-semibold">Widget Settings</h3>
                <ToggleSetting
                  label="Show order lookup in widget"
                  description="Allow visitors to check their order status through the chat widget"
                  checked={configValues.enableOrderLookup === true}
                  onChange={(v) => setConfigValues({ ...configValues, enableOrderLookup: v })}
                />
                <ToggleSetting
                  label="Sync customer data"
                  description="Pull customer info from orders for agent context"
                  checked={configValues.syncCustomers !== false}
                  onChange={(v) => setConfigValues({ ...configValues, syncCustomers: v })}
                />
              </div>
            )}

            {/* Field Mapping for CRM and Marketing */}
            {(category === 'crm' || category === 'marketing') && connected && (
              <div className="bg-white/50 border border-zinc-800 rounded-xl p-6">
                <FieldMappingEditor
                  integrationType={backendType}
                  integrationLabel={name}
                />
              </div>
            )}

            {/* Generic settings — always show */}
            <div className="bg-white/50 border border-zinc-800 rounded-xl p-6 space-y-4">
              <h3 className="text-gray-900 font-semibold">General</h3>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Display Name</label>
                <input
                  type="text"
                  value={configValues.displayName || ''}
                  onChange={(e) => setConfigValues({ ...configValues, displayName: e.target.value })}
                  placeholder={name}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-300 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSaveConfig}
                disabled={savingConfig || !connected}
                className="bg-blue-600 hover:bg-blue-700 text-gray-900"
              >
                {savingConfig ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Save Settings
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Connect Modal */}
      {showConnectModal && (
        <IntegrationConnectModal
          integration={{ id: integrationId, name, category: category }}
          currentStatus={connected ? 'connected' : null}
          onClose={() => setShowConnectModal(false)}
          onConnected={() => {
            setShowConnectModal(false);
            loadIntegration();
          }}
        />
      )}
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-zinc-300">{label}</p>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-zinc-700'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : ''}`}
        />
      </button>
    </div>
  );
}
