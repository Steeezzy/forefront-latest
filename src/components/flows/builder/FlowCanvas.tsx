"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ReactFlow,
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    BackgroundVariant,
    Connection,
    Edge,
    Node,
    MiniMap
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { FlowTriggerNode } from './nodes/FlowTriggerNode';
import { FlowConditionNode } from './nodes/FlowConditionNode';
import { FlowActionNode } from './nodes/FlowActionNode';
import { FlowRAGNode } from './nodes/FlowRAGNode';
import { FlowCustomEdge } from './edges/FlowCustomEdge';
import { FlowBuilderSidebar } from './FlowBuilderSidebar';
import { NodeConfigPanel } from './NodeConfigPanel';
import { FlowTestDialog } from './FlowTestDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';
import { v4 as uuidv4 } from 'uuid';
import { Pencil } from 'lucide-react';

const nodeTypes = {
    flow_trigger: FlowTriggerNode,
    flow_condition: FlowConditionNode,
    flow_action: FlowActionNode,
    flow_rag: FlowRAGNode,
};

const edgeTypes = {
    custom: FlowCustomEdge,
};

const defaultTriggerNode: Node = {
    id: 'trigger-1',
    type: 'flow_trigger',
    position: { x: 400, y: 120 },
    data: { label: 'Trigger', subtype: 'first_visit' },
    deletable: false,
};

interface FlowCanvasProps {
    flowId: string;
}

