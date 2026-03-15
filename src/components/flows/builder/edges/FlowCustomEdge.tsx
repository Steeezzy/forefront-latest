"use client";

import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow, Edge } from '@xyflow/react';
import { Trash2, ArrowRightLeft } from 'lucide-react';
import { useState } from 'react';

interface FlowCustomEdgeProps {
    id: string;
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
    sourcePosition: any;
    targetPosition: any;
    selected?: boolean;
    data?: { reversed?: boolean };
    markerEnd?: string;
    style?: React.CSSProperties;
}

export function FlowCustomEdge({
    id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, selected, data, style,
}: FlowCustomEdgeProps) {
    const { setEdges, getEdge } = useReactFlow();
    const [hovered, setHovered] = useState(false);

    const isReversed = data?.reversed || false;

    // If reversed, swap the bezier curve direction visually
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX: isReversed ? targetX : sourceX,
        sourceY: isReversed ? targetY : sourceY,
        targetX: isReversed ? sourceX : targetX,
        targetY: isReversed ? sourceY : targetY,
        sourcePosition: isReversed ? targetPosition : sourcePosition,
        targetPosition: isReversed ? sourcePosition : targetPosition,
    });

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEdges((eds) => eds.filter((edge) => edge.id !== id));
    };

    const handleReverse = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEdges((eds) => eds.map((edge) => {
            if (edge.id === id) {
                return {
                    ...edge,
                    data: { ...edge.data, reversed: !isReversed },
                };
            }
            return edge;
        }));
    };

    const isActive = selected || hovered;

    return (
        <>
            {/* Invisible wider path for easier selection */}
            <path
                d={edgePath}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{ cursor: 'pointer' }}
            />

            {/* Visible edge */}
            <BaseEdge
                id={id}
                path={edgePath}
                style={{
                    stroke: isActive ? '#6366f1' : '#6b7280',
                    strokeWidth: isActive ? 3 : 2,
                    transition: 'stroke 0.15s, stroke-width 0.15s',
                    ...style,
                }}
            />

            {/* Arrow marker at midpoint showing direction */}
            <EdgeLabelRenderer>
                {/* Direction arrow (always visible) */}
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: 'all',
                    }}
                    className="nodrag nopan"
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                >
                    {/* Direction indicator dot / arrow */}
                    <div className={`flex items-center justify-center w-5 h-5 rounded-full transition-all cursor-pointer
                        ${isActive
                            ? 'bg-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                            : 'bg-slate-700 border border-slate-600'
                        }`}
                    >
                        <svg width="10" height="10" viewBox="0 0 10 10"
                            className={`transition-transform ${isReversed ? 'rotate-180' : ''}`}
                        >
                            <polygon
                                points="0,2 10,5 0,8"
                                fill={isActive ? '#fff' : '#374151'}
                            />
                        </svg>
                    </div>

                    {/* Toolbar on hover/select */}
                    {isActive && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#1a1a2e] border border-gray-200 rounded-lg px-1.5 py-1 shadow-2xl z-50">
                            <button
                                onClick={handleReverse}
                                className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-slate-300 hover:text-blue-400 hover:bg-white/5 rounded transition-colors"
                                title={isReversed ? 'Set to Forward' : 'Set to Backward'}
                            >
                                <ArrowRightLeft size={11} />
                                {isReversed ? 'Backward' : 'Forward'}
                            </button>
                            <div className="w-px h-4 bg-white/10" />
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                                title="Delete connection"
                            >
                                <Trash2 size={11} />
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </EdgeLabelRenderer>
        </>
    );
}
