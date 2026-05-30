"use client";

import { useEffect, useState } from "react";
import { Plus, Search, MoreHorizontal, Smile, Check, Globe, FileText, X, AlertTriangle, Play } from "lucide-react";
import { buildProxyUrl } from "@/lib/backend-url";
import { resolveWorkspaceSession } from "@/lib/workspace-session";

interface KnowledgeSource {
    id: string;
    name: string;
    type: 'text' | 'url' | 'pdf' | 'qa_pair';
    status: string;
    website_pages_count?: number;
    qna_count?: number;
    vectors_count?: number;
    created_at?: string;
}

export default function KnowledgeBasePage() {
    const [sources, setSources] = useState<KnowledgeSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Wizard Tab State
    const [wizardTab, setWizardTab] = useState<'Type' | 'Details'>('Type');

    // Form State
    const [name, setName] = useState("");
    const [type, setType] = useState<'url' | 'qa_pair' | 'text' | 'pdf'>('url');
    // Type-specific forms
    const [url, setUrl] = useState("");
    const [textInput, setTextInput] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [primaryAgentId, setPrimaryAgentId] = useState("");

    const fetchSources = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(buildProxyUrl(`/api/knowledge/sources`)); // Supports auto agent resolving on backend
            if (!res.ok) throw new Error("Failed to fetch knowledge sources");
            const data = await res.json();
            setSources(data.data || []);
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSources();
    }, []);

    useEffect(() => {
        const loadSession = async () => {
            try {
                const session = await resolveWorkspaceSession();
                setPrimaryAgentId(session.agentId || "");
            } catch {
                setPrimaryAgentId("");
            }
        };

        loadSession();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let endpoint = "/api/knowledge/website";
            const agentId = primaryAgentId || (await resolveWorkspaceSession()).agentId;
            if (!agentId) {
                throw new Error("Primary agent session is unavailable");
            }

            let body: any = { name, agentId };

            if (type === 'url') {
                endpoint = "/api/knowledge/website";
                body.url = url;
                body.mode = 'priority';
            } else if (type === 'qa_pair') {
                endpoint = "/api/knowledge/manual-qna";
            } else if (type === 'text') {
                endpoint = "/api/knowledge/upload";
                body.type = 'text';
                body.content = textInput;
            }

            const res = await fetch(buildProxyUrl(endpoint), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error("Failed to create knowledge source");
            
            setIsCreateOpen(false);
            setName("");
            setUrl("");
            setTextInput("");
            setWizardTab('Type');
            fetchSources();
        } catch (err: any) {
            alert(err.message || "Failed to create source");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this source?")) return;
        try {
            const res = await fetch(buildProxyUrl(`/api/knowledge/sources/${id}`), {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed to delete source");
            fetchSources();
        } catch (err: any) {
            alert(err.message || "Failed to delete");
        }
    };

    return (
        <div style={{ background: '#fafafa', minHeight: '100vh', width: '100%', padding: '28px 32px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#09090b' }}>Knowledge Base</h1>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Manage knowledge sources for your AI agents</p>
                </div>

                <button
                    onClick={() => setIsCreateOpen(true)}
                    style={{
                        background: '#09090b', color: 'white', height: '34px', padding: '0 16px',
                        borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: 'none'
                    }}
                >
                    + Add Source
                </button>
            </div>

            {/* Sub header grid */}
            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500, marginBottom: '16px' }}>All Sources</div>

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ height: '140px', background: '#fff', border: '1px solid #e4e4e7', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
                    ))}
                </div>
            ) : sources.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', background: '#fff', borderRadius: '12px', border: '1px solid #e4e4e7' }}>
                    <FileText size={48} style={{ marginBottom: 16, opacity: 0.4 }} />
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#6b7280' }}>No sources yet</p>
                    <p style={{ fontSize: '13px' }}>Click "+ Add Source" to get started</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    {sources.map(source => (
                        <div key={source.id} style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: '12px', padding: '20px', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ width: '40px', height: '40px', background: '#f8fafc', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {source.type === 'url' ? <Globe size={18} style={{ color: '#09090b' }} /> : <FileText size={18} style={{ color: '#09090b' }} />}
                                </div>
                                
                                <button onClick={() => handleDelete(source.id)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                                    <X size={14} />
                                </button>
                            </div>

                            <div style={{ marginTop: '14px' }}>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#09090b', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                    {source.name || (source.type === 'url' ? 'Website' : 'Document')}
                                </div>
                                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px', textTransform: 'uppercase' }}>
                                    Type: {source.type}
                                </div>
                            </div>

                            <div style={{ marginTop: '16px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <div style={{ fontSize: '11px', background: '#f4f4f5', color: '#71717a', padding: '2px 8px', borderRadius: '12px' }}>
                                    📄 {source.website_pages_count || source.qna_count || 0} items
                                </div>
                                {source.status === 'processing' && (
                                    <div style={{ fontSize: '11px', background: '#fef08a', color: '#854d0e', padding: '2px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <div style={{ width: '6px', height: '6px', background: '#854d0e', borderRadius: '50%', animation: 'pulse 1s infinite' }} /> Processing
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Source Modal */}
            {isCreateOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '480px', boxShadow: '0 20px 40px rgba(0,0,0,0.12)', position: 'relative' }}>
                        <button onClick={() => setIsCreateOpen(false)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                            <X size={18} />
                        </button>
                        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#09090b' }}>Add Knowledge Source</h2>
                        <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Feed data to train your AI agents</p>

                        <div style={{ display: 'flex', borderBottom: '1px solid #e4e4e7', gap: '20px', marginTop: '20px', marginBottom: '16px' }}>
                            <div style={{ paddingBottom: '8px', fontSize: '13px', fontWeight: 500, color: wizardTab === 'Type' ? '#09090b' : '#9ca3af', borderBottom: wizardTab === 'Type' ? '2px solid #09090b' : 'none', cursor: 'pointer' }} onClick={() => setWizardTab('Type')}>1. Select Type</div>
                            <div style={{ paddingBottom: '8px', fontSize: '13px', fontWeight: 500, color: wizardTab === 'Details' ? '#09090b' : '#9ca3af', borderBottom: wizardTab === 'Details' ? '2px solid #09090b' : 'none', cursor: 'pointer' }} onClick={() => setWizardTab('Details')}>2. Details</div>
                        </div>

                        <form onSubmit={handleCreate}>
                            {wizardTab === 'Type' ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    {[
                                        { id: 'url', label: 'Website Crawl', icon: Globe, desc: 'Scrape pages from URL' },
                                        { id: 'qa_pair', label: 'Manual Q&A', icon: FileText, desc: 'Add Questions & Answers' },
                                        { id: 'text', label: 'Raw Text', icon: FileText, desc: 'Paste text content' }
                                    ].map(t => (
                                        <div
                                            key={t.id}
                                            onClick={() => { setType(t.id as any); setWizardTab('Details'); }}
                                            style={{
                                                background: '#fff', border: type === t.id ? '2px solid #09090b' : '1px solid #e4e4e7',
                                                borderRadius: '12px', padding: '16px', cursor: 'pointer', transition: 'border 0.12s'
                                            }}
                                        >
                                            <t.icon size={20} style={{ color: '#09090b' }} />
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#09090b', marginTop: '8px' }}>{t.label}</div>
                                            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{t.desc}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div>
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#52525b', marginBottom: '6px' }}>Source Name</label>
                                        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Website Pages, FAQ" required style={{ width: '100%', height: '36px', border: '1px solid #e4e4e7', borderRadius: '8px', padding: '0 12px', fontSize: '13px', outline: 'none' }} />
                                    </div>

                                    {type === 'url' && (
                                        <div style={{ marginBottom: '16px' }}>
                                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#52525b', marginBottom: '6px' }}>Website URL</label>
                                            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" required style={{ width: '100%', height: '36px', border: '1px solid #e4e4e7', borderRadius: '8px', padding: '0 12px', fontSize: '13px', outline: 'none' }} />
                                        </div>
                                    )}

                                    {type === 'text' && (
                                        <div style={{ marginBottom: '16px' }}>
                                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#52525b', marginBottom: '6px' }}>Raw Text Content</label>
                                            <textarea value={textInput} onChange={e => setTextInput(e.target.value)} placeholder="Paste text here..." required style={{ width: '100%', minHeight: '100px', border: '1px solid #e4e4e7', borderRadius: '8px', padding: '12px', fontSize: '13px', outline: 'none' }} />
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                                        <button type="button" onClick={() => setWizardTab('Type')} style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: '8px', padding: '0 16px', height: '34px', fontSize: '13px', cursor: 'pointer' }}>Back</button>
                                        <button type="submit" disabled={submitting} style={{ background: '#09090b', color: '#fff', border: 'none', borderRadius: '8px', padding: '0 16px', height: '34px', fontSize: '13px', cursor: 'pointer' }}>
                                            {submitting ? 'Creating...' : 'Create Source'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
