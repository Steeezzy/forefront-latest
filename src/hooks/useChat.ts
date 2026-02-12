"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";

export interface Message {
    id: string;
    content: string;
    sender_type: 'visitor' | 'agent' | 'ai' | 'system';
    created_at: string;
}

export function useChat(conversationId: string) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [limitReached, setLimitReached] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!conversationId) return;

        // Initialize Socket
        const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
            withCredentials: true,
            transports: ['websocket'],
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("Socket connected");
            setIsConnected(true);
            socket.emit("join_room", conversationId);
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected");
            setIsConnected(false);
        });

        socket.on("new_message", (msg: Message) => {
            setMessages((prev) => [...prev, msg]);

            // Check for system message indicating limit
            if (msg.sender_type === 'system' && msg.content.includes('limit reached')) {
                setLimitReached(true);
            }
        });

        socket.on("error", (err: any) => {
            console.error("Socket error", err);
        });

        return () => {
            socket.disconnect();
        };
    }, [conversationId]);

    const sendMessage = (content: string) => {
        if (limitReached) return;
        if (!socketRef.current) return;

        // Optimistic update (optional, but good for UX)
        // For now, rely on server echo to keep it simple and consistent with IDs

        socketRef.current.emit("send_message", {
            conversationId,
            content,
            senderType: 'visitor' // Hardcoded for this demo flow, since we are simulating the visitor experience in the panel for now
        });
    };

    return { messages, sendMessage, limitReached, isConnected };
}
