"use client";

import { useState, useRef, useEffect } from "react";
import { X, RefreshCw, Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";

interface TestConversaModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    sources?: string[];
}

export function TestConversaModal({ isOpen, onClose }: TestConversaModalProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [agentId, setAgentId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    // Fetch agent ID on open
    useEffect(() => {
        if (isOpen && !agentId) {
            apiFetch("/agents/primary")
                .then((data) => {
                    if (data?.id) setAgentId(data.id);
                })
                .catch(() => { });
        }
    }, [isOpen, agentId]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        const question = input.trim();
        if (!question || !agentId || isTyping) return;

        // Add user message
        const userMsg: ChatMessage = {
            id: `u-${Date.now()}`,
            role: "user",
            content: question,
        };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        try {
            const response = await apiFetch("/api/knowledge/chat", {
                method: "POST",
                body: JSON.stringify({ agentId, question }),
            });

            const aiMsg: ChatMessage = {
                id: `a-${Date.now()}`,
                role: "assistant",
                content: response?.answer || "I couldn't find an answer to that question.",
                sources: response?.sources || [],
            };
            setMessages((prev) => [...prev, aiMsg]);
        } catch (err: any) {
            const errMsg: ChatMessage = {
                id: `e-${Date.now()}`,
                role: "assistant",
                content: "Sorry, something went wrong. Please try again.",
            };
            setMessages((prev) => [...prev, errMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleReset = () => {
        setMessages([]);
        setInput("");
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-4 sm:p-6 bg-black/40 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="bg-[#ffffff] w-full max-w-[360px] h-[600px] rounded-[16px] border border-[#e4e4e7] flex flex-col overflow-hidden"
                        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
                    >
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-[#ffffff] to-[#f3f4f6]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <Bot size={20} className="text-gray-900" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-sm">Test Conversa</h3>
                                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                        <Sparkles size={10} className="text-blue-400" />
                                        AI powered by your knowledge base
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleReset}
                                    className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-gray-900 transition-colors"
                                    title="Reset conversation"
                                >
                                    <RefreshCw size={16} />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-gray-900 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f9fafb] min-h-[200px]">
                            {messages.length === 0 && !isTyping && (
                                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                                    <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-4">
                                        <Bot size={28} className="text-blue-400" />
                                    </div>
                                    <h4 className="text-gray-900 font-medium text-sm mb-2">Test your AI Agent</h4>
                                    <p className="text-slate-500 text-xs leading-relaxed max-w-[240px]">
                                        Ask any question to test how Conversa responds using your imported knowledge base.
                                    </p>

                                    {/* Quick suggestions */}
                                    <div className="mt-6 space-y-2 w-full">
                                        {[
                                            "What do you know about my business?",
                                            "What services do you offer?",
                                            "Tell me about your return policy",
                                        ].map((q) => (
                                            <button
                                                key={q}
                                                onClick={() => {
                                                    setInput(q);
                                                }}
                                                className="w-full text-left px-4 py-2.5 rounded-xl bg-white/[0.03] border border-gray-200 text-slate-400 text-xs hover:bg-white/[0.06] hover:text-gray-900 hover:border-blue-500/20 transition-all"
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`flex gap-2.5 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                                    >
                                        {/* Avatar */}
                                        <div
                                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.role === "user"
                                                ? "bg-slate-700"
                                                : "bg-gradient-to-br from-blue-500 to-blue-700"
                                                }`}
                                        >
                                            {msg.role === "user" ? (
                                                <User size={13} className="text-gray-900" />
                                            ) : (
                                                <Bot size={13} className="text-gray-900" />
                                            )}
                                        </div>

                                        {/* Bubble */}
                                        <div style={{ maxWidth: '80%' }}>
                                            <div
                                                style={{
                                                    fontSize: '13px',
                                                    padding: '8px 14px',
                                                    ...(msg.role === "user" ? {
                                                        background: '#6366f1',
                                                        color: '#ffffff',
                                                        borderRadius: '12px 12px 2px 12px',
                                                    } : {
                                                        background: '#ffffff',
                                                        border: '1px solid #e4e4e7',
                                                        borderRadius: '12px 12px 12px 2px',
                                                        color: '#09090b',
                                                    })
                                                }}
                                            >
                                                {msg.content}
                                            </div>

                                            {/*
                                            {/* Sources }
                                            {msg.sources && msg.sources.length > 0 && (
                                                <div className="mt-1.5 flex flex-wrap gap-1">
                                                    {msg.sources.map((src, i) => (
                                                        <span
                                                            key={i}
                                                            className="text-[10px] text-slate-600 bg-white/[0.03] border border-gray-200 px-2 py-0.5 rounded-full"
                                                        >
                                                            {src}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            */}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Typing indicator */}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="flex gap-2.5">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                                            <Bot size={13} className="text-gray-900" />
                                        </div>
                                        <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[#f3f4f6] border border-gray-200">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input bar */}
                        <form
                            onSubmit={handleSend}
                            className="px-4 py-3 bg-[#ffffff] border-t border-gray-200"
                        >
                            <div className="relative">
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type a message..."
                                    disabled={isTyping}
                                    className="w-full bg-[#f9fafb] text-gray-900 placeholder-slate-600 rounded-xl pl-4 pr-12 py-3 text-sm border border-transparent focus:border-blue-500/30 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all disabled:opacity-50"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isTyping}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-gray-900 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-30 disabled:bg-transparent disabled:text-slate-600"
                                >
                                    {isTyping ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Send size={16} />
                                    )}
                                </button>
                            </div>
                            <p className="text-center text-[10px] text-slate-600 mt-2">
                                Powered by Sarvam AI • Responses based on your knowledge base
                            </p>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
