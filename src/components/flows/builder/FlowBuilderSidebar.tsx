"use client";

import { useState } from 'react';
import {
    Home, RefreshCw, Eye, ScrollText, MessageCircle, Keyboard, CalendarClock,
    MousePointer, Crosshair, Clock, UserX, Play, ArrowRightCircle, Building, Zap,
    // Condition icons
    GitBranch, Globe, Monitor, Smartphone, UserCheck, CalendarDays, Languages,
    Radio, Mail, MessageSquare, Link as LinkIcon, ShoppingCart,
    // Action icons
    HelpCircle, LayoutGrid, CreditCard, Send, Bell, Shuffle, Tag, MinusCircle,
    Network, Flag, ToggleLeft, ToggleRight, Users, BarChart3, FileText, Database,
    ShoppingBag, Package, Truck, Ticket, Info,
    // RAG icons
    Brain, Search, Scissors, Cpu, FileSearch, Filter, Layers, AlertTriangle,
    Sparkles, MessageSquareText, Code, Save, HardDrive, BookOpen, Scan, UserCog,
    Bot, Wrench, Terminal, GitFork
} from 'lucide-react';

// --- NODE DEFINITIONS ---

const TRIGGERS = [
    {
        group: 'By action they made on your page', items: [
            { subtype: 'first_visit', label: 'First visit on site', icon: Home },
            { subtype: 'visitor_returns', label: 'Visitor returns', icon: RefreshCw },
            { subtype: 'visitor_opens_page', label: 'Visitor opens a page', icon: Eye },
            { subtype: 'visitor_scrolls', label: 'Visitor scrolls page', icon: ScrollText },
            { subtype: 'visitor_clicks_chat', label: 'Visitor clicks chat icon', icon: MessageCircle },
            { subtype: 'new_event', label: 'New event', icon: Zap },
            { subtype: 'form_abandoned', label: 'Form abandoned', icon: FileText },
            { subtype: 'mouse_leaves', label: 'Mouse leaves window', icon: MousePointer },
            { subtype: 'idle_visitor', label: 'Idle visitor', icon: Clock },
            { subtype: 'schedule', label: 'On certain days & times', icon: CalendarClock },
            { subtype: 'shopify_add_cart', label: 'Visitor adds to cart', icon: ShoppingCart },
        ]
    },
    {
        group: 'By clicking or typing in the chat', items: [
            { subtype: 'visitor_says', label: 'Visitor says', icon: Keyboard },
            { subtype: 'visitor_selects_dept', label: 'Visitor selects department', icon: Building },
        ]
    },
    {
        group: 'When you start it', items: [
            { subtype: 'agent_no_respond', label: "Agent doesn't respond", icon: UserX },
            { subtype: 'agent_starts_flow', label: 'Agent starts the flow', icon: Play },
            { subtype: 'from_another_flow', label: 'From another flow', icon: ArrowRightCircle },
        ]
    },
];

const CONDITIONS = [
    {
        group: '', items: [
            { subtype: 'based_on_variable', label: 'Based on variable', icon: GitBranch },
            { subtype: 'browser', label: 'Browser', icon: Globe },
            { subtype: 'operating_system', label: 'Operating system', icon: Monitor },
            { subtype: 'mobile', label: 'Mobile', icon: Smartphone },
            { subtype: 'returning_visitor', label: 'Returning visitor', icon: UserCheck },
            { subtype: 'day', label: 'Day', icon: CalendarDays },
            { subtype: 'current_url', label: 'Current URL', icon: LinkIcon },
            { subtype: 'language', label: 'Language', icon: Languages },
            { subtype: 'mailing_subscriber', label: 'Mailing subscriber', icon: Mail },
            { subtype: 'chat_status', label: 'Chat status', icon: MessageSquare },
            { subtype: 'connection_channel', label: 'Connection channel', icon: Radio },
        ]
    },
    {
        group: 'Shopify', items: [
            { subtype: 'cart_value', label: 'Cart value', icon: ShoppingCart },
        ]
    },
];

