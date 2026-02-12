"use client";

import { LyroSidebar } from '@/components/lyro/LyroSidebar';
import { useChat } from '@/hooks/useChat';
import { useState } from 'react';

// Hardcoded conversation ID for demo - in real app, this comes from URL or list
const DEMO_CONVERSATION_ID = "3120b8f8-01af-4cb6-bcf4-ea41a89b86d3";

export default function LyroHubPage() {
    const { messages, sendMessage, limitReached, isConnected } = useChat(DEMO_CONVERSATION_ID);
    const [input, setInput] = useState("");

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        sendMessage(input);
        setInput("");
    };

    return (
        <div className="flex h-full bg-[#0f1115]">
            <LyroSidebar />

            <div className="flex-1 flex flex-col h-full relative">
                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="text-gray-500 text-center mt-10">No messages yet. Start chatting!</div>
                    )}
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender_type === 'visitor' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] p-3 rounded-lg ${msg.sender_type === 'visitor' ? 'bg-blue-600' : 'bg-gray-700'}`}>
                                <p className="text-sm">{msg.content}</p>
                                <span className="text-xs opacity-50 block mt-1">{new Date(msg.created_at).toLocaleTimeString()}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-800 bg-[#0f1115]">
                    {limitReached ? (
                        <div className="text-center p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
                            <h3 className="text-red-500 font-bold mb-2">Plan Limit Reached</h3>
                            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
                                Upgrade Plan
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSend} className="flex gap-2">
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 bg-[#1a1d24] border border-gray-700 rounded p-2 focus:outline-none focus:border-blue-500"
                                disabled={!isConnected}
                            />
                            <button
                                type="submit"
                                disabled={!isConnected || !input.trim()}
                                className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                            >
                                Send
                            </button>
                        </form>
                    )}
                    {!isConnected && <div className="text-xs text-red-500 mt-1">Disconnected</div>}
                </div>
            </div>
        </div>
    );
}
