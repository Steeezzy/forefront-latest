"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { FlowsSidebar } from '@/components/flows/FlowsSidebar';
import { FlowsHeader } from '@/components/flows/FlowsHeader';
import { FlowsStats } from '@/components/flows/FlowsStats';
import { FlowsFilterBar } from '@/components/flows/FlowsFilterBar';
import { FlowsList } from '@/components/flows/FlowsList';
import { FlowsFAB } from '@/components/flows/FlowsFAB';
import { apiFetch } from '@/lib/api';

export default function MyFlowsPage() {
    const [agentId, setAgentId] = useState<string | null>(null);
    const [authError, setAuthError] = useState(false);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        return () => { mountedRef.current = false; };
    }, []);

    // Hard timeout - never show loading for more than 12 seconds
    useEffect(() => {
        const hardTimeout = setTimeout(() => {
            if (mountedRef.current && loading) {
                console.log('[MyFlows] Hard timeout reached');
                setLoading(false);
                if (!agentId) {
                    setErrorMessage('Connection timed out. Please restart Docker/backend and refresh.');
                }
            }
        }, 12000);
        return () => clearTimeout(hardTimeout);
    }, [loading, agentId]);

    useEffect(() => {
        let cancelled = false;

        async function init() {
            // Step 1: Try to sync auth (with timeout built into the endpoint)
            console.log('[MyFlows] Starting auth sync...');
            try {
                const res = await fetch('/api/auth/sync', { method: 'POST' });
                const data = await res.json().catch(() => ({}));
                console.log('[MyFlows] Auth sync:', res.status, data);
                
                if (!res.ok) {
                    console.warn('[MyFlows] Auth sync failed:', data);
                }
            } catch (e: any) {
                console.error('[MyFlows] Auth sync error:', e.message);
            }

            if (cancelled) return;

            // Step 2: Try to fetch agent
            console.log('[MyFlows] Fetching agent...');
            try {
                const data = await apiFetch('/agents/primary');
                console.log('[MyFlows] Agent response:', JSON.stringify(data));
                const id = data?.agent?.id || data?.id;
                if (id && !cancelled) {
                    console.log('[MyFlows] Got agent ID:', id);
                    setAgentId(id);
                    setLoading(false);
                    return;
                }
            } catch (err: any) {
                console.error('[MyFlows] Agent fetch error:', err.message);
                if (err.message === 'UNAUTHORIZED' && !cancelled) {
                    setAuthError(true);
                    setLoading(false);
                    return;
                }
            }

            // If we get here, show error instead of spinning forever
            if (!cancelled) {
                setErrorMessage('Could not connect to backend. Please ensure Docker is running and refresh.');
                setLoading(false);
            }
        }

        init();
        return () => { cancelled = true; };
    }, []);

    return (
        <div className="flex h-full bg-[#f8fafc]">
            <FlowsSidebar />

            <div className="flex-1 h-full overflow-y-auto relative">
                <div className="p-8 lg:p-10 pb-32 max-w-[1600px] mx-auto">
                    <FlowsHeader agentId={agentId} />
                    <FlowsStats agentId={agentId} />

                    <div className="mt-8">
                        <FlowsFilterBar />
                        <FlowsList 
                            agentId={agentId ?? undefined} 
                            authError={authError} 
                            loading={loading}
                            errorMessage={errorMessage}
                        />
                    </div>
                </div>

                <FlowsFAB agentId={agentId} />
            </div>
        </div>
    );
}
