'use client';

import { useState } from 'react';
import {
  Search,
  Send,
  Lightbulb,
  X,
  Paperclip,
  ChevronDown,
  Clock,
  MessageSquare,
  Mail,
  Phone,
  MessageCircle,
  User,
  Building2,
  CreditCard,
  ExternalLink,
  AlertTriangle,
  Shield,
  FileText,
  StickyNote,
  CheckCircle,
} from 'lucide-react';

type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
type TicketPriority = 'urgent' | 'high' | 'medium' | 'low';
type Channel = 'chat' | 'email' | 'voice' | 'whatsapp';

interface TicketMessage {
  id: string;
  sender: 'customer' | 'agent';
  content: string;
  time: string;
  agentName?: string;
}

interface InternalNote {
  id: string;
  agent: string;
  content: string;
  time: string;
}

interface Ticket {
  id: string;
  title: string;
  customer: string;
  email: string;
  workspace: string;
  plan: string;
  status: TicketStatus;
  priority: TicketPriority;
  channel: Channel;
  time: string;
  messages: TicketMessage[];
  internalNotes: InternalNote[];
}

const mockTickets: Ticket[] = [
  {
    id: 'TK-1047',
    title: 'Unable to connect WhatsApp channel',
    customer: 'Raj Kumar',
    email: 'raj@mystore.in',
    workspace: 'mystore-workspace',
    plan: 'Pro',
    status: 'open',
    priority: 'urgent',
    channel: 'chat',
    time: '5 min ago',
    messages: [
      { id: 'm1', sender: 'customer', content: 'Hi, I cannot connect my WhatsApp Business number. I keep getting an error after scanning the QR code.', time: '10:02 AM' },
      { id: 'm2', sender: 'agent', content: 'Hi Raj! I\'m sorry to hear that. Could you tell me which error message you see after scanning?', time: '10:05 AM', agentName: 'Sneha R' },
      { id: 'm3', sender: 'customer', content: 'It says "Authentication failed. Please try again." but I\'ve tried 5 times now.', time: '10:06 AM' },
    ],
    internalNotes: [
      { id: 'n1', agent: 'Sneha R', content: 'Checked workspace — WhatsApp token expired. Need to revoke and re-issue from Meta dashboard.', time: '10:08 AM' },
    ],
  },
  {
    id: 'TK-1046',
    title: 'Razorpay payment not reflecting',
    customer: 'Priya Hospitals',
    email: 'billing@priyahospitals.com',
    workspace: 'priya-hospitals',
    plan: 'Enterprise',
    status: 'pending',
    priority: 'high',
    channel: 'email',
    time: '23 min ago',
    messages: [
      { id: 'm4', sender: 'customer', content: 'We paid ₹29,999 via Razorpay 2 days ago but the plan hasn\'t been upgraded. Transaction ID: RZP_8827736.', time: '9:45 AM' },
      { id: 'm5', sender: 'agent', content: 'Thank you for reaching out. I can see the transaction in our logs. Let me check the webhook status.', time: '9:50 AM', agentName: 'Arjun K' },
    ],
    internalNotes: [],
  },
  {
    id: 'TK-1045',
    title: 'AI bot giving wrong product prices',
    customer: 'Spice Garden',
    email: 'owner@spicegarden.in',
    workspace: 'spicegarden-workspace',
    plan: 'Pro',
    status: 'open',
    priority: 'high',
    channel: 'whatsapp',
    time: '45 min ago',
    messages: [
      { id: 'm6', sender: 'customer', content: 'The chatbot is quoting old prices from last month. We updated our menu 3 days ago.', time: '9:20 AM' },
    ],
    internalNotes: [],
  },
  {
    id: 'TK-1044',
    title: 'Voice agent dropping calls mid-conversation',
    customer: 'MedCare Hospitals',
    email: 'it@medcare.in',
    workspace: 'medcare-hospitals',
    plan: 'Enterprise',
    status: 'open',
    priority: 'urgent',
    channel: 'voice',
    time: '1 hr ago',
    messages: [
      { id: 'm7', sender: 'customer', content: 'Our voice agent keeps dropping patient calls after about 2 minutes. This is critical for us.', time: '8:55 AM' },
      { id: 'm8', sender: 'agent', content: 'I understand the urgency. I\'m pulling your call logs now. Do you have any specific call IDs we can investigate?', time: '9:01 AM', agentName: 'Deepa M' },
    ],
    internalNotes: [
      { id: 'n2', agent: 'Deepa M', content: 'Escalated to infra team. Looks like Twilio session timeout issue.', time: '9:05 AM' },
    ],
  },
  {
    id: 'TK-1043',
    title: 'Cannot export conversation history',
    customer: 'Green Valley School',
    email: 'it@greenvalley.edu',
    workspace: 'greenvalley-school',
    plan: 'Starter',
    status: 'pending',
    priority: 'medium',
    channel: 'email',
    time: '2 hr ago',
    messages: [
      { id: 'm9', sender: 'customer', content: 'The export button in conversations does nothing when I click it. No download starts.', time: '8:30 AM' },
    ],
    internalNotes: [],
  },
  {
    id: 'TK-1042',
    title: 'Chatbot not replying in Hindi',
    customer: 'City Hospital',
    email: 'admin@cityhospital.com',
    workspace: 'city-hospital',
    plan: 'Enterprise',
    status: 'resolved',
    priority: 'medium',
    channel: 'chat',
    time: '3 hr ago',
    messages: [
      { id: 'm10', sender: 'customer', content: 'The bot was configured for Hindi but it keeps replying in English only.', time: '7:45 AM' },
      { id: 'm11', sender: 'agent', content: 'I\'ve re-enabled the Hindi language pack and reset the language detection model. Please test now.', time: '8:00 AM', agentName: 'Rahul S' },
      { id: 'm12', sender: 'customer', content: 'Working now, thank you!', time: '8:15 AM' },
    ],
    internalNotes: [],
  },
  {
    id: 'TK-1041',
    title: 'Billing invoice shows wrong GST number',
    customer: 'TechZone India',
    email: 'finance@techzone.in',
    workspace: 'techzone-india',
    plan: 'Pro',
    status: 'open',
    priority: 'low',
    channel: 'email',
    time: '4 hr ago',
    messages: [
      { id: 'm13', sender: 'customer', content: 'Invoice #INV-2024-0088 shows the wrong GSTIN. Our correct GSTIN is 27AAPCS8087Q1ZN.', time: '6:55 AM' },
    ],
    internalNotes: [],
  },
  {
    id: 'TK-1040',
    title: 'API rate limit too low for our usage',
    customer: 'Divya Retail',
    email: 'dev@divyaretail.com',
    workspace: 'divya-retail',
    plan: 'Pro',
    status: 'closed',
    priority: 'low',
    channel: 'chat',
    time: '6 hr ago',
    messages: [
      { id: 'm14', sender: 'customer', content: 'We are hitting the 1000 API call/day limit frequently. Can this be increased?', time: '5:00 AM' },
      { id: 'm15', sender: 'agent', content: 'Your plan allows up to 1000 calls/day. We recommend upgrading to Enterprise for 10,000 calls/day.', time: '5:15 AM', agentName: 'Meena V' },
    ],
    internalNotes: [],
  },
];

