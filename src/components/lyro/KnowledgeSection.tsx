"use client";

import { Lightbulb, Globe, MessageSquare, Database, BookOpen, Loader2, CheckCircle2, AlertCircle, ExternalLink, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useCallback } from 'react';
import { AddKnowledgeModal } from './AddKnowledgeModal';
import { ManageQnAModal } from './ManageQnAModal';
import { ManageWebsitePagesModal } from './ManageWebsitePagesModal';
import { apiFetch } from '@/lib/api';

interface KnowledgeSource {
    id: string;
    agent_id: string;
    type: string;
    name: string;
    url?: string;
    status: string;
    scrape_mode?: string;
    error_message?: string;
    website_pages_count?: string;
    qna_count?: string;
    vectors_count?: string;
    created_at: string;
    updated_at: string;
    last_synced_at?: string;
}

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; borderColor: string; icon: any; label: string }> = {
    pending: { color: 'text-yellow-400', bgColor: 'bg-yellow-900/30', borderColor: 'border-yellow-700/40', icon: Loader2, label: 'Pending' },
    processing: { color: 'text-blue-400', bgColor: 'bg-blue-900/30', borderColor: 'border-blue-700/40', icon: Loader2, label: 'Scraping...' },
    completed: { color: 'text-emerald-400', bgColor: 'bg-emerald-900/30', borderColor: 'border-emerald-700/40', icon: CheckCircle2, label: 'Ready' },
    indexed: { color: 'text-emerald-400', bgColor: 'bg-emerald-900/30', borderColor: 'border-emerald-700/40', icon: CheckCircle2, label: 'Indexed' },
    failed: { color: 'text-red-400', bgColor: 'bg-red-900/30', borderColor: 'border-red-700/40', icon: AlertCircle, label: 'Failed' },
};

