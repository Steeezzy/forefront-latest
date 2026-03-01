"use client";

import { useState, useEffect, useCallback } from 'react';
import { IntegrationLanding } from '@/components/settings/integrations/IntegrationLanding';
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { Phone, CheckCircle2, XCircle, Loader2, Trash2, Settings, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SocialAccount {
    id: string;
    account_id: string;
    account_name: string;
    channel: string;
    connected: boolean;
    metadata: any;
    created_at: string;
}

export default function WhatsAppSettingsPage() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form fields
    const [phoneNumberId, setPhoneNumberId] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [webhookSecret, setWebhookSecret] = useState('');

    const loadAccounts = useCallback(async () => {
        try {
            const res = await apiFetch('/api/social/accounts?channel=whatsapp');
            setAccounts((res.data || []).filter((a: SocialAccount) => a.connected));
        } catch (e) {
            console.error('Failed to load WhatsApp accounts:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadAccounts(); }, [loadAccounts]);

    const handleConnect = async () => {
        if (!phoneNumberId || !accessToken) {
            setError('Phone Number ID and Access Token are required');
            return;
        }
        setConnecting(true);
        setError('');
        setSuccess('');
        try {
            await apiFetch('/api/social/accounts/whatsapp/connect', {
                method: 'POST',
                body: JSON.stringify({ phoneNumberId, accessToken, webhookSecret }),
            });
            setSuccess('WhatsApp connected successfully!');
            setShowForm(false);
            setPhoneNumberId('');
            setAccessToken('');
            setWebhookSecret('');
            loadAccounts();
        } catch (e: any) {
            setError(e.message || 'Failed to connect WhatsApp');
        } finally {
            setConnecting(false);
        }
    };

    const handleDisconnect = async (id: string) => {
        if (!confirm('Are you sure you want to disconnect this WhatsApp account?')) return;
        try {
            await apiFetch(`/api/social/accounts/${id}`, { method: 'DELETE' });
            loadAccounts();
        } catch (e: any) {
            setError(e.message || 'Failed to disconnect');
        }
    };

    const handleSidebarNav = (tab: string) => {
        if (tab === 'WhatsApp') return;
        if (['Email', 'Facebook', 'Instagram', 'Account'].includes(tab)) {
            router.push(`/panel/settings/${tab.toLowerCase().replace(' ', '-')}`);
        } else {
            router.push('/panel/settings');
        }
    };

    const connectedAccounts = accounts.filter(a => a.connected);

    return (
        <div className="flex min-h-screen bg-[#0f1115] overflow-hidden h-screen">
            <div className="h-full overflow-y-auto pt-8 pl-8 pb-8">
                <SettingsSidebar activeTab="WhatsApp" onTabChange={handleSidebarNav} />
            </div>
            <div className="flex-1 overflow-y-auto h-full p-8 relative custom-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    </div>
                ) : connectedAccounts.length > 0 && !showForm ? (
                    /* ── Connected State ── */
                    <div className="max-w-[800px] animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <Phone size={20} className="text-emerald-400" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">WhatsApp Integration</h1>
                                <p className="text-zinc-500 text-sm">Manage your connected WhatsApp accounts</p>
                            </div>
                        </div>

                        {success && (
                            <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm flex items-center gap-2">
                                <CheckCircle2 size={16} /> {success}
                            </div>
                        )}
                        {error && (
                            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                                <XCircle size={16} /> {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            {connectedAccounts.map(account => (
                                <div key={account.id} className="bg-[#18181b] border border-white/5 rounded-xl p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                            <Phone size={20} className="text-emerald-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium">
                                                {account.account_name || account.account_id}
                                            </h3>
                                            <p className="text-zinc-500 text-sm">
                                                {account.metadata?.phoneNumber || `ID: ${account.account_id}`}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                                <span className="text-emerald-400 text-xs">Connected</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => router.push('/panel/settings/channels')}
                                            className="text-zinc-400 hover:text-white"
                                        >
                                            <Settings size={16} className="mr-1" /> Auto-Reply
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDisconnect(account.id)}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                        >
                                            <Trash2 size={16} className="mr-1" /> Disconnect
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button
                            onClick={() => setShowForm(true)}
                            className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            + Add another account
                        </Button>
                    </div>
                ) : showForm ? (
                    /* ── Connection Form ── */
                    <div className="max-w-[600px] animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <button
                            onClick={() => { setShowForm(false); setError(''); }}
                            className="flex items-center gap-1 text-zinc-400 hover:text-white text-sm mb-6 transition-colors"
                        >
                            <ArrowLeft size={16} /> Back
                        </button>

                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <Phone size={20} className="text-emerald-400" />
                            </div>
                            <h1 className="text-xl font-bold text-white">Connect WhatsApp</h1>
                        </div>

                        <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 space-y-5">
                            <p className="text-zinc-400 text-sm leading-relaxed">
                                Connect your WhatsApp Business account using the Meta Cloud API.
                                You&apos;ll need your <strong className="text-zinc-200">Phone Number ID</strong> and
                                a <strong className="text-zinc-200">permanent Access Token</strong> from the
                                <a href="https://developers.facebook.com" target="_blank" rel="noopener" className="text-blue-400 hover:underline ml-1">
                                    Meta Developer Console
                                </a>.
                            </p>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                                    <XCircle size={16} /> {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                                    Phone Number ID <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={phoneNumberId}
                                    onChange={(e) => setPhoneNumberId(e.target.value)}
                                    placeholder="e.g. 123456789012345"
                                    className="w-full bg-[#0f1115] border border-zinc-800 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                                />
                                <p className="text-zinc-600 text-xs mt-1">Found in WhatsApp &gt; API Setup in your Meta app</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                                    Permanent Access Token <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={accessToken}
                                    onChange={(e) => setAccessToken(e.target.value)}
                                    placeholder="Your permanent token"
                                    className="w-full bg-[#0f1115] border border-zinc-800 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                                />
                                <p className="text-zinc-600 text-xs mt-1">Generate a permanent token from System Users in Meta Business Suite</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                                    Webhook Verify Token <span className="text-zinc-600">(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={webhookSecret}
                                    onChange={(e) => setWebhookSecret(e.target.value)}
                                    placeholder="Your webhook verify token"
                                    className="w-full bg-[#0f1115] border border-zinc-800 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                                />
                                <p className="text-zinc-600 text-xs mt-1">Used to verify webhook calls from Meta</p>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <Button
                                    onClick={handleConnect}
                                    disabled={connecting || !phoneNumberId || !accessToken}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                                >
                                    {connecting && <Loader2 size={16} className="mr-2 animate-spin" />}
                                    {connecting ? 'Connecting...' : 'Connect WhatsApp'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => { setShowForm(false); setError(''); }}
                                    className="text-zinc-400"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                            <h3 className="text-blue-400 text-sm font-medium mb-2">Setup Guide</h3>
                            <ol className="text-zinc-400 text-xs space-y-1.5 list-decimal list-inside">
                                <li>Create a Meta App at developers.facebook.com</li>
                                <li>Add the WhatsApp product to your app</li>
                                <li>Go to WhatsApp &gt; API Setup to find your Phone Number ID</li>
                                <li>Create a System User in Meta Business Suite and generate a permanent token</li>
                                <li>Set the webhook URL to: <code className="text-blue-300 bg-blue-500/10 px-1 rounded">{"your-domain/api/social/webhooks/whatsapp"}</code></li>
                            </ol>
                        </div>
                    </div>
                ) : (
                    /* ── Landing / Not Connected ── */
                    <IntegrationLanding
                        platformName="WhatsApp"
                        icon={Phone}
                        description="Handle your WhatsApp conversations directly in your Forefront inbox and quickly answer your customers' questions. Less distraction with switching platforms, more productivity."
                        buttonText="Integrate WhatsApp"
                        onIntegrate={() => setShowForm(true)}
                        features={[
                            {
                                icon: Phone,
                                title: "Direct messages",
                                text: "Respond to all messages from customers. Group chat and calls are not available yet."
                            },
                            {
                                icon: require('lucide-react').Clock,
                                title: "Reply window",
                                text: "You have 24 hours to reply to messages from your customers."
                            },
                            {
                                icon: require('lucide-react').GitBranch,
                                title: "Flows",
                                text: "Boost your productivity by using Flows to automate repetitive conversations."
                            }
                        ]}
                    />
                )}
            </div>
        </div>
    );
}
