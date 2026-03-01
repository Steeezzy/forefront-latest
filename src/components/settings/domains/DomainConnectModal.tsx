"use client";

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';
import {
    Globe, Mail, Monitor, CheckCircle2, XCircle, Copy, Check,
    RefreshCw, Trash2, Plus, ExternalLink, Shield, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────

interface WidgetDomain {
    id: string;
    domain: string;
    verified: boolean;
    verification_token: string;
    verified_at: string | null;
    created_at: string;
}

interface CustomDomain {
    id: string;
    domain: string;
    verified: boolean;
    verification_token: string;
    cname_target: string;
    ssl_status: string;
    verified_at: string | null;
}

interface EmailDomain {
    id: string;
    domain: string;
    spf_verified: boolean;
    dkim_verified: boolean;
    dmarc_verified: boolean;
    status: string;
    required_records: DnsRecord[];
}

interface DnsRecord {
    type: string;
    host: string;
    value: string;
    description: string;
    verified?: boolean;
}

// ─── Sub-Components ──────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="p-1 hover:bg-white/10 rounded transition-colors text-zinc-400 hover:text-white"
            title="Copy to clipboard"
        >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
    );
}

function DnsRecordCard({ record }: { record: DnsRecord }) {
    return (
        <div className="bg-[#0f1115] border border-white/5 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400 uppercase">{record.description}</span>
                {record.verified !== undefined && (
                    record.verified
                        ? <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 size={12} /> Verified</span>
                        : <span className="flex items-center gap-1 text-xs text-amber-400"><XCircle size={12} /> Pending</span>
                )}
            </div>
            <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                <span className="text-zinc-500">Type</span>
                <div className="flex items-center gap-2">
                    <code className="text-white bg-white/5 px-2 py-0.5 rounded text-xs">{record.type}</code>
                </div>
                <span className="text-zinc-500">Host</span>
                <div className="flex items-center gap-2">
                    <code className="text-white bg-white/5 px-2 py-0.5 rounded text-xs flex-1 break-all">{record.host}</code>
                    <CopyButton text={record.host} />
                </div>
                <span className="text-zinc-500">Value</span>
                <div className="flex items-center gap-2">
                    <code className="text-white bg-white/5 px-2 py-0.5 rounded text-xs flex-1 break-all max-h-20 overflow-auto">{record.value}</code>
                    <CopyButton text={record.value} />
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ verified, label }: { verified: boolean; label?: string }) {
    return (
        <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
            verified ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
        )}>
            {verified ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
            {label || (verified ? 'Verified' : 'Pending')}
        </span>
    );
}

// ─── Tab: Widget Domains ─────────────────────────────────────────────

