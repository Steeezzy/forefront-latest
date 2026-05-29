"use client";

import { useEffect, useState } from "react";
import { Plus, PhoneCall, Trash2, Link2, Globe, X, Smile, Search, SlidersHorizontal, Settings, AlertTriangle } from "lucide-react";
import { buildProxyUrl } from "@/lib/backend-url";
import { resolveWorkspaceSession } from "@/lib/workspace-session";

interface PhoneNumber {
    id: string;
    phone_number: string;
    country: string;
    type: 'local' | 'toll-free';
    status: 'active' | 'pending' | 'released';
    provider?: string;
    connection_type?: string;
    forwarded_to?: string;
    assigned_agent_id?: string;
    assigned_agent_name?: string;
    created_at?: string;
}

interface AvailableNumber {
    phoneNumber: string;
    friendlyName: string;
    region: string;
    capabilities: { voice: boolean; sms: boolean };
    price?: number;
}

interface VoiceAgent {
    id: string;
    name: string;
}

interface NumberProviderStatus {
    id: string;
    name: string;
    status: 'configured' | 'workspace' | 'env' | 'not_configured' | 'partial' | 'coming_soon' | 'manual';
    supportsInventory: boolean;
    supportsProvision: boolean;
    supportsLocal: boolean;
    supportsTollFree: boolean;
    note: string;
}