const STATUS_COLORS: Record<TicketStatus, string> = {
  open: 'bg-blue-100 text-blue-700',
  pending: 'bg-amber-100 text-amber-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-gray-100 text-gray-500',
};

const PRIORITY_DOT: Record<TicketPriority, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-400',
  medium: 'bg-yellow-400',
  low: 'bg-green-400',
};

const PRIORITY_BADGE: Record<TicketPriority, string> = {
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

const CHANNEL_ICON: Record<Channel, React.ElementType> = {
  chat: MessageSquare,
  email: Mail,
  voice: Phone,
  whatsapp: MessageCircle,
};

const STATUS_COUNTS = {
  all: mockTickets.length,
  open: mockTickets.filter((t) => t.status === 'open').length,
  pending: mockTickets.filter((t) => t.status === 'pending').length,
  resolved: mockTickets.filter((t) => t.status === 'resolved').length,
  closed: mockTickets.filter((t) => t.status === 'closed').length,
};

const AI_SUGGESTIONS: Record<string, string> = {
  'TK-1047': "Hi Raj! I understand how frustrating this can be. The 'Authentication failed' error after scanning the QR code usually means the WhatsApp token has expired or the session timed out. Let me revoke the current session and generate a fresh QR code for you. This should resolve the issue in under 2 minutes. Please stay on this chat!",
  'TK-1046': "Hello! I can confirm we've received your payment of ₹29,999 (Transaction ID: RZP_8827736). There appears to have been a webhook delivery failure on our end. I've manually triggered the plan upgrade and you should see your account upgraded to Enterprise within the next 5 minutes. I'll also send a revised invoice to your email.",
  'TK-1045': "Hi! This typically happens when the knowledge base cache hasn't refreshed after a product update. I've triggered a manual re-sync of your menu data. Your chatbot should start quoting the correct prices within the next 10–15 minutes. Let me know if you'd like me to verify a few items!",
};

type TabType = 'conversation' | 'notes' | 'info';

export default function TicketsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assignedFilter, setAssignedFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket>(mockTickets[0]);
  const [activeTab, setActiveTab] = useState<TabType>('conversation');
  const [replyText, setReplyText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [showAiSuggestion, setShowAiSuggestion] = useState(true);
  const [impersonateConfirm, setImpersonateConfirm] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [notes, setNotes] = useState<Record<string, InternalNote[]>>(
    Object.fromEntries(mockTickets.map((t) => [t.id, t.internalNotes]))
  );

  const filteredTickets = tickets.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.customer.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (channelFilter !== 'all' && t.channel !== channelFilter) return false;
    return true;
  });

  const aiSuggestion = AI_SUGGESTIONS[selectedTicket.id];

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    const newMsg: TicketMessage = {
      id: `m-${Date.now()}`,
      sender: 'agent',
      content: replyText,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      agentName: 'Support Agent',
    };
    setTickets((prev) =>
      prev.map((t) => t.id === selectedTicket.id ? { ...t, messages: [...t.messages, newMsg] } : t)
    );
    setSelectedTicket((prev) => ({ ...prev, messages: [...prev.messages, newMsg] }));
    setReplyText('');
    setShowAiSuggestion(true);
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    const newNote: InternalNote = {
      id: `n-${Date.now()}`,
      agent: 'Support Agent',
      content: noteText,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
    setNotes((prev) => ({ ...prev, [selectedTicket.id]: [...(prev[selectedTicket.id] || []), newNote] }));
    setNoteText('');
  };

  const handleUseAiSuggestion = () => {
    if (aiSuggestion) {
      setReplyText(aiSuggestion);
      setShowAiSuggestion(false);
    }
  };

  const handleCloseTicket = () => {
    setTickets((prev) =>
      prev.map((t) => t.id === selectedTicket.id ? { ...t, status: 'closed' } : t)
    );
    setSelectedTicket((prev) => ({ ...prev, status: 'closed' }));
  };

  return (
    <div className="flex h-[calc(100vh-56px-48px)] gap-0 -mx-4 -my-6 overflow-hidden bg-gray-50">
      {/* Left sidebar */}
      <div className="w-[280px] flex-shrink-0 flex flex-col border-r border-gray-200 bg-white">
        {/* Search */}
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="p-3 border-b border-gray-100 space-y-3">
          {/* Status */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Status</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(STATUS_COUNTS).map(([status, count]) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`text-xs px-2 py-0.5 rounded-full capitalize transition-colors ${
                    statusFilter === status
                      ? 'bg-indigo-100 text-indigo-700 font-medium'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {status} ({count})
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Priority</p>
            <div className="flex flex-wrap gap-1">
              {['all', 'urgent', 'high', 'medium', 'low'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`text-xs px-2 py-0.5 rounded-full capitalize transition-colors ${
                    priorityFilter === p
                      ? 'bg-indigo-100 text-indigo-700 font-medium'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Assigned to */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Assigned to</p>
            <select
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
            >
              <option value="all">All Agents</option>
              <option value="me">My Tickets</option>
            </select>
          </div>

          {/* Channel */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Channel</p>
            <div className="flex flex-wrap gap-1">
              {['all', 'chat', 'email', 'voice', 'whatsapp'].map((c) => (
                <button
                  key={c}
                  onClick={() => setChannelFilter(c)}
                  className={`text-xs px-2 py-0.5 rounded-full capitalize transition-colors ${
                    channelFilter === c
                      ? 'bg-indigo-100 text-indigo-700 font-medium'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ticket list */}
        <div className="flex-1 overflow-y-auto">
          {filteredTickets.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No tickets match your filters</p>
          ) : (
            filteredTickets.map((ticket) => {
              const ChannelIcon = CHANNEL_ICON[ticket.channel];
              const isSelected = selectedTicket.id === ticket.id;
              return (
                <button
                  key={ticket.id}
                  onClick={() => { setSelectedTicket(ticket); setActiveTab('conversation'); setShowAiSuggestion(true); }}
                  className={`w-full text-left px-3 py-3 border-b border-gray-50 transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 border-l-2 border-l-indigo-500'
                      : 'hover:bg-gray-50 border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_DOT[ticket.priority]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400 font-mono">{ticket.id}</span>
                        <ChannelIcon className="w-3 h-3 text-gray-400" />
                      </div>
                      <p className="text-xs font-medium text-gray-800 truncate mt-0.5">{ticket.title}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                        {ticket.customer} · {ticket.time}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right main area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm font-semibold text-gray-700">{selectedTicket.id}</span>
            <h2 className="text-sm font-semibold text-gray-900">{selectedTicket.title}</h2>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[selectedTicket.status]}`}>
              {selectedTicket.status}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${PRIORITY_BADGE[selectedTicket.priority]}`}>
              {selectedTicket.priority}
            </span>
          </div>
          <button
            onClick={handleCloseTicket}
            disabled={selectedTicket.status === 'closed'}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X className="w-3.5 h-3.5" />
            Close Ticket
          </button>
        </div>

        {/* Customer info bar */}
        <div className="px-5 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-5 flex-shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <User className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-medium">{selectedTicket.customer}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Mail className="w-3.5 h-3.5 text-gray-400" />
            {selectedTicket.email}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Building2 className="w-3.5 h-3.5 text-gray-400" />
            {selectedTicket.workspace}
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
            {selectedTicket.plan}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 flex-shrink-0">
          {(['conversation', 'notes', 'info'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-xs font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'conversation' ? 'Conversation' : tab === 'notes' ? 'Internal Notes' : 'Customer Info'}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {/* Conversation Tab */}
          {activeTab === 'conversation' && (
            <div className="flex flex-col h-full">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {selectedTicket.messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.sender === 'agent'
                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                        : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                    }`}>
                      {msg.sender === 'agent' && msg.agentName && (
                        <p className="text-[10px] font-semibold text-indigo-200 mb-1">{msg.agentName}</p>
                      )}
                      <p className="leading-relaxed">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${msg.sender === 'agent' ? 'text-indigo-300' : 'text-gray-400'}`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI suggestion */}
              <div className="px-5 pb-2 flex-shrink-0">
                {showAiSuggestion && aiSuggestion && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 mb-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                        Suggested Reply
                      </div>
                      <button
                        onClick={() => setShowAiSuggestion(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{aiSuggestion}</p>
                    <div className="flex gap-2 mt-2.5">
                      <button
                        onClick={handleUseAiSuggestion}
                        className="text-xs font-medium px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Use this reply
                      </button>
                      <button
                        onClick={() => setShowAiSuggestion(false)}
                        className="text-xs font-medium px-3 py-1 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                {/* Reply editor */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <textarea
                    rows={3}
                    className="w-full px-3.5 py-2.5 text-sm text-gray-800 resize-none focus:outline-none"
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <button className="text-gray-400 hover:text-gray-600">
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <div className="relative">
                        <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-2 py-1">
                          Quick response <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handleSendReply}
                      disabled={!replyText.trim()}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Internal Notes Tab */}
          {activeTab === 'notes' && (
            <div className="p-5 space-y-4">
              {/* Existing notes */}
              {(notes[selectedTicket.id] || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <StickyNote className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">No internal notes yet</p>
                </div>
              ) : (
                (notes[selectedTicket.id] || []).map((note) => (
                  <div key={note.id} className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-yellow-800">{note.agent}</span>
                      <span className="text-xs text-yellow-600">{note.time}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{note.content}</p>
                  </div>
                ))
              )}

              {/* Add note */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <textarea
                  rows={4}
                  className="w-full px-3.5 py-2.5 text-sm text-gray-800 resize-none focus:outline-none"
                  placeholder="Add an internal note (not visible to customer)..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <div className="flex justify-end px-3 py-2 bg-gray-50 border-t border-gray-100">
                  <button
                    onClick={handleAddNote}
                    disabled={!noteText.trim()}
                    className="text-xs font-semibold px-3 py-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-40"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Customer Info Tab */}
          {activeTab === 'info' && (
            <div className="p-5 space-y-5">
              {/* Workspace info */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-500" />
                  Workspace Info
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Name', value: selectedTicket.workspace },
                    { label: 'Plan', value: selectedTicket.plan },
                    { label: 'Owner', value: selectedTicket.customer },
                    { label: 'Domain', value: `${selectedTicket.workspace}.qestron.com` },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">{label}</p>
                      <p className="text-sm text-gray-800 mt-0.5 font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick actions */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-indigo-500" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  <button className="flex items-center gap-2 text-xs font-medium px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors text-gray-700">
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
                    View Workspace
                  </button>
                  <button className="flex items-center gap-2 text-xs font-medium px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors text-gray-700">
                    <FileText className="w-3.5 h-3.5 text-emerald-500" />
                    Billing History
                  </button>
                  <button
                    onClick={() => setImpersonateConfirm(true)}
                    className="flex items-center gap-2 text-xs font-medium px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors text-amber-700"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Impersonate Login
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Impersonate confirmation modal */}
      {impersonateConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Impersonate Login</h3>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              You will be logged into <strong>{selectedTicket.workspace}</strong> as admin.{' '}
              <span className="text-amber-700 font-medium">All actions will be logged.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setImpersonateConfirm(false)}
                className="flex-1 text-sm font-medium px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setImpersonateConfirm(false)}
                className="flex-1 text-sm font-semibold px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
              >
                Confirm & Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
