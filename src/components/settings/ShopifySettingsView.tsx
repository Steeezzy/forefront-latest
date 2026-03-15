"use client";

import { useState, useEffect } from 'react';
import {
    Store, RefreshCw, Unplug, CheckCircle2, XCircle, Clock, Package,
    Users, ShoppingCart, AlertTriangle, ExternalLink, Loader2, ShieldCheck,
    Webhook, Trash2, ArrowDownToLine
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { shopifyApi, type ShopifyStore } from '@/lib/api';

interface WebhookStatus {
    topic: string;
    label: string;
    registered: boolean;
}

const WEBHOOK_TOPICS: WebhookStatus[] = [
    { topic: 'orders/create', label: 'New Orders', registered: true },
    { topic: 'orders/updated', label: 'Order Updates', registered: true },
    { topic: 'orders/fulfilled', label: 'Order Fulfilled', registered: true },
    { topic: 'orders/cancelled', label: 'Order Cancelled', registered: true },
    { topic: 'refunds/create', label: 'Refund Created', registered: true },
    { topic: 'customers/create', label: 'New Customer', registered: true },
    { topic: 'customers/update', label: 'Customer Update', registered: true },
    { topic: 'checkouts/create', label: 'Checkout Abandoned', registered: true },
    { topic: 'products/create', label: 'Product Created', registered: true },
    { topic: 'products/update', label: 'Product Updated', registered: true },
    { topic: 'app/uninstalled', label: 'App Uninstalled', registered: true },
];

export function ShopifySettingsView() {
    const [stores, setStores] = useState<ShopifyStore[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [connectDomain, setConnectDomain] = useState('');
    const [disconnecting, setDisconnecting] = useState<string | null>(null);

    useEffect(() => {
        loadStores();
    }, []);

    const loadStores = async () => {
        try {
            const res = await shopifyApi.getStores();
            setStores(res.stores || []);
        } catch {
            setStores([]);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = () => {
        if (!connectDomain.trim()) return;
        const domain = connectDomain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
        const shop = domain.includes('.myshopify.com') ? domain : `${domain}.myshopify.com`;
        fetch(`/api/proxy/api/shopify/install?shop=${encodeURIComponent(shop)}`)
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
    };

    const handleSync = async (storeId: string) => {
        setSyncing(true);
        try {
            await shopifyApi.triggerSync(storeId);
        } catch {
            // silent
        } finally {
            setTimeout(() => {
                setSyncing(false);
                loadStores();
            }, 3000);
        }
    };

    const handleDisconnect = async (storeId: string) => {
        if (!confirm('Are you sure you want to disconnect this Shopify store? All synced data will be preserved but sync will stop.')) return;
        setDisconnecting(storeId);
        try {
            await shopifyApi.disconnect(storeId);
            setStores(prev => prev.filter(s => s.id !== storeId));
        } catch {
            // silent
        } finally {
            setDisconnecting(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-zinc-500">
                <Loader2 className="animate-spin mr-2" size={20} />
                Loading Shopify settings...
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Shopify</h1>
                <p className="text-zinc-400 text-sm">
                    Manage your connected Shopify stores, sync settings, and webhook configuration.
                </p>
            </div>

            {/* Connected Stores */}
            {stores.length > 0 ? (
                stores.map(store => (
                    <div key={store.id} className="bg-[#ffffff] border border-gray-200 rounded-xl overflow-hidden">
                        {/* Store Header */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                                        <Store size={24} className="text-green-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-gray-900 font-semibold text-lg">{store.shop_domain}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            {store.is_active ? (
                                                <span className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
                                                    <CheckCircle2 size={12} /> Connected
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-red-400 text-xs font-medium">
                                                    <XCircle size={12} /> Disconnected
                                                </span>
                                            )}
                                            {store.plan_name && (
                                                <span className="text-zinc-500 text-xs">Plan: {store.plan_name}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-zinc-700 text-zinc-300 hover:text-gray-900"
                                        onClick={() => window.open(`https://${store.shop_domain}/admin`, '_blank')}
                                    >
                                        <ExternalLink size={14} className="mr-1.5" />
                                        Shopify Admin
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-zinc-700 text-zinc-300 hover:text-gray-900"
                                        onClick={() => handleSync(store.id)}
                                        disabled={syncing}
                                    >
                                        <RefreshCw size={14} className={`mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
                                        {syncing ? 'Syncing...' : 'Sync Now'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                        onClick={() => handleDisconnect(store.id)}
                                        disabled={disconnecting === store.id}
                                    >
                                        {disconnecting === store.id ? (
                                            <Loader2 size={14} className="mr-1.5 animate-spin" />
                                        ) : (
                                            <Unplug size={14} className="mr-1.5" />
                                        )}
                                        Disconnect
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Sync Info */}
                        <div className="p-6 border-b border-gray-200">
                            <h4 className="text-zinc-400 text-xs uppercase font-bold mb-4 tracking-wider">Sync Status</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <SyncStat
                                    icon={Clock}
                                    label="Last Synced"
                                    value={store.last_synced_at
                                        ? new Date(store.last_synced_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                        : 'Never'}
                                />
                                <SyncStat icon={ShoppingCart} label="Orders" value="Synced" />
                                <SyncStat icon={Users} label="Customers" value="Synced" />
                                <SyncStat icon={Package} label="Products" value="Synced" />
                            </div>
                        </div>

                        {/* Scopes */}
                        {store.scopes && (
                            <div className="p-6 border-b border-gray-200">
                                <h4 className="text-zinc-400 text-xs uppercase font-bold mb-3 tracking-wider flex items-center gap-2">
                                    <ShieldCheck size={14} />
                                    Permissions
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {store.scopes.split(',').map(scope => (
                                        <span key={scope} className="px-2.5 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-full border border-gray-200">
                                            {scope.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Webhooks */}
                        <div className="p-6">
                            <h4 className="text-zinc-400 text-xs uppercase font-bold mb-4 tracking-wider flex items-center gap-2">
                                <Webhook size={14} />
                                Active Webhooks
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {WEBHOOK_TOPICS.map(wh => (
                                    <div key={wh.topic} className="flex items-center gap-2 px-3 py-2 bg-white/50 rounded-lg">
                                        <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                                        <span className="text-zinc-300 text-sm">{wh.label}</span>
                                        <span className="text-zinc-600 text-xs ml-auto">{wh.topic}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                /* No Store Connected */
                <div className="bg-[#ffffff] border border-gray-200 rounded-xl p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                        <Store size={32} className="text-green-400" />
                    </div>
                    <h3 className="text-gray-900 font-semibold text-xl mb-2">Connect Your Shopify Store</h3>
                    <p className="text-zinc-400 text-sm mb-8 max-w-md mx-auto">
                        Sync your orders, customers, and products. Enable cart recovery, order tracking, and AI-powered customer support.
                    </p>
                    <div className="max-w-sm mx-auto">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={connectDomain}
                                onChange={e => setConnectDomain(e.target.value)}
                                placeholder="your-store.myshopify.com"
                                className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                                onKeyDown={e => e.key === 'Enter' && handleConnect()}
                            />
                            <Button
                                className="bg-green-600 hover:bg-green-500 text-gray-900"
                                onClick={handleConnect}
                            >
                                Connect
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Danger Zone */}
            {stores.length > 0 && (
                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                        <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-red-400 font-semibold mb-1">Danger Zone</h4>
                            <p className="text-zinc-500 text-sm mb-4">
                                Deleting store data will permanently remove all synced orders, customers, and products from Questron. This action cannot be undone.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            >
                                <Trash2 size={14} className="mr-1.5" />
                                Delete All Synced Data
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SyncStat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="bg-white/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
                <Icon size={14} className="text-zinc-500" />
                <span className="text-zinc-500 text-xs">{label}</span>
            </div>
            <span className="text-gray-900 text-sm font-medium">{value}</span>
        </div>
    );
}
