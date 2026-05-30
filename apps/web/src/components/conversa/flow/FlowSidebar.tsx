import { useState } from 'react';
import { Network, Database, Zap, RefreshCw, ShoppingBag, MapPin, FolderTree, Link as LinkIcon, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FlowSidebar() {
    const [activeTab, setActiveTab] = useState<'actions' | 'conditions'>('actions');

    const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/reactflow-label', label);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="w-80 bg-[#ffffff] border-l border-gray-200 h-full flex flex-col z-10">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 px-2 pt-2">
                <button
                    onClick={() => setActiveTab('actions')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'actions' ? 'border-blue-600 text-blue-500' : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                >
                    Actions
                </button>
                <button
                    onClick={() => setActiveTab('conditions')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'conditions' ? 'border-blue-600 text-blue-500' : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                >
                    Conditions
                </button>
            </div>

            {/* Nodes List */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {activeTab === 'actions' && (
                    <div className="space-y-6">
                        {/* Core Actions */}
                        <div className="grid grid-cols-2 gap-3">
                            <DraggableItem type="api_call" label="API call" icon={<Network size={18} />} color="blue" onDragStart={onDragStart} />
                            <DraggableItem type="update_session" label="Update session variable" icon={<Database size={18} />} color="blue" onDragStart={onDragStart} />
                            <DraggableItem type="update_contact" label="Update contact property" icon={<FolderTree size={18} />} color="blue" onDragStart={onDragStart} />
                            <DraggableItem type="data_transform" label="Data transformation" icon={<RefreshCw size={18} />} color="blue" onDragStart={onDragStart} />
                            <DraggableItem type="zapier" label="Send to Zapier" icon={<Zap size={18} />} color="orange" onDragStart={onDragStart} />
                        </div>

                        {/* Shopify Integration */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                <h3 className="text-sm font-semibold text-slate-300">Shopify</h3>
                            </div>

                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3 mb-4 flex gap-3 items-start text-blue-400">
                                <Info size={16} className="shrink-0 mt-0.5" />
                                <p className="text-xs leading-relaxed">
                                    These nodes are designed for advanced use and require technical knowledge. For a quicker, easier alternative <a href="#" className="underline font-medium hover:text-blue-300">Visit Action templates</a>
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <DraggableItem type="shopify_order" label="Get order details" icon={<ShoppingBag size={18} />} color="slate" onDragStart={onDragStart} />
                                <DraggableItem type="shopify_shipping" label="Update shipping address" icon={<MapPin size={18} />} color="slate" onDragStart={onDragStart} />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'conditions' && (
                    <div className="grid grid-cols-2 gap-3">
                        <DraggableItem type="condition_variable" label="Based on variable" icon={<FolderTree size={18} />} color="orange" onDragStart={onDragStart} />
                        <DraggableItem type="condition_url" label="Current URL" icon={<LinkIcon size={18} />} color="orange" onDragStart={onDragStart} />
                    </div>
                )}
            </div>
        </div>
    );
}

function DraggableItem({ type, label, icon, color, onDragStart }: any) {
    const bgColor = color === 'blue' ? 'bg-[#6366f1]' : color === 'orange' ? 'bg-[#f97316]' : 'bg-slate-700';

    return (
        <div
            className="flex flex-col gap-2 p-3 bg-black/20 border border-gray-200 rounded-lg cursor-grab hover:border-blue-500/50 hover:bg-black/40 transition-all group"
            draggable
            onDragStart={(e) => onDragStart(e, type, label)}
        >
            <div className={`w-8 h-8 rounded-md flex items-center justify-center text-gray-900 ${bgColor}`}>
                {icon}
            </div>
            <span className="text-xs font-medium text-slate-300 leading-tight group-hover:text-blue-400 transition-colors">
                {label}
            </span>
        </div>
    );
}
