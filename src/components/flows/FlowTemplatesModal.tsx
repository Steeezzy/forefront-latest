"use client";

import { useState, useEffect } from 'react';
import { X, Search, Loader2, ShoppingCart, UserPlus, HeadphonesIcon, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Template {
    name: string;
    description: string;
    category: 'sales' | 'leads' | 'support';
    trigger_type: string;
    uses: number;
}

interface FlowTemplatesModalProps {
    isOpen: boolean;
    onClose: () => void;
    agentId: string;
}

const categoryConfig = {
    sales: { label: 'Sales', icon: ShoppingCart, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
    leads: { label: 'Leads', icon: UserPlus, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
    support: { label: 'Support', icon: HeadphonesIcon, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
};

export function FlowTemplatesModal({ isOpen, onClose, agentId }: FlowTemplatesModalProps) {
    const router = useRouter();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('all');

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
        }
    }, [isOpen]);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/api/flows/templates');
            setTemplates(data.templates || []);
        } catch (err) {
            console.error('Failed to fetch templates:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUseTemplate = async (templateName: string) => {
        setCreating(templateName);
        try {
            const res = await apiFetch('/api/flows/from-template', {
                method: 'POST',
                body: JSON.stringify({ agentId, templateName }),
            });
            if (res.flow?.id) {
                router.push(`/panel/flows/create/${res.flow.id}`);
                onClose();
            }
        } catch (err) {
            console.error('Failed to create flow from template:', err);
            alert('Failed to create flow');
        } finally {
            setCreating(null);
        }
    };

    const filteredTemplates = templates.filter((t) => {
        const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                              t.description.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const formatUses = (uses: number) => {
        if (uses >= 1000) return `${(uses / 1000).toFixed(1)}K uses`;
        return `${uses} uses`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1d24] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Flow Templates</h2>
                        <p className="text-sm text-slate-400 mt-1">Choose a template to get started quickly</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Search & Filters */}
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="relative flex-1">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search templates..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-[#0f1115] border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setActiveCategory('all')}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                activeCategory === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                            }`}
                        >
                            All
                        </button>
                        {Object.entries(categoryConfig).map(([key, config]) => (
                            <button
                                key={key}
                                onClick={() => setActiveCategory(key)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                                    activeCategory === key
                                        ? `${config.bgColor} ${config.color}`
                                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                }`}
                            >
                                <config.icon size={14} />
                                {config.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Templates Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <Loader2 className="animate-spin text-blue-400" size={32} />
                        </div>
                    ) : filteredTemplates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                            <Search size={32} className="mb-2 opacity-50" />
                            <p>No templates found</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {filteredTemplates.map((template) => {
                                const config = categoryConfig[template.category];
                                return (
                                    <div
                                        key={template.name}
                                        className="bg-[#0f1115] border border-white/5 rounded-xl p-4 hover:border-white/20 transition-colors group"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}>
                                                        {config.label}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {formatUses(template.uses)}
                                                    </span>
                                                </div>
                                                <h3 className="font-medium text-white truncate">{template.name}</h3>
                                                <p className="text-sm text-slate-400 mt-1 line-clamp-2">{template.description}</p>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => handleUseTemplate(template.name)}
                                                disabled={creating !== null}
                                                className="bg-blue-600 hover:bg-blue-500 text-white shrink-0"
                                            >
                                                {creating === template.name ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                ) : (
                                                    <>
                                                        Use <ChevronRight size={14} />
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