export default function NumbersPage() {
    const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
    const [agents, setAgents] = useState<VoiceAgent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [selectedNumber, setSelectedNumber] = useState<PhoneNumber | null>(null);

    // Add Numbers Modal State
    const [selectedProvider, setSelectedProvider] = useState<string>("twilio");
    const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([]);
    const [providerCatalog, setProviderCatalog] = useState<NumberProviderStatus[]>([]);
    const [availableError, setAvailableError] = useState<string | null>(null);

    const providers = [
        { id: 'twilio', name: 'Twilio', icon: '🔴', color: '#f22f46' },
        { id: 'plivo', name: 'Plivo', icon: '📱', color: '#2563eb' },
        { id: 'tatatele', name: 'Tata Tele', icon: '🏢', color: '#ea580c' },
        { id: 'exotel', name: 'Exotel', icon: '📞', color: '#3b82f6' },
        { id: 'mcube', name: 'Mcube', icon: '☁️', color: '#10b981' },
        { id: 'vobiz', name: 'Vobiz', icon: '🎙️', color: '#8b5cf6' }
    ];
    const [loadingAvailable, setLoadingAvailable] = useState(false);
    const [country, setCountry] = useState("IN");
    const [type, setType] = useState<"local" | "toll-free">("local");
    const [submitting, setSubmitting] = useState(false);

    // Pagination & Config Checks for Adding Numbers
    const [offset, setOffset] = useState(0);
    const [totalAvailable, setTotalAvailable] = useState(0);
    const [isConfigured, setIsConfigured] = useState(true);
    const LIMIT = 20;

    // Assign Modal State
    const [selectedAgent, setSelectedAgent] = useState("");

    // BYOT Modal State
    const [isByotOpen, setIsByotOpen] = useState(false);
    const [byotTab, setByotTab] = useState<'forwarding' | 'sip' | 'port'>('forwarding');
    const [existingNumber, setExistingNumber] = useState('');
    const [sipDomain, setSipDomain] = useState('');
    const [sipUsername, setSipUsername] = useState('');
    const [sipPassword, setSipPassword] = useState('');
    const [portProvider, setPortProvider] = useState('');
    const [portAccount, setPortAccount] = useState('');
    const [qestronNumber, setQestronNumber] = useState('');
    const [portSubmitting, setPortSubmitting] = useState(false);

    useEffect(() => {
        if (isByotOpen) {
            const firstActive = numbers.find(n => n.provider !== 'own' && n.provider !== 'byot')?.phone_number;
            setQestronNumber(firstActive || '');
        }
    }, [isByotOpen, numbers]);

    const [orgId, setOrgId] = useState<string>("");
    const providerStatusById = Object.fromEntries(providerCatalog.map((provider) => [provider.id, provider]));
    const selectedProviderMeta = providerStatusById[selectedProvider];

    const getProviderBadge = (providerId: string) => {
        const status = providerStatusById[providerId]?.status;
        if (status === 'configured' || status === 'workspace' || status === 'env') return { label: 'Ready', color: '#166534', bg: '#dcfce7', border: '#86efac' };
        if (status === 'partial') return { label: 'Partial', color: '#92400e', bg: '#fef3c7', border: '#fcd34d' };
        if (status === 'not_configured') return { label: 'Needs API', color: '#991b1b', bg: '#fee2e2', border: '#fecaca' };
        if (status === 'coming_soon') return { label: 'Soon', color: '#52525b', bg: '#f4f4f5', border: '#e4e4e7' };
        return { label: 'Manual', color: '#1d4ed8', bg: '#dbeafe', border: '#93c5fd' };
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            let activeOrgId = orgId;
            if (!activeOrgId) {
                const session = await resolveWorkspaceSession();
                activeOrgId = session.workspaceId;
                setOrgId(activeOrgId);
            }

            const [numbersRes, agentRes, providerRes] = await Promise.all([
                fetch(buildProxyUrl(`/api/numbers?orgId=${activeOrgId}`)),
                fetch(buildProxyUrl(`/api/voice-agents?orgId=${activeOrgId}`)),
                fetch(buildProxyUrl(`/api/numbers/providers?orgId=${activeOrgId}`)),
            ]);

            if (!numbersRes.ok) throw new Error("Failed to fetch numbers");

            const data = await numbersRes.json();
            setNumbers(data.map((number: any) => ({
                ...number,
                phone_number: number.phone_number || number.number,
                country: number.country_code || number.country || 'US',
                assigned_agent_name: number.agent_name || number.assigned_agent_name,
                provider: number.provider,
                connection_type: number.connection_type,
                forwarded_to: number.forwarded_to,
            })));

            if (agentRes.ok) {
                const agentData = await agentRes.json();
                setAgents(agentData);
            }

            if (providerRes.ok) {
                const providerData = await providerRes.json();
                setProviderCatalog(providerData.providers || []);
            }
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableNumbers = async (append = false) => {
        if (!orgId) return;
        if (selectedProviderMeta && !selectedProviderMeta.supportsInventory) {
            setAvailableNumbers([]);
            setOffset(0);
            setTotalAvailable(0);
            setIsConfigured(selectedProviderMeta.status === 'configured' || selectedProviderMeta.status === 'workspace' || selectedProviderMeta.status === 'env');
            setAvailableError(null);
            return;
        }
        setLoadingAvailable(true);
        setAvailableError(null);
        try {
            const currentOffset = append ? offset : 0;
            const res = await fetch(buildProxyUrl(`/api/numbers/available?orgId=${orgId}&countryCode=${country}&type=${type}&provider=${selectedProvider}&limit=${LIMIT}&offset=${currentOffset}`));
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || data.message || "Failed to fetch available numbers");
            }
            
            if (append) {
                setAvailableNumbers(prev => [...prev, ...data.numbers]);
                setOffset(prev => prev + LIMIT);
            } else {
                setAvailableNumbers(data.numbers || []);
                setOffset(LIMIT);
            }
            setTotalAvailable(data.total || 0);
            setIsConfigured(data.isConfigured !== false);
            setAvailableError(data.error || null);
        } catch (err: any) {
            setAvailableError(err.message || "Failed to fetch available numbers");
            console.error("Available numbers error:", err.message);
        } finally {
            setLoadingAvailable(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (isAddOpen && orgId) {
            fetchAvailableNumbers(false);
        }
    }, [isAddOpen, country, type, orgId, selectedProvider, providerCatalog]);

    const handleBuyNumber = async (numberToBuy: AvailableNumber) => {
        setSubmitting(true);
        try {
            const res = await fetch(buildProxyUrl("/api/numbers/provision"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orgId,
                    countryCode: country,
                    type,
                    phoneNumber: numberToBuy.phoneNumber,
                    provider: selectedProvider
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to buy number");
            }
            
            setIsAddOpen(false);
            fetchData();
        } catch (err: any) {
            alert(err.message || "Failed to buy number");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (num: PhoneNumber) => {
        if (!confirm(`Are you sure you want to release ${num.phone_number}?`)) return;
        setSubmitting(true);
        try {
            const res = await fetch(buildProxyUrl(`/api/numbers/${num.id}`), { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to release number");
            fetchData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleConnectByotSip = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(buildProxyUrl("/api/numbers/connect-sip"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ workspaceId: orgId, sipDomain, username: sipUsername, password: sipPassword, port: 5060, existingNumber })
            });
            if (!res.ok) throw new Error("Failed to connect SIP");
            await fetchData();
            setIsByotOpen(false);
            setExistingNumber(""); setSipDomain(""); setSipUsername(""); setSipPassword("");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleConnectByotForward = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(buildProxyUrl("/api/numbers/connect-forwarding"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ workspaceId: orgId, existingNumber, qestronNumber })
            });
            if (!res.ok) throw new Error("Failed to configure Call Forwarding");
            await fetchData();
            setIsByotOpen(false);
            setExistingNumber("");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleAssignAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedNumber) return;
        setSubmitting(true);
        try {
            const res = await fetch(buildProxyUrl(`/api/numbers/${selectedNumber.id}/assign`), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    agentId: selectedAgent
                })
            });

            if (!res.ok) throw new Error("Failed to assign agent");
            
            setIsAssignOpen(false);
            setSelectedNumber(null);
            setSelectedAgent("");
            fetchData();
        } catch (err: any) {
            alert(err.message || "Failed to assign");
        } finally {
            setSubmitting(false);
        }
    };

    const handlePortRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!existingNumber.trim()) return;

        setPortSubmitting(true);
        try {
            const res = await fetch(buildProxyUrl("/api/numbers/port-request"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    workspaceId: orgId,
                    existingNumber,
                    currentProvider: portProvider,
                    accountNumber: portAccount,
                })
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Failed to submit port request");

            alert(data.message || "Port request submitted");
            setExistingNumber("");
            setPortProvider("");
            setPortAccount("");
            setIsByotOpen(false);
        } catch (err: any) {
            alert(err.message || "Failed to submit port request");
        } finally {
            setPortSubmitting(false);
        }
    };

    // Country flags helper
    const getFlag = (code: string) => {
        if (!code) return '🌐';
        const str = code.toUpperCase();
        if (str.startsWith('+91') || str === 'IN') return '🇮🇳';
        if (str.startsWith('+1') || str === 'US') return '🇺🇸';
        if (str.startsWith('+44') || str === 'GB' || str === 'UK') return '🇬🇧';
        
        const flags: Record<string, string> = { US: '🇺🇸', IN: '🇮🇳', UK: '🇬🇧', GB: '🇬🇧', CA: '🇨🇦', AU: '🇦🇺' };
        return flags[str] || '🌐';
    };

    const getCountryName = (code: string) => {
        if (!code) return 'Unknown';
        const str = code.toUpperCase();
        if (str.startsWith('+91') || str === 'IN') return 'India';
        if (str.startsWith('+1') || str === 'US') return 'United States';
        if (str.startsWith('+44') || str === 'GB' || str === 'UK') return 'United Kingdom';
        if (str === 'CA') return 'Canada';
        if (str === 'AU') return 'Australia';
        return code;
    };

    return (
        <div style={{ background: '#fcfcfc', minHeight: '100vh', width: '100%', padding: '24px 32px', fontFamily: 'Inter, sans-serif' }}>
            
            {/* Breadcrumb Top Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#71717a' }}>
                    <span>Dashboard</span>
                    <span>&gt;</span>
                    <span style={{ color: '#09090b', fontWeight: 500 }}>Numbers</span>
                </div>
                <div style={{ background: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                    ₹120
                </div>
            </div>

            {/* Title & Add Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#09090b' }}>Numbers</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => setIsAddOpen(true)}
                        style={{
                            background: '#09090b', color: 'white', height: '36px', padding: '0 16px',
                            borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: 'none',
                            display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                    >
                        <Plus size={16} /> Get Number
                    </button>
                    <button
                        onClick={() => setIsByotOpen(true)}
                        style={{
                            background: '#fff', color: '#09090b', height: '36px', padding: '0 16px',
                            borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: '1px solid #e4e4e7',
                            display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                    >
                        <Link2 size={16} /> Connect Your Number
                    </button>
                </div>
            </div>

            {/* Table or Empty State */}
            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading numbers...</div>
            ) : error ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626', background: '#fff', borderRadius: '12px', border: '1px solid #fecaca', margin: '20px 0' }}>
                    <AlertTriangle size={32} style={{ margin: '0 auto 12px', opacity: 0.8 }} />
                    <p style={{ fontSize: '14px', fontWeight: 600 }}>Failed to load numbers</p>
                    <p style={{ fontSize: '13px', marginTop: '4px', opacity: 0.8 }}>{error}</p>
                </div>
            ) : numbers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', background: '#fff', borderRadius: '12px', border: '1px solid #e4e4e7' }}>
                    <PhoneCall size={48} style={{ marginBottom: 16, opacity: 0.4, margin: '0 auto' }} />
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#6b7280' }}>No numbers yet</p>
                    <p style={{ fontSize: '13px' }}>Click "Add Numbers" to buy your first telephony line</p>
                </div>
            ) : (
                <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#fafafa', borderBottom: '1px solid #e4e4e7' }}>
                                {['ID', 'Country', 'Added On', 'Used By', 'Tags', 'Actions'].map((col, i) => (
                                    <th key={i} style={{ padding: '12px 16px', fontSize: '11px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {numbers.map((num, i) => (
                                <tr key={num.id} style={{ borderBottom: '1px solid #f4f4f5', transition: 'background 0.12s' }}>
                                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#09090b', fontWeight: 500, fontFamily: 'monospace' }}>
                                        {num.phone_number}
                                    </td>
                                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '16px' }}>{getFlag(num.country)}</span> {getCountryName(num.country)}
                                    </td>
                                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#71717a' }}>
                                        {num.created_at ? new Date(num.created_at).toLocaleDateString() : 'Mar 15, 2026'}
                                    </td>
                                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#09090b' }}>
                                        {num.assigned_agent_name ? (
                                            <span style={{ fontSize: '12px', color: '#6b9e94', background: '#f0fffb', border: '1px solid #b5ddd5', padding: '2px 8px', borderRadius: '12px' }}>{num.assigned_agent_name}</span>
                                        ) : (
                                            <span style={{ color: '#a1a1aa', fontSize: '13px' }}>Unassigned</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        {num.type === 'toll-free' ? (
                                            <span style={{ fontSize: '11px', background: '#f4f4f5', color: '#71717a', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e4e4e7' }}>Toll-Free</span>
                                        ) : (
                                            <span style={{ fontSize: '11px', background: '#f0fffb', color: '#6b9e94', padding: '2px 6px', borderRadius: '4px', border: '1px solid #b5ddd5' }}>Local</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => { setSelectedNumber(num); setIsAssignOpen(true); }}
                                                style={{ background: 'none', border: '1px solid #e4e4e7', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#3f3f46' }}
                                            >
                                                <Link2 size={12} /> Assign
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(num)}
                                                disabled={submitting}
                                                style={{ background: 'none', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Numbers Modal (Wide View with Sidebar) */}
            {isAddOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: '16px', width: '840px', height: '560px', boxShadow: '0 20px 40px rgba(0,0,0,0.12)', display: 'flex', overflow: 'hidden', position: 'relative' }}>
                        
                        <button onClick={() => setIsAddOpen(false)} style={{ position: 'absolute', right: '16px', top: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#a1a1aa', zIndex: 10 }}>
                            <X size={18} />
                        </button>
                        
                        {/* Sidebar */}
                        <div style={{ width: '190px', borderRight: '1px solid #e4e4e7', background: '#fafafa', padding: '20px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#09090b', marginBottom: '16px', paddingLeft: '4px' }}>Add Numbers</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {providers.map((p) => {
                                        const isSel = selectedProvider === p.id;
                                        const badge = getProviderBadge(p.id);
                                        return (
                                            <div 
                                                key={p.id}
                                                onClick={() => setSelectedProvider(p.id)}
                                                style={{ 
                                                    background: isSel ? '#fff' : 'transparent', 
                                                    border: isSel ? '1px solid #e4e4e7' : '1px solid transparent', 
                                                    borderRadius: '8px', padding: '8px 12px', 
                                                    display: 'flex', alignItems: 'center', gap: '10px', 
                                                    color: isSel ? '#09090b' : '#71717a', 
                                                    fontWeight: isSel ? 600 : 500, fontSize: '13px', 
                                                    cursor: 'pointer', boxShadow: isSel ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
                                                    transition: 'all 0.12s'
                                                }}
                                            >
                                                <div style={{ width: '16px', height: '16px', background: p.color, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                                                    {p.icon === '🔴' ? <div style={{ width: '6px', height: '6px', background: '#fff', borderRadius: '50%' }} /> : p.icon}
                                                </div>
                                                <span style={{ flex: 1 }}>{p.name}</span>
                                                <span style={{ fontSize: '10px', color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`, borderRadius: '999px', padding: '1px 6px' }}>
                                                    {badge.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div style={{ fontSize: '12px', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', paddingLeft: '4px' }}>
                                <Link2 size={12} /> Visit docs
                            </div>
                        </div>

                        {/* Main Modal Content */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            {/* Filter Bar */}
                            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    {/* Selected Provider Badge */}
                                    <div style={{ border: '1px solid #e4e4e7', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', color: '#09090b', background: '#fff', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                                        <div style={{ width: '10px', height: '10px', background: providers.find(p => p.id === selectedProvider)?.color || '#e4e4e7', borderRadius: '50%' }} />
                                        {providers.find(p => p.id === selectedProvider)?.name || 'Provider'}
                                    </div>

                                    {/* Country Select */}
                                    <select value={country} onChange={e => setCountry(e.target.value)} style={{ border: '1px solid #e4e4e7', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', background: '#fff', outline: 'none' }}>
                                        <option value="US">🇺🇸 United States</option>
                                        <option value="IN">🇮🇳 India</option>
                                        <option value="GB">🇬🇧 United Kingdom</option>
                                        <option value="CA">🇨🇦 Canada</option>
                                    </select>

                                    {/* Type Select */}
                                    <select value={type} onChange={e => setType(e.target.value as any)} style={{ border: '1px solid #e4e4e7', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', background: '#fff', outline: 'none' }}>
                                        <option value="local">Local</option>
                                        <option value="toll-free">Toll-Free</option>
                                    </select>
                                </div>
                                <div style={{ width: '28px', height: '28px', border: '1px solid #e4e4e7', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717a', cursor: 'pointer' }}>
                                    <Settings size={14} />
                                </div>
                            </div>

                            <div style={{ padding: '12px 24px', borderBottom: '1px solid #f4f4f5', background: '#fafafa' }}>
                                <p style={{ fontSize: '12px', color: '#52525b', margin: 0 }}>
                                    Local and toll-free inventory comes from provider APIs. Only providers with live inventory/search support can return purchasable numbers here.
                                </p>
                            </div>

                            {/* Tab */}
                            <div style={{ padding: '12px 24px', borderBottom: '1px solid #e4e4e7', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600, color: '#09090b', borderBottom: '2px solid #09090b', paddingBottom: '12px', display: 'inline-block' }}>
                                    Buy new
                                </span>
                                {availableNumbers.length > 0 && (
                                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                                        Showing {availableNumbers.length} of {totalAvailable} numbers
                                    </span>
                                )}
                            </div>

                            {/* Table */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px' }}>
                                {selectedProviderMeta?.note && (
                                    <div style={{ background: '#f8fafc', border: '1px solid #e4e4e7', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#334155' }}>
                                        {selectedProviderMeta.note}
                                    </div>
                                )}

                                {availableError && (
                                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#b91c1c' }}>
                                        {availableError}
                                    </div>
                                )}

                                {selectedProvider === 'twilio' && country === 'IN' && type === 'local' && !availableError && (
                                    <div style={{ background: '#fff7ed', border: '1px solid #fdba74', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#9a3412' }}>
                                        Twilio inventory for India local numbers can be limited or region-restricted. If this comes back empty, try `United States` or `Toll-Free` first to verify the connection.
                                    </div>
                                )}

                                {!isConfigured && selectedProviderMeta?.supportsInventory && selectedProviderMeta?.status === 'not_configured' && (
                                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#dc2626' }}>
                                        {selectedProvider.toUpperCase()} API credentials not configured. Add {selectedProvider === 'plivo' ? 'PLIVO_AUTH_ID and PLIVO_AUTH_TOKEN' : 'TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN'} to your environment variables.
                                        <a href={selectedProvider === 'plivo' ? 'https://console.plivo.com' : 'https://twilio.com/console'} target="_blank" style={{ color: '#dc2626', fontWeight: 500, marginLeft: '4px', textDecoration: 'underline' }}>
                                            Get credentials &rarr;
                                        </a>
                                    </div>
                                )}

                                {selectedProviderMeta && !selectedProviderMeta.supportsInventory ? (
                                    <div style={{ padding: '60px 40px', textAlign: 'center', color: '#71717a' }}>
                                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🚧</div>
                                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#09090b', marginBottom: '4px' }}>{providers.find(p => p.id === selectedProvider)?.name} Inventory</h4>
                                        <p style={{ fontSize: '12px', color: '#a1a1aa' }}>
                                            {selectedProviderMeta?.status === 'partial'
                                                ? 'Credentials can be stored, but this provider does not yet have live number search/provisioning in Forefront.'
                                                : 'This provider integration is not implemented for live number inventory yet. Use Twilio or Plivo for now.'}
                                        </p>
                                        <button
                                            onClick={() => setIsByotOpen(true)}
                                            style={{ marginTop: '16px', background: '#09090b', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', cursor: 'pointer' }}
                                        >
                                            Use Your Own Number Instead
                                        </button>
                                    </div>
                                ) : loadingAvailable ? (
                                    <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>Searching available numbers...</div>
                                ) : availableNumbers.length === 0 ? (
                                    <div style={{ padding: '40px', textAlign: 'center', color: '#a1a1aa', fontSize: '13px' }}>No available numbers found for this selection.</div>
                                ) : (
                                  <>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #f4f4f5' }}>
                                                {['Number', 'Region', 'Rental Rate', 'Action'].map((h, i) => (
                                                    <th key={i} style={{ padding: '10px 0', fontSize: '11px', color: '#a1a1aa', fontWeight: 500 }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {availableNumbers.map((n, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #fafafa' }}>
                                                    <td style={{ padding: '12px 0', fontSize: '13px', fontWeight: 500, color: '#09090b', fontFamily: 'monospace' }}>{n.phoneNumber}</td>
                                                    <td style={{ padding: '12px 0', fontSize: '12px', color: '#71717a' }}>{n.region || 'National'}</td>
                                                    <td style={{ padding: '12px 0', fontSize: '12px', color: '#09090b' }}>₹{n.price || 199}.00 / month</td>
                                                    <td style={{ padding: '12px 0' }}>
                                                        <button
                                                            onClick={() => handleBuyNumber(n)}
                                                            disabled={submitting}
                                                            style={{ background: '#09090b', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                                        >
                                                            Buy Number
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Load More Button */}
                                    {availableNumbers.length < totalAvailable && (
                                        <div style={{ textAlign: 'center', padding: '16px 0' }}>
                                            <button
                                                onClick={() => fetchAvailableNumbers(true)}
                                                disabled={loadingAvailable}
                                                style={{
                                                    background: 'transparent', border: '1px solid #e4e4e7', borderRadius: '8px',
                                                    padding: '8px 20px', fontSize: '13px', color: '#374151', fontWeight: 500,
                                                    cursor: loadingAvailable ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                {loadingAvailable ? 'Loading...' : 'Load more numbers'}
                                            </button>
                                        </div>
                                    )}

                                    {availableNumbers.length >= totalAvailable && availableNumbers.length > 0 && (
                                        <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', padding: '12px 0' }}>
                                            All available numbers loaded ({availableNumbers.length} total)
                                        </p>
                                    )}
                                  </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Modal (Simple) */}
            {isAssignOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.12)', position: 'relative' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#09090b' }}>Assign Voice Agent</h2>
                        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Route calls from {selectedNumber?.phone_number} to an AI</p>

                        <form onSubmit={handleAssignAgent} style={{ marginTop: '20px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <select value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)} style={{ width: '100%', height: '36px', border: '1px solid #e4e4e7', borderRadius: '8px', padding: '0 12px', fontSize: '13px', background: '#fff' }}>
                                    <option value="">Choose Agent</option>
                                    {agents.map((agent) => (
                                        <option key={agent.id} value={agent.id}>{agent.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button type="button" onClick={() => { setIsAssignOpen(false); setSelectedNumber(null); }} style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: '8px', padding: '0 12px', height: '34px', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={submitting || !selectedAgent} style={{ background: '#09090b', color: '#fff', border: 'none', borderRadius: '8px', padding: '0 12px', height: '34px', fontSize: '12px', cursor: 'pointer' }}>
                                    {submitting ? 'Assigning...' : 'Assign'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Connect Your Number (BYOT) Modal */}
            {isByotOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', width: '600px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                        {/* Header */}
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f4f4f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#09090b' }}>Connect Your Number</h2>
                            <button onClick={() => setIsByotOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a1a1aa' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', borderBottom: '1px solid #f4f4f5', background: '#fafafa' }}>
                            {[
                                { id: 'forwarding', label: 'Call Forwarding' },
                                { id: 'sip', label: 'SIP Trunk' },
                                { id: 'port', label: 'Port Number' }
                            ].map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setByotTab(t.id as any)}
                                    style={{
                                        flex: 1, padding: '14px 0', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                                        background: 'transparent',
                                        border: 'none', borderBottom: byotTab === t.id ? '2px solid #09090b' : '2px solid transparent',
                                        color: byotTab === t.id ? '#09090b' : '#71717a'
                                    }}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div style={{ padding: '24px' }}>
                            <div style={{ background: '#f8fafc', border: '1px solid #e4e4e7', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', fontSize: '12px', color: '#52525b' }}>
                                Personal or business numbers cannot be used live just by typing them into the dashboard. They need one of three real telecom paths:
                                {' '}call forwarding, SIP trunk routing, or carrier porting.
                            </div>

                            {byotTab === 'forwarding' && (
                                <form onSubmit={handleConnectByotForward}>
                                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#09090b', marginBottom: '16px' }}>Forward your existing number to Qestron</h3>
                                    
                                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                                        <p style={{ fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '8px' }}>Step 1: We'll give you a Qestron number</p>
                                        {qestronNumber ? (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                                                <span style={{ fontSize: '14px', fontFamily: 'monospace', color: '#0f172a' }}>{qestronNumber}</span>
                                                <button type="button" onClick={() => navigator.clipboard.writeText(qestronNumber)} style={{ fontSize: '12px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Copy</button>
                                            </div>
                                        ) : (
                                            <p style={{ color: '#dc2626', fontSize: '13px', margin: 0 }}>
                                                You need to get a Qestron number first before using call forwarding.{' '}
                                                <span 
                                                    onClick={() => { setIsByotOpen(false); setIsAddOpen(true); }}
                                                    style={{ color: '#000', textDecoration: 'underline', cursor: 'pointer', fontWeight: 500 }}
                                                >
                                                    Get a number &rarr;
                                                </span>
                                            </p>
                                        )}
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <p style={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>Step 2: On your phone/PBX, set call forwarding to the number above</p>
                                    </div>

                                    <div style={{ marginBottom: '24px' }}>
                                        <p style={{ fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '8px' }}>Step 3: Enter your existing number to verify</p>
                                        <input 
                                            value={existingNumber} onChange={e => setExistingNumber(e.target.value)}
                                            placeholder="+91 ____________" required
                                            style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #e4e4e7', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                                        />
                                    </div>

                                    <button disabled={submitting || !existingNumber} style={{ width: '100%', height: '44px', background: '#09090b', color: '#fff', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', border: 'none' }}>
                                        {submitting ? 'Verifying...' : 'Verify & Connect'}
                                    </button>
                                </form>
                            )}

                            {byotTab === 'sip' && (
                                <form onSubmit={handleConnectByotSip}>
                                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#09090b', marginBottom: '16px' }}>Connect via SIP</h3>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '12px', color: '#71717a', marginBottom: '6px' }}>Existing Number</label>
                                            <input value={existingNumber} onChange={e => setExistingNumber(e.target.value)} required placeholder="+91 ____________" style={{ width: '100%', height: '36px', padding: '0 12px', border: '1px solid #e4e4e7', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '12px', color: '#71717a', marginBottom: '6px' }}>SIP Domain</label>
                                            <input value={sipDomain} onChange={e => setSipDomain(e.target.value)} required placeholder="sip.example.com" style={{ width: '100%', height: '36px', padding: '0 12px', border: '1px solid #e4e4e7', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '12px', color: '#71717a', marginBottom: '6px' }}>Username</label>
                                            <input value={sipUsername} onChange={e => setSipUsername(e.target.value)} required style={{ width: '100%', height: '36px', padding: '0 12px', border: '1px solid #e4e4e7', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '12px', color: '#71717a', marginBottom: '6px' }}>Password</label>
                                            <input type="password" value={sipPassword} onChange={e => setSipPassword(e.target.value)} required style={{ width: '100%', height: '36px', padding: '0 12px', border: '1px solid #e4e4e7', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
                                        </div>
                                    </div>

                                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
                                        <p style={{ fontSize: '12px', color: '#475569', marginBottom: '6px' }}>Your Qestron SIP URI:</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '13px', fontFamily: 'monospace', color: '#0f172a' }}>sip:agent@forefront-latest.onrender.com</span>
                                            <button type="button" onClick={() => navigator.clipboard.writeText('sip:agent@forefront-latest.onrender.com')} style={{ fontSize: '12px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Copy URI</button>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button type="button" disabled style={{ flex: 1, height: '44px', background: '#fff', color: '#a1a1aa', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'not-allowed', border: '1px solid #e4e4e7' }}>
                                            Test Connection Soon
                                        </button>
                                        <button disabled={submitting || !existingNumber || !sipDomain} style={{ flex: 1, height: '44px', background: '#09090b', color: '#fff', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', border: 'none' }}>
                                            {submitting ? 'Authenticating...' : 'Save & Connect'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {byotTab === 'port' && (
                                <form onSubmit={handlePortRequest}>
                                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#09090b', marginBottom: '16px' }}>Port your number to Qestron</h3>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '12px', color: '#71717a', marginBottom: '6px' }}>Phone number</label>
                                            <input value={existingNumber} onChange={e => setExistingNumber(e.target.value)} placeholder="+91 ____________" style={{ width: '100%', height: '36px', padding: '0 12px', border: '1px solid #e4e4e7', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '12px', color: '#71717a', marginBottom: '6px' }}>Current provider</label>
                                            <input value={portProvider} onChange={e => setPortProvider(e.target.value)} placeholder="e.g. Airtel, Exotel" style={{ width: '100%', height: '36px', padding: '0 12px', border: '1px solid #e4e4e7', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '12px', color: '#71717a', marginBottom: '6px' }}>Account number</label>
                                            <input value={portAccount} onChange={e => setPortAccount(e.target.value)} style={{ width: '100%', height: '36px', padding: '0 12px', border: '1px solid #e4e4e7', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
                                        </div>
                                    </div>

                                    <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '12px', marginBottom: '24px', display: 'flex', gap: '8px', color: '#991b1b' }}>
                                        <AlertTriangle size={16} />
                                        <span style={{ fontSize: '13px' }}>Porting takes 5-7 business days and still requires carrier-side approval.</span>
                                    </div>

                                    <button disabled={portSubmitting || !existingNumber} style={{ width: '100%', height: '44px', background: '#09090b', color: '#fff', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', border: 'none' }}>
                                        {portSubmitting ? 'Submitting...' : 'Request Port'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
