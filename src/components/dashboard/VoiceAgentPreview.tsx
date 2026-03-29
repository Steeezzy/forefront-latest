"use client";

import { Phone, Volume2, MoreHorizontal, Pause, Plus } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceAgent {
    id: string;
    name: string;
    status: 'active' | 'inactive' | 'busy';
    call_count: number;
    last_active?: string;
    direction: 'inbound' | 'outbound' | 'both';
}

export function VoiceAgentPreview() {
    const [agents, setAgents] = useState<VoiceAgent[]>([]);
    const [testingAgent, setTestingAgent] = useState<string | null>(null);
    const [speaking, setSpeaking] = useState(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        // Mock data - replace with real API
        setAgents([
            { id: '1', name: 'Support AI', status: 'active', call_count: 124, direction: 'inbound' },
            { id: '2', name: 'Sales Assistant', status: 'active', call_count: 89, direction: 'outbound' },
            { id: '3', name: 'Receptionist', status: 'busy', call_count: 234, direction: 'both' },
        ]);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-emerald-500';
            case 'busy':
                return 'bg-amber-500 animate-pulse';
            case 'inactive':
                return 'bg-gray-400';
            default:
                return 'bg-gray-400';
        }
    };

    const getDirectionLabel = (direction: string) => {
        switch (direction) {
            case 'inbound':
                return 'Inbound';
            case 'outbound':
                return 'Outbound';
            case 'both':
                return 'Hybrid';
            default:
                return direction;
        }
    };

    const handleTestVoice = async (agent: VoiceAgent) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

        if (testingAgent === agent.id && speaking) {
            window.speechSynthesis.cancel();
            setSpeaking(false);
            setTestingAgent(null);
            return;
        }

        // Stop any currently playing audio
        window.speechSynthesis.cancel();

        setTestingAgent(agent.id);
        setSpeaking(true);

        const utterance = new SpeechSynthesisUtterance(`Hello, this is ${agent.name}. How can I help you today?`);
        utterance.lang = 'en-US';
        utterance.rate = 0.95;
        utterance.volume = 1;
        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => {
            setSpeaking(false);
            setTestingAgent(null);
        };
        utterance.onerror = () => {
            setSpeaking(false);
            setTestingAgent(null);
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    return (
        <div className="h-full rounded-2xl border border-border-subtle bg-bg-card p-6 shadow-sm flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-elevated text-text-primary shadow-sm border border-border-subtle ring-1 ring-border-subtle">
                        <Phone className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-text-primary">Voice Agents</h3>
                        <p className="text-xs text-text-secondary">{agents.length} total agents</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-text-secondary hover:text-accent hover:bg-bg-hover"
                    asChild
                >
                    <a href="/panel/voice-agents" className="flex items-center gap-1">
                        <span>Manage</span>
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </a>
                </Button>
            </div>

            {/* Agents List */}
            <div className="flex-1 space-y-2.5 overflow-y-auto custom-scrollbar -mr-2 pr-2">
                {agents.map((agent, idx) => (
                    <div
                        key={agent.id}
                        className={cn(
                            "group flex items-center justify-between rounded-xl border p-4 transition-all duration-300",
                            "hover:shadow-sm border-border-subtle hover:border-border-default hover:bg-bg-hover",
                            "animate-fade-in",
                            idx === 0 && "animation-delay-0",
                        )}
                        style={{
                            animationDelay: `${idx * 100}ms`,
                        }}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            {/* Status indicator */}
                            <div className="relative">
                                <div className={cn(
                                    "h-2.5 w-2.5 rounded-full",
                                    getStatusColor(agent.status)
                                )} />
                                {agent.status === 'active' && (
                                    <div className={cn(
                                        "absolute inset-0 h-2.5 w-2.5 rounded-full animate-ping",
                                        getStatusColor(agent.status)
                                    )} />
                                )}
                            </div>

                            <div className="min-w-0">
                                <h4 className="text-sm font-semibold text-text-primary truncate">
                                    {agent.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-text-secondary">
                                        {getDirectionLabel(agent.direction)}
                                    </span>
                                    <span className="text-xs text-text-muted opacity-30">•</span>
                                    <span className="text-xs text-text-secondary">
                                        {agent.call_count.toLocaleString()} calls
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-8 w-8 rounded-lg transition-all duration-300",
                                    testingAgent === agent.id && speaking
                                        ? "bg-red-500/10 text-red-600 hover:bg-red-500/20"
                                        : "text-text-muted hover:text-accent hover:bg-bg-hover"
                                )}
                                onClick={() => handleTestVoice(agent)}
                                title={testingAgent === agent.id && speaking ? "Stop test" : "Test voice"}
                            >
                                {testingAgent === agent.id && speaking ? (
                                    <Pause className="h-4 w-4" />
                                ) : (
                                    <Volume2 className="h-4 w-4" />
                                )}
                            </Button>
                            <button className="rounded-lg p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-hover opacity-0 group-hover:opacity-100 transition-all">
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick stats */}
            <div className="mt-5 grid grid-cols-2 gap-3 pt-4 border-t border-border-subtle">
                <div className="rounded-lg bg-bg-elevated p-3 border border-border-subtle">
                    <p className="text-xs text-text-muted mb-1 font-medium">Today's Calls</p>
                    <p className="text-lg font-bold text-text-primary">
                        {agents.reduce((sum, a) => sum + a.call_count, 0).toLocaleString()}
                    </p>
                </div>
                <div className="rounded-lg bg-bg-elevated p-3 border border-border-subtle">
                    <p className="text-xs text-text-muted mb-1 font-medium">Active</p>
                    <p className="text-lg font-bold text-text-primary">
                        {agents.filter(a => a.status === 'active' || a.status === 'busy').length}
                    </p>
                </div>
            </div>

            {/* Create Agent CTA */}
            <div className="mt-3">
                <Button
                    className="w-full bg-gray-900 dark:bg-accent hover:bg-gray-800 dark:hover:bg-accent-hover text-white dark:text-black border-0 shadow-lg"
                    asChild
                >
                    <a href="/panel/voice-agents/create" className="flex items-center justify-center gap-2">
                        <Plus className="h-4 w-4" />
                        New Agent
                    </a>
                </Button>
            </div>
        </div>
    );
}
