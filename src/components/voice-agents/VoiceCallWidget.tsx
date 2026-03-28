"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { PhoneOff, Mic, MicOff, Volume2, VolumeX, Loader2 } from "lucide-react";
import { PUBLIC_API_BASE_URL } from "@/lib/backend-url";

interface VoiceCallWidgetProps {
    agentId: string;
    workspaceId: string;
    agentName: string;
    onEndCall?: () => void;
}

interface SocketIOClient {
    on: (event: string, callback: (...args: any[]) => void) => void;
    emit: (event: string, data: any) => void;
    disconnect: () => void;
    connected: boolean;
}

export default function VoiceCallWidget({ agentId, workspaceId, agentName, onEndCall }: VoiceCallWidgetProps) {
    const [status, setStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("connecting");
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [sessionId, setSessionId] = useState<string | null>(null);

    const socketRef = useRef<SocketIOClient | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioElementRef = useRef<HTMLAudioElement | null>(null);
    const audioUrlRef = useRef<string | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Initialize audio element for TTS playback
    useEffect(() => {
        if (typeof window !== "undefined") {
            audioElementRef.current = new Audio();
            audioElementRef.current.autoplay = false; // We'll trigger play manually after processing
            audioElementRef.current.preload = 'auto';
            // Pre-load to initialize the element and help with browser policies
            audioElementRef.current.load();

            audioElementRef.current.onended = () => {
                // Ready for next audio chunk
                console.log("Audio playback ended");
            };

            audioElementRef.current.onerror = (e: any) => {
                const error = audioElementRef.current?.error as any;
                console.error("Audio playback error:", {
                    code: error?.code,
                    message: error?.message,
                    name: error?.name,
                    event: e?.type || e
                });
            };
            audioElementRef.current.oncanplay = () => {
                console.log("Audio can play");
            };
        }

        return () => {
            if (audioElementRef.current) {
                audioElementRef.current.pause();
                const currentSrc = audioElementRef.current.src;
                if (currentSrc && currentSrc.startsWith('blob:')) {
                    URL.revokeObjectURL(currentSrc);
                }
                // Use removeAttribute instead of "" to avoid "invalid URL" errors
                audioElementRef.current.removeAttribute('src');
                audioElementRef.current.load();
            }
        };
    }, []);

    // Connect to socket.io and join voice session
    useEffect(() => {
        const socket = io(PUBLIC_API_BASE_URL, {
            path: "/socket.io/",
            transports: ["websocket", "polling"],
            withCredentials: true,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("Socket connected, joining voice session");
            socket.emit("voice:join", { agentId, workspaceId, callDirection: "webcall" });
        });

        socket.on("voice:joined", (data: { sessionId: string; agent: any; message: string }) => {
            console.log("Voice session joined:", data);
            setSessionId(data.sessionId);
            setStatus("connected");
        });

        socket.on("voice:tts", async (data: { audio: string; text: string; sessionId: string; contentType?: string }) => {
            console.log("Received TTS audio", { length: data.audio.length });
            if (!data.audio) {
                console.warn("Empty TTS audio received");
                return;
            }

            try {
                // Clean base64 (remove newlines/whitespace that Sarvam might include)
                const cleanBase64 = data.audio.replace(/\s/g, '');
                const mimeType = data.contentType || "audio/wav";
                const audioBlob = base64ToBlob(cleanBase64, mimeType);
                const audioUrl = URL.createObjectURL(audioBlob);
                audioUrlRef.current = audioUrl;

                if (audioElementRef.current) {
                    // Clean up previous URL if exists
                    const currentSrc = audioElementRef.current.src;
                    if (currentSrc && currentSrc.startsWith('blob:')) {
                        URL.revokeObjectURL(currentSrc);
                    }

                    // Set up event handlers
                    const playAudio = () => {
                        audioElementRef.current?.play().catch(err => {
                            console.error("Audio play error:", err);
                        });
                    };

                    audioElementRef.current.oncanplay = playAudio;
                    audioElementRef.current.onended = () => {
                        if (audioElementRef.current?.src?.startsWith('blob:')) {
                            URL.revokeObjectURL(audioElementRef.current.src);
                        }
                        audioUrlRef.current = null;
                    };

                    audioElementRef.current.src = audioUrl;
                    audioElementRef.current.load();
                }
            } catch (error) {
                console.error("Failed to process TTS audio:", error);
            }
        });

        socket.on("voice:error", (data: { message: string }) => {
            console.error("Voice error:", data.message);
            setStatus("error");
            alert(`Voice error: ${data.message}`);
        });

        socket.on("voice:ended", () => {
            console.log("Voice session ended by server");
            cleanup();
            setStatus("disconnected");
            onEndCall?.();
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected");
            cleanup();
            setStatus("disconnected");
            onEndCall?.();
        });

        return () => {
            socket.disconnect();
            stopMicrophone();
            if (audioElementRef.current) {
                audioElementRef.current.pause();
                const currentSrc = audioElementRef.current.src;
                if (currentSrc && currentSrc.startsWith('blob:')) {
                    URL.revokeObjectURL(currentSrc);
                }
                audioElementRef.current.removeAttribute('src');
                audioElementRef.current.load();
            }
            if (audioUrlRef.current) {
                URL.revokeObjectURL(audioUrlRef.current);
                audioUrlRef.current = null;
            }
        };
    }, [agentId, workspaceId, onEndCall]);

    const base64ToBlob = (base64: string, mimeType: string): Blob => {
        try {
            // Remove any data URL prefix if present
            const base64Content = base64.includes(',') ? base64.split(',')[1] : base64;
            // Clean any non-base64 characters
            const cleaned = base64Content.replace(/[^A-Za-z0-9+/=]/g, '');
            const charData = atob(cleaned);
            const byteArray = new Uint8Array(charData.length);
            
            for (let i = 0; i < charData.length; i++) {
                byteArray[i] = charData.charCodeAt(i);
            }
            
            return new Blob([byteArray], { type: mimeType });
        } catch (error) {
            console.error('base64ToBlob failed:', error, { base64Sample: base64.substring(0, 100) });
            throw error;
        }
    };

    const startMicrophone = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });
            streamRef.current = stream;

            // Use MediaRecorder to capture audio chunks
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: "audio/webm;codecs=opus",
            });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                    // Send audio chunk to server
                    const reader = new FileReader();
                    reader.onload = () => {
                        const base64 = reader.result as string;
                        const base64Data = base64.split(",")[1]; // Remove data URL prefix
                        socketRef.current?.emit("voice:audio", {
                            audio: base64Data,
                            sessionId,
                            mimeType: mediaRecorder.mimeType || 'audio/webm',
                        });
                    };
                    reader.readAsDataURL(event.data);
                }
            };

            mediaRecorder.start(1000); // Emit chunks every second (or adjust for lower latency)
            mediaRecorderRef.current = mediaRecorder;
        } catch (error: any) {
            console.error("Failed to get microphone:", error);
            alert("Could not access microphone. Please check permissions.");
        }
    };

    const stopMicrophone = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const endCall = () => {
        if (socketRef.current && sessionId) {
            socketRef.current.emit("voice:end", { sessionId });
        }
        cleanup();
        setStatus("disconnected");
        onEndCall?.();
    };

    const cleanup = () => {
        stopMicrophone();
        audioChunksRef.current = [];
        setSessionId(null);
    };

    const toggleMute = () => {
        if (isMuted) {
            startMicrophone();
        } else {
            stopMicrophone();
        }
        setIsMuted(!isMuted);
    };

    const toggleSpeaker = () => {
        if (audioElementRef.current) {
            if (isSpeakerOn) {
                audioElementRef.current.pause();
            } else {
                audioElementRef.current.play().catch(console.error);
            }
        }
        setIsSpeakerOn(!isSpeakerOn);
    };

    // Auto-start microphone when connected
    useEffect(() => {
        if (status === "connected") {
            startMicrophone();
        }
        return () => {
            if (status !== "connected") {
                stopMicrophone();
            }
        };
    }, [status]);

    const getStatusColor = () => {
        switch (status) {
            case "connected":
                return "bg-green-500";
            case "connecting":
                return "bg-yellow-500";
            case "error":
                return "bg-red-500";
            default:
                return "bg-gray-400";
        }
    };

    const getStatusText = () => {
        switch (status) {
            case "connected":
                return "Connected";
            case "connecting":
                return "Connecting...";
            case "error":
                return "Error";
            default:
                return "Disconnected";
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-center text-white">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <span className="text-4xl">🤖</span>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">{agentName}</h2>
                    <div className="flex items-center justify-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`}></div>
                        <span className="text-sm text-gray-300">{getStatusText()}</span>
                    </div>
                    {sessionId && (
                        <p className="text-xs text-gray-400 mt-3 font-mono">Session: {sessionId.slice(-8)}</p>
                    )}
                </div>

                {/* Call Controls */}
                <div className="p-8 bg-gradient-to-b from-gray-50 to-white">
                    <div className="flex justify-center items-center gap-8">
                        {/* Mute */}
                        <button
                            onClick={toggleMute}
                            disabled={status !== "connected"}
                            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                                isMuted
                                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            } ${status !== "connected" ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
                        </button>

                        {/* End Call */}
                        <button
                            onClick={endCall}
                            className="w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-lg"
                        >
                            <PhoneOff size={32} />
                        </button>

                        {/* Speaker */}
                        <button
                            onClick={toggleSpeaker}
                            disabled={status !== "connected"}
                            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                                !isSpeakerOn
                                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            } ${status !== "connected" ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            {!isSpeakerOn ? <VolumeX size={28} /> : <Volume2 size={28} />}
                        </button>
                    </div>

                    {/* Status Messages */}
                    <div className="mt-8 text-center min-h-[50px]">
                        {status === "connecting" && (
                            <div className="flex items-center justify-center gap-2 text-blue-600">
                                <Loader2 className="animate-spin" size={18} />
                                <span>Connecting to voice agent...</span>
                            </div>
                        )}
                        {status === "connected" && !isMuted && (
                            <p className="text-sm text-gray-600">Listening... Speak now.</p>
                        )}
                        {status === "connected" && isMuted && (
                            <p className="text-sm text-orange-600">Microphone muted</p>
                        )}
                        {status === "error" && (
                            <p className="text-sm text-red-600">Connection error. Please try again.</p>
                        )}
                        {status === "disconnected" && (
                            <p className="text-sm text-gray-500">Call ended</p>
                        )}
                    </div>

                    {/* Note */}
                    <div className="mt-6 text-xs text-gray-500 text-center border-t pt-4">
                        <p>This is a live voice demo using WebRTC streaming.</p>
                        <p className="mt-1">Your voice is transcribed and the AI responds in real-time.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
