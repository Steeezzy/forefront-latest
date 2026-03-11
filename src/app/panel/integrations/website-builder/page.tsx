"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IntegrationsSidebar } from '@/components/integrations/IntegrationsSidebar';
import { shopifyApi, apiFetch, type ShopifyStore } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
    ShoppingBag, Globe, Code, Copy, Check, ExternalLink, Loader2,
    CheckCircle2, XCircle, RefreshCw, AlertTriangle, Monitor,
    Smartphone, ArrowRight, Eye, EyeOff, Settings2, Palette,
    Layout, Puzzle, Store, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={copy} className="p-1.5 hover:bg-white/10 rounded transition-colors text-zinc-400 hover:text-white" title="Copy">
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
    );
}

interface WidgetDomain {
    id: string;
    domain: string;
    verified: boolean;
}

export default function WebsiteBuilderPage() {
    const router = useRouter();
    const [stores, setStores] = useState<ShopifyStore[]>([]);
    const [widgetDomains, setWidgetDomains] = useState<WidgetDomain[]>([]);
    const [loading, setLoading] = useState(true);
    const [embedEnabled, setEmbedEnabled] = useState(true);
    const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
    const [widgetPosition, setWidgetPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
    const [showOnMobile, setShowOnMobile] = useState(true);
    const [autoOpen, setAutoOpen] = useState(false);
    const [autoOpenDelay, setAutoOpenDelay] = useState(5);

    const projectId = 'YOUR_PROJECT_ID';

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [storeRes, domainRes] = await Promise.all([
                shopifyApi.getStores().catch(() => ({ stores: [] })),
                apiFetch('/api/domains/widget').catch(() => ({ domains: [] })),
            ]);
            setStores((storeRes as any).stores || []);
            setWidgetDomains((domainRes as any).domains || []);
        } finally {
            setLoading(false);
        }
    };

    const activeStore = stores.find(s => s.is_active);
    const shopDomain = activeStore?.shop_domain || 'your-store.myshopify.com';

    const installSnippet = `<!-- Forefront Chat Widget -->
<script src="https://widget.forefront.chat/loader.js"
        data-project-id="${projectId}"
        async>
</script>`;

    const shopifyThemeSnippet = `{% comment %} Forefront Chat Widget {% endcomment %}
{% if template != 'cart' %}
<script src="https://widget.forefront.chat/loader.js"
        data-project-id="${projectId}"
        data-shopify-domain="{{ shop.permanent_domain }}"
        async>
</script>
{% endif %}`;

    if (loading) {
        return (
            <div className="flex min-h-screen bg-[#0f1115] p-8 items-center justify-center">
                <Loader2 className="animate-spin text-zinc-500" size={24} />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#0f1115] p-8 overflow-y-auto h-screen">
            <IntegrationsSidebar selectedCategory="Website Builder" onSelectCategory={(cat) => {
                if (cat !== 'Website Builder') router.push(`/panel/integrations?category=${cat}`);
            }} />

            <div className="flex-1 max-w-5xl space-y-8">
                <header>
                    <h1 className="text-2xl font-bold text-white mb-1">Website Builder</h1>
                    <p className="text-zinc-400 text-sm">
                        Install and configure the Forefront chat widget on your website. Manage Shopify app embeds and custom installations.
                    </p>
                </header>

                {/* ─── Shopify App Embed ─────────────────────────── */}
                {activeStore && (
                    <div className="bg-[#18181b] border border-white/5 rounded-xl overflow-hidden">
                        <div className="p-6 border-b border-white/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                                        <ShoppingBag size={24} className="text-green-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-white font-semibold text-lg">Shopify App Embed</h2>
                                        <p className="text-zinc-400 text-sm">{shopDomain}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {embedEnabled ? (
                                        <span className="flex items-center gap-1.5 text-green-400 text-xs font-medium bg-green-500/10 px-3 py-1.5 rounded-full">
                                            <CheckCircle2 size={12} /> Active
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-red-400 text-xs font-medium bg-red-500/10 px-3 py-1.5 rounded-full">
                                            <XCircle size={12} /> Inactive
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* App Embed Toggle Card */}
                        <div className="p-6 border-b border-white/5">
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="flex-1 space-y-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-sm">1</div>
                                            <h3 className="text-white font-semibold">Enable App Embed in Shopify Theme Editor</h3>
                                        </div>
                                        <p className="text-zinc-400 text-sm mb-4">
                                            Turn on the Forefront Chat app embed in your Shopify theme to make the widget visible to your customers.
                                        </p>
                                        <Button
                                            className="bg-green-600 hover:bg-green-500 text-white"
                                            onClick={() => window.open(`https://${shopDomain}/admin/themes/current/editor?context=apps`, '_blank')}
                                        >
                                            <ExternalLink size={14} className="mr-1.5" />
                                            Go to Shopify Theme Editor
                                        </Button>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center font-bold text-sm">2</div>
                                            <h3 className="text-white font-semibold">Verify Widget on Your Store</h3>
                                        </div>
                                        <p className="text-zinc-400 text-sm mb-4">
                                            After enabling the app embed, visit your storefront to confirm the chat widget appears.
                                        </p>
                                        <Button
                                            variant="outline"
                                            className="border-zinc-700 text-zinc-300 hover:text-white"
                                            onClick={() => window.open(`https://${shopDomain}`, '_blank')}
                                        >
                                            <Globe size={14} className="mr-1.5" />
                                            Visit Your Store
                                        </Button>
                                    </div>
                                </div>

                                {/* Visual Preview — Shopify Theme Editor Mock */}
                                <div className="flex-1 bg-[#0f1115] rounded-xl border border-white/5 p-6 flex items-center justify-center min-h-[280px]">
                                    <div className="w-full max-w-[300px]">
                                        <div className="bg-[#18181b] rounded-lg border border-white/5 overflow-hidden shadow-xl">
                                            <div className="px-4 py-3 border-b border-white/5 bg-zinc-900/50">
                                                <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">App embeds</span>
                                            </div>
                                            <div className="p-4 space-y-3">
                                                <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center">
                                                            <div className="w-4 h-4 bg-current rounded-sm" />
                                                        </div>
                                                        <div>
                                                            <span className="text-white text-sm font-medium">Forefront Chat</span>
                                                            <p className="text-zinc-500 text-xs">Live chat widget</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setEmbedEnabled(!embedEnabled)}
                                                        className={cn(
                                                            "w-11 h-6 rounded-full relative transition-colors",
                                                            embedEnabled ? "bg-blue-600" : "bg-zinc-600"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-4 h-4 bg-white rounded-full absolute top-1 transition-all",
                                                            embedEnabled ? "right-1" : "left-1"
                                                        )} />
                                                    </button>
                                                </div>
                                                {/* Other app embeds (greyed out) */}
                                                <div className="flex items-center justify-between p-3 opacity-40">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-zinc-700" />
                                                        <div>
                                                            <div className="w-24 h-3 bg-zinc-700 rounded" />
                                                            <div className="w-16 h-2 bg-zinc-800 rounded mt-1" />
                                                        </div>
                                                    </div>
                                                    <div className="w-11 h-6 bg-zinc-700 rounded-full" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Status check */}
                            <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-3 text-sm">
                                {embedEnabled ? (
                                    <>
                                        <CheckCircle2 size={16} className="text-green-400" />
                                        <span className="text-green-400">Widget is enabled on your Shopify store</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle size={16} className="text-amber-400" />
                                        <span className="text-amber-400">Widget is not visible to customers. Enable the app embed above.</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Widget Configuration */}
                        <div className="p-6 border-b border-white/5">
                            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                <Settings2 size={16} className="text-zinc-400" />
                                Widget Configuration
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-zinc-400 text-xs font-medium mb-2 block">Position</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setWidgetPosition('bottom-right')}
                                            className={cn(
                                                "flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors",
                                                widgetPosition === 'bottom-right'
                                                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                                                    : "border-white/10 text-zinc-400 hover:bg-white/5"
                                            )}
                                        >
                                            Bottom Right
                                        </button>
                                        <button
                                            onClick={() => setWidgetPosition('bottom-left')}
                                            className={cn(
                                                "flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors",
                                                widgetPosition === 'bottom-left'
                                                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                                                    : "border-white/10 text-zinc-400 hover:bg-white/5"
                                            )}
                                        >
                                            Bottom Left
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-zinc-400 text-xs font-medium mb-2 block">Mobile Visibility</label>
                                    <button
                                        onClick={() => setShowOnMobile(!showOnMobile)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-2.5 rounded-lg border transition-colors",
                                            showOnMobile
                                                ? "border-green-500/30 bg-green-500/5 text-green-400"
                                                : "border-white/10 text-zinc-400 hover:bg-white/5"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Smartphone size={16} />
                                            <span className="text-sm font-medium">Show on mobile</span>
                                        </div>
                                        <div className={cn(
                                            "w-10 h-5 rounded-full relative transition-colors",
                                            showOnMobile ? "bg-green-600" : "bg-zinc-600"
                                        )}>
                                            <div className={cn(
                                                "w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all",
                                                showOnMobile ? "right-[3px]" : "left-[3px]"
                                            )} />
                                        </div>
                                    </button>
                                </div>

                                <div>
                                    <label className="text-zinc-400 text-xs font-medium mb-2 block">Auto-Open Delay</label>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setAutoOpen(!autoOpen)}
                                            className={cn(
                                                "flex items-center justify-between px-4 py-2.5 rounded-lg border transition-colors flex-1",
                                                autoOpen
                                                    ? "border-blue-500/30 bg-blue-500/5 text-blue-400"
                                                    : "border-white/10 text-zinc-400 hover:bg-white/5"
                                            )}
                                        >
                                            <span className="text-sm font-medium">Auto-open widget</span>
                                            <div className={cn(
                                                "w-10 h-5 rounded-full relative transition-colors",
                                                autoOpen ? "bg-blue-600" : "bg-zinc-600"
                                            )}>
                                                <div className={cn(
                                                    "w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all",
                                                    autoOpen ? "right-[3px]" : "left-[3px]"
                                                )} />
                                            </div>
                                        </button>
                                        {autoOpen && (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={autoOpenDelay}
                                                    onChange={e => setAutoOpenDelay(Number(e.target.value))}
                                                    min={1}
                                                    max={60}
                                                    className="w-16 bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                />
                                                <span className="text-zinc-500 text-xs">sec</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-zinc-400 text-xs font-medium mb-2 block">Appearance</label>
                                    <Button
                                        variant="outline"
                                        className="w-full border-zinc-700 text-zinc-300 hover:text-white justify-between"
                                        onClick={() => router.push('/panel/settings')}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Palette size={16} />
                                            <span>Customize Appearance</span>
                                        </div>
                                        <ChevronRight size={14} />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Shopify Theme Snippet */}
                        <div className="p-6">
                            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                                <Code size={16} className="text-zinc-400" />
                                Manual Installation (Theme Liquid)
                            </h3>
                            <p className="text-zinc-500 text-xs mb-4">
                                If you prefer manual installation or need to customize placement, add this snippet to your Shopify theme&apos;s <code className="text-zinc-400 bg-zinc-800 px-1 rounded">theme.liquid</code> before the closing <code className="text-zinc-400 bg-zinc-800 px-1 rounded">&lt;/body&gt;</code> tag.
                            </p>
                            <div className="relative">
                                <pre className="bg-[#0f1115] border border-white/5 rounded-lg p-4 text-xs text-zinc-300 font-mono overflow-x-auto">
                                    {shopifyThemeSnippet}
                                </pre>
                                <div className="absolute top-2 right-2">
                                    <CopyButton text={shopifyThemeSnippet} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── General Script Installation ───────────────── */}
                <div className="bg-[#18181b] border border-white/5 rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Code size={24} className="text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-white font-semibold text-lg">JavaScript Widget Install</h2>
                                <p className="text-zinc-400 text-sm">
                                    For any website — WordPress, Wix, Squarespace, custom HTML, etc.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <p className="text-zinc-400 text-sm mb-4">
                            Paste this code snippet into your website&apos;s HTML, just before the closing <code className="text-zinc-400 bg-zinc-800 px-1 rounded">&lt;/body&gt;</code> tag.
                        </p>
                        <div className="relative">
                            <pre className="bg-[#0f1115] border border-white/5 rounded-lg p-4 text-xs text-zinc-300 font-mono overflow-x-auto">
                                {installSnippet}
                            </pre>
                            <div className="absolute top-2 right-2">
                                <CopyButton text={installSnippet} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Platform-Specific Install Cards ────────────── */}
                <div>
                    <h2 className="text-white font-semibold text-lg mb-4">Platform Guides</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { name: 'WordPress', icon: Globe, color: 'text-blue-400', bgColor: 'bg-blue-500/10', desc: 'Use the Forefront plugin or paste the snippet in your theme.' },
                            { name: 'Wix', icon: Layout, color: 'text-purple-400', bgColor: 'bg-purple-500/10', desc: 'Add via the Custom Code section in Wix settings.' },
                            { name: 'Squarespace', icon: Monitor, color: 'text-white', bgColor: 'bg-zinc-700', desc: 'Inject code via Settings → Advanced → Code Injection.' },
                        ].map(platform => (
                            <div key={platform.name} className="bg-[#18181b] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors cursor-pointer">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", platform.bgColor)}>
                                        <platform.icon size={20} className={platform.color} />
                                    </div>
                                    <h3 className="text-white font-semibold">{platform.name}</h3>
                                </div>
                                <p className="text-zinc-500 text-xs leading-relaxed">{platform.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ─── Allowed Domains ────────────────────────────── */}
                <div className="bg-[#18181b] border border-white/5 rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-white/5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                    <Globe size={24} className="text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-white font-semibold text-lg">Allowed Domains</h2>
                                    <p className="text-zinc-400 text-sm">
                                        Whitelist domains where the chat widget is allowed to load.
                                    </p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:text-white"
                                onClick={() => router.push('/panel/settings')}
                            >
                                Manage Domains
                            </Button>
                        </div>
                    </div>
                    <div className="p-6">
                        {widgetDomains.length > 0 ? (
                            <div className="space-y-2">
                                {widgetDomains.map(d => (
                                    <div key={d.id} className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            {d.verified ? (
                                                <CheckCircle2 size={14} className="text-green-400" />
                                            ) : (
                                                <XCircle size={14} className="text-amber-400" />
                                            )}
                                            <span className="text-zinc-300 text-sm">{d.domain}</span>
                                        </div>
                                        <span className={cn(
                                            "text-xs px-2 py-0.5 rounded-full",
                                            d.verified ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"
                                        )}>
                                            {d.verified ? 'Verified' : 'Pending'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-zinc-500 text-sm">
                                <Globe size={24} className="mx-auto mb-2 text-zinc-600" />
                                No domains configured. The widget will load on any domain.
                            </div>
                        )}
                    </div>
                </div>

                {/* No Shopify — connect prompt */}
                {!activeStore && (
                    <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <ShoppingBag size={20} className="text-green-400 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-green-400 font-semibold mb-1">Connect Shopify for Enhanced Features</h4>
                                <p className="text-zinc-400 text-sm mb-4">
                                    Connect your Shopify store to enable app embed installation, automatic cart tracking, order management, and AI-powered product recommendations.
                                </p>
                                <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-500 text-white"
                                    onClick={() => router.push('/panel/settings/shopify')}
                                >
                                    Connect Shopify Store
                                    <ArrowRight size={14} className="ml-1.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
