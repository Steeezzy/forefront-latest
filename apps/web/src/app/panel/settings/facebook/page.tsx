"use client";

import { useState, useEffect, useCallback } from 'react';
import { IntegrationLanding } from '@/components/settings/integrations/IntegrationLanding';
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { Facebook, CheckCircle2, XCircle, Loader2, Trash2, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface SocialAccount {
    id: string;
    account_id: string;
    account_name: string;
    channel: string;
    connected: boolean;
    metadata: any;
    created_at: string;
}

export default function FacebookSettingsPage() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const loadAccounts = useCallback(async () => {
        try {
            const res = await apiFetch('/api/social/accounts?channel=messenger');
            setAccounts((res.data || []).filter((a: SocialAccount) => a.connected));
        } catch (e) {
            console.error('Failed to load Messenger accounts:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadAccounts(); }, [loadAccounts]);

    const handleIntegrate = async () => {
        setConnecting(true);
        setError('');
        try {
            const res = await apiFetch('/api/social/accounts/meta/auth-url?channel=messenger');
            if (res.url) {
                window.open(res.url, '_blank', 'width=600,height=700');
                setSuccess('Complete the authorization in the popup window. The page will refresh when done.');
                // Poll for connection
                const pollInterval = setInterval(async () => {
                    const check = await apiFetch('/api/social/accounts?channel=messenger');
                    const connected = (check.data || []).filter((a: SocialAccount) => a.connected);
                    if (connected.length > accounts.length) {
                        clearInterval(pollInterval);
                        setSuccess('Facebook Messenger connected successfully!');
                        setConnecting(false);
                        loadAccounts();
                    }
                }, 3000);
                setTimeout(() => { clearInterval(pollInterval); setConnecting(false); }, 120000);
            }
        } catch (e: any) {
            setError(e.message || 'Failed to start Facebook OAuth flow. Make sure META_APP_ID and META_APP_SECRET are configured.');
            setConnecting(false);
        }
    };

    const handleDisconnect = async (id: string) => {
        if (!confirm('Are you sure you want to disconnect this Facebook Page?')) return;
        try {
            await apiFetch(`/api/social/accounts/${id}`, { method: 'DELETE' });
            loadAccounts();
        } catch (e: any) {
            setError(e.message || 'Failed to disconnect');
        }
    };

    const handleSidebarNav = (tab: string) => {
        if (tab === 'Facebook') return;
        if (['Email', 'Instagram', 'WhatsApp', 'Account'].includes(tab)) {
            router.push(`/panel/settings/${tab.toLowerCase().replace(' ', '-')}`);
        } else {
            router.push('/panel/settings');
        }
    };

    const connectedAccounts = accounts.filter(a => a.connected);

    return (
        <div className="flex min-h-screen bg-[#f8fafc] overflow-hidden h-screen">
            <div className="h-full overflow-y-auto pt-8 pl-8 pb-8">
                <SettingsSidebar activeTab="Facebook" onTabChange={handleSidebarNav} />
            </div>
            <div className="flex-1 overflow-y-auto h-full p-8 relative custom-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    </div>
                ) : connectedAccounts.length > 0 ? (
                    /* ── Connected State ── */
                    <div className="max-w-[800px] animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <Facebook size={20} className="text-blue-400" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Facebook Messenger Integration</h1>
                                <p className="text-zinc-500 text-sm">Manage your connected Facebook Pages</p>
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
                                <div key={account.id} className="bg-[#ffffff] border border-gray-200 rounded-xl p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                            <Facebook size={20} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-gray-900 font-medium">
                                                {account.account_name || account.account_id}
                                            </h3>
                                            <p className="text-zinc-500 text-sm">Facebook Page</p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                                <span className="text-emerald-400 text-xs">Connected</span>
                                                <span className="text-zinc-600 text-xs ml-2">
                                                    Since {new Date(account.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => router.push('/panel/settings/channels')}
                                            className="text-zinc-400 hover:text-gray-900"
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

                        <Button onClick={handleIntegrate} disabled={connecting} className="mt-6 bg-blue-600 hover:bg-blue-700 text-gray-900">
                            {connecting && <Loader2 size={16} className="mr-2 animate-spin" />}
                            + Add another page
                        </Button>
                    </div>
                ) : (
                    /* ── Landing / Not Connected ── */
                    <div className="max-w-[1000px]">
                        {error && (
                            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                                <XCircle size={16} /> {error}
                            </div>
                        )}
                        {success && (
                            <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-sm flex items-center gap-2">
                                <Loader2 size={16} className="animate-spin" /> {success}
                            </div>
                        )}
                        <IntegrationLanding
                            platformName="Facebook"
                            icon={Facebook}
                            description="Manage your Facebook Messenger conversations and comments directly from your Questron inbox to respond to customer questions quickly. Fewer distractions from switching platforms, more productivity for you."
                            buttonText={connecting ? "Connecting..." : "Integrate Facebook"}
                            onIntegrate={handleIntegrate}
                        />

                        <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl max-w-[1000px]">
                            <h3 className="text-blue-400 text-sm font-medium mb-2">Requirements</h3>
                            <ul className="text-zinc-400 text-xs space-y-1 list-disc list-inside">
                                <li>A Facebook Page you manage</li>
                                <li>A Meta App with Messenger product enabled</li>
                                <li>META_APP_ID and META_APP_SECRET configured in server environment</li>
                                <li>Webhook URL configured to: <code className="text-blue-300 bg-blue-500/10 px-1 rounded">your-domain/api/social/webhooks/messenger</code></li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
