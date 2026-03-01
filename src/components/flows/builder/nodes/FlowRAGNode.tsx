import { Handle, Position } from '@xyflow/react';
import {
    Play, Pause, Copy, MoreHorizontal,
    FileText, Scissors, Cpu, Database, Globe, Search, FileSearch, Filter,
    Layers, AlertTriangle, Sparkles, Brain, MessageSquareText, Code, Radio,
    Save, HardDrive, BookOpen, Scan, UserCog, Bot, Wrench, Terminal, GitFork
} from 'lucide-react';
import { useState } from 'react';

interface FlowRAGNodeProps {
    data: { label: string; subtype: string; category: string; config?: Record<string, any>; is_paused?: boolean };
    selected?: boolean;
    id: string;
}

const categoryColors: Record<string, string> = {
    ingestion: 'bg-cyan-600', retrieval: 'bg-cyan-600', llm: 'bg-violet-600', memory: 'bg-teal-600', agent: 'bg-fuchsia-700',
};

const categoryBorderSel: Record<string, string> = {
    ingestion: 'border-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.2)]',
    retrieval: 'border-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.2)]',
    llm: 'border-violet-400 shadow-[0_0_16px_rgba(139,92,246,0.2)]',
    memory: 'border-teal-400 shadow-[0_0_16px_rgba(20,184,166,0.2)]',
    agent: 'border-fuchsia-400 shadow-[0_0_16px_rgba(192,38,211,0.2)]',
};

const iconMap: Record<string, any> = {
    doc_loader: FileText, text_splitter: Scissors, embedding_model: Cpu, vector_store_writer: Database, web_crawler: Globe,
    embed_query: Search, vector_search: FileSearch, reranker: Filter, context_builder: Layers, fallback_handler: AlertTriangle,
    prompt_template: Sparkles, llm_call: Brain, chat_history_injector: MessageSquareText, output_parser: Code, streaming_response: Radio,
    session_memory_read: BookOpen, session_memory_write: Save, longterm_memory_fetch: HardDrive, longterm_memory_store: Database,
    conversation_summarizer: Scan, entity_extractor: UserCog,
    ai_agent: Bot, tool_node: Wrench, code_interpreter: Terminal, multi_agent_router: GitFork,
};

export function FlowRAGNode({ data, selected, id }: FlowRAGNodeProps) {
    const IconComp = iconMap[data.subtype] || Brain;
    const bgColor = categoryColors[data.category] || 'bg-violet-600';
    const borderSel = categoryBorderSel[data.category] || 'border-violet-400';
    const isFallback = data.subtype === 'fallback_handler';
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
                ${selected ? borderSel : 'border-white/10 hover:border-violet-500/50'}
                ${data.is_paused ? 'opacity-50' : ''}`}>

                <Handle type="target" position={Position.Top} id="input"
                    className="!w-3.5 !h-3.5 !bg-slate-700 !border-2 !border-slate-500 hover:!border-violet-400 hover:!bg-violet-500 transition-colors !-top-[7px]" />

                <div className="p-3 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white ${bgColor} shrink-0`}>
                        <IconComp size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-white leading-tight block truncate">{data.label}</span>
                        <span className="text-[10px] text-slate-500 capitalize">{data.category}</span>
                    </div>
                </div>

                {isFallback ? (
                    <div className="flex border-t border-white/5 text-[10px] font-semibold">
                        <div className="flex-1 py-2 text-center text-emerald-400 border-r border-white/5 relative hover:bg-emerald-500/5">
                            ✅ Has Results
                            <Handle type="source" position={Position.Bottom} id="has_results"
                                className="!w-3.5 !h-3.5 !bg-emerald-600 !border-2 !border-emerald-400 hover:!bg-emerald-400 transition-colors !-bottom-[7px]"
                                style={{ left: '50%' }} />
                        </div>
                        <div className="flex-1 py-2 text-center text-red-400 relative hover:bg-red-500/5">
                            ❌ No Results
                            <Handle type="source" position={Position.Bottom} id="no_results"
                                className="!w-3.5 !h-3.5 !bg-red-600 !border-2 !border-red-400 hover:!bg-red-400 transition-colors !-bottom-[7px]"
                                style={{ left: '50%' }} />
                        </div>
                    </div>
                ) : (
                    <Handle type="source" position={Position.Bottom} id="output"
                        className="!w-3.5 !h-3.5 !bg-slate-700 !border-2 !border-slate-500 hover:!border-violet-400 hover:!bg-violet-500 transition-colors !-bottom-[7px]" />
                )}
            </div>
        </div>
    );
}
