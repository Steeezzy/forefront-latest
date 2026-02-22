"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Megaphone, Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { apiFetch } from "@/lib/api";
import Link from 'next/link';

interface ZendeskImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ZendeskImportModal({ isOpen, onClose }: ZendeskImportModalProps) {
    const [zendeskUrl, setZendeskUrl] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [importResult, setImportResult] = useState<{ total: number; imported: number } | null>(null);

    const handleImport = async () => {
        if (!zendeskUrl.trim()) return;

        setStatus("loading");
        setErrorMsg("");

        try {
            // Extract subdomain from URL
            let subdomain = zendeskUrl.trim();
            if (subdomain.includes("zendesk.com")) {
                const match = subdomain.match(/(?:https?:\/\/)?([^.]+)\.zendesk\.com/);
                if (match) subdomain = match[1];
            }

            // Get the real agent ID
            const agentData = await apiFetch("/agents/primary");
            const agentId = agentData?.id;
            if (!agentId) throw new Error("Could not find your agent. Please try again.");

            const data = await apiFetch("/knowledge/zendesk", {
                method: "POST",
                body: JSON.stringify({
                    agentId,
                    subdomain,
                    email: "api@example.com", // placeholder — in production, user would configure this
                    apiToken: "placeholder" // placeholder — in production, user would configure this
                })
            });

            setImportResult(data?.data);
            setStatus("success");
            setTimeout(() => {
                setStatus("idle");
                setZendeskUrl("");
                setImportResult(null);
                onClose();
            }, 3000);
        } catch (err: any) {
            setStatus("error");
            setErrorMsg(err.message || "Failed to import from Zendesk");
        }
    };

    const resetAndClose = () => {
        setStatus("idle");
        setErrorMsg("");
        setZendeskUrl("");
        setImportResult(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={resetAndClose}>
            <DialogContent className="max-w-lg bg-[#18181b] border-zinc-800 text-white p-0 overflow-hidden">
                <div className="p-6 pb-4">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                            <Megaphone className="w-5 h-5 text-blue-500" />
                            Import Zendesk public articles
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400 text-sm mt-1">
                            Provide the URL of your Zendesk Help Center. We&apos;ll import all public articles and use them as knowledge for your AI.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 pb-6 space-y-5">
                    {/* URL Input */}
                    <div>
                        <label className="text-sm font-medium text-zinc-300 mb-2 block">
                            Enter URL of your website
                        </label>
                        <input
                            type="text"
                            value={zendeskUrl}
                            onChange={(e) => setZendeskUrl(e.target.value)}
                            placeholder="e.g. mypage.zendesk.com"
                            className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm"
                        />
                    </div>

                    {/* Info Note */}
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
                        <Info className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-zinc-400">
                            Zendesk articles must be public, and the maximum number of imported articles is 1,000.
                            Need more? <Link href="/panel/upgrade" className="text-blue-400 hover:underline cursor-pointer">Upgrade to the Plus plan.</Link>
                        </p>
                    </div>

                    {/* Status Messages */}
                    {status === "success" && importResult && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-green-400">
                                Imported {importResult.imported} of {importResult.total} articles!
                            </span>
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
                            disabled={!zendeskUrl.trim() || status === "loading"}
                            className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                        >
                            {status === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
                            Import
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