const ACTIONS = [
    {
        group: '', items: [
            { subtype: 'send_message', label: 'Send a chat message', icon: MessageSquare },
            { subtype: 'ask_question', label: 'Ask a question', icon: HelpCircle },
            { subtype: 'decision_quick', label: 'Decision (Quick Replies)', icon: LayoutGrid },
            { subtype: 'decision_buttons', label: 'Decision (Buttons)', icon: MousePointer },
            { subtype: 'decision_cards', label: 'Decision (Card Messages)', icon: CreditCard },
            { subtype: 'send_email', label: 'Send an email', icon: Mail },
            { subtype: 'delay', label: 'Delay', icon: Clock },
            { subtype: 'randomize', label: 'Randomize', icon: Shuffle },
            { subtype: 'update_contact', label: 'Update contact property', icon: UserCheck },
            { subtype: 'add_tag', label: 'Add a tag', icon: Tag },
            { subtype: 'api_call', label: 'API call', icon: Network },
            { subtype: 'remove_tag', label: 'Remove a tag', icon: MinusCircle },
            { subtype: 'send_zapier', label: 'Send to Zapier', icon: Zap },
            { subtype: 'flow_ended', label: 'Flow ended message', icon: Flag },
            { subtype: 'subscribe_mailing', label: 'Subscribe for Mailing', icon: Send },
            { subtype: 'disable_input', label: 'Disable text input', icon: ToggleLeft },
            { subtype: 'enable_input', label: 'Enable text input', icon: ToggleRight },
            { subtype: 'send_notification', label: 'Send notification', icon: Bell },
            { subtype: 'assign_agent', label: 'Assign to an agent', icon: Users },
            { subtype: 'to_another_flow', label: 'To another flow', icon: ArrowRightCircle },
            { subtype: 'reassign_dept', label: 'Reassign to Department', icon: Building },
            { subtype: 'send_ga_event', label: 'Send event to GA', icon: BarChart3 },
            { subtype: 'send_form', label: 'Send a form', icon: FileText },
            { subtype: 'update_session_var', label: 'Update session variable', icon: Database },
            { subtype: 'data_transform', label: 'Data transformation', icon: RefreshCw },
            { subtype: 'open_website', label: 'Open website in modal', icon: Globe },
        ]
    },
    {
        group: 'Shopify', items: [
            { subtype: 'shopify_order', label: 'Check order status', icon: ShoppingBag },
            { subtype: 'shopify_product', label: 'Check product availability', icon: Package },
            { subtype: 'shopify_shipping', label: 'Check shipping details', icon: Truck },
            { subtype: 'shopify_coupon', label: 'Send a coupon code', icon: Ticket },
        ]
    },
];

// --- RAG / AI NODE DEFINITIONS ---

const RAG_NODES = [
    {
        group: '🟡 Ingestion', category: 'ingestion', color: 'bg-cyan-600', items: [
            { subtype: 'doc_loader', label: 'Document Loader', icon: FileText },
            { subtype: 'text_splitter', label: 'Text Splitter', icon: Scissors },
            { subtype: 'embedding_model', label: 'Embedding Model', icon: Cpu },
            { subtype: 'vector_store_writer', label: 'Vector Store Writer', icon: Database },
            { subtype: 'web_crawler', label: 'Web Crawler', icon: Globe },
        ]
    },
    {
        group: '🔵 Retrieval', category: 'retrieval', color: 'bg-cyan-600', items: [
            { subtype: 'embed_query', label: 'Embed Query', icon: Search },
            { subtype: 'vector_search', label: 'Vector Search', icon: FileSearch },
            { subtype: 'reranker', label: 'Reranker', icon: Filter },
            { subtype: 'context_builder', label: 'Context Builder', icon: Layers },
            { subtype: 'fallback_handler', label: 'Fallback Handler', icon: AlertTriangle },
        ]
    },
    {
        group: '🟣 LLM', category: 'llm', color: 'bg-violet-600', items: [
            { subtype: 'prompt_template', label: 'Prompt Template', icon: Sparkles },
            { subtype: 'llm_call', label: 'LLM Call', icon: Brain },
            { subtype: 'chat_history_injector', label: 'Chat History Injector', icon: MessageSquareText },
            { subtype: 'output_parser', label: 'Output Parser', icon: Code },
            { subtype: 'streaming_response', label: 'Streaming Response', icon: Radio },
        ]
    },
    {
        group: '🟢 Memory', category: 'memory', color: 'bg-teal-600', items: [
            { subtype: 'session_memory_read', label: 'Session Memory Read', icon: BookOpen },
            { subtype: 'session_memory_write', label: 'Session Memory Write', icon: Save },
            { subtype: 'longterm_memory_fetch', label: 'Long-term Memory Fetch', icon: HardDrive },
            { subtype: 'longterm_memory_store', label: 'Long-term Memory Store', icon: Database },
            { subtype: 'conversation_summarizer', label: 'Conversation Summarizer', icon: Scan },
            { subtype: 'entity_extractor', label: 'Entity Extractor', icon: UserCog },
        ]
    },
    {
        group: '🔴 Agents', category: 'agent', color: 'bg-fuchsia-700', items: [
            { subtype: 'ai_agent', label: 'AI Agent', icon: Bot },
            { subtype: 'tool_node', label: 'Tool Node', icon: Wrench },
            { subtype: 'code_interpreter', label: 'Code Interpreter', icon: Terminal },
            { subtype: 'multi_agent_router', label: 'Multi-Agent Router', icon: GitFork },
        ]
    },
];

// --- COMPONENT ---

