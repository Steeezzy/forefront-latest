import { Handle, Position } from '@xyflow/react';
import { Bot } from 'lucide-react';

export function TriggerNode() {
    return (
        <div className="flex flex-col items-center">
            {/* The Icon Bubble */}
            <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg mb-2 relative">
                <Bot size={28} />
                {/* Outgoing Handle (Bottom) */}
                <Handle
                    type="source"
                    position={Position.Bottom}
                    className="w-3 h-3 bg-blue-500 border-2 border-[#18181b] -bottom-1.5"
                />
            </div>
            {/* The Label */}
            <div className="bg-[#18181b] px-4 py-1.5 rounded-md shadow-sm border border-white/10">
                <span className="text-sm font-medium text-slate-200">Collect information</span>
            </div>
        </div>
    );
}
