"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { PhoneOff, Mic, MicOff, Volume2, VolumeX, Loader2, Languages } from "lucide-react";
import { PUBLIC_API_BASE_URL } from "@/lib/backend-url";

interface VoiceCallWidgetProps {
    agentId: string;
    workspaceId: string;
    agentName: string;
    callerLanguage?: string;
    enableLiveTranslation?: boolean;
    onEndCall?: () => void;
}

interface VoiceTranscript {
    id: string;
    speaker: "user" | "assistant";
    originalText: string;
    translatedText?: string | null;
    languageCode?: string;
    translatedLanguageCode?: string | null;
    timestamp?: string;
}

interface SocketIOClient {
    on: (event: string, callback: (...args: any[]) => void) => void;
    emit: (event: string, data: any) => void;
    disconnect: () => void;
    connected: boolean;
}

const LANGUAGE_LABELS: Record<string, string> = {
    "en-IN": "English",
    "hi-IN": "Hindi",
    "ta-IN": "Tamil",
    "te-IN": "Telugu",
    "kn-IN": "Kannada",
    "ml-IN": "Malayalam",
    "mr-IN": "Marathi",
    "gu-IN": "Gujarati",
    "bn-IN": "Bengali",
    "pa-IN": "Punjabi",
};

export default function VoiceCallWidget({
    agentId,
    workspaceId,
    agentName,
    callerLanguage = "en-IN",
    enableLiveTranslation = false,
    onEndCall,
}: VoiceCallWidgetProps) {
    const [status, setStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("connecting");
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [agentLanguageCode, setAgentLanguageCode] = useState<string>(callerLanguage);
    const [transcripts, setTranscripts] = useState<VoiceTranscript[]>([]);
    const [audioUnlockRequired, setAudioUnlockRequired] = useState(false);
    const [playbackError, setPlaybackError] = useState<string | null>(null);

    const socketRef = useRef<SocketIOClient | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioElementRef = useRef<HTMLAudioElement | null>(null);
    const audioUrlRef = useRef<string | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const captureCycleTimerRef = useRef<number | null>(null);
    const sessionIdRef = useRef<string | null>(null);
    const transcriptViewportRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        sessionIdRef.current = sessionId;
    }, [sessionId]);

    const attemptAudioPlayback = async () => {
        if (!audioElementRef.current) {
            return;
        }

        try {
            await audioElementRef.current.play();
            setAudioUnlockRequired(false);
            setPlaybackError(null);
        } catch (error: any) {
            console.error("Audio play error:", error);
            if (error?.name === "NotAllowedError") {
                setAudioUnlockRequired(true);
                setPlaybackError("Tap Enable Audio to allow browser playback.");
                return;
            }
            setPlaybackError("Audio playback failed. Check system output and speaker settings.");
        }
    };

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
            socket.emit("voice:join", {
                agentId,
                workspaceId,
                callDirection: "webcall",
                callerLanguage,
                enableLiveTranslation,
            });
        });

        socket.on("voice:joined", (data: { sessionId: string; agent: any; message: string; agentLanguageCode?: string }) => {
            console.log("Voice session joined:", data);
            setSessionId(data.sessionId);
            if (data.agentLanguageCode) {
                setAgentLanguageCode(data.agentLanguageCode);
            }
            setStatus("connected");
        });

        socket.on("voice:transcript", (data: {
            speaker: "user" | "assistant";
            originalText: string;
            translatedText?: string | null;
            languageCode?: string;
            translatedLanguageCode?: string | null;
            timestamp?: string;
        }) => {
            const content = (data.originalText || "").trim();
            if (!content) {
                return;
            }

            setTranscripts((current) => [
                ...current,
                {
                    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    speaker: data.speaker,
                    originalText: data.originalText,
                    translatedText: data.translatedText || null,
                    languageCode: data.languageCode,
                    translatedLanguageCode: data.translatedLanguageCode || null,
                    timestamp: data.timestamp,
                },
            ]);
        });

        socket.on("voice:tts", async (data: { audio: string; text: string; sessionId: string; contentType?: string; shouldEndCall?: boolean }) => {
            console.log("Received TTS audio", { length: data.audio.length });
            if (!data.audio) {
                console.warn("Empty TTS audio received");
                return;
            }

            const shouldEndCall = Boolean(data.shouldEndCall);

            try {
                setPlaybackError(null);

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
                        if (audioElementRef.current?.muted) {
                            return;
                        }
                        attemptAudioPlayback();
                    };

                    audioElementRef.current.oncanplay = playAudio;
                    audioElementRef.current.onended = () => {
                        if (audioElementRef.current?.src?.startsWith('blob:')) {
                            URL.revokeObjectURL(audioElementRef.current.src);
                        }
                        audioUrlRef.current = null;

                        if (shouldEndCall) {
                            endCall();
                        }
                    };

                    audioElementRef.current.src = audioUrl;
                    audioElementRef.current.load();
                }
            } catch (error) {
                console.error("Failed to process TTS audio:", error);
            }
        });

        socket.on("voice:error", (data: { message: string; details?: string }) => {
            const text = data?.details ? `${data.message}: ${data.details}` : data.message;
            console.error("Voice error:", text);
            setStatus("error");
            alert(`Voice error: ${text}`);
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
    }, [agentId, workspaceId, callerLanguage, enableLiveTranslation, onEndCall]);

    useEffect(() => {
        if (transcriptViewportRef.current) {
            transcriptViewportRef.current.scrollTop = transcriptViewportRef.current.scrollHeight;
        }
    }, [transcripts]);

    useEffect(() => {
        if (audioElementRef.current) {
            audioElementRef.current.muted = !isSpeakerOn;
        }
    }, [isSpeakerOn]);

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

    const emitAudioBlob = (blob: Blob, mimeType: string) => {
        const currentSessionId = sessionIdRef.current;
        if (!blob.size || !currentSessionId) {
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result as string;
            const base64Data = base64.split(",")[1];
            socketRef.current?.emit("voice:audio", {
                audio: base64Data,
                sessionId: currentSessionId,
                mimeType,
            });
        };
        reader.readAsDataURL(blob);
    };

    const startMicrophone = async () => {
        if (streamRef.current) {
            return;
        }

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

            const mimeCandidates = [
                "audio/webm;codecs=opus",
                "audio/webm",
                "audio/ogg;codecs=opus",
                "audio/ogg",
                "audio/mp4",
            ];
            const supportedMimeType = mimeCandidates.find((candidate) => {
                try {
                    return typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(candidate);
                } catch {
                    return false;
                }
            });

            const chunkDurationMs = 2400;
            const createRecorder = (stream: MediaStream, preferredMimeType?: string) => {
                if (preferredMimeType) {
                    try {
                        return new MediaRecorder(stream, { mimeType: preferredMimeType });
                    } catch (error) {
                        console.warn("Preferred recorder mime failed, falling back to browser default", preferredMimeType, error);
                    }
                }
                return new MediaRecorder(stream);
            };

            const startRecorderCycle = (attempt = 0) => {
                if (!streamRef.current) {
                    return;
                }

                const mediaRecorder = createRecorder(
                    streamRef.current,
                    attempt === 0 ? supportedMimeType : undefined
                );
                mediaRecorderRef.current = mediaRecorder;

                const cycleChunks: Blob[] = [];
                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        cycleChunks.push(event.data);
                    }
                };

                mediaRecorder.onstop = () => {
                    if (captureCycleTimerRef.current !== null) {
                        window.clearTimeout(captureCycleTimerRef.current);
                        captureCycleTimerRef.current = null;
                    }

                    if (cycleChunks.length > 0) {
                        const rawMimeType = mediaRecorder.mimeType || cycleChunks[0]?.type || "audio/webm";
                        const normalizedMimeType = (rawMimeType.split(";")[0] || "audio/webm").trim().toLowerCase();
                        const mergedBlob = new Blob(cycleChunks, { type: normalizedMimeType });
                        emitAudioBlob(mergedBlob, normalizedMimeType);
                    }

                    if (streamRef.current) {
                        window.setTimeout(() => startRecorderCycle(0), 120);
                    }
                };

                try {
                    mediaRecorder.start();
                } catch (startError) {
                    console.error("MediaRecorder start failed", startError);
                    if (streamRef.current && attempt < 2) {
                        window.setTimeout(() => startRecorderCycle(attempt + 1), 220);
                        return;
                    }

                    setStatus("error");
                    alert("Voice capture failed to start. Please retry the call.");
                    stopMicrophone();
                    return;
                }

                captureCycleTimerRef.current = window.setTimeout(() => {
                    if (mediaRecorder.state !== "inactive") {
                        mediaRecorder.stop();
                    }
                }, chunkDurationMs);
            };

            startRecorderCycle();
        } catch (error: any) {
            console.error("Failed to get microphone:", error);
            alert("Could not access microphone. Please check permissions.");
        }
    };

    const stopMicrophone = () => {
        const stream = streamRef.current;
        streamRef.current = null;

        if (captureCycleTimerRef.current !== null) {
            window.clearTimeout(captureCycleTimerRef.current);
            captureCycleTimerRef.current = null;
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
        mediaRecorderRef.current = null;

        if (stream) {
            stream.getTracks().forEach(track => track.stop());
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
                attemptAudioPlayback();
            }
        }
        setIsSpeakerOn(!isSpeakerOn);
    };

    const unlockAudio = () => {
        setAudioUnlockRequired(false);
        attemptAudioPlayback();
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

    const formatLanguageLabel = (code?: string | null) => {
        if (!code) {
            return "Unknown";
        }
        return LANGUAGE_LABELS[code] || code;
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1500] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden border border-gray-200">
                <div className="grid md:grid-cols-[340px_1fr]">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg mx-auto">
                            <span className="text-3xl">🤖</span>
                        </div>
                        <h2 className="text-2xl font-bold mt-5 text-center">{agentName}</h2>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`}></div>
                            <span className="text-sm text-gray-200">{getStatusText()}</span>
                        </div>
                        {sessionId && (
                            <p className="text-xs text-gray-400 mt-3 font-mono text-center">Session: {sessionId.slice(-8)}</p>
                        )}

                        <div className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-4">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-gray-300">
                                <Languages size={14} />
                                Translation
                            </div>
                            <p className="text-sm text-white mt-2">
                                Caller: {formatLanguageLabel(callerLanguage)}
                            </p>
                            <p className="text-sm text-white mt-1">
                                Agent: {formatLanguageLabel(agentLanguageCode)}
                            </p>
                            <p className="text-xs mt-3 text-gray-300">
                                {enableLiveTranslation ? "Live translation is ON." : "Live translation is OFF."}
                            </p>
                        </div>

                        <div className="mt-8 flex justify-center items-center gap-5">
                            <button
                                onClick={toggleMute}
                                disabled={status !== "connected"}
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                                    isMuted
                                        ? "bg-red-100 text-red-600 hover:bg-red-200"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                } ${status !== "connected" ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                            </button>

                            <button
                                onClick={endCall}
                                className="w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-lg"
                            >
                                <PhoneOff size={30} />
                            </button>

                            <button
                                onClick={toggleSpeaker}
                                disabled={status !== "connected"}
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                                    !isSpeakerOn
                                        ? "bg-red-100 text-red-600 hover:bg-red-200"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                } ${status !== "connected" ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                {!isSpeakerOn ? <VolumeX size={24} /> : <Volume2 size={24} />}
                            </button>
                        </div>

                        <div className="mt-6 text-xs text-gray-400 text-center">
                            <p>Live voice stream with Sarvam STT + TTS.</p>
                            <p className="mt-1">Speak naturally to test full call behavior.</p>
                        </div>
                    </div>

                    <div className="p-6 md:p-7 bg-white">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Live Transcript</h3>
                                <p className="text-xs text-gray-500 mt-1">Original speech with translated subtitles in real-time.</p>
                            </div>
                            <div className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                                {enableLiveTranslation ? "Translate On" : "Translate Off"}
                            </div>
                        </div>

                        <div
                            ref={transcriptViewportRef}
                            className="h-[360px] overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3"
                        >
                            {transcripts.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-sm text-gray-500 text-center px-4">
                                    Start speaking. Transcripts will appear here live.
                                </div>
                            ) : (
                                transcripts.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`max-w-[90%] ${item.speaker === "user" ? "ml-auto" : "mr-auto"}`}
                                    >
                                        <div className={`text-[11px] mb-1 ${item.speaker === "user" ? "text-right text-gray-500" : "text-left text-gray-500"}`}>
                                            {item.speaker === "user" ? "You" : "Assistant"}
                                            {item.languageCode ? ` · ${formatLanguageLabel(item.languageCode)}` : ""}
                                        </div>
                                        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${item.speaker === "user" ? "bg-gray-900 text-white" : "bg-white text-gray-900 border border-gray-200"}`}>
                                            {item.originalText}
                                        </div>
                                        {item.translatedText && item.translatedText !== item.originalText && (
                                            <div className="mt-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900 leading-relaxed">
                                                Translation ({formatLanguageLabel(item.translatedLanguageCode || "")}): {item.translatedText}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-4 min-h-[28px] text-sm">
                            {status === "connecting" && (
                                <div className="flex items-center gap-2 text-blue-600">
                                    <Loader2 className="animate-spin" size={16} />
                                    <span>Connecting to voice agent...</span>
                                </div>
                            )}
                            {status === "connected" && !isMuted && (
                                <p className="text-emerald-700">Listening now. Speak to continue the call.</p>
                            )}
                            {status === "connected" && isMuted && (
                                <p className="text-orange-600">Microphone muted. Unmute to talk.</p>
                            )}
                            {status === "error" && (
                                <p className="text-red-600">Connection error. Please retry the call.</p>
                            )}
                            {status === "disconnected" && (
                                <p className="text-gray-500">Call ended.</p>
                            )}

                            {audioUnlockRequired && (
                                <div className="mt-2 flex items-center gap-3">
                                    <button
                                        onClick={unlockAudio}
                                        className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-black"
                                    >
                                        Enable Audio
                                    </button>
                                    <span className="text-xs text-gray-600">Browser blocked autoplay for voice output.</span>
                                </div>
                            )}

                            {playbackError && (
                                <p className="mt-2 text-xs text-red-600">{playbackError}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
