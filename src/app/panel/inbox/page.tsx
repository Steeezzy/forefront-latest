"use client";

import { useState, useCallback } from 'react';
import { InboxSidebar, InboxView, ConversationStatusFilter, TicketStatusFilter } from '@/components/inbox/InboxSidebar';
import { InboxTopNav } from '@/components/inbox/InboxTopNav';
import { InboxEmptyState } from '@/components/inbox/InboxEmptyState';
import { IntegrationGrid } from '@/components/inbox/IntegrationGrid';
import { ConversationList } from '@/components/inbox/ConversationList';
import { ConversationDetail } from '@/components/inbox/ConversationDetail';
import { VisitorInfoPanel } from '@/components/inbox/VisitorInfoPanel';
import { TicketList } from '@/components/inbox/TicketList';
import { TicketDetail } from '@/components/inbox/TicketDetail';
import { TicketEmptyState } from '@/components/inbox/TicketEmptyState';
import { CreateTicketDialog } from '@/components/inbox/CreateTicketDialog';
import { Plus } from 'lucide-react';

interface SelectedConversation {
    id: string;
    channel: string;
    visitor_name: string;
    agent_takeover: boolean;
}

interface SelectedTicket {
    id: string;
    ticket_number: string;
    subject: string;
}

export default function InboxPage() {
    // View state
    const [activeView, setActiveView] = useState<InboxView>('conversations');
    const [conversationStatus, setConversationStatus] = useState<ConversationStatusFilter>('open');
    const [ticketStatus, setTicketStatus] = useState<TicketStatusFilter>('open');
    const [channelFilter, setChannelFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Conversation state
    const [selectedConversation, setSelectedConversation] = useState<SelectedConversation | null>(null);
    const [showInfoPanel, setShowInfoPanel] = useState(false);

    // Ticket state
    const [selectedTicket, setSelectedTicket] = useState<SelectedTicket | null>(null);
    const [showCreateTicket, setShowCreateTicket] = useState(false);

    // Refresh keys
    const [convRefreshKey, setConvRefreshKey] = useState(0);
    const [ticketRefreshKey, setTicketRefreshKey] = useState(0);

    const handleSimulate = useCallback(() => {
        setConvRefreshKey(prev => prev + 1);
    }, []);

    const handleViewChange = useCallback((view: InboxView) => {
        setActiveView(view);
        setSearchQuery('');
        if (view === 'conversations') {
            setSelectedTicket(null);
        } else {
            setSelectedConversation(null);
            setShowInfoPanel(false);
        }
    }, []);

    // Map conversation sidebar status to API params
    // Backend uses: status=open|closed|snoozed|pending, assigned_to=unassigned
    const getConversationApiStatus = (): string => {
        if (conversationStatus === 'solved') return 'closed';
        if (conversationStatus === 'unassigned') return 'open'; // unassigned handled via separate param
        return 'open';
    };

    const getListTitle = () => {
        if (searchQuery) return `Search: "${searchQuery}"`;
        if (activeView === 'tickets') {
            return ticketStatus === 'unassigned' ? 'Unassigned Tickets'
                : ticketStatus === 'solved' ? 'Solved Tickets'
                : 'My Open Tickets';
        }
        return conversationStatus === 'unassigned' ? 'Unassigned'
            : conversationStatus === 'solved' ? 'Solved'
            : 'My Open';
    };

    return (
        <div className="flex h-full bg-[#0f1115]">
            {/* Inner Sidebar — conversations & tickets sections */}
            <InboxSidebar
                activeView={activeView}
                onViewChange={handleViewChange}
                conversationStatus={conversationStatus}
                ticketStatus={ticketStatus}
                onConversationStatusChange={setConversationStatus}
                onTicketStatusChange={setTicketStatus}
                channelFilter={channelFilter}
                onChannelFilterChange={setChannelFilter}
            />

            {/* List Panel */}
            <div className="w-80 border-r border-white/5 flex flex-col h-full overflow-hidden">
                <div className="h-14 flex items-center justify-between px-4 border-b border-white/5">
                    <h2 className="text-sm font-semibold text-zinc-300">
                        {getListTitle()}
                    </h2>
                    {activeView === 'tickets' && (
                        <button
                            onClick={() => setShowCreateTicket(true)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
                            title="Create ticket"
                        >
                            <Plus size={16} />
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto">
                    {activeView === 'conversations' ? (
                        <ConversationList
                            key={convRefreshKey}
                            channelFilter={channelFilter}
                            statusFilter={getConversationApiStatus()}
                            selectedId={selectedConversation?.id}
                            searchQuery={searchQuery}
                            onSelectConversation={(conv) => setSelectedConversation({
                                id: conv.id,
                                channel: conv.channel,
                                visitor_name: conv.visitor_name,
                                agent_takeover: conv.agent_takeover,
                            })}
                        />
                    ) : (
                        <TicketList
                            key={ticketRefreshKey}
                            statusFilter={ticketStatus}
                            selectedId={selectedTicket?.id}
                            searchQuery={searchQuery}
                            onSelectTicket={(ticket) => setSelectedTicket({
                                id: ticket.id,
                                ticket_number: ticket.ticket_number,
                                subject: ticket.subject,
                            })}
                        />
                    )}
                </div>
            </div>

            {/* Detail Panel */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <InboxTopNav
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                />

                {activeView === 'conversations' ? (
                    selectedConversation ? (
                        <div className="flex-1 flex overflow-hidden">
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <ConversationDetail
                                    conversationId={selectedConversation.id}
                                    channel={selectedConversation.channel}
                                    visitorName={selectedConversation.visitor_name}
                                    agentTakeover={selectedConversation.agent_takeover}
                                    showInfoPanel={showInfoPanel}
                                    onToggleInfo={() => setShowInfoPanel(!showInfoPanel)}
                                    onTakeoverChange={(takeover) =>
                                        setSelectedConversation(prev => prev ? { ...prev, agent_takeover: takeover } : null)
                                    }
                                />
                            </div>

                            {showInfoPanel && (
                                <VisitorInfoPanel
                                    conversationId={selectedConversation.id}
                                    onClose={() => setShowInfoPanel(false)}
                                    onUpdate={() => setConvRefreshKey(prev => prev + 1)}
                                />
                            )}
                        </div>
                    ) : (
                        <main className="flex-1 overflow-y-auto p-8 lg:p-12">
                            <div className="max-w-5xl mx-auto">
                                <InboxEmptyState onSimulate={handleSimulate} />
                                <IntegrationGrid />
                            </div>
                        </main>
                    )
                ) : (
                    selectedTicket ? (
                        <div className="flex-1 overflow-hidden">
                            <TicketDetail
                                ticketId={selectedTicket.id}
                                onTicketUpdate={() => setTicketRefreshKey(prev => prev + 1)}
                            />
                        </div>
                    ) : (
                        <main className="flex-1 overflow-y-auto">
                            <TicketEmptyState onCreateTicket={() => setShowCreateTicket(true)} />
                        </main>
                    )
                )}
            </div>

            {/* Create Ticket Dialog */}
            <CreateTicketDialog
                open={showCreateTicket}
                onClose={() => setShowCreateTicket(false)}
                onCreated={() => setTicketRefreshKey(prev => prev + 1)}
            />
        </div>
    );
}
