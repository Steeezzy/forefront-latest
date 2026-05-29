"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { EmailHero } from '@/components/settings/email/EmailHero';
import { EmailTable } from '@/components/settings/email/EmailTable';
import { Button } from '@/components/ui/button';
import { ExternalLink, ChevronDown, Loader2, XCircle, CheckCircle2, Mail, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DomainConnectModal } from '@/components/settings/domains/DomainConnectModal';
import { apiFetch } from '@/lib/api';

interface EmailConnection {
    id: string;
    email_address: string;
    provider: string;
    status: string;
    created_at: string;
}

export default function EmailSettingsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'Mailbox' | 'Sender address' | 'Domains' | 'Blocked'>('Mailbox');
    const [domainModalOpen, setDomainModalOpen] = useState(false);
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [connectMethod, setConnectMethod] = useState<'gmail' | 'smtp' | null>(null);

    // Data from API
    const [connections, setConnections] = useState<EmailConnection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [connecting, setConnecting] = useState(false);

    // SMTP Form
    const [smtpForm, setSmtpForm] = useState({
        emailAddress: '', imapHost: '', imapPort: 993,
        smtpHost: '', smtpPort: 587, username: '',
        password: '', useSsl: true,
    });

    const loadConnections = useCallback(async () => {
        try {
            const res = await apiFetch('/api/channels/email/connections');
            setConnections(res.data || []);
        } catch (e) {
            console.error('Failed to load email connections:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadConnections(); }, [loadConnections]);

    const handleConnectGmail = async () => {
        setConnecting(true);
        setError('');
        try {
            const res = await apiFetch('/api/channels/email/connect-gmail', { method: 'POST' });
            if (res.url) {
                window.open(res.url, '_blank', 'width=600,height=700');
                setSuccess('Complete Gmail authorization in the popup window.');
                // Poll for connection
                const pollInterval = setInterval(async () => {
                    const check = await apiFetch('/api/channels/email/connections');
                    if ((check.data || []).length > connections.length) {
                        clearInterval(pollInterval);
                        setSuccess('Gmail connected successfully!');
                        setConnecting(false);
                        setShowConnectModal(false);
                        loadConnections();
                    }
                }, 3000);
                setTimeout(() => { clearInterval(pollInterval); setConnecting(false); }, 120000);
            }
        } catch (e: any) {
            setError(e.message || 'Failed to start Gmail OAuth. Ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are configured.');
            setConnecting(false);
        }
    };

    const handleConnectSmtp = async () => {
        if (!smtpForm.emailAddress || !smtpForm.imapHost || !smtpForm.smtpHost) {
            setError('Email, IMAP host, and SMTP host are required.');
            return;
        }
        setConnecting(true);
        setError('');
        try {
            await apiFetch('/api/channels/email/connect-smtp', {
                method: 'POST',
                body: JSON.stringify(smtpForm),
            });
            setSuccess('Email connected successfully via SMTP/IMAP!');
            setShowConnectModal(false);
            setConnectMethod(null);
            setSmtpForm({ emailAddress: '', imapHost: '', imapPort: 993, smtpHost: '', smtpPort: 587, username: '', password: '', useSsl: true });
            loadConnections();
        } catch (e: any) {
            setError(e.message || 'Failed to connect SMTP/IMAP');
        } finally {
            setConnecting(false);
        }
    };

    const handleDisconnect = async (id: string) => {
        if (!confirm('Disconnect this email account?')) return;
        try {
            await apiFetch(`/api/channels/email/connections/${id}`, { method: 'DELETE' });
            loadConnections();
        } catch (e: any) {
            setError(e.message || 'Failed to disconnect');
        }
    };

    const handleSidebarNav = (tab: string) => {
        if (tab === 'Email') return;
        if (['Facebook', 'Instagram', 'WhatsApp', 'Account'].includes(tab)) {
            router.push(`/panel/settings/${tab.toLowerCase().replace(' ', '-')}`);
        } else {
            router.push('/panel/settings');
        }
    };

    // Map connections to mailbox table format
    const mailboxData = connections.map(c => ({
        email: c.email_address,
        status: c.status === 'active' ? 'Connected' : c.status,
    }));

    return (
        <div className="flex min-h-screen bg-[#f8fafc] overflow-hidden h-screen">
            <div className="h-full overflow-y-auto pt-8 pl-8 pb-8">
                <SettingsSidebar activeTab="Email" onTabChange={handleSidebarNav} />
            </div>

            <div className="flex-1 overflow-y-auto h-full p-8 relative custom-scrollbar">
                <div className="max-w-[1000px]">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-6">Email</h1>

                            <div className="flex items-center gap-8 border-b border-gray-200">
                                {[
                                    { id: 'Mailbox', label: 'Mailbox' },
                                    { id: 'Sender address', label: 'Sender address' },
                                    { id: 'Domains', label: 'Domains' },
                                    { id: 'Blocked', label: 'Blocked e-mail addresses' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={cn(
                                            "pb-4 text-sm font-medium transition-colors border-b-2",
                                            activeTab === tab.id
                                                ? "text-blue-500 border-blue-500"
                                                : "text-zinc-500 border-transparent hover:text-zinc-300"
                                        )}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mb-auto">
                            <a href="#" className="flex items-center gap-2 text-zinc-400 text-sm hover:text-blue-400 transition-colors">
                                Forwarding emails to Questron <ExternalLink size={14} />
                            </a>
                            <Button
                                onClick={() => { setShowConnectModal(true); setConnectMethod(null); setError(''); }}
                                className="bg-blue-600 hover:bg-blue-700 text-gray-900 rounded-lg px-4 py-2"
                            >
                                Connect mailbox
                            </Button>
                        </div>
                    </div>

                    {/* Alerts */}
                    {success && (
                        <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm flex items-center gap-2">
                            <CheckCircle2 size={16} /> {success}
                            <button onClick={() => setSuccess('')} className="ml-auto text-emerald-400/50 hover:text-emerald-400"><X size={14} /></button>
                        </div>
                    )}
                    {error && !showConnectModal && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                            <XCircle size={16} /> {error}
                            <button onClick={() => setError('')} className="ml-auto text-red-400/50 hover:text-red-400"><X size={14} /></button>
                        </div>
                    )}

                    {/* Tab Content */}
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">

                        {/* MAILBOX TAB */}
                        {activeTab === 'Mailbox' && (
                            <>
                                {connections.length === 0 && (
                                    <EmailHero
                                        title="Start managing your support emails in 3 steps"
                                        steps={['Connect your mailbox', 'Add a domain', 'Set sender address']}
                                        buttonText="Connect mailbox"
                                        onButtonClick={() => { setShowConnectModal(true); setConnectMethod(null); setError(''); }}
                                        illustrationType="mailbox"
                                    />
                                )}

                                <div className="mb-4">
                                    <p className="text-zinc-400 text-sm">Automatically forward emails from other providers directly to the Questron Inbox, to see and reply to them alongside your chats and messenger conversations.</p>
                                </div>

                                {loading ? (
                                    <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /></div>
                                ) : connections.length > 0 ? (
                                    <div className="space-y-3">
                                        {connections.map(conn => (
                                            <div key={conn.id} className="bg-[#ffffff] border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                                                        <Mail size={18} className="text-purple-400" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-gray-900 text-sm font-medium">{conn.email_address}</h3>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-zinc-500 text-xs capitalize">{conn.provider}</span>
                                                            <div className="flex items-center gap-1">
                                                                <div className={cn("w-1.5 h-1.5 rounded-full", conn.status === 'active' ? "bg-emerald-400" : "bg-yellow-400")} />
                                                                <span className={cn("text-xs", conn.status === 'active' ? "text-emerald-400" : "text-yellow-400")}>
                                                                    {conn.status === 'active' ? 'Active' : conn.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost" size="sm"
                                                    onClick={() => handleDisconnect(conn.id)}
                                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                >
                                                    <Trash2 size={14} className="mr-1" /> Disconnect
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <EmailTable
                                        headers={['Email', 'Status']}
                                        data={[]}
                                        emptyStateMessage="Connect mailbox to start forwarding all your incoming emails to Questron"
                                    />
                                )}

                                <div className="mt-8">
                                    <a href="#" className="text-blue-500 text-sm hover:underline">Missing anything in Email? Give feedback</a>
                                </div>
                            </>
                        )}

                        {/* SENDER ADDRESS TAB */}
                        {activeTab === 'Sender address' && (
                            <>
                                <div className="mb-6">
                                    <p className="text-zinc-400 text-sm mb-4">Keep sending tickets from Questron domain or start using your own domain to improve your credibility and increase the deliverability.</p>

                                    <div className="flex items-center gap-4">
                                        <span className="text-zinc-400 text-sm">Default</span>
                                        <div className="relative">
                                            <select className="appearance-none bg-[#f8fafc] border border-zinc-800 rounded-md py-2 pl-4 pr-10 text-gray-900 text-sm focus:outline-none focus:border-blue-500 cursor-pointer">
                                                <option>Questron domain</option>
                                            </select>
                                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <EmailTable
                                    headers={['Sender address', 'Sender type', 'Status']}
                                    data={[]}
                                    emptyStateMessage="You don't have any connected domains yet, to add a new sender address. Connect your domain"
                                    emptyStateAction={
                                        <button className="text-blue-500 text-sm font-medium hover:underline mt-1">Connect your domain</button>
                                    }
                                />
                            </>
                        )}

                        {/* DOMAINS TAB */}
                        {activeTab === 'Domains' && (
                            <>
                                <EmailHero
                                    title="Start managing your support emails in 3 steps"
                                    steps={['Connect your mailbox', 'Add a domain', 'Set sender address']}
                                    buttonText="Add domain"
                                    onButtonClick={() => setDomainModalOpen(true)}
                                    illustrationType="domains"
                                />

                                <div className="mb-4">
                                    <p className="text-zinc-400 text-sm">Sending emails from your domain can help improve delivery rates, and make your emails look more professional. Verify your domain and remove &quot;via questron.com&quot; from your emails.</p>
                                </div>

                                <EmailTable
                                    headers={['Domain', 'Status', 'Usage']}
                                    data={[]}
                                    emptyStateMessage="You haven't added any domain yet."
                                    emptyStateAction={
                                        <button onClick={() => setDomainModalOpen(true)} className="text-blue-500 text-sm font-medium hover:underline mt-1">Add your first domain</button>
                                    }
                                />

                                <DomainConnectModal open={domainModalOpen} onClose={() => setDomainModalOpen(false)} defaultTab="email" />
                            </>
                        )}

                        {/* BLOCKED TAB */}
                        {activeTab === 'Blocked' && (
                            <>
                                <div className="flex justify-end mb-4">
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-gray-900">
                                        Block another e-mail address
                                    </Button>
                                </div>

                                <div className="mb-4">
                                    <p className="text-zinc-400 text-sm">List of blocked e-mail addresses from which you won&apos;t receive any tickets.</p>
                                </div>

                                <EmailTable
                                    headers={['Email', 'Last update']}
                                    data={[]}
                                    emptyStateMessage="No filtered emails"
                                />
                            </>
                        )}
                    </div>
                </div>

                {/* ── Connect Mailbox Modal ── */}
                {showConnectModal && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowConnectModal(false)}>
                        <div className="bg-[#ffffff] border border-gray-200 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-gray-900 text-lg font-semibold">Connect Mailbox</h2>
                                <button onClick={() => setShowConnectModal(false)} className="text-zinc-500 hover:text-gray-900">
                                    <X size={20} />
                                </button>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                                    <XCircle size={16} /> {error}
                                </div>
                            )}

                            {!connectMethod ? (
                                /* ── Choose Method ── */
                                <div className="space-y-3">
                                    <button
                                        onClick={handleConnectGmail}
                                        disabled={connecting}
                                        className="w-full flex items-center gap-4 p-4 bg-[#f8fafc] border border-gray-200 rounded-xl hover:border-blue-500/30 hover:bg-blue-500/5 transition-all text-left"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                            <Mail size={18} className="text-red-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-gray-900 text-sm font-medium">Connect Gmail</h3>
                                            <p className="text-zinc-500 text-xs mt-0.5">Sign in with Google to connect your Gmail account</p>
                                        </div>
                                        {connecting && <Loader2 size={16} className="text-blue-400 animate-spin ml-auto" />}
                                    </button>

                                    <button
                                        onClick={() => setConnectMethod('smtp')}
                                        className="w-full flex items-center gap-4 p-4 bg-[#f8fafc] border border-gray-200 rounded-xl hover:border-blue-500/30 hover:bg-blue-500/5 transition-all text-left"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                            <Mail size={18} className="text-purple-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-gray-900 text-sm font-medium">Connect via SMTP/IMAP</h3>
                                            <p className="text-zinc-500 text-xs mt-0.5">For Outlook, Yahoo, custom domains, or any IMAP-compatible provider</p>
                                        </div>
                                    </button>

                                    <p className="text-zinc-600 text-xs text-center mt-4">
                                        You can also set up email forwarding to receive emails without connecting your account.
                                    </p>
                                </div>
                            ) : (
                                /* ── SMTP/IMAP Form ── */
                                <div className="space-y-4">
                                    <button
                                        onClick={() => { setConnectMethod(null); setError(''); }}
                                        className="text-zinc-400 hover:text-gray-900 text-xs mb-2 transition-colors"
                                    >
                                        ← Back to options
                                    </button>

                                    <div>
                                        <label className="block text-sm text-zinc-300 mb-1">Email Address <span className="text-red-400">*</span></label>
                                        <input
                                            type="email"
                                            value={smtpForm.emailAddress}
                                            onChange={e => setSmtpForm(f => ({ ...f, emailAddress: e.target.value }))}
                                            placeholder="you@company.com"
                                            className="w-full bg-[#f8fafc] border border-zinc-800 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-zinc-400 mb-1">IMAP Host <span className="text-red-400">*</span></label>
                                            <input
                                                value={smtpForm.imapHost}
                                                onChange={e => setSmtpForm(f => ({ ...f, imapHost: e.target.value }))}
                                                placeholder="imap.gmail.com"
                                                className="w-full bg-[#f8fafc] border border-zinc-800 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-zinc-400 mb-1">IMAP Port</label>
                                            <input
                                                type="number"
                                                value={smtpForm.imapPort}
                                                onChange={e => setSmtpForm(f => ({ ...f, imapPort: parseInt(e.target.value) || 993 }))}
                                                className="w-full bg-[#f8fafc] border border-zinc-800 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-zinc-400 mb-1">SMTP Host <span className="text-red-400">*</span></label>
                                            <input
                                                value={smtpForm.smtpHost}
                                                onChange={e => setSmtpForm(f => ({ ...f, smtpHost: e.target.value }))}
                                                placeholder="smtp.gmail.com"
                                                className="w-full bg-[#f8fafc] border border-zinc-800 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-zinc-400 mb-1">SMTP Port</label>
                                            <input
                                                type="number"
                                                value={smtpForm.smtpPort}
                                                onChange={e => setSmtpForm(f => ({ ...f, smtpPort: parseInt(e.target.value) || 587 }))}
                                                className="w-full bg-[#f8fafc] border border-zinc-800 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs text-zinc-400 mb-1">Username</label>
                                        <input
                                            value={smtpForm.username}
                                            onChange={e => setSmtpForm(f => ({ ...f, username: e.target.value }))}
                                            placeholder="Same as email address"
                                            className="w-full bg-[#f8fafc] border border-zinc-800 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs text-zinc-400 mb-1">Password / App Password</label>
                                        <input
                                            type="password"
                                            value={smtpForm.password}
                                            onChange={e => setSmtpForm(f => ({ ...f, password: e.target.value }))}
                                            placeholder="App-specific password"
                                            className="w-full bg-[#f8fafc] border border-zinc-800 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={smtpForm.useSsl}
                                            onChange={e => setSmtpForm(f => ({ ...f, useSsl: e.target.checked }))}
                                            className="rounded border-zinc-700 bg-[#f8fafc]"
                                        />
                                        <span className="text-zinc-400 text-sm">Use SSL/TLS</span>
                                    </label>

                                    <div className="flex items-center gap-3 pt-2">
                                        <Button
                                            onClick={handleConnectSmtp}
                                            disabled={connecting || !smtpForm.emailAddress}
                                            className="bg-blue-600 hover:bg-blue-700 text-gray-900 disabled:opacity-50"
                                        >
                                            {connecting && <Loader2 size={16} className="mr-2 animate-spin" />}
                                            {connecting ? 'Connecting...' : 'Connect Email'}
                                        </Button>
                                        <Button variant="ghost" onClick={() => setConnectMethod(null)} className="text-zinc-400">Cancel</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
