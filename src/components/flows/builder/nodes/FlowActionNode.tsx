import { Handle, Position } from '@xyflow/react';
import {
    Play, Pause, Copy, MoreHorizontal,
    MessageSquare, HelpCircle, LayoutGrid, MousePointer, CreditCard,
    Mail, Clock, Shuffle, UserPlus, Tag, MinusCircle, Network, Zap,
    Flag, Bell, Users, ArrowRightCircle, Building, BarChart3, FileText,
    Database, RefreshCw, ShoppingBag, Package, Truck, Ticket,
    ToggleLeft, ToggleRight, Globe, Send
} from 'lucide-react';
import { useState } from 'react';

interface FlowActionNodeProps {
    data: {
        label: string;
        subtype: string;
        config?: Record<string, any>;
        is_paused?: boolean;
    };
    selected?: boolean;
    id: string;
}

const iconMap: Record<string, any> = {
    send_message: MessageSquare, ask_question: HelpCircle,
    decision_quick: LayoutGrid, decision_buttons: MousePointer, decision_cards: CreditCard,
    send_email: Mail, send_notification: Bell, delay: Clock, randomize: Shuffle,
    to_another_flow: ArrowRightCircle, flow_ended: Flag, open_website: Globe,
    api_call: Network, update_contact: UserPlus, add_tag: Tag, remove_tag: MinusCircle,
    update_session_var: Database, data_transform: RefreshCw, send_zapier: Zap,
    send_ga_event: BarChart3, send_form: FileText, assign_agent: Users,
    reassign_dept: Building, disable_input: ToggleLeft, enable_input: ToggleRight,
    subscribe_mailing: Send, shopify_order: ShoppingBag, shopify_product: Package,
    shopify_shipping: Truck, shopify_coupon: Ticket,
};

export function FlowActionNode({ data, selected, id }: FlowActionNodeProps) {
    const IconComp = iconMap[data.subtype] || MessageSquare;
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className="relative group">
            {/* Hover Toolbar */}
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-50 flex items-center gap-0.5 bg-[#1a1a2e] border border-white/10 rounded-md px-1 py-0.5 shadow-xl">
                <button className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-green-400" title="Execute"><Play size={12} /></button>
                <button className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-yellow-400" title="Pause"><Pause size={12} /></button>
                <button className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-blue-400" title="Duplicate"><Copy size={12} /></button>
                <button className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white"
                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}><MoreHorizontal size={12} /></button>
            </div>

            {showMenu && (
                <div className="absolute -top-2 right-0 translate-x-full z-50 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-2xl py-1 min-w-[160px]"
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
            <div className={`bg-[#18181b] rounded-xl border w-56 overflow-hidden transition-all cursor-pointer
                ${selected ? 'border-blue-400 shadow-[0_0_16px_rgba(59,130,246,0.2)]' : 'border-white/10 hover:border-blue-500/50'}
                ${data.is_paused ? 'opacity-50' : ''}`}>

                {/* Input handle */}
                <Handle type="target" position={Position.Top} id="input"
                    className="!w-3.5 !h-3.5 !bg-slate-700 !border-2 !border-slate-500 hover:!border-blue-400 hover:!bg-blue-500 transition-colors !-top-[7px]" />

                <div className="p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white bg-blue-600 shrink-0">
                        <IconComp size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-white leading-tight block truncate">{data.label}</span>
                        <span className="text-[10px] text-blue-400/70">Action</span>
                    </div>
                </div>

                {/* Output handle */}
                <Handle type="source" position={Position.Bottom} id="output"
                    className="!w-3.5 !h-3.5 !bg-slate-700 !border-2 !border-slate-500 hover:!border-blue-400 hover:!bg-blue-500 transition-colors !-bottom-[7px]" />
            </div>
        </div>
    );
}
