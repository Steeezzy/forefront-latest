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
    Node
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { TriggerNode } from './TriggerNode';
import { ActionNode } from './ActionNode';
import { FlowSidebar } from './FlowSidebar';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { v4 as uuidv4 } from 'uuid';

const nodeTypes = {
    trigger: TriggerNode,
    action: ActionNode,
};

const initialNodes: Node[] = [
    {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 300, y: 150 },
        data: {},
        deletable: false,
    },
];

interface ActionsSequenceBuilderProps {
    actionId: string;
}

function BuilderContent({ actionId }: ActionsSequenceBuilderProps) {
    const router = useRouter();
    const reactFlowWrapper = useRef<HTMLDivElement>(null);

    const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Load existing action data
    useEffect(() => {
        const fetchAction = async () => {
            try {
                const res = await apiFetch(`/api/actions/${actionId}`);
                if (res.action?.nodes && res.action.nodes.length > 0) {
                    setNodes(res.action.nodes);
                }
                if (res.action?.edges && res.action.edges.length > 0) {
                    setEdges(res.action.edges);
                }
            } catch (error) {
                console.error("Failed to load action sequence:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAction();
    }, [actionId, setNodes, setEdges]);

    const onConnect = useCallback(
        (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
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
            const label = event.dataTransfer.getData('application/reactflow-label');

            // Check if the dropped element is valid
            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node = {
                id: uuidv4(),
                type: 'action',
                position,
                data: { label, type },
                deletable: true,
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes]
    );

    const handleSaveAndClose = async () => {
        setIsSaving(true);
        try {
            await apiFetch(`/api/actions/${actionId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    nodes: reactFlowInstance?.getNodes() || nodes,
                    edges: reactFlowInstance?.getEdges() || edges,
                })
            });
            router.push(`/panel/chatbot/actions/create?edit=${actionId}`);
        } catch (error) {
            console.error(error);
            alert("Failed to save sequence");
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        router.push(`/panel/chatbot/actions/create?edit=${actionId}`);
    };

    if (isLoading) {
        return <div className="flex-1 flex items-center justify-center bg-[#f8fafc] text-slate-400">Loading builder...</div>;
    }

    return (
        <div className="flex flex-col h-full bg-[#f8fafc]">
            {/* Top Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#ffffff] border-b border-gray-200 z-20">
                <div>
                    <h1 className="text-xl font-serif text-gray-900 leading-none">Action sequence</h1>
                    <p className="text-sm text-slate-400 mt-1">What tasks does Conversa need to perform, or what data does Conversa need to get from third-party software, to complete this Action?</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="border-gray-200 text-slate-300 hover:text-gray-900 hover:bg-white/5" onClick={handleClose}>
                        Close
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-500 text-gray-900 border-0 shadow-sm" onClick={handleSaveAndClose} disabled={isSaving}>
                        Save and close
                    </Button>
                </div>
            </div>

            {/* Builder Canvas and Sidebar */}
            <div className="flex flex-1 overflow-hidden" ref={reactFlowWrapper}>
                <div className="flex-1 h-full">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onInit={setReactFlowInstance}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        nodeTypes={nodeTypes}
                        fitView
                        fitViewOptions={{ padding: 2, maxZoom: 1.2 }}
                        className="bg-[#f8fafc]"
                        defaultEdgeOptions={{
                            style: { stroke: '#6b7280', strokeWidth: 2 },
                            animated: false
                        }}
                    >
                        <Background
                            color="#374151"
                            gap={16}
                            size={1}
                            variant={BackgroundVariant.Dots}
                        />
                        <Controls className="bg-[#ffffff] shadow-md border border-gray-200 rounded-md fill-slate-300 *:border-b-white/10" />
                    </ReactFlow>
                </div>

                {/* Right Sidebar */}
                <FlowSidebar />
            </div>
        </div>
    );
}

export function ActionsSequenceBuilder(props: ActionsSequenceBuilderProps) {
    return (
        <ReactFlowProvider>
            <BuilderContent {...props} />
        </ReactFlowProvider>
    );
}
