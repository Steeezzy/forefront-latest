"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Loader2, Plus, Trash2, Edit2, Save, MessageSquare, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface QnAPair {
    id: string;
    question: string;
    answer: string;
    category?: string;
    created_at: string;
    updated_at: string;
}

interface ManageQnAModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ManageQnAModal({ isOpen, onClose }: ManageQnAModalProps) {
    const [pairs, setPairs] = useState<QnAPair[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editQuestion, setEditQuestion] = useState("");
    const [editAnswer, setEditAnswer] = useState("");
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    // New Q&A state
    const [showAddForm, setShowAddForm] = useState(false);
    const [newQuestion, setNewQuestion] = useState("");
    const [newAnswer, setNewAnswer] = useState("");
    const [addingNew, setAddingNew] = useState(false);

    const fetchQnAPairs = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const agentData = await apiFetch("/agents/primary");
            if (!agentData?.id) throw new Error("Agent not found");

            const sourcesData = await apiFetch(`/knowledge/sources?agentId=${agentData.id}`);
            const qnaSources = sourcesData?.data?.filter((s: any) => 
                s.type === 'manual_qna' || s.type === 'qa_pair'
            ) || [];

            const allPairs: QnAPair[] = [];
            for (const source of qnaSources) {
                const pairsData = await apiFetch(`/knowledge/qna/${source.id}`);
                if (pairsData?.data) {
                    allPairs.push(...pairsData.data);
                }
            }

            setPairs(allPairs.sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ));
        } catch (err: any) {
            setError(err.message || "Failed to load Q&A pairs");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchQnAPairs();
        }
    }, [isOpen, fetchQnAPairs]);

    const handleEdit = (pair: QnAPair) => {
        setEditingId(pair.id);
        setEditQuestion(pair.question);
        setEditAnswer(pair.answer);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditQuestion("");
        setEditAnswer("");
    };

    const handleSaveEdit = async () => {
        if (!editingId || !editQuestion.trim() || !editAnswer.trim()) return;
        
        setSaving(true);
        try {
            await apiFetch(`/knowledge/qna/${editingId}`, {
                method: "PUT",
                body: JSON.stringify({
                    question: editQuestion.trim(),
                    answer: editAnswer.trim()
                })
            });

            setPairs(prev => prev.map(p => 
                p.id === editingId 
                    ? { ...p, question: editQuestion.trim(), answer: editAnswer.trim() }
                    : p
            ));
            handleCancelEdit();
        } catch (err: any) {
            setError(err.message || "Failed to update Q&A");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (qnaId: string) => {
        if (!confirm("Are you sure you want to delete this Q&A pair?")) return;
        
        setDeleting(qnaId);
        try {
            await apiFetch(`/knowledge/qna/${qnaId}`, { method: "DELETE" });
            setPairs(prev => prev.filter(p => p.id !== qnaId));
        } catch (err: any) {
            setError(err.message || "Failed to delete Q&A");
        } finally {
            setDeleting(null);
        }
    };

    const handleAddNew = async () => {
        if (!newQuestion.trim() || !newAnswer.trim()) return;

        setAddingNew(true);
        try {
            const agentData = await apiFetch("/agents/primary");
            if (!agentData?.id) throw new Error("Agent not found");

            // Create or get Q&A source
            const sourceData = await apiFetch("/knowledge/manual-qna", {
                method: "POST",
                body: JSON.stringify({
                    agentId: agentData.id,
                    name: "Manual Q&A"
                })
            });

            const sourceId = sourceData?.data?.id;

            // Add Q&A pair
            const result = await apiFetch("/knowledge/qna", {
                method: "POST",
                body: JSON.stringify({
                    sourceId,
                    question: newQuestion.trim(),
                    answer: newAnswer.trim(),
                    category: "Manual"
                })
            });

            if (result?.data) {
                setPairs(prev => [result.data, ...prev]);
            }

            setNewQuestion("");
            setNewAnswer("");
            setShowAddForm(false);
        } catch (err: any) {
            setError(err.message || "Failed to add Q&A");
        } finally {
            setAddingNew(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />

            {/* Modal */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[80vh] bg-[#0f1115] border border-zinc-800 rounded-xl z-50 flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-blue-500" />
                        <h2 className="text-lg font-bold text-white">Manage Q&A Pairs</h2>
                        <span className="text-sm text-zinc-500">({pairs.length} pairs)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddForm(true)}
                            className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Q&A
                        </Button>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-900/30 border border-red-700/40 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                            <AlertCircle size={16} />
                            {error}
                            <button onClick={() => setError("")} className="ml-auto">
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    {/* Add New Form */}
                    {showAddForm && (
                        <div className="mb-6 p-4 bg-zinc-900 border border-zinc-700 rounded-lg">
                            <h4 className="text-sm font-medium text-white mb-3">Add New Q&A</h4>
                            <input
                                type="text"
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                placeholder="Question"
                                className="w-full px-3 py-2 mb-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-sm"
                            />
                            <textarea
                                value={newAnswer}
                                onChange={(e) => setNewAnswer(e.target.value)}
                                placeholder="Answer"
                                rows={3}
                                className="w-full px-3 py-2 mb-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-sm resize-none"
                            />
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setShowAddForm(false);
                                        setNewQuestion("");
                                        setNewAnswer("");
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleAddNew}
                                    disabled={!newQuestion.trim() || !newAnswer.trim() || addingNew}
                                    className="bg-blue-600 hover:bg-blue-500"
                                >
                                    {addingNew && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                                    Add
                                </Button>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center py-12 gap-3">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                            <span className="text-zinc-400">Loading Q&A pairs...</span>
                        </div>
                    ) : pairs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <MessageSquare className="w-12 h-12 text-zinc-700 mb-3" />
                            <h4 className="text-white font-medium mb-1">No Q&A pairs yet</h4>
                            <p className="text-zinc-500 text-sm mb-4">
                                Add question and answer pairs to teach your AI
                            </p>
                            <Button
                                onClick={() => setShowAddForm(true)}
                                className="bg-blue-600 hover:bg-blue-500"
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Add your first Q&A
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pairs.map(pair => (
                                <div
                                    key={pair.id}
                                    className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
                                >
                                    {editingId === pair.id ? (
                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                value={editQuestion}
                                                onChange={(e) => setEditQuestion(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500 text-sm"
                                            />
                                            <textarea
                                                value={editAnswer}
                                                onChange={(e) => setEditAnswer(e.target.value)}
                                                rows={3}
                                                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500 text-sm resize-none"
                                            />
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleCancelEdit}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={handleSaveEdit}
                                                    disabled={saving}
                                                    className="bg-blue-600 hover:bg-blue-500"
                                                >
                                                    {saving && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                                                    <Save className="w-3 h-3 mr-1" />
                                                    Save
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-medium text-sm mb-1">
                                                        Q: {pair.question}
                                                    </p>
                                                    <p className="text-zinc-400 text-sm">
                                                        A: {pair.answer}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <button
                                                        onClick={() => handleEdit(pair)}
                                                        className="p-1.5 rounded-lg text-zinc-500 hover:text-blue-400 hover:bg-blue-900/20 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(pair.id)}
                                                        disabled={deleting === pair.id}
                                                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                                                        title="Delete"
                                                    >
                                                        {deleting === pair.id ? (
                                                            <Loader2 size={14} className="animate-spin" />
                                                        ) : (
                                                            <Trash2 size={14} />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                            {pair.category && (
                                                <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-zinc-800 text-zinc-400 rounded">
                                                    {pair.category}
                                                </span>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