function CanvasContent({ flowId }: FlowCanvasProps) {
    const router = useRouter();
    const wrapperRef = useRef<HTMLDivElement>(null);

    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([defaultTriggerNode]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [rfInstance, setRfInstance] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [flowName, setFlowName] = useState('Untitled Flow');
    const [flowAgentId, setFlowAgentId] = useState<string | null>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);

    // Load flow from API
    useEffect(() => {
        const load = async () => {
            try {
                const res = await apiFetch(`/api/flows/${flowId}`);
                if (res.flow) {
                    setFlowName(res.flow.name || 'Untitled Flow');
                    setFlowAgentId(res.flow.agent_id || null);
                    if (res.flow.nodes?.length > 0) setNodes(res.flow.nodes);
                    if (res.flow.edges?.length > 0) setEdges(res.flow.edges);
                }
            } catch (e) {
                console.error('Failed to load flow:', e);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [flowId, setNodes, setEdges]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({
            ...params,
            type: 'custom',
            data: { reversed: false },
            animated: true,
        }, eds)),
        [setEdges]
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();
            const type = event.dataTransfer.getData('application/reactflow');
            const subtype = event.dataTransfer.getData('application/reactflow-subtype');
            const label = event.dataTransfer.getData('application/reactflow-label');
            const category = event.dataTransfer.getData('application/reactflow-category');
            if (!type) return;

            const position = rfInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node = {
                id: uuidv4(),
                type,
                position,
                data: { label, subtype, category, config: {} },
                deletable: true,
            };
            setNodes((nds) => nds.concat(newNode));
        },
        [rfInstance, setNodes]
    );

    // When a node is clicked, open the config panel
    const onNodeClick = useCallback((_: any, node: Node) => {
        setSelectedNode(node);
    }, []);

    // Close config panel when clicking on the canvas background
    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
    }, []);

    // Update node config from the config panel
    const handleUpdateConfig = useCallback((nodeId: string, newConfig: Record<string, any>) => {
        setNodes((nds) => nds.map((n) => {
            if (n.id === nodeId) {
                return { ...n, data: { ...n.data, config: newConfig } };
            }
            return n;
        }));
        // Keep selectedNode in sync
        setSelectedNode((prev) => {
            if (prev && prev.id === nodeId) {
                return { ...prev, data: { ...prev.data, config: newConfig } };
            }
            return prev;
        });
    }, [setNodes]);

    const handleSave = async (close: boolean = false, showAlert: boolean = true) => {
        setIsSaving(true);
        try {
            await apiFetch(`/api/flows/${flowId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    name: flowName,
                    nodes: rfInstance?.getNodes() || nodes,
                    edges: rfInstance?.getEdges() || edges,
                })
            });
            if (close) router.push('/panel/flows/my-flows');
            return true;
        } catch (e) {
            console.error(e);
            if (showAlert) {
                alert('Failed to save flow');
            }
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const handleActivate = async () => {
        const saved = await handleSave(false);
        if (!saved) return;
        try {
            await apiFetch(`/api/flows/${flowId}`, {
                method: 'PUT',
                body: JSON.stringify({ is_active: true })
            });
            router.push('/panel/flows/my-flows');
        } catch (e) {
            console.error(e);
        }
    };

    if (isLoading) {
        return <div className="flex-1 flex items-center justify-center bg-[#f8fafc] text-slate-400">Loading builder...</div>;
    }

    return (
        <div className="flex flex-col h-full bg-[#f8fafc]">
            {/* Top Header */}
            <div className="flex items-center justify-between px-5 py-3 bg-[#ffffff] border-b border-gray-200 z-20">
                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">Flows &gt;</span>
                    {isEditingName ? (
                        <Input
                            value={flowName}
                            onChange={(e) => setFlowName(e.target.value)}
                            onBlur={() => setIsEditingName(false)}
                            onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                            className="h-7 w-60 text-sm bg-black/30 border-gray-200 text-gray-900"
                            autoFocus
                        />
                    ) : (
                        <button
                            onClick={() => setIsEditingName(true)}
                            className="flex items-center gap-2 text-gray-900 text-sm font-medium hover:text-blue-400 transition-colors"
                        >
                            {flowName}
                            <Pencil size={12} className="text-slate-500" />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-200 text-slate-300 hover:text-gray-900 hover:bg-white/5 text-xs"
                        onClick={() => setIsTestDialogOpen(true)}
                    >
                        Test it out
                    </Button>
                    <Button variant="outline" size="sm" className="border-gray-200 text-slate-300 hover:text-gray-900 hover:bg-white/5 text-xs"
                        onClick={() => handleSave(true)} disabled={isSaving}>
                        Close
                    </Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-gray-900 border-0 text-xs"
                        onClick={handleActivate} disabled={isSaving}>
                        Activate
                    </Button>
                </div>
            </div>

            {/* Canvas + Sidebar + Config Panel */}
            <div className="flex flex-1 overflow-hidden" ref={wrapperRef}>
                {/* Left side: Canvas area */}
                <div className="flex-1 h-full">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onInit={setRfInstance}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onNodeClick={onNodeClick}
                        onPaneClick={onPaneClick}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        fitView
                        fitViewOptions={{ padding: 2, maxZoom: 1 }}
                        className="bg-[#f8fafc]"
                        defaultEdgeOptions={{
                            type: 'custom',
                            animated: true,
                            data: { reversed: false },
                        }}
                        connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2 }}
                        snapToGrid
                        snapGrid={[16, 16]}
                        deleteKeyCode="Backspace"
                        edgesReconnectable
                    >
                        <Background color="#374151" gap={16} size={1} variant={BackgroundVariant.Dots} />
                        <Controls className="bg-[#ffffff] border border-gray-200 rounded-md [&>button]:bg-[#ffffff] [&>button]:text-slate-300 [&>button]:border-gray-200 [&>button:hover]:bg-white/5" />
                        <MiniMap
                            nodeStrokeColor="#6b7280"
                            nodeColor="#ffffff"
                            nodeBorderRadius={4}
                            maskColor="rgba(0,0,0,0.5)"
                            className="bg-[#f8fafc] border border-gray-200 rounded-md"
                        />
                    </ReactFlow>
                </div>

                {/* Right side: Sidebar OR Config Panel */}
                {selectedNode ? (
                    <NodeConfigPanel
                        node={selectedNode}
                        flowId={flowId}
                        flowAgentId={flowAgentId}
                        onClose={() => setSelectedNode(null)}
                        onUpdateConfig={handleUpdateConfig}
                        onOpenTester={() => setIsTestDialogOpen(true)}
                    />
                ) : (
                    <FlowBuilderSidebar />
                )}
            </div>

            <FlowTestDialog
                open={isTestDialogOpen}
                onClose={() => setIsTestDialogOpen(false)}
                flowId={flowId}
                flowName={flowName}
                agentId={flowAgentId}
                onBeforeRun={() => handleSave(false, false)}
            />
        </div>
    );
}

export function FlowCanvas(props: FlowCanvasProps) {
    return (
        <ReactFlowProvider>
            <CanvasContent {...props} />
        </ReactFlowProvider>
    );
}
