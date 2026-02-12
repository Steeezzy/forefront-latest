"use client";

import { useState } from 'react';
import { AnalyticsSidebar } from '@/components/analytics/AnalyticsSidebar';
import { AnalyticsHeader } from '@/components/analytics/AnalyticsHeader';
import { OverviewTab } from '@/components/analytics/OverviewTab';
import { AISupportTab } from '@/components/analytics/AISupportTab';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

export default function AnalyticsPage() {
    const [currentView, setCurrentView] = useState('Overview');
    const [aiTab, setAiTab] = useState('Live conversations');

    return (
        <div className="flex min-h-screen bg-[#0f1115]">
            {/* Sidebar */}
            <AnalyticsSidebar currentView={currentView} onNavigate={setCurrentView} />

            {/* Main Content */}
            <div className="flex-1 p-8 overflow-y-auto h-[calc(100vh-64px)] relative">

                <AnalyticsHeader
                    currentView={currentView}
                    aiTab={aiTab}
                    setAiTab={setAiTab}
                />

                <div className="max-w-7xl mx-auto">
                    {currentView === 'Overview' && <OverviewTab />}
                    {currentView === 'AI support' && <AISupportTab />}

                    {/* Placeholders for other views */}
                    {(currentView === 'Human support' || currentView === 'Sales & Leads') && (
                        <div className="flex flex-col items-center justify-center min-h-[400px] text-center border border-dashed border-white/10 rounded-xl bg-[#18181b]">
                            <h3 className="text-white font-medium mb-2">{currentView}</h3>
                            <p className="text-zinc-500 text-sm">This section is currently under development.</p>
                        </div>
                    )}
                </div>

                {/* Floating Action Button */}
                <Button className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-900/20 flex items-center justify-center p-0 z-50">
                    <MessageSquare className="text-white" size={24} />
                </Button>

            </div>
        </div>
    );
}
