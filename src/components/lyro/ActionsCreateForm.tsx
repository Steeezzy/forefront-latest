"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, GitMerge, FileJson } from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface ActionsCreateFormProps {
    actionId?: string;
    initialData?: {
        name: string;
        instructions: string;
        ask_confirmation: boolean;
        nodes?: any[];
    };
}

export function ActionsCreateForm({ actionId, initialData }: ActionsCreateFormProps) {
    const router = useRouter();
    const [name, setName] = useState(initialData?.name || '');
    const [instructions, setInstructions] = useState(initialData?.instructions || '');
    const [askConfirmation, setAskConfirmation] = useState(initialData?.ask_confirmation ?? true);
    const [isSaving, setIsSaving] = useState(false);

    const hasSequence = initialData?.nodes && initialData.nodes.length > 0;

    const handleCreateSequence = async () => {
        if (!name.trim()) alert("Please enter a name first to save the draft.");
        // If no actionId exists, we need to create a draft first
        setIsSaving(true);
        try {
            if (actionId) {
                // Update existing
                await apiFetch(`/api/actions/${actionId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ name, instructions, ask_confirmation: askConfirmation })
                });
                router.push(`/panel/chatbot/actions/${actionId}/sequence`);
            } else {
                // Create new draft
                const res = await apiFetch(`/api/actions`, {
                    method: 'POST',
                    body: JSON.stringify({
                        agentId: 'db4206d5-9c68-4c61-be81-e6163468caec', // TODO: Get from context 
                        name,
                        instructions,
                        askConfirmation
                    })
                });
                if (res.action?.id) {
                    router.push(`/panel/chatbot/actions/${res.action.id}/sequence`);
                }
            }
        } catch (error) {
            console.error(error);
            alert("Failed to save draft");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAndClose = async (activate: boolean = false) => {
        if (!name.trim()) return alert("Please enter a name.");
        setIsSaving(true);
        try {
            if (actionId) {
                await apiFetch(`/api/actions/${actionId}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        name,
                        instructions,
                        ask_confirmation: askConfirmation,
                        is_active: activate
                    })
                });
            } else {
                await apiFetch(`/api/actions`, {
                    method: 'POST',
                    body: JSON.stringify({
                        agentId: 'db4206d5-9c68-4c61-be81-e6163468caec', // TODO: Get from context 
                        name,
                        instructions,
                        askConfirmation
                    })
                });
            }
            router.push('/panel/chatbot/actions');
        } catch (error) {
            console.error(error);
            alert("Failed to save Action");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 max-w-[800px]">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-white"
                    onClick={() => router.push('/panel/chatbot/actions')}
                >
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-2xl font-serif text-white">
                        {actionId ? 'Edit Action' : 'Create Action'}
                    </h1>
                </div>
            </div>

            {/* Name Field */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Name</label>
                <p className="text-xs text-slate-400 mb-2">
                    Choose a descriptive name that helps you identify this Action in your list. This name will also be used by Lyro as context for how it should operate.
                </p>
                <Input
                    placeholder="e.g. Check Order Status"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-black/20 border-white/10 text-white"
                />
            </div>

            {/* Instructions Field */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Instructions</label>
                <p className="text-xs text-slate-400 mb-2">
                    Give Lyro detailed instructions on how this Action should and shouldn't behave. Go into detail, so Lyro can really understand all use cases.
                </p>
                <Textarea
                    placeholder="E.g. Use this action when a user asks about their order..."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="bg-black/20 border-white/10 text-white min-h-[150px] resize-y"
                />
            </div>

            {/* Action Sequence Box */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Action sequence</label>
                <p className="text-xs text-slate-400 mb-2">
                    What tasks does Lyro need to perform, or what data does Lyro need to get from third-party software, to complete this Action?
                </p>

                <div className="border border-white/10 rounded-xl bg-[#18181b] p-6 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
                        <GitMerge size={32} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-medium text-slate-200 mb-1">
                            {hasSequence ? 'Sequence configured' : 'Sequence is empty'}
                        </h3>
                        <p className="text-xs text-slate-400 mb-3">
                            {hasSequence ? 'This action has nodes attached.' : 'Add steps to retrieve data from external tools or APIs.'}
                        </p>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border-0"
                            onClick={handleCreateSequence}
                            disabled={isSaving}
                        >
                            {hasSequence ? 'Edit sequence' : 'Create sequence'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Output Variables Box */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Output variables</label>
                <p className="text-xs text-slate-400 mb-2">
                    Data you choose to save from API calls. Select the information Lyro should access.
                </p>

                <div className="border border-white/10 rounded-xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#18181b] text-slate-400">
                            <tr>
                                <th className="px-4 py-3 font-medium">Type</th>
                                <th className="px-4 py-3 font-medium">Name</th>
                                <th className="px-4 py-3 font-medium">Available for Lyro</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-t border-white/10 bg-black/20">
                                <td colSpan={3} className="px-4 py-8 text-center text-slate-500 text-sm">
                                    <div className="flex flex-col items-center gap-2">
                                        <FileJson size={24} className="opacity-50" />
                                        You didn't save any information from API responses.
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Settings & Save */}
            <div className="flex flex-col gap-6 pt-6 border-t border-white/10">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-sm font-medium text-slate-200">Ask visitor to confirm Action</h3>
                        <p className="text-xs text-slate-400">
                            We advise not disabling this option for actions that are irreversible.
                        </p>
                    </div>
                    <Switch
                        checked={askConfirmation}
                        onCheckedChange={setAskConfirmation}
                        className="data-[state=checked]:bg-blue-600"
                    />
                </div>

                <div className="flex items-center justify-between mt-4">
                    <Button variant="outline" className="border-white/10 text-slate-300 hover:text-white" onClick={() => router.push('/panel/chatbot/actions')}>
                        Cancel
                    </Button>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="border-white/10 text-slate-300 hover:text-white">
                            Test it out
                        </Button>
                        <Button variant="outline" className="border-white/10 text-slate-300 hover:text-white" onClick={() => handleSaveAndClose(false)} disabled={isSaving}>
                            Save and close
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => handleSaveAndClose(true)} disabled={isSaving}>
                            Activate
                        </Button>
                    </div>
                </div>
            </div>

        </div>
    );
}