export function FlowBuilderSidebar() {
    const [activeTab, setActiveTab] = useState<'triggers' | 'conditions' | 'actions' | 'ai_rag'>('triggers');

    const onDragStart = (event: React.DragEvent, nodeType: string, subtype: string, label: string, category?: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/reactflow-subtype', subtype);
        event.dataTransfer.setData('application/reactflow-label', label);
        event.dataTransfer.setData('application/reactflow-category', category || '');
        event.dataTransfer.effectAllowed = 'move';
    };

    const tabs = [
        { key: 'triggers' as const, label: 'Triggers', icon: Home, color: 'text-blue-500' },
        { key: 'conditions' as const, label: 'Conditions', icon: GitBranch, color: 'text-orange-500' },
        { key: 'actions' as const, label: 'Actions', icon: Zap, color: 'text-blue-500' },
        { key: 'ai_rag' as const, label: 'AI / RAG', icon: Brain, color: 'text-violet-500' },
    ];

    return (
        <div className="w-72 bg-[#18181b] border-l border-white/5 h-full flex flex-col z-10">
            {/* Tab Bar */}
            <div className="flex border-b border-white/5">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors border-b-2
                            ${activeTab === tab.key
                                ? `border-blue-500 ${tab.color}`
                                : 'border-transparent text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Descriptions */}
            {activeTab === 'triggers' && (
                <p className="px-4 pt-3 pb-2 text-[11px] text-slate-500 leading-relaxed">
                    Choose how your visitors will be engaged by the Flow.
                </p>
            )}
            {activeTab === 'ai_rag' && (
                <p className="px-4 pt-3 pb-2 text-[11px] text-slate-500 leading-relaxed">
                    AI-powered nodes for RAG pipelines, LLM calls, vector search, and memory.
                </p>
            )}

            {/* Node List */}
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-4">
                {activeTab === 'ai_rag' ? (
                    /* == RAG Nodes (special rendering with category colors) == */
                    RAG_NODES.map((group, gi) => (
                        <div key={gi}>
                            <div className="flex items-center gap-2 mb-2 mt-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${group.color}`} />
                                <h3 className="text-xs font-semibold text-slate-400">{group.group}</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {group.items.map((item) => (
                                    <div
                                        key={item.subtype}
                                        className="flex flex-col gap-1.5 p-2.5 bg-black/20 border border-white/5 rounded-lg cursor-grab hover:border-violet-500/40 hover:bg-black/40 transition-all group"
                                        draggable
                                        onDragStart={(e) => onDragStart(e, 'flow_rag', item.subtype, item.label, group.category)}
                                    >
                                        <div className={`w-7 h-7 rounded-md flex items-center justify-center text-white ${group.color}`}>
                                            <item.icon size={15} />
                                        </div>
                                        <span className="text-[11px] font-medium text-slate-300 leading-tight group-hover:text-violet-400 transition-colors">
                                            {item.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    /* == Standard Nodes (Triggers/Conditions/Actions) == */
                    (() => {
                        const currentList = activeTab === 'triggers' ? TRIGGERS : activeTab === 'conditions' ? CONDITIONS : ACTIONS;
                        const nodeType = activeTab === 'triggers' ? 'flow_trigger' : activeTab === 'conditions' ? 'flow_condition' : 'flow_action';
                        return currentList.map((group, gi) => (
                            <div key={gi}>
                                {group.group && (
                                    <div className="flex items-center gap-2 mb-2 mt-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                        <h3 className="text-xs font-semibold text-slate-400">{group.group}</h3>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-2">
                                    {group.items.map((item) => (
                                        <div
                                            key={item.subtype}
                                            className="flex flex-col gap-1.5 p-2.5 bg-black/20 border border-white/5 rounded-lg cursor-grab hover:border-blue-500/40 hover:bg-black/40 transition-all group"
                                            draggable
                                            onDragStart={(e) => onDragStart(e, nodeType, item.subtype, item.label)}
                                        >
                                            <div className={`w-7 h-7 rounded-md flex items-center justify-center text-white
                                                ${activeTab === 'conditions' ? 'bg-orange-500' : 'bg-blue-600'}`}>
                                                <item.icon size={15} />
                                            </div>
                                            <span className="text-[11px] font-medium text-slate-300 leading-tight group-hover:text-blue-400 transition-colors">
                                                {item.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ));
                    })()
                )}

                {activeTab === 'conditions' && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3 flex gap-2 items-start text-blue-400 mt-3">
                        <Info size={14} className="shrink-0 mt-0.5" />
                        <p className="text-[10px] leading-relaxed">
                            To make conditions on data such Email, Name, Country use &quot;Based on variable&quot; node.
                        </p>
                    </div>
                )}

                {activeTab === 'ai_rag' && (
                    <div className="bg-violet-500/10 border border-violet-500/20 rounded-md p-3 flex gap-2 items-start text-violet-400 mt-3">
                        <Info size={14} className="shrink-0 mt-0.5" />
                        <p className="text-[10px] leading-relaxed">
                            RAG nodes work with your Knowledge Bases. Create a KB first in Settings → Knowledge Base, then use Embed Query → Vector Search → LLM Call to build AI-powered flows.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
