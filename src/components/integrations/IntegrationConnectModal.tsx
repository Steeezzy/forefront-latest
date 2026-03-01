"use client";

import { useState } from 'react';
import { X, Loader2, CheckCircle, AlertCircle, ExternalLink, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';

interface IntegrationConnectModalProps {
  integration: {
    id: string;
    name: string;
    category: string;
  };
  currentStatus?: 'connected' | 'disconnected' | null;
  onClose: () => void;
  onConnected: () => void;
}

// Field definitions for each integration type
const INTEGRATION_FIELDS: Record<string, { label: string; key: string; type?: string; placeholder: string; helpText?: string }[]> = {
  // BI & Analytics
  'google-analytics': [
    { label: 'Measurement ID', key: 'measurementId', placeholder: 'G-XXXXXXXXXX', helpText: 'Find this in Google Analytics → Admin → Data Streams → Web' },
  ],
  'google-tag-manager': [
    { label: 'Container ID', key: 'containerId', placeholder: 'GTM-XXXXXXX', helpText: 'Find this in GTM → Container → Container ID' },
  ],
  'zapier': [
    { label: 'Webhook URL', key: 'webhookUrl', placeholder: 'https://hooks.zapier.com/hooks/catch/...', helpText: 'Create a Zap, choose "Webhooks by Zapier" as trigger, and paste the webhook URL here' },
  ],

  // CRM
  'hubspot': [
    { label: 'API Key', key: 'apiKey', type: 'password', placeholder: 'pat-na1-...', helpText: 'Go to HubSpot → Settings → Integrations → Private Apps → Create a Private App' },
  ],
  'salesforce': [
    { label: 'Instance URL', key: 'instanceUrl', placeholder: 'https://yourorg.my.salesforce.com', helpText: 'Your Salesforce org URL' },
    { label: 'Access Token', key: 'accessToken', type: 'password', placeholder: 'Your OAuth access token' },
  ],
  'pipedrive': [
    { label: 'API Token', key: 'apiToken', type: 'password', placeholder: 'Your Pipedrive API token', helpText: 'Go to Pipedrive → Settings → Personal preferences → API' },
  ],
  'zoho': [
    { label: 'Access Token', key: 'accessToken', type: 'password', placeholder: 'Your Zoho CRM access token' },
  ],
  'agile-crm': [
    { label: 'Domain', key: 'domain', placeholder: 'your-domain', helpText: 'Your Agile CRM subdomain (e.g., "mycompany" from mycompany.agilecrm.com)' },
    { label: 'Email', key: 'email', placeholder: 'admin@example.com' },
    { label: 'API Key', key: 'apiKey', type: 'password', placeholder: 'Your Agile CRM REST API key' },
  ],
  'zendesk-sell': [
    { label: 'API Token', key: 'apiToken', type: 'password', placeholder: 'Your Zendesk Sell API token', helpText: 'Go to Zendesk Sell → Settings → OAuth → Access Tokens' },
  ],

  // E-commerce
  'woocommerce': [
    { label: 'Store URL', key: 'storeUrl', placeholder: 'https://your-store.com', helpText: 'Your WooCommerce store URL' },
    { label: 'Consumer Key', key: 'consumerKey', type: 'password', placeholder: 'ck_...' },
    { label: 'Consumer Secret', key: 'consumerSecret', type: 'password', placeholder: 'cs_...' },
  ],
  'bigcommerce': [
    { label: 'Store Hash', key: 'storeHash', placeholder: 'abc123', helpText: 'Found in your BigCommerce admin URL' },
    { label: 'Access Token', key: 'accessToken', type: 'password', placeholder: 'Your API access token' },
  ],
  'adobe-commerce': [
    { label: 'Store URL', key: 'storeUrl', placeholder: 'https://your-magento-store.com' },
    { label: 'Access Token', key: 'accessToken', type: 'password', placeholder: 'Your integration access token' },
  ],
  'prestashop': [
    { label: 'Store URL', key: 'storeUrl', placeholder: 'https://your-prestashop.com' },
    { label: 'API Key', key: 'apiKey', type: 'password', placeholder: 'Your webservice API key' },
  ],
  'wordpress': [],

  // Marketing
  'mailchimp': [
    { label: 'API Key', key: 'apiKey', type: 'password', placeholder: 'xxxxxxx-usXX', helpText: 'Go to Mailchimp → Account → Extras → API keys' },
  ],
  'klaviyo': [
    { label: 'API Key', key: 'apiKey', type: 'password', placeholder: 'pk_...', helpText: 'Go to Klaviyo → Settings → API Keys' },
  ],
  'activecampaign': [
    { label: 'Account URL', key: 'accountUrl', placeholder: 'https://yourname.api-us1.com', helpText: 'Your ActiveCampaign account URL' },
    { label: 'API Key', key: 'apiKey', type: 'password', placeholder: 'Your ActiveCampaign API key' },
  ],
  'omnisend': [
    { label: 'API Key', key: 'apiKey', type: 'password', placeholder: 'Your Omnisend API key' },
  ],
  'mailerlite': [
    { label: 'API Key', key: 'apiKey', type: 'password', placeholder: 'Your MailerLite API key' },
  ],
  'brevo': [
    { label: 'API Key', key: 'apiKey', type: 'password', placeholder: 'xkeysib-...', helpText: 'Go to Brevo → Settings → SMTP & API → API Keys' },
  ],

  // Customer Support
  'zendesk': [
    { label: 'Subdomain', key: 'subdomain', placeholder: 'your-company', helpText: 'From your-company.zendesk.com' },
    { label: 'Email', key: 'email', placeholder: 'admin@company.com', helpText: 'Admin email for your Zendesk account' },
    { label: 'API Token', key: 'apiToken', type: 'password', placeholder: 'Your Zendesk API token', helpText: 'Go to Admin → Channels → API → Token Access' },
  ],

  // Reviews
  'judgeme': [
    { label: 'API Token', key: 'apiToken', type: 'password', placeholder: 'Your Judge.me API token' },
    { label: 'Shop Domain', key: 'shopDomain', placeholder: 'your-shop.myshopify.com' },
  ],
};

// Map display IDs to backend types
function toBackendType(id: string): string {
  return id.replace(/-/g, '_');
}

export function IntegrationConnectModal({ integration, currentStatus, onClose, onConnected }: IntegrationConnectModalProps) {
  const fields = INTEGRATION_FIELDS[integration.id] || [];
  const isAnalytics = ['google-analytics', 'google-tag-manager'].includes(integration.id);
  const isWordPress = integration.id === 'wordpress';
  const isFacebook = integration.id === 'facebook';
  const isEmail = integration.id === 'email';
  const isInstagram = integration.id === 'instagram';
  const isWhatsApp = integration.id === 'whatsapp';
  const isChannelIntegration = isFacebook || isInstagram || isWhatsApp;

  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [wpSnippet, setWpSnippet] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isConnected = currentStatus === 'connected';
  const backendType = toBackendType(integration.id);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload: any = {};

      if (isAnalytics) {
        // Analytics config goes in config, not credentials
        payload.config = {};
        fields.forEach(f => { if (values[f.key]) payload.config[f.key] = values[f.key]; });
      } else if (integration.id === 'zapier') {
        payload.webhookUrl = values.webhookUrl;
      } else {
        payload.credentials = {};
        fields.forEach(f => { if (values[f.key]) payload.credentials[f.key] = values[f.key]; });
      }

      await apiFetch(`/api/integrations/${backendType}/connect`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSuccess(true);
      setTimeout(() => {
        onConnected();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setError(null);
    try {
      await apiFetch(`/api/integrations/${backendType}/disconnect`, {
        method: 'DELETE',
      });
      onConnected(); // Refresh parent
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch(`/api/integrations/${backendType}/test`, {
        method: 'POST',
      });
      if (result?.result?.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      } else {
        setError(result?.result?.error || 'Connection test failed');
      }
    } catch (err: any) {
      setError(err.message || 'Test failed');
    } finally {
      setLoading(false);
    }
  };

  const loadWordPressSnippet = async () => {
    try {
      const data = await apiFetch('/api/integrations/wordpress/snippet');
      setWpSnippet(data.snippet);
    } catch {
      setError('Failed to load snippet');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="text-xl font-bold text-white">{integration.name}</h2>
            <p className="text-sm text-zinc-400 mt-1 capitalize">{integration.category}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Channel integrations — redirect to social settings */}
          {isChannelIntegration && (
            <div className="text-center py-6">
              <p className="text-zinc-300 mb-4">
                {integration.name} is configured through the Channels settings.
              </p>
              <a
                href="/panel/settings/channels"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
              >
                Go to Channel Settings <ExternalLink size={14} />
              </a>
            </div>
          )}

          {/* Email integration */}
          {isEmail && (
            <div className="text-center py-6">
              <p className="text-zinc-300 mb-4">
                Email forwarding is configured through Settings → Email.
              </p>
              <a
                href="/panel/settings/email"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
              >
                Go to Email Settings <ExternalLink size={14} />
              </a>
            </div>
          )}

          {/* Shopify — already built */}
          {integration.id === 'shopify' && (
            <div className="text-center py-6">
              <p className="text-zinc-300 mb-4">
                Shopify is managed through Settings → Shopify.
              </p>
              <a
                href="/panel/settings/shopify"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
              >
                Go to Shopify Settings <ExternalLink size={14} />
              </a>
            </div>
          )}

          {/* WordPress — show snippet */}
          {isWordPress && (
            <div className="space-y-4">
              <p className="text-zinc-300 text-sm">
                Add the Forefront Chat widget to your WordPress site by copying the code snippet below into your theme&apos;s header or using a header scripts plugin.
              </p>
              {!wpSnippet ? (
                <Button onClick={loadWordPressSnippet} variant="outline" className="w-full border-white/10 text-white hover:bg-white/5">
                  Generate Widget Code
                </Button>
              ) : (
                <div className="relative">
                  <pre className="bg-black/40 border border-white/10 rounded-lg p-4 text-xs text-green-400 overflow-x-auto whitespace-pre-wrap">
                    {wpSnippet}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(wpSnippet)}
                    className="absolute top-2 right-2 text-zinc-400 hover:text-white transition-colors"
                  >
                    {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Standard field-based integrations */}
          {!isChannelIntegration && !isEmail && !isWordPress && integration.id !== 'shopify' && (
            <>
              {fields.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    {field.label}
                  </label>
                  <input
                    type={field.type || 'text'}
                    value={values[field.key] || ''}
                    onChange={e => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40"
                    disabled={loading}
                  />
                  {field.helpText && (
                    <p className="text-xs text-zinc-500 mt-1">{field.helpText}</p>
                  )}
                </div>
              ))}

              {fields.length === 0 && !isConnected && (
                <p className="text-zinc-400 text-sm text-center py-4">
                  This integration doesn&apos;t require additional configuration.
                </p>
              )}
            </>
          )}

          {/* Status messages */}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 text-red-400 text-sm p-3 rounded-lg">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 bg-green-500/10 text-green-400 text-sm p-3 rounded-lg">
              <CheckCircle size={16} className="flex-shrink-0" />
              Connected successfully!
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!isChannelIntegration && !isEmail && integration.id !== 'shopify' && (
          <div className="flex items-center justify-between p-6 border-t border-white/5">
            <div>
              {isConnected && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  {disconnecting ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                  Disconnect
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {isConnected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={loading}
                  className="border-white/10 text-white hover:bg-white/5"
                >
                  Test Connection
                </Button>
              )}

              {!isWordPress && (
                <Button
                  size="sm"
                  onClick={handleConnect}
                  disabled={loading || (fields.length > 0 && !Object.values(values).some(v => v))}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading && <Loader2 size={14} className="animate-spin mr-1" />}
                  {isConnected ? 'Update' : 'Connect'}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