export function KnowledgeSection() {
    const [isAddKnowledgeOpen, setIsAddKnowledgeOpen] = useState(false);
    const [isManageQnAOpen, setIsManageQnAOpen] = useState(false);
    const [isManageWebsiteOpen, setIsManageWebsiteOpen] = useState(false);
    const [sources, setSources] = useState<KnowledgeSource[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSources = useCallback(async () => {
        try {
            const agentData = await apiFetch("/agents/primary");
            if (!agentData?.id) return;

            const data = await apiFetch(`/knowledge/sources?agentId=${agentData.id}`);
            if (data?.data) {
                setSources(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch knowledge sources:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSources();
        // Poll every 10s to catch processing updates
        const interval = setInterval(fetchSources, 10000);
        return () => clearInterval(interval);
    }, [fetchSources]);

    const handleDelete = async (sourceId: string) => {
        if (!confirm('Are you sure you want to delete this knowledge source? This action cannot be undone.')) {
            return;
        }
        try {
            await apiFetch(`/knowledge/sources/${sourceId}`, { method: 'DELETE' });
            setSources(prev => prev.filter(s => s.id !== sourceId));
        } catch (err) {
            console.error("Failed to delete source:", err);
            alert('Failed to delete source. Please try again.');
        }
    };

    const handleRetry = async (source: KnowledgeSource) => {
        if (!source.url) {
            alert('Cannot retry: No URL found for this source.');
            return;
        }
        try {
            // Update status to pending immediately for visual feedback
            setSources(prev => prev.map(s => 
                s.id === source.id ? { ...s, status: 'pending', error_message: undefined } : s
            ));
            
            // Delete the old source and create a new scraping job
            await apiFetch(`/knowledge/sources/${source.id}`, { method: 'DELETE' });
            await apiFetch('/knowledge/website', {
                method: 'POST',
                body: JSON.stringify({
                    agentId: source.agent_id,
                    url: source.url,
                    mode: source.scrape_mode || 'single',
                }),
            });
            
            // Refresh sources list
            fetchSources();
        } catch (err) {
            console.error("Failed to retry scraping:", err);
            alert('Failed to retry. Please try again.');
            fetchSources();
        }
    };

    const websiteSources = sources.filter(s => s.type === 'website');
    const qnaSources = sources.filter(s => s.type === 'manual_qna' || s.type === 'qa_pair');
    const otherSources = sources.filter(s => s.type !== 'website' && s.type !== 'manual_qna' && s.type !== 'qa_pair');

    const totalPages = websiteSources.reduce((sum, s) => sum + parseInt(s.website_pages_count || '0'), 0);
    const totalQnA = sources.reduce((sum, s) => sum + parseInt(s.qna_count || '0'), 0);
    const totalVectors = sources.reduce((sum, s) => sum + parseInt(s.vectors_count || '0'), 0);

    const dataSummary = [
        {
            icon: Lightbulb,
            title: "Suggestions",
            desc: "Knowledge to add from unanswered questions and past inbox",
            status: "0 questions to review",
            button: "Manage",
            onClick: () => { /* TODO: Implement suggestions management */ }
        },
        {
            icon: Globe,
            title: "Website URL",
            desc: "Content imported from URLs, like knowledge bases or websites",
            status: `${totalPages} page${totalPages !== 1 ? 's' : ''}`,
            button: "Manage",
            onClick: () => setIsManageWebsiteOpen(true)
        },
        {
            icon: MessageSquare,
            title: "Q&A",
            desc: "Question and answers content",
            status: `${totalQnA} questions and answers`,
            button: "Manage",
            onClick: () => setIsManageQnAOpen(true)
        },
        {
            icon: Database,
            title: "Product database",
            desc: "Content from your products used for product recommendation",
            status: "0 products",
            button: "Manage",
            onClick: () => { /* TODO: Implement product database management */ }
        }
    ];

    return (
        <div>
            <h2 className="text-xl font-bold text-white mb-4">Knowledge</h2>

            {/* Score Banner */}
            <div className="bg-[#18181b] border border-white/5 rounded-xl p-6 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="relative w-32 h-16 overflow-hidden">
                        <div className="absolute top-0 left-0 w-32 h-32 rounded-full border-[12px] border-white/10 border-b-0 border-l-0 border-r-0 rotate-180" />
                        <div className="absolute top-0 left-0 w-32 h-32 rounded-full border-[12px] border-slate-600 border-b-0 border-l-0 border-r-0 rotate-180 clip-path-half" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)', transform: 'rotate(180deg)' }} />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-semibold">
                                {totalVectors > 0
                                    ? `${totalVectors} knowledge vectors indexed`
                                    : "We're gathering knowledge score data"
                                }
                            </span>
                        </div>
                        <p className="text-slate-400 text-sm">
                            {totalVectors > 0
                                ? "Your AI agent can now answer questions from imported knowledge."
                                : "The score will appear once Lyro encounters questions it can't answer. Check back later!"
                            }
                        </p>
                    </div>
                </div>

                <Button
                    className="bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                    onClick={() => setIsAddKnowledgeOpen(true)}
                >
                    Add knowledge
                </Button>
            </div>

            {/* === YOUR KNOWLEDGE BASE === */}
            {sources.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Your Knowledge Base</h3>
                        <button
                            onClick={fetchSources}
                            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                        >
                            <RefreshCw size={12} />
                            Refresh
                        </button>
                    </div>

                    <div className="space-y-3">
                        {sources.map(source => {
                            const statusCfg = STATUS_CONFIG[source.status] || STATUS_CONFIG.pending;
                            const StatusIcon = statusCfg.icon;
                            const pages = parseInt(source.website_pages_count || '0');
                            const qna = parseInt(source.qna_count || '0');
                            const vectors = parseInt(source.vectors_count || '0');

                            return (
                                <div
                                    key={source.id}
                                    className="bg-[#18181b] border border-white/5 rounded-xl p-4 hover:bg-[#1c1f26] transition-all group"
                                >
                                    <div className="flex items-center justify-between">
                                        {/* Left: Icon + Info */}
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="p-2.5 bg-white/5 rounded-lg text-blue-400 flex-shrink-0">
                                                <Globe size={20} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-white font-medium text-sm truncate" title={source.url || source.name}>
                                                        {source.url || source.name || 'Untitled'}
                                                    </h4>
                                                    {source.url && (
                                                        <a
                                                            href={source.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-slate-500 hover:text-blue-400 transition-colors flex-shrink-0"
                                                            title={source.url}
                                                        >
                                                            <ExternalLink size={12} />
                                                        </a>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs">
                                                    {/* Status Badge */}
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${statusCfg.bgColor} ${statusCfg.borderColor} ${statusCfg.color} border`}>
                                                        <StatusIcon size={11} className={source.status === 'processing' ? 'animate-spin' : ''} />
                                                        {statusCfg.label}
                                                    </span>

                                                    {/* Mode Badge */}
                                                    {source.scrape_mode && (
                                                        <span className="text-slate-500">
                                                            {source.scrape_mode === 'single' ? 'Single page' : 'Priority scan'}
                                                        </span>
                                                    )}

                                                    {/* Stats */}
                                                    {pages > 0 && <span className="text-slate-500">{pages} page{pages !== 1 ? 's' : ''}</span>}
                                                    {qna > 0 && <span className="text-slate-500">{qna} Q&A</span>}
                                                    {vectors > 0 && <span className="text-slate-500">{vectors} vectors</span>}

                                                    {/* Error */}
                                                    {source.error_message && (
                                                        <span className="text-red-400 truncate max-w-[200px]" title={source.error_message}>
                                                            {source.error_message}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Actions */}
                                        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                                            <span className="text-slate-600 text-xs">
                                                {source.last_synced_at
                                                    ? `Synced ${new Date(source.last_synced_at).toLocaleDateString()}`
                                                    : new Date(source.created_at).toLocaleDateString()
                                                }
                                            </span>
                                            {source.status === 'failed' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRetry(source); }}
                                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-900/20 transition-all text-xs"
                                                    title="Retry scraping"
                                                >
                                                    <RefreshCw size={12} />
                                                    <span className="hidden sm:inline">Retry</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(source.id); }}
                                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-all text-xs"
                                                title="Delete source"
                                            >
                                                <Trash2 size={12} />
                                                <span className="hidden sm:inline">Delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="bg-[#18181b] border border-white/5 rounded-xl p-8 mb-8 flex items-center justify-center gap-3">
                    <Loader2 size={18} className="animate-spin text-blue-400" />
                    <span className="text-slate-400 text-sm">Loading knowledge sources...</span>
                </div>
            )}

            {/* Empty State */}
            {!loading && sources.length === 0 && (
                <div className="bg-[#18181b] border border-white/5 border-dashed rounded-xl p-8 mb-8 flex flex-col items-center justify-center text-center">
                    <div className="p-3 bg-blue-600/10 rounded-xl mb-3">
                        <BookOpen size={24} className="text-blue-400" />
                    </div>
                    <h4 className="text-white font-medium mb-1">No knowledge sources yet</h4>
                    <p className="text-slate-500 text-sm mb-4 max-w-sm">
                        Import a website URL, add Q&A pairs, or upload a CSV to teach your AI agent about your business.
                    </p>
                    <Button
                        className="bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                        onClick={() => setIsAddKnowledgeOpen(true)}
                    >
                        Import your first source
                    </Button>
                </div>
            )}

            {/* Data Source Summary List */}
            <div className="space-y-4 mb-8">
                {dataSummary.map((item, idx) => (
                    <div key={idx} className="bg-[#18181b] border border-white/5 rounded-xl p-4 flex items-center justify-between hover:bg-[#1c1f26] transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-white/5 rounded-lg text-slate-400 group-hover:text-white transition-colors">
                                <item.icon size={20} />
                            </div>
                            <div>
                                <h4 className="text-white font-medium text-sm mb-0.5">{item.title}</h4>
                                <p className="text-slate-500 text-xs hidden md:block">{item.desc}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <span className="text-white text-sm font-medium">{item.status}</span>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="border-white/10 text-white hover:bg-white/5 h-8"
                                onClick={item.onClick}
                            >
                                {item.button}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-2 text-blue-500 text-sm font-medium hover:underline cursor-pointer">
                <BookOpen size={16} />
                <span>How to effectively add data sources</span>
            </div>

            <AddKnowledgeModal
                isOpen={isAddKnowledgeOpen}
                onClose={() => { setIsAddKnowledgeOpen(false); fetchSources(); }}
            />

            <ManageQnAModal
                isOpen={isManageQnAOpen}
                onClose={() => { setIsManageQnAOpen(false); fetchSources(); }}
            />

            <ManageWebsitePagesModal
                isOpen={isManageWebsiteOpen}
                onClose={() => { setIsManageWebsiteOpen(false); fetchSources(); }}
            />
        </div>
    );
}
