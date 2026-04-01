"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Play, Pause, Edit, Trash2, ChevronLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface ChatbotFlow {
    id: string;
    workspace_id: string;
    name: string;
    description: string;
    active: boolean;
    created_at: string;
    updated_at: string;
}

export default function IndustryFlowsPage() {
    const params = useParams();
    const router = useRouter();
    const industryId = params.industryId as string;

    const [flows, setFlows] = useState<ChatbotFlow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadFlows();
    }, [industryId]);

    const loadFlows = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch(`/api/chatbot-flows/${industryId}`);
            if (res.flows) {
                setFlows(res.flows);
            }
        } catch (error) {
            console.error('Failed to load flows:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateFlow = async () => {
        setIsCreating(true);
        try {
            const res = await apiFetch(`/api/chatbot-flows/${industryId}`, {
                method: 'POST',
                body: JSON.stringify({ name: 'New Chatbot Flow' })
            });
            if (res.flow) {
                router.push(`/panel/industries/${industryId}/flows/${res.flow.id}`);
            }
        } catch (error) {
            console.error('Failed to create flow:', error);
            alert('Failed to create flow');
        } finally {
            setIsCreating(false);
        }
    };

    const handleToggleActive = async (flowId: string, currentActive: boolean) => {
        try {
            await apiFetch(`/api/chatbot-flows/${flowId}/activate`, {
                method: 'POST',
                body: JSON.stringify({ active: !currentActive })
            });
            await loadFlows();
        } catch (error) {
            console.error('Failed to toggle flow:', error);
            alert('Failed to toggle flow');
        }
    };

    const handleDeleteFlow = async (flowId: string) => {
        if (!confirm('Are you sure you want to delete this flow?')) return;
        try {
            await apiFetch(`/api/chatbot-flows/${flowId}`, {
                method: 'DELETE'
            });
            await loadFlows();
        } catch (error) {
            console.error('Failed to delete flow:', error);
            alert('Failed to delete flow');
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* Header */}
            <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-xl border-b border-[#e2e8f0]">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-5">
                    <button
                        onClick={() => router.push(`/panel/industries/${industryId}`)}
                        className="flex items-center gap-1 text-xs text-[#64748b] hover:text-[#0a192f] transition-colors mb-4 font-medium"
                    >
                        <ChevronLeft size={14} /> Back to workspace
                    </button>

                    <div className="flex items-center justify-between">
                        <div>
                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-2xl font-bold tracking-tight text-[#0a192f]"
                            >
                                Chatbot Flows
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="mt-0.5 text-sm text-[#64748b] font-medium"
                            >
                                Build custom conversation flows with visual drag-and-drop editor
                            </motion.p>
                        </div>

                        <Button
                            onClick={handleCreateFlow}
                            disabled={isCreating}
                            className="bg-[#0a192f] hover:bg-[#112240] text-white"
                        >
                            <Plus size={16} className="mr-2" />
                            Create New Flow
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-[#64748b]">Loading flows...</div>
                    </div>
                ) : flows.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-20 px-4"
                    >
                        <div className="w-16 h-16 rounded-full bg-[#e0f2fe] flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-[#0ea5e9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-[#0a192f] mb-2">No flows yet</h3>
                        <p className="text-[#64748b] text-center mb-6 max-w-md">
                            Create your first chatbot flow to design custom conversation paths for your visitors
                        </p>
                        <Button
                            onClick={handleCreateFlow}
                            disabled={isCreating}
                            className="bg-[#0a192f] hover:bg-[#112240] text-white"
                        >
                            <Plus size={16} className="mr-2" />
                            Create Your First Flow
                        </Button>
                    </motion.div>
                ) : (
                    <div className="grid gap-4">
                        {flows.map((flow, idx) => (
                            <motion.div
                                key={flow.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white rounded-xl border border-[#e2e8f0] p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-[#0a192f]">{flow.name}</h3>
                                            {flow.active && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        {flow.description && (
                                            <p className="text-sm text-[#64748b] mb-3">{flow.description}</p>
                                        )}
                                        <div className="flex items-center gap-4 text-xs text-[#94a3b8]">
                                            <span>Created {new Date(flow.created_at).toLocaleDateString()}</span>
                                            <span>Updated {new Date(flow.updated_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleToggleActive(flow.id, flow.active)}
                                            className="border-[#e2e8f0]"
                                        >
                                            {flow.active ? (
                                                <>
                                                    <Pause size={14} className="mr-1.5" />
                                                    Deactivate
                                                </>
                                            ) : (
                                                <>
                                                    <Play size={14} className="mr-1.5" />
                                                    Activate
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.push(`/panel/industries/${industryId}/flows/${flow.id}`)}
                                            className="border-[#e2e8f0]"
                                        >
                                            <Edit size={14} className="mr-1.5" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteFlow(flow.id)}
                                            className="border-[#e2e8f0] text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
