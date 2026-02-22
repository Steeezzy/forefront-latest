"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle2, AlertCircle, PenLine, ChevronDown } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface ManualQnAModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ManualQnAModal({ isOpen, onClose }: ManualQnAModalProps) {
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [usedBy, setUsedBy] = useState({ lyro: true, copilot: true });
    const [audience, setAudience] = useState("Everyone");

    const handleSave = async () => {
        if (!question.trim() || !answer.trim()) return;

        setStatus("loading");
        setErrorMsg("");

        try {
            // Get the real agent ID
            const agentData = await apiFetch("/agents/primary");
            const agentId = agentData?.id;
            if (!agentId) throw new Error("Could not find your agent. Please try again.");

            // First create a Q&A source container if needed
            const sourceData = await apiFetch("/knowledge/manual-qna", {
                method: "POST",
                body: JSON.stringify({
                    agentId,
                    name: "Manual Q&A"
                })
            });

            const sourceId = sourceData?.data?.id;

            // Then add the Q&A pair
            await apiFetch("/knowledge/qna", {
                method: "POST",
                body: JSON.stringify({
                    sourceId,
                    question: question.trim(),
                    answer: answer.trim(),
                    category: "Manual"
                })
            });

            setStatus("success");
            setTimeout(() => {
                resetAndClose();
            }, 1500);
        } catch (err: any) {
            setStatus("error");
            setErrorMsg(err.message || "Failed to save Q&A");
        }
    };

    const resetAndClose = () => {
        setQuestion("");
        setAnswer("");
        setStatus("idle");
        setErrorMsg("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 z-50"
                onClick={resetAndClose}
            />

            {/* Side Panel */}
            <div className="fixed top-0 right-0 h-full w-full max-w-[720px] bg-[#0f1115] border-l border-zinc-800 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                        <PenLine className="w-5 h-5 text-blue-500" />
                        <h2 className="text-lg font-bold text-white">Add</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSave}
                            disabled={!question.trim() || !answer.trim() || status === "loading"}
                            className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            {status === "loading" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Save and close
                        </button>
                        <button
                            onClick={resetAndClose}
                            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto flex">
                    {/* Left: Content */}
                    <div className="flex-1 p-6 space-y-5 border-r border-zinc-800">
                        <div>
                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 block">
                                Content
                            </label>

                            {/* Question */}
                            <div className="mb-4">
                                <input
                                    type="text"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    placeholder="Question"
                                    className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm"
                                />
                            </div>

                            {/* Answer */}
                            <div className="relative">
                                <textarea
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    placeholder="Answer"
                                    rows={12}
                                    className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm resize-none"
                                />
                                {/* Character counter + formatting hints */}
                                <div className="flex items-center justify-between mt-2 px-1">
                                    <div className="flex items-center gap-2">
                                        <button className="text-zinc-500 hover:text-zinc-300 transition-colors text-xs p-1 rounded hover:bg-zinc-800">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                        </button>
                                    </div>
                                    <span className="text-xs text-zinc-600">
                                        {answer.length}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Status Messages */}
                        {status === "success" && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                                <span className="text-sm text-green-400">Q&A saved successfully!</span>
                            </div>
                        )}
                        {status === "error" && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                <AlertCircle className="w-4 h-4 text-red-400" />
                                <span className="text-sm text-red-400">{errorMsg}</span>
                            </div>
                        )}
                    </div>

                    {/* Right: Metadata Sidebar */}
                    <div className="w-[240px] p-5 space-y-6 flex-shrink-0">
                        {/* DATA */}
                        <div>
                            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Data</h4>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-zinc-500">Source</span>
                                    <div className="flex items-center gap-1.5">
                                        <PenLine className="w-3 h-3 text-zinc-400" />
                                        <span className="text-xs text-zinc-300">Manual</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-zinc-500">Last updated</span>
                                    <span className="text-xs text-zinc-500">—</span>
                                </div>
                            </div>
                        </div>

                        {/* USED BY */}
                        <div>
                            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Used by</h4>
                            <div className="space-y-2">
                                <label className="flex items-center justify-between cursor-pointer group">
                                    <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">Lyro AI Agent</span>
                                    <div
                                        onClick={() => setUsedBy(prev => ({ ...prev, lyro: !prev.lyro }))}
                                        className={`w-8 h-[18px] rounded-full relative transition-colors cursor-pointer ${usedBy.lyro ? "bg-blue-600" : "bg-zinc-700"
                                            }`}
                                    >
                                        <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-all ${usedBy.lyro ? "left-[16px]" : "left-[2px]"
                                            }`} />
                                    </div>
                                </label>
                                <label className="flex items-center justify-between cursor-pointer group">
                                    <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">Copilot</span>
                                    <div
                                        onClick={() => setUsedBy(prev => ({ ...prev, copilot: !prev.copilot }))}
                                        className={`w-8 h-[18px] rounded-full relative transition-colors cursor-pointer ${usedBy.copilot ? "bg-blue-600" : "bg-zinc-700"
                                            }`}
                                    >
                                        <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-all ${usedBy.copilot ? "left-[16px]" : "left-[2px]"
                                            }`} />
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* AUDIENCE */}
                        <div>
                            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Audience</h4>
                            <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 hover:border-zinc-600 transition-colors">
                                <span className="text-xs text-zinc-300">{audience}</span>
                                <ChevronDown className="w-3 h-3 text-zinc-500" />
                            </button>
                            <p className="text-[10px] text-zinc-600 mt-2 leading-relaxed">
                                Lyro AI Agent and Copilot will use the same audience.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
