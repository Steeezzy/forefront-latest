"use client";

import { Import, Plus, FilePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useState } from 'react';
import { FlowTemplatesModal } from './FlowTemplatesModal';

interface FlowsHeaderProps {
    agentId?: string | null;
}

export function FlowsHeader({ agentId }: FlowsHeaderProps) {
    const router = useRouter();
    const [creating, setCreating] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);

    const handleCreateFromScratch = async () => {
        if (!agentId) {
            alert('Still connecting to the server. Please wait a moment and try again, or refresh the page.');
            return;
        }
        setCreating(true);
        try {
            const res = await apiFetch('/api/flows', {
                method: 'POST',
                body: JSON.stringify({
                    agentId,
                    name: `New Flow ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`,
                })
            });
            if (res.flow?.id) {
                router.push(`/panel/flows/create/${res.flow.id}`);
            } else {
                alert('Flow was created but no ID returned. Please refresh.');
            }
        } catch (e: any) {
            console.error('Create flow error:', e);
            alert(`Failed to create flow: ${e.message || 'Unknown error'}`);
        } finally {
            setCreating(false);
        }
    };

    const handleOpenTemplates = () => {
        if (!agentId) {
            alert('Still connecting to the server. Please wait a moment and try again, or refresh the page.');
            return;
        }
        setShowTemplates(true);
    };

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h1 className="text-3xl font-bold text-white">My Flows</h1>

                <div className="flex items-center gap-3 flex-wrap">
                    <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 gap-2">
                        <Import size={16} />
                        Import
                    </Button>
                    <Button
                        variant="outline"
                        className="border-white/10 text-white hover:bg-white/5 gap-2"
                        onClick={handleCreateFromScratch}
                        disabled={creating}
                    >
                        <Plus size={16} />
                        {creating ? 'Creating...' : 'Create from scratch'}
                    </Button>
                    <Button 
                        className="bg-blue-600 hover:bg-blue-500 text-white border-0 gap-2"
                        onClick={handleOpenTemplates}
                    >
                        <FilePlus size={16} />
                        Add from template
                    </Button>
                </div>
            </div>

            {agentId && (
                <FlowTemplatesModal
                    isOpen={showTemplates}
                    onClose={() => setShowTemplates(false)}
                    agentId={agentId}
                />
            )}
        </>
    );
}
