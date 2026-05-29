"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Loader2, Globe, Trash2, ExternalLink, AlertCircle, RefreshCw, FileText } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface WebsitePage {
    id: string;
    url: string;
    title: string;
    word_count: number;
    priority_score?: number;
    last_crawled_at?: string;
    created_at: string;
}

interface WebsiteSource {
    id: string;
    name: string;
    url: string;
    status: string;
    website_pages_count: string;
}

interface ManageWebsitePagesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ManageWebsitePagesModal({ isOpen, onClose }: ManageWebsitePagesModalProps) {
    const [sources, setSources] = useState<WebsiteSource[]>([]);
    const [selectedSource, setSelectedSource] = useState<WebsiteSource | null>(null);
    const [pages, setPages] = useState<WebsitePage[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingPages, setLoadingPages] = useState(false);
    const [error, setError] = useState("");
    const [deleting, setDeleting] = useState<string | null>(null);

    const fetchSources = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const agentData = await apiFetch("/agents/primary");
            if (!agentData?.id) throw new Error("Agent not found");

            const sourcesData = await apiFetch(`/knowledge/sources?agentId=${agentData.id}`);
            const websiteSources = sourcesData?.data?.filter((s: any) => s.type === 'website') || [];
            setSources(websiteSources);

            // Auto-select first source
            if (websiteSources.length > 0 && !selectedSource) {
                setSelectedSource(websiteSources[0]);
            }
        } catch (err: any) {
            setError(err.message || "Failed to load website sources");
        } finally {
            setLoading(false);
        }
    }, [selectedSource]);

    const fetchPages = useCallback(async (sourceId: string) => {
        setLoadingPages(true);
        setError("");
        try {
            const pagesData = await apiFetch(`/knowledge/sources/${sourceId}/pages`);
            setPages(pagesData?.data || []);
        } catch (err: any) {
            setError(err.message || "Failed to load pages");
        } finally {
            setLoadingPages(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchSources();
        }
    }, [isOpen, fetchSources]);

    useEffect(() => {
        if (selectedSource) {
            fetchPages(selectedSource.id);
        }
    }, [selectedSource, fetchPages]);

    const handleDeletePage = async (pageId: string) => {
        if (!confirm("Are you sure you want to delete this page?")) return;

        setDeleting(pageId);
        try {
            await apiFetch(`/knowledge/pages/${pageId}`, { method: "DELETE" });
            setPages(prev => prev.filter(p => p.id !== pageId));
        } catch (err: any) {
            setError(err.message || "Failed to delete page");
        } finally {
            setDeleting(null);
        }
    };

    const handleDeleteSource = async (sourceId: string) => {
        if (!confirm("Are you sure you want to delete this entire website source and all its pages?")) return;

        try {
            await apiFetch(`/knowledge/sources/${sourceId}`, { method: "DELETE" });
            setSources(prev => prev.filter(s => s.id !== sourceId));
            if (selectedSource?.id === sourceId) {
                setSelectedSource(sources.find(s => s.id !== sourceId) || null);
                setPages([]);
            }
        } catch (err: any) {
            setError(err.message || "Failed to delete source");
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />

            {/* Modal */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[85vh] bg-[#f8fafc] border border-zinc-800 rounded-xl z-50 flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-blue-500" />
                        <h2 className="text-lg font-bold text-gray-900">Manage Website Pages</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-gray-900 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar - Source List */}
                    <div className="w-64 border-r border-zinc-800 overflow-y-auto">
                        <div className="p-3 border-b border-zinc-800">
                            <p className="text-xs text-zinc-500 uppercase font-semibold">Sources</p>
                        </div>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                            </div>
                        ) : sources.length === 0 ? (
                            <div className="p-4 text-center text-zinc-500 text-sm">
                                No website sources imported yet
                            </div>
                        ) : (
                            <div className="p-2 space-y-1">
                                {sources.map(source => (
                                    <button
                                        key={source.id}
                                        onClick={() => setSelectedSource(source)}
                                        className={`w-full text-left p-3 rounded-lg transition-colors ${selectedSource?.id === source.id
                                                ? "bg-blue-600/20 border border-blue-500/30"
                                                : "hover:bg-zinc-800 border border-transparent"
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <Globe size={14} className="text-blue-400 flex-shrink-0" />
                                            <span className="text-gray-900 text-sm font-medium truncate">
                                                {source.name}
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-500 truncate pl-5">
                                            {source.website_pages_count} pages
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Main Content - Pages List */}
                    <div className="flex-1 overflow-y-auto">
                        {error && (
                            <div className="m-4 p-3 bg-red-900/30 border border-red-700/40 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                                <AlertCircle size={16} />
                                {error}
                                <button onClick={() => setError("")} className="ml-auto">
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        {!selectedSource ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                <Globe className="w-12 h-12 text-zinc-700 mb-3" />
                                <p className="text-zinc-500">Select a source to view its pages</p>
                            </div>
                        ) : loadingPages ? (
                            <div className="flex items-center justify-center py-12 gap-3">
                                <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                                <span className="text-zinc-400">Loading pages...</span>
                            </div>
                        ) : (
                            <div className="p-4">
                                {/* Source Header */}
                                <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-800">
                                    <div>
                                        <h3 className="text-gray-900 font-medium">{selectedSource.name}</h3>
                                        <a
                                            href={selectedSource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                                        >
                                            {selectedSource.url}
                                            <ExternalLink size={10} />
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fetchPages(selectedSource.id)}
                                            className="border-zinc-700 text-gray-900 hover:bg-zinc-800"
                                        >
                                            <RefreshCw size={14} className="mr-1" />
                                            Refresh
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteSource(selectedSource.id)}
                                            className="border-red-700/40 text-red-400 hover:bg-red-900/20"
                                        >
                                            <Trash2 size={14} className="mr-1" />
                                            Delete Source
                                        </Button>
                                    </div>
                                </div>

                                {/* Pages List */}
                                {pages.length === 0 ? (
                                    <div className="text-center py-12 text-zinc-500">
                                        <FileText className="w-10 h-10 mx-auto mb-2 text-zinc-700" />
                                        <p>No pages scraped yet</p>
                                        <p className="text-xs mt-1">Pages will appear here once scraping completes</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-xs text-zinc-500 mb-3">{pages.length} pages indexed</p>
                                        {pages.map(page => (
                                            <div
                                                key={page.id}
                                                className="p-3 bg-white border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors group"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <FileText size={14} className="text-zinc-500 flex-shrink-0" />
                                                            <h4 className="text-gray-900 text-sm font-medium truncate">
                                                                {page.title || "Untitled Page"}
                                                            </h4>
                                                        </div>
                                                        <a
                                                            href={page.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-blue-400 hover:underline truncate block"
                                                        >
                                                            {page.url}
                                                        </a>
                                                        <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                                                            <span>{page.word_count || 0} words</span>
                                                            {page.priority_score && (
                                                                <span>Priority: {page.priority_score}</span>
                                                            )}
                                                            {page.last_crawled_at && (
                                                                <span>
                                                                    Crawled: {new Date(page.last_crawled_at).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeletePage(page.id)}
                                                        disabled={deleting === page.id}
                                                        className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                                                        title="Delete page"
                                                    >
                                                        {deleting === page.id ? (
                                                            <Loader2 size={14} className="animate-spin" />
                                                        ) : (
                                                            <Trash2 size={14} />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
