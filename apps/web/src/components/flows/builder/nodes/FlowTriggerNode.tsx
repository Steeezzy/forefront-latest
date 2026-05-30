import { Handle, Position } from '@xyflow/react';
import { Home, Play, Pause, Copy, Trash2, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

interface FlowTriggerNodeProps {
    data: {
        label: string;
        subtype: string;
        config?: Record<string, any>;
        is_paused?: boolean;
    };
    selected?: boolean;
    id: string;
}

export function FlowTriggerNode({ data, selected, id }: FlowTriggerNodeProps) {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className="relative group">
            {/* Hover Toolbar */}
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-50 flex items-center gap-0.5 bg-[#1a1a2e] border border-gray-200 rounded-md px-1 py-0.5 shadow-xl">
                <button className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-green-400 transition-colors" title="Execute">
                    <Play size={12} />
                </button>
                <button className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-yellow-400 transition-colors" title={data.is_paused ? 'Resume' : 'Pause'}>
                    <Pause size={12} />
                </button>
                <button className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-blue-400 transition-colors" title="Duplicate">
                    <Copy size={12} />
                </button>
                <button
                    className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-gray-900 transition-colors"
                    title="More"
                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                >
                    <MoreHorizontal size={12} />
                </button>
            </div>

            {/* Right-click / More Menu */}
            {showMenu && (
                <div className="absolute -top-2 right-0 translate-x-full z-50 bg-[#1a1a2e] border border-gray-200 rounded-lg shadow-2xl py-1 min-w-[160px]"
                    onMouseLeave={() => setShowMenu(false)}>
                    {[
                        { label: 'Open...', shortcut: '' },
                        { label: 'Execute step', shortcut: '' },
                        { label: 'Rename', shortcut: '' },
                        { label: 'Deactivate', shortcut: 'D' },
                        { label: 'Copy', shortcut: '⌘C' },
                        { label: 'Duplicate', shortcut: '⌘D' },
                        { label: 'Delete', shortcut: '⌫', danger: true },
                    ].map((item, i) => (
                        <button key={i} className={`w-full text-left px-3 py-1.5 text-xs flex justify-between items-center transition-colors
                            ${(item as any).danger ? 'text-red-400 hover:bg-red-500/10' : 'text-slate-300 hover:bg-white/5'}`}>
                            {item.label}
                            {item.shortcut && <span className="text-[10px] text-slate-600 ml-4">{item.shortcut}</span>}
                        </button>
                    ))}
                </div>
            )}

            {/* Paused indicator */}
            {data.is_paused && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center z-10">
                    <Pause size={8} className="text-black" />
                </div>
            )}

            {/* Node Body */}
            <div className={`w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-gray-900 shadow-lg relative transition-all cursor-pointer
                ${selected ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-[#f8fafc] shadow-blue-500/20' : 'hover:shadow-blue-500/20'}
                ${data.is_paused ? 'opacity-50' : ''}`}>

                <Home size={28} />

                {/* Input handle (top) */}
                <Handle type="target" position={Position.Top} id="input"
                    className="!w-3.5 !h-3.5 !bg-slate-700 !border-2 !border-slate-500 hover:!border-blue-400 hover:!bg-blue-500 transition-colors !-top-[7px]" />

                {/* Output handles */}
                <Handle type="source" position={Position.Bottom} id="output"
                    className="!w-3.5 !h-3.5 !bg-slate-700 !border-2 !border-slate-500 hover:!border-blue-400 hover:!bg-blue-500 transition-colors !-bottom-[7px]" />
                <Handle type="source" position={Position.Right} id="right"
                    className="!w-3 !h-3 !bg-slate-700 !border-2 !border-slate-500 hover:!border-blue-400 hover:!bg-blue-500 transition-colors" />
                <Handle type="source" position={Position.Left} id="left"
                    className="!w-3 !h-3 !bg-slate-700 !border-2 !border-slate-500 hover:!border-blue-400 hover:!bg-blue-500 transition-colors" />
            </div>

            {/* Label */}
            <div className="mt-2 text-center">
                <span className="text-xs font-medium text-slate-200 px-2 py-0.5 bg-[#ffffff] rounded border border-gray-200">
                    {data.label || 'Trigger'}
                </span>
            </div>
        </div>
    );
}