function WidgetDomainsTab() {
    const [domains, setDomains] = useState<WidgetDomain[]>([]);
    const [newDomain, setNewDomain] = useState('');
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [verifying, setVerifying] = useState<string | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [selectedDomain, setSelectedDomain] = useState<WidgetDomain | null>(null);

    const fetchDomains = useCallback(async () => {
        try {
            const res = await apiFetch('/api/domains/widget');
            const data = await res.json();
            if (data.success) setDomains(data.domains);
        } catch { /* ignore */ }
        setLoading(false);
    }, []);

    useEffect(() => { fetchDomains(); }, [fetchDomains]);

    const handleAdd = async () => {
        if (!newDomain.trim()) return;
        setAdding(true);
        try {
            const res = await apiFetch('/api/domains/widget', {
                method: 'POST',
                body: JSON.stringify({ domain: newDomain.trim() }),
            });
            const data = await res.json();
            if (data.success) {
                setSelectedDomain(data.domain);
                setNewDomain('');
                setShowAdd(false);
                await fetchDomains();
            }
        } catch { /* ignore */ }
        setAdding(false);
    };

    const handleVerify = async (id: string) => {
        setVerifying(id);
        try {
            const res = await apiFetch(`/api/domains/widget/${id}/verify`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                await fetchDomains();
                if (data.verified) {
                    setSelectedDomain(null);
                }
            }
        } catch { /* ignore */ }
        setVerifying(null);
    };

    const handleDelete = async (id: string) => {
        try {
            await apiFetch(`/api/domains/widget/${id}`, { method: 'DELETE' });
            await fetchDomains();
            if (selectedDomain?.id === id) setSelectedDomain(null);
        } catch { /* ignore */ }
    };

    if (loading) return <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-zinc-500" /></div>;

    return (
        <div className="space-y-4">
            <p className="text-zinc-400 text-sm">
                Whitelist domains where your chat widget is allowed to load. The widget won't render on domains that aren't verified here.
            </p>

            {/* Domain List */}
            {domains.length > 0 && (
                <div className="bg-[#0f1115] border border-white/5 rounded-xl overflow-hidden">
                    {domains.map((d, i) => (
                        <div
                            key={d.id}
                            className={cn(
                                "flex items-center justify-between px-4 py-3 hover:bg-white/2 transition-colors cursor-pointer",
                                i < domains.length - 1 && "border-b border-white/5"
                            )}
                            onClick={() => setSelectedDomain(d)}
                        >
                            <div className="flex items-center gap-3">
                                <Globe size={16} className="text-zinc-500" />
                                <span className="text-white text-sm">{d.domain}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <StatusBadge verified={d.verified} />
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(d.id); }}
                                    className="p-1 hover:bg-white/10 rounded text-zinc-500 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Selected Domain — DNS instructions */}
            {selectedDomain && !selectedDomain.verified && (
                <div className="bg-[#18181b] border border-white/10 rounded-xl p-5 space-y-4">
                    <h4 className="text-white font-medium">Verify {selectedDomain.domain}</h4>
                    <p className="text-zinc-400 text-sm">Add this TXT record to your DNS settings:</p>
                    <DnsRecordCard record={{
                        type: 'TXT',
                        host: '@',
                        value: selectedDomain.verification_token,
                        description: 'Verification Record',
                    }} />
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => handleVerify(selectedDomain.id)}
                            disabled={verifying === selectedDomain.id}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {verifying === selectedDomain.id ? (
                                <><Loader2 size={14} className="animate-spin mr-2" /> Checking...</>
                            ) : (
                                <><RefreshCw size={14} className="mr-2" /> Verify DNS</>
                            )}
                        </Button>
                        <span className="text-zinc-500 text-xs">DNS changes can take up to 48 hours to propagate</span>
                    </div>
                </div>
            )}

            {/* Add Domain */}
            {showAdd ? (
                <div className="flex items-center gap-2">
                    <Input
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        placeholder="e.g. mywebsite.com or *.mywebsite.com"
                        className="bg-[#0f1115] border-white/10 text-white flex-1"
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        autoFocus
                    />
                    <Button onClick={handleAdd} disabled={adding} className="bg-blue-600 hover:bg-blue-700">
                        {adding ? <Loader2 size={14} className="animate-spin" /> : 'Add'}
                    </Button>
                    <Button variant="ghost" onClick={() => { setShowAdd(false); setNewDomain(''); }} className="text-zinc-400">
                        Cancel
                    </Button>
                </div>
            ) : (
                <Button onClick={() => setShowAdd(true)} variant="outline" className="border-dashed border-white/10 text-zinc-400 hover:text-white hover:border-white/20">
                    <Plus size={14} className="mr-2" /> Add domain
                </Button>
            )}

            {domains.length === 0 && !showAdd && (
                <div className="text-center py-8 text-zinc-500 text-sm">
                    No domains configured yet. By default, the widget loads on any domain.
                </div>
            )}
        </div>
    );
}

// ─── Tab: Custom Domain ──────────────────────────────────────────────

function CustomDomainTab() {
    const [domains, setDomains] = useState<CustomDomain[]>([]);
    const [newDomain, setNewDomain] = useState('');
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [verifying, setVerifying] = useState<string | null>(null);
    const [showAdd, setShowAdd] = useState(false);

    const fetchDomains = useCallback(async () => {
        try {
            const res = await apiFetch('/api/domains/custom');
            const data = await res.json();
            if (data.success) setDomains(data.domains);
        } catch { /* ignore */ }
        setLoading(false);
    }, []);

    useEffect(() => { fetchDomains(); }, [fetchDomains]);

    const handleAdd = async () => {
        if (!newDomain.trim()) return;
        setAdding(true);
        try {
            const res = await apiFetch('/api/domains/custom', {
                method: 'POST',
                body: JSON.stringify({ domain: newDomain.trim() }),
            });
            const data = await res.json();
            if (data.success) {
                setNewDomain('');
                setShowAdd(false);
                await fetchDomains();
            }
        } catch { /* ignore */ }
        setAdding(false);
    };

    const handleVerify = async (id: string) => {
        setVerifying(id);
        try {
            await apiFetch(`/api/domains/custom/${id}/verify`, { method: 'POST' });
            await fetchDomains();
        } catch { /* ignore */ }
        setVerifying(null);
    };

    const handleDelete = async (id: string) => {
        try {
            await apiFetch(`/api/domains/custom/${id}`, { method: 'DELETE' });
            await fetchDomains();
        } catch { /* ignore */ }
    };

    if (loading) return <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-zinc-500" /></div>;

    return (
        <div className="space-y-4">
            <p className="text-zinc-400 text-sm">
                Point a custom subdomain (e.g. <code className="text-white bg-white/5 px-1 rounded">support.yourcompany.com</code>) to Forefront so your chat page is served on your own domain.
            </p>

            {domains.map((d) => (
                <div key={d.id} className="bg-[#0f1115] border border-white/5 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Globe size={16} className="text-blue-400" />
                            <span className="text-white font-medium">{d.domain}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <StatusBadge verified={d.verified} />
                            {d.verified && d.ssl_status !== 'active' && (
                                <span className="text-xs text-amber-400">SSL: {d.ssl_status}</span>
                            )}
                            <button
                                onClick={() => handleDelete(d.id)}
                                className="p-1 hover:bg-white/10 rounded text-zinc-500 hover:text-red-400"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>

                    {!d.verified && (
                        <>
                            <p className="text-zinc-400 text-sm">Add these DNS records:</p>
                            <div className="space-y-3">
                                <DnsRecordCard record={{
                                    type: 'CNAME',
                                    host: d.domain.split('.')[0],
                                    value: d.cname_target,
                                    description: 'Points your subdomain to Forefront',
                                }} />
                                <DnsRecordCard record={{
                                    type: 'TXT',
                                    host: `_antigravity.${d.domain}`,
                                    value: d.verification_token,
                                    description: 'Verification Record',
                                }} />
                            </div>
                            <Button
                                onClick={() => handleVerify(d.id)}
                                disabled={verifying === d.id}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {verifying === d.id ? (
                                    <><Loader2 size={14} className="animate-spin mr-2" /> Checking...</>
                                ) : (
                                    <><RefreshCw size={14} className="mr-2" /> Verify DNS</>
                                )}
                            </Button>
                        </>
                    )}
                </div>
            ))}

            {showAdd ? (
                <div className="flex items-center gap-2">
                    <Input
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        placeholder="e.g. support.yourcompany.com"
                        className="bg-[#0f1115] border-white/10 text-white flex-1"
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        autoFocus
                    />
                    <Button onClick={handleAdd} disabled={adding} className="bg-blue-600 hover:bg-blue-700">
                        {adding ? <Loader2 size={14} className="animate-spin" /> : 'Add'}
                    </Button>
                    <Button variant="ghost" onClick={() => { setShowAdd(false); setNewDomain(''); }} className="text-zinc-400">
                        Cancel
                    </Button>
                </div>
            ) : (
                <Button onClick={() => setShowAdd(true)} variant="outline" className="border-dashed border-white/10 text-zinc-400 hover:text-white hover:border-white/20">
                    <Plus size={14} className="mr-2" /> Add custom domain
                </Button>
            )}

            {domains.length === 0 && !showAdd && (
                <div className="text-center py-8 text-zinc-500 text-sm">
                    No custom domains configured. Your chat page is available at the default Forefront URL.
                </div>
            )}
        </div>
    );
}

// ─── Tab: Email Domain ───────────────────────────────────────────────

function EmailDomainTab() {
    const [domains, setDomains] = useState<EmailDomain[]>([]);
    const [newDomain, setNewDomain] = useState('');
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [verifying, setVerifying] = useState<string | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchDomains = useCallback(async () => {
        try {
            const res = await apiFetch('/api/domains/email');
            const data = await res.json();
            if (data.success) setDomains(data.domains);
        } catch { /* ignore */ }
        setLoading(false);
    }, []);

    useEffect(() => { fetchDomains(); }, [fetchDomains]);

    const handleAdd = async () => {
        if (!newDomain.trim()) return;
        setAdding(true);
        try {
            const res = await apiFetch('/api/domains/email', {
                method: 'POST',
                body: JSON.stringify({ domain: newDomain.trim() }),
            });
            const data = await res.json();
            if (data.success) {
                setNewDomain('');
                setShowAdd(false);
                setExpandedId(data.domain.id);
                await fetchDomains();
            }
        } catch { /* ignore */ }
        setAdding(false);
    };

    const handleVerify = async (id: string) => {
        setVerifying(id);
        try {
            await apiFetch(`/api/domains/email/${id}/verify`, { method: 'POST' });
            await fetchDomains();
        } catch { /* ignore */ }
        setVerifying(null);
    };

    const handleDelete = async (id: string) => {
        try {
            await apiFetch(`/api/domains/email/${id}`, { method: 'DELETE' });
            await fetchDomains();
            if (expandedId === id) setExpandedId(null);
        } catch { /* ignore */ }
    };

    if (loading) return <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-zinc-500" /></div>;

    return (
        <div className="space-y-4">
            <p className="text-zinc-400 text-sm">
                Verify your domain to send emails from <code className="text-white bg-white/5 px-1 rounded">support@yourdomain.com</code> instead of using the Forefront domain. This improves deliverability and credibility.
            </p>

            {domains.map((d) => (
                <div key={d.id} className="bg-[#0f1115] border border-white/5 rounded-xl overflow-hidden">
                    <div
                        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/2 transition-colors"
                        onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                    >
                        <div className="flex items-center gap-3">
                            <Mail size={16} className="text-blue-400" />
                            <span className="text-white font-medium">{d.domain}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-500">SPF</span>
                                {d.spf_verified ? <CheckCircle2 size={12} className="text-emerald-400" /> : <XCircle size={12} className="text-amber-400" />}
                                <span className="text-xs text-zinc-500">DKIM</span>
                                {d.dkim_verified ? <CheckCircle2 size={12} className="text-emerald-400" /> : <XCircle size={12} className="text-amber-400" />}
                                <span className="text-xs text-zinc-500">DMARC</span>
                                {d.dmarc_verified ? <CheckCircle2 size={12} className="text-emerald-400" /> : <XCircle size={12} className="text-amber-400" />}
                            </div>
                            <StatusBadge
                                verified={d.status === 'verified'}
                                label={d.status === 'partial' ? 'Partial' : d.status === 'verified' ? 'Verified' : 'Pending'}
                            />
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(d.id); }}
                                className="p-1 hover:bg-white/10 rounded text-zinc-500 hover:text-red-400"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>

                    {expandedId === d.id && (
                        <div className="border-t border-white/5 p-5 space-y-3">
                            <p className="text-zinc-400 text-sm">Add these DNS records to your domain provider:</p>
                            {(d.required_records || []).map((record, i) => (
                                <DnsRecordCard key={i} record={record} />
                            ))}
                            <Button
                                onClick={() => handleVerify(d.id)}
                                disabled={verifying === d.id}
                                className="bg-blue-600 hover:bg-blue-700 mt-2"
                            >
                                {verifying === d.id ? (
                                    <><Loader2 size={14} className="animate-spin mr-2" /> Checking all records...</>
                                ) : (
                                    <><Shield size={14} className="mr-2" /> Verify all records</>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            ))}

            {showAdd ? (
                <div className="flex items-center gap-2">
                    <Input
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        placeholder="e.g. yourcompany.com"
                        className="bg-[#0f1115] border-white/10 text-white flex-1"
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        autoFocus
                    />
                    <Button onClick={handleAdd} disabled={adding} className="bg-blue-600 hover:bg-blue-700">
                        {adding ? <Loader2 size={14} className="animate-spin" /> : 'Add'}
                    </Button>
                    <Button variant="ghost" onClick={() => { setShowAdd(false); setNewDomain(''); }} className="text-zinc-400">
                        Cancel
                    </Button>
                </div>
            ) : (
                <Button onClick={() => setShowAdd(true)} variant="outline" className="border-dashed border-white/10 text-zinc-400 hover:text-white hover:border-white/20">
                    <Plus size={14} className="mr-2" /> Add email domain
                </Button>
            )}

            {domains.length === 0 && !showAdd && (
                <div className="text-center py-8 text-zinc-500 text-sm">
                    No email domains configured. Emails are sent from the Forefront domain by default.
                </div>
            )}
        </div>
    );
}

// ─── Main Modal ──────────────────────────────────────────────────────

type DomainTab = 'widget' | 'custom' | 'email';

interface DomainConnectModalProps {
    open: boolean;
    onClose: () => void;
    defaultTab?: DomainTab;
}

export function DomainConnectModal({ open, onClose, defaultTab = 'widget' }: DomainConnectModalProps) {
    const [tab, setTab] = useState<DomainTab>(defaultTab);

    useEffect(() => {
        if (open) setTab(defaultTab);
    }, [open, defaultTab]);

    const tabs: { id: DomainTab; label: string; icon: React.ReactNode; desc: string }[] = [
        { id: 'widget', label: 'Widget Domains', icon: <Monitor size={16} />, desc: 'Where your widget loads' },
        { id: 'custom', label: 'Custom Domain', icon: <Globe size={16} />, desc: 'Branded chat page URL' },
        { id: 'email', label: 'Email Domain', icon: <Mail size={16} />, desc: 'Send from your domain' },
    ];

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="bg-[#161920] border-white/10 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-white">Connect Domain</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Configure domains for your widget, branded chat page, and email sending.
                    </DialogDescription>
                </DialogHeader>

                {/* Tab Switcher */}
                <div className="flex gap-2 mt-2">
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={cn(
                                "flex-1 flex items-center gap-2 p-3 rounded-lg border transition-all text-left",
                                tab === t.id
                                    ? "bg-blue-600/10 border-blue-500/30 text-blue-400"
                                    : "bg-white/2 border-white/5 text-zinc-400 hover:border-white/10 hover:text-white"
                            )}
                        >
                            {t.icon}
                            <div>
                                <div className="text-sm font-medium">{t.label}</div>
                                <div className="text-xs opacity-60">{t.desc}</div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="mt-4 min-h-[200px]">
                    {tab === 'widget' && <WidgetDomainsTab />}
                    {tab === 'custom' && <CustomDomainTab />}
                    {tab === 'email' && <EmailDomainTab />}
                </div>
            </DialogContent>
        </Dialog>
    );
}
