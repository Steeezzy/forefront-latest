"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Globe, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface WebsiteImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function WebsiteImportModal({ isOpen, onClose }: WebsiteImportModalProps) {
    const [url, setUrl] = useState("");
    const [mode, setMode] = useState<"priority" | "single">("priority");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleImport = async () => {
        if (!url.trim()) return;

        setStatus("loading");
        setErrorMsg("");

        try {
            // Get the real agent ID
            const agentData = await apiFetch("/agents/primary");
            const agentId = agentData?.id;
            if (!agentId) throw new Error("Could not find your agent. Please try again.");

            await apiFetch("/knowledge/website", {
                method: "POST",
                body: JSON.stringify({
                    agentId,
                    url: url.trim(),
                    name: new URL(url.trim()).hostname,
                    mode
                })
            });

            setStatus("success");
            setTimeout(() => {
                setStatus("idle");
                setUrl("");
                onClose();
            }, 2000);
        } catch (err: any) {
            setStatus("error");
            setErrorMsg(err.message || "Failed to import website");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => { setStatus("idle"); setErrorMsg(""); onClose(); }}>
            <DialogContent className="max-w-lg bg-[#ffffff] border-zinc-800 text-gray-900 p-0 overflow-hidden">
                {/* Header */}
                <div className="p-6 pb-4">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Globe className="w-5 h-5 text-blue-500" />
                            Provide website URL to import knowledge
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400 text-sm mt-1">
                            Choose how you want to share knowledge. This will teach your AI to answer questions related to your business.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 pb-6 space-y-5">
                    {/* Import Mode Toggle */}
                    <div>
                        <p className="text-sm font-medium text-zinc-300 mb-3">How to import knowledge?</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setMode("priority")}
                                className={`p-4 rounded-lg border text-left transition-all ${mode === "priority"
                                    ? "border-blue-500 bg-blue-500/10"
                                    : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                                    }`}
                            >
                                <span className={`text-sm font-medium ${mode === "priority" ? "text-blue-400" : "text-gray-900"}`}>
                                    Scan priority pages
                                </span>
                                {mode === "priority" && <span className="ml-1 text-blue-400">✓</span>}
                                <p className="text-xs text-zinc-500 mt-1">
                                    AI will scan priority related pages using the top-level domain.
                                </p>
                            </button>
                            <button
                                onClick={() => setMode("single")}
                                className={`p-4 rounded-lg border text-left transition-all ${mode === "single"
                                    ? "border-blue-500 bg-blue-500/10"
                                    : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                                    }`}
                            >
                                <span className={`text-sm font-medium ${mode === "single" ? "text-blue-400" : "text-gray-900"}`}>
                                    Scan single page
                                </span>
                                <p className="text-xs text-zinc-500 mt-1">
                                    AI will scan only provided pages to import content.
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* URL Input */}
                    <div>
                        <p className="text-sm font-medium text-zinc-300 mb-2">Provide URL</p>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="e.g. https://mypage.com/faq"
                            className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-gray-900 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm"
                        />
                        <p className="text-xs text-zinc-500 mt-2">
                            • This process may take a few minutes and will continue in the background.
                        </p>
                    </div>

                    {/* Status Messages */}
                    {status === "success" && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-green-400">Website scraping started! Check progress in the Knowledge section.</span>
                        </div>
                    )}
                    {status === "error" && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                            <AlertCircle className="w-4 h-4 text-red-400" />
                            <span className="text-sm text-red-400">{errorMsg}</span>
                        </div>
                    )}

                    {/* Import Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleImport}
                            disabled={!url.trim() || status === "loading"}
                            className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-gray-900 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                        >
                            {status === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
                            Import knowledge
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
