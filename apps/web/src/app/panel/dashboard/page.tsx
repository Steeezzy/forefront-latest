"use client";

import { StatCard } from '@/components/dashboard/StatCard';
import { QuickActionCard } from '@/components/dashboard/QuickActionCard';
import { UnifiedChart } from '@/components/dashboard/UnifiedChart';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { SystemStatusCard } from '@/components/dashboard/SystemStatusCard';
import { VoiceAgentPreview } from '@/components/dashboard/VoiceAgentPreview';
import { ChatbotPreview } from '@/components/dashboard/ChatbotPreview';
import { MessageSquare, Phone, BarChart3, Settings, Users, Bot, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50/50 via-white to-gray-50/30">
            <div className="px-4 lg:px-6 py-8 space-y-8">
                    {/* Welcome Banner */}
                    <div className="rounded-3xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-6 md:p-8 lg:p-10 text-white shadow-2xl shadow-gray-900/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="space-y-3 max-w-2xl">
                                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-white/90 border border-white/10">
                                    <Zap className="h-3.5 w-3.5" />
                                    <span>Unified AI Dashboard</span>
                                </div>
                                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
                                    Welcome back, Karthik
                                </h1>
                                <p className="text-gray-300 text-base md:text-lg leading-relaxed max-w-xl">
                                    Your AI systems are synchronized and performing optimally. Monitor both Conversa AI and Voice Agents from a single pane.
                                </p>
                                <div className="flex flex-wrap items-center gap-3 pt-1">
                                    <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 border-0 font-medium shadow-xl">
                                        <Bot className="h-4 w-4 mr-2" />
                                        Test Conversa
                                    </Button>
                                    <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm">
                                        <Phone className="h-4 w-4 mr-2" />
                                        Test Voice
                                    </Button>
                                </div>
                            </div>
                            <div className="hidden lg:flex items-center gap-8">
                                <div className="text-center">
                                    <p className="text-4xl font-bold">2,847</p>
                                    <p className="text-sm text-gray-400">Interactions</p>
                                </div>
                                <div className="w-px h-16 bg-white/20" />
                                <div className="text-center">
                                    <p className="text-4xl font-bold">73%</p>
                                    <p className="text-sm text-gray-400">AI Resolution</p>
                                </div>
                                <div className="w-px h-16 bg-white/20" />
                                <div className="text-center">
                                    <p className="text-4xl font-bold">4</p>
                                    <p className="text-sm text-gray-400">Agents Active</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Key Metrics Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        <StatCard
                            title="Total Interactions"
                            value="2,847"
                            change={12.5}
                            icon={MessageSquare}
                            color="brand"
                        />
                        <StatCard
                            title="AI Resolution Rate"
                            value="73%"
                            change={2.3}
                            icon={Bot}
                            color="brand"
                        />
                        <StatCard
                            title="Voice Calls"
                            value="426"
                            change={-5.1}
                            icon={Phone}
                            color="brand"
                        />
                        <StatCard
                            title="Total Agents"
                            value="4"
                            icon={Users}
                            color="brand"
                        />
                    </div>

                    {/* Main Grid - Bento Style */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
                        <div className="lg:col-span-3 row-span-2 min-h-[400px]">
                            <UnifiedChart />
                        </div>
                        <div className="lg:col-span-1 row-span-1 min-h-[200px]">
                            <SystemStatusCard />
                        </div>
                    </div>

                    {/* Second Row - Preview Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                        <div className="lg:col-span-1 min-h-[420px]">
                            <ChatbotPreview />
                        </div>
                        <div className="lg:col-span-1 min-h-[420px]">
                            <VoiceAgentPreview />
                        </div>
                        <div className="lg:col-span-1 min-h-[420px]">
                            <ActivityFeed title="Recent Activity" maxItems={6} />
                        </div>
                    </div>

                    {/* Quick Actions Row */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
                            <Link href="/panel/voice-agents" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                                View all →
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                            <QuickActionCard
                                title="Create Voice Agent"
                                description="Set up a new AI voice assistant for inbound and outbound calls"
                                icon={Phone}
                                href="/panel/voice-agents/create"
                                colorClass="from-[#101728] to-[#1e293b]"
                            />
                            <QuickActionCard
                                title="Add Knowledge"
                                description="Import website content, add Q&A pairs, or upload CSV files"
                                icon={Bot}
                                href="/panel/chatbot/data-sources"
                                colorClass="from-[#101728] to-[#1e293b]"
                                badge="New"
                            />
                            <QuickActionCard
                                title="View Analytics"
                                description="Detailed performance reports for both chatbot and voice"
                                icon={BarChart3}
                                href="/panel/analytics"
                                colorClass="from-[#101728] to-[#1e293b]"
                            />
                            <QuickActionCard
                                title="Settings"
                                description="Configure channels, integrations, and agent behaviors"
                                icon={Settings}
                                href="/panel/settings"
                                colorClass="from-[#101728] to-[#1e293b]"
                            />
                        </div>
                    </div>

                    {/* Bottom Spacing */}
                    <div className="h-8" />
            </div>
        </div>
    );
}
