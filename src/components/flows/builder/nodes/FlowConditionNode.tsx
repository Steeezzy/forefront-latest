import { Handle, Position } from '@xyflow/react';
import { GitBranch, Play, Pause, Copy, Trash2, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

interface FlowConditionNodeProps {
    data: {
        label: string;
        subtype: string;
        config?: Record<string, any>;
        is_paused?: boolean;
    };
    selected?: boolean;
    id: string;
}

export function FlowConditionNode({ data, selected, id }: FlowConditionNodeProps) {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className="relative group">
            {/* Hover Toolbar */}
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-50 flex items-center gap-0.5 bg-[#1a1a2e] border border-gray-200 rounded-md px-1 py-0.5 shadow-xl">
                <button className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-green-400" title="Execute"><Play size={12} /></button>
                <button className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-yellow-400" title="Pause"><Pause size={12} /></button>
                <button className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-blue-400" title="Duplicate"><Copy size={12} /></button>
                <button className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-gray-900"
                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}><MoreHorizontal size={12} /></button>
            </div>

            {showMenu && (
                <div className="absolute -top-2 right-0 translate-x-full z-50 bg-[#1a1a2e] border border-gray-200 rounded-lg shadow-2xl py-1 min-w-[160px]"
                    onMouseLeave={() => setShowMenu(false)}>
                    {['Open...', 'Execute step', 'Rename', 'Deactivate', 'Copy', 'Duplicate', 'Delete'].map((label, i) => (
                        <button key={i} className={`w-full text-left px-3 py-1.5 text-xs transition-colors
                            ${label === 'Delete' ? 'text-red-400 hover:bg-red-500/10' : 'text-slate-300 hover:bg-white/5'}`}>
                            {label}
                        </button>
                    ))}
                </div>
            )}

            {data.is_paused && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center z-10">
                    <Pause size={8} className="text-black" />
                </div>
            )}

            {/* Node body */}
            <div className={`bg-[#ffffff] rounded-xl border w-56 overflow-hidden transition-all cursor-pointer
                ${selected ? 'border-orange-400 shadow-[0_0_16px_rgba(251,146,60,0.2)]' : 'border-gray-200 hover:border-orange-400/50'}
                ${data.is_paused ? 'opacity-50' : ''}`}>

                {/* Input handle */}
                <Handle type="target" position={Position.Top} id="input"
                    className="!w-3.5 !h-3.5 !bg-slate-700 !border-2 !border-slate-500 hover:!border-orange-400 hover:!bg-orange-500 transition-colors !-top-[7px]" />

                <div className="p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-900 bg-orange-500 shrink-0">
                        <GitBranch size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 leading-tight block truncate">{data.label}</span>
                        <span className="text-[10px] text-orange-400/70">Condition</span>
                    </div>
                </div>

                {/* True / False outputs */}
                <div className="flex border-t border-gray-200 text-[10px] font-semibold">
                    <div className="flex-1 py-2 text-center text-emerald-400 border-r border-gray-200 relative hover:bg-emerald-500/5">
                        ✅ True
                        <Handle type="source" position={Position.Bottom} id="true"
                            className="!w-3.5 !h-3.5 !bg-emerald-600 !border-2 !border-emerald-400 hover:!bg-emerald-400 transition-colors !-bottom-[7px]"
                            style={{ left: '50%' }} />
                    </div>
                    <div className="flex-1 py-2 text-center text-red-400 relative hover:bg-red-500/5">
                        ❌ False
                        <Handle type="source" position={Position.Bottom} id="false"
                            className="!w-3.5 !h-3.5 !bg-red-600 !border-2 !border-red-400 hover:!bg-red-400 transition-colors !-bottom-[7px]"
                            style={{ left: '50%' }} />
                    </div>
                </div>
            </div>
        </div>
    );
}
