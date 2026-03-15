import { Handle, Position } from '@xyflow/react';
import { Network, Database, Zap, RefreshCw, ShoppingBag, MapPin, FolderTree, Link } from 'lucide-react';

export function ActionNode({ data }: { data: { label: string, type: string } }) {

    // Determine icon based on type
    const getIcon = () => {
        switch (data.type) {
            case 'api_call': return <Network size={20} />;
            case 'update_session': return <Database size={20} />;
            case 'update_contact': return <FolderTree size={20} />;
            case 'data_transform': return <RefreshCw size={20} />;
            case 'zapier': return <Zap size={20} />;
            case 'shopify_order': return <ShoppingBag size={20} />;
            case 'shopify_shipping': return <MapPin size={20} />;
            case 'condition_variable': return <FolderTree size={20} />;
            case 'condition_url': return <Link size={20} />;
            default: return <Database size={20} />;
        }
    };

    const getBgColor = () => {
        if (data.type.startsWith('shopify')) return 'bg-slate-700';
        if (data.type.startsWith('condition')) return 'bg-orange-500';
        if (data.type === 'zapier') return 'bg-orange-600';
        return 'bg-blue-600';
    };

    return (
        <div className="bg-[#ffffff] rounded-lg shadow-sm border border-gray-200 w-48 overflow-hidden group hover:border-blue-500 transition-colors">
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 bg-[#ffffff] border-2 border-white/20 group-hover:border-blue-500"
            />

            <div className="p-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-md flex items-center justify-center text-gray-900 ${getBgColor()}`}>
                    {getIcon()}
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium text-slate-200 leading-tight">
                        {data.label}
                    </div>
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 bg-[#ffffff] border-2 border-white/20 group-hover:border-blue-500"
            />
        </div>
    );
}
