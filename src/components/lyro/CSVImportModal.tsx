"use client";

import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, Download, X } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface CSVImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CSVImportModal({ isOpen, onClose }: CSVImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [duplicateMode, setDuplicateMode] = useState<"replace" | "skip">("replace");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [importResult, setImportResult] = useState<{ total: number; imported: number } | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (selectedFile: File) => {
        if (!selectedFile.name.endsWith(".csv")) {
            setErrorMsg("Please upload a .CSV file");
            setStatus("error");
            return;
        }
        if (selectedFile.size > 5 * 1024 * 1024) {
            setErrorMsg("File size must be under 5 MB");
            setStatus("error");
            return;
        }
        setFile(selectedFile);
        setStatus("idle");
        setErrorMsg("");
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    }, []);

    const handleImport = async () => {
        if (!file) return;
        setStatus("loading");
        setErrorMsg("");

        try {
            const csvContent = await file.text();

            // Get the real agent ID
            const agentData = await apiFetch("/agents/primary");
            const agentId = agentData?.id;
            if (!agentId) throw new Error("Could not find your agent. Please try again.");

            const data = await apiFetch("/knowledge/csv-import", {
                method: "POST",
                body: JSON.stringify({
                    agentId,
                    name: file.name,
                    csvContent
                })
            });

            setImportResult(data?.data);
            setStatus("success");
            setTimeout(() => {
                setStatus("idle");
                setFile(null);
                setImportResult(null);
                onClose();
            }, 3000);
        } catch (err: any) {
            setStatus("error");
            setErrorMsg(err.message || "Failed to import CSV");
        }
    };

    const downloadTemplate = () => {
        let baseUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!baseUrl) {
            baseUrl = typeof window !== 'undefined'
                ? `${window.location.protocol}//${window.location.hostname}:3001`
                : 'http://localhost:3001';
        }
        window.open(`${baseUrl}/knowledge/csv-template`, "_blank");
    };

    const resetAndClose = () => {
        setFile(null);
        setStatus("idle");
        setErrorMsg("");
        setImportResult(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={resetAndClose}>
            <DialogContent className="max-w-lg bg-[#18181b] border-zinc-800 text-white p-0 overflow-hidden">
                <div className="p-6 pb-4">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-blue-500" />
                            Import Q&As from .CSV file
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400 text-sm mt-1">
                            Add your questions and answers in the sheet. Upload .CSV file to feed your AI with knowledge or download our sample to prepare your file.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 pb-6 space-y-5">
                    {/* Info Note */}
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-300">
                            The file must contain two columns: &apos;Question&apos; and &apos;Answer&apos;. Both should be brief. Use the attached example as a starting point for your file.{" "}
                            <button onClick={downloadTemplate} className="text-blue-400 hover:underline font-medium">Download sample</button>
                        </p>
                    </div>

                    {/* File Drop Area */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragOver
                            ? "border-blue-500 bg-blue-500/10"
                            : file
                                ? "border-green-500/50 bg-green-500/5"
                                : "border-zinc-700 hover:border-zinc-500 bg-zinc-800/30"
                            }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                        />
                        {file ? (
                            <div className="flex items-center justify-center gap-3">
                                <FileSpreadsheet className="w-8 h-8 text-green-400" />
                                <div className="text-left">
                                    <p className="text-sm font-medium text-white">{file.name}</p>
                                    <p className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                    className="ml-2 p-1 rounded hover:bg-zinc-700"
                                >
                                    <X className="w-4 h-4 text-zinc-400" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
                                <p className="text-sm text-zinc-300">
                                    <span className="text-blue-400 font-medium">Browse</span> or drag & drop it here
                                </p>
                                <p className="text-xs text-zinc-500 mt-1">
                                    Accepts .CSV files up to 5 MB in size and 600 entries.
                                </p>
                            </>
                        )}
                    </div>

                    {/* Duplicate Handling */}
                    <div>
                        <p className="text-sm font-medium text-zinc-300 mb-3">How should we proceed if the same Q&As are found?</p>
                        <div className="space-y-2">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${duplicateMode === "replace" ? "border-blue-500" : "border-zinc-600"
                                    }`}>
                                    {duplicateMode === "replace" && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                </div>
                                <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                                    Import new and replace duplicated Q&As with CSV content
                                </span>
                            </label>
                            <label
                                onClick={() => setDuplicateMode("skip")}
                                className="flex items-center gap-3 cursor-pointer group"
                            >
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${duplicateMode === "skip" ? "border-blue-500" : "border-zinc-600"
                                    }`}>
                                    {duplicateMode === "skip" && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                </div>
                                <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                                    Import new and skip duplicated Q&As from CSV file
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Status Messages */}
                    {status === "success" && importResult && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-green-400">
                                Imported {importResult.imported} of {importResult.total} Q&A pairs!
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
                            disabled={!file || status === "loading"}
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
