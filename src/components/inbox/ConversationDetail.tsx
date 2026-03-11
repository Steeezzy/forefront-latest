"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Phone, Instagram, Facebook, Mail, Globe, Bot, UserCheck,
  Send, ArrowRightLeft, XCircle, AlertTriangle, Smile, Paperclip,
  Hash, MoreHorizontal, CheckCheck, Clock, Zap, FileText,
  Image as ImageIcon, Copy, Trash2, ChevronDown, X,
  MessageSquare, Star, User, ShoppingBag, Ticket, Wand2, AlertCircle
} from 'lucide-react';
import { ConversationActionsMenu } from './ConversationActionsMenu';
import { ZendeskTicketModal } from './ZendeskTicketModal';
import { ProductDirectory } from './ProductDirectory';

const CHANNEL_CONFIG: Record<string, { icon: any; color: string; label: string; bg: string }> = {
  whatsapp: { icon: Phone, color: 'text-green-400', label: 'WhatsApp', bg: 'bg-green-500/10' },
  instagram: { icon: Instagram, color: 'text-pink-400', label: 'Instagram', bg: 'bg-pink-500/10' },
  messenger: { icon: Facebook, color: 'text-blue-400', label: 'Messenger', bg: 'bg-blue-500/10' },
  email: { icon: Mail, color: 'text-yellow-400', label: 'Email', bg: 'bg-yellow-500/10' },
  web: { icon: Globe, color: 'text-purple-400', label: 'Web', bg: 'bg-purple-500/10' },
};

const CANNED_RESPONSES = [
  { shortcut: '/hello', title: 'Greeting', content: 'Hi there! 👋 Thanks for reaching out. How can I help you today?' },
  { shortcut: '/thanks', title: 'Thank you', content: 'Thank you for contacting us! Is there anything else I can help you with?' },
  { shortcut: '/wait', title: 'Please wait', content: 'Let me look into this for you. Please give me a moment.' },
  { shortcut: '/bye', title: 'Goodbye', content: 'Thank you for chatting with us! Have a wonderful day! 😊' },
  { shortcut: '/price', title: 'Pricing info', content: 'Great question! You can find our latest pricing information at our pricing page. Would you like me to help you choose the right plan?' },
  { shortcut: '/hours', title: 'Business hours', content: 'Our support team is available Monday to Friday, 9 AM to 5 PM. Outside these hours, our AI assistant is here to help!' },
  { shortcut: '/transfer', title: 'Transfer', content: 'I\'ll connect you with a specialist who can better assist you. Please hold on for a moment.' },
  { shortcut: '/sorry', title: 'Apology', content: 'I\'m sorry for the inconvenience. Let me help resolve this for you right away.' },
];

const EMOJI_LIST = ['😊', '👋', '👍', '❤️', '🎉', '🔥', '💡', '⭐', '✅', '🙏', '😄', '🤔', '💪', '🚀', '📧', '📞', '💬', '🎯', '✨', '🌟'];

interface Message {
  id: string;
  sender_type: 'visitor' | 'agent' | 'ai' | 'system';
  content: string;
  created_at: string;
  ai_confidence?: number;
  tone_applied?: string;
  auto_reply_channel?: string;
  message_type?: string;
  is_internal?: boolean;
  sender_name?: string;
  read_at?: string;
}

interface ConversationDetailProps {
  conversationId: string;
  channel: string;
  visitorName: string;
  visitorEmail?: string;
  visitorPhone?: string;
  agentTakeover: boolean;
  onTakeoverChange?: (takeover: boolean) => void;
  onToggleInfo?: () => void;
  showInfoPanel?: boolean;
}

export function ConversationDetail({
  conversationId,
  channel,
  visitorName,
  visitorEmail,
  visitorPhone,
  agentTakeover,
  onTakeoverChange,
  onToggleInfo,
  showInfoPanel
}: ConversationDetailProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [takingOver, setTakingOver] = useState(false);
  const [showCannedResponses, setShowCannedResponses] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [cannedFilter, setCannedFilter] = useState('');
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [showZendeskModal, setShowZendeskModal] = useState(false);
  const [showProductDir, setShowProductDir] = useState(false);
  const [showAiTools, setShowAiTools] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const ch = CHANNEL_CONFIG[channel] || CHANNEL_CONFIG.web;
  const ChannelIcon = ch.icon;

  const loadMessages = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/inbox/conversations/${conversationId}`);
      const data = res.data || res;
      const msgs = data.messages || data.data?.messages || [];
      setMessages(msgs);

      // Mark as read
      try {
        await apiFetch(`/api/inbox/conversations/${conversationId}/read`, { method: 'POST' });
      } catch (_) {}
    } catch (e) {
      console.error('Failed to load messages:', e);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  // Poll for new messages
  useEffect(() => {
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTakeover = async () => {
    setTakingOver(true);
    try {
      await apiFetch(`/api/channels/conversations/${conversationId}/takeover`, { method: 'POST' });
      onTakeoverChange?.(true);
      loadMessages(); // Refresh to show system message
    } catch (e) {
      console.error('Takeover failed:', e);
    } finally {
      setTakingOver(false);
    }
  };

  const handleRelease = async () => {
    setTakingOver(true);
    try {
      await apiFetch(`/api/channels/conversations/${conversationId}/release`, { method: 'POST' });
      onTakeoverChange?.(false);
      loadMessages();
    } catch (e) {
      console.error('Release failed:', e);
    } finally {
      setTakingOver(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await apiFetch(`/api/inbox/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: replyText, sender_type: 'agent' }),
      });
      setReplyText('');
      loadMessages();
    } catch (e) {
      console.error('Send failed:', e);
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (value: string) => {
    setReplyText(value);
    // Show canned responses when typing /
    if (value.startsWith('/')) {
      setShowCannedResponses(true);
      setCannedFilter(value.slice(1).toLowerCase());
    } else {
      setShowCannedResponses(false);
    }
  };

  const insertCannedResponse = (content: string) => {
    setReplyText(content);
    setShowCannedResponses(false);
    inputRef.current?.focus();
  };

  const insertEmoji = (emoji: string) => {
    setReplyText(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const filteredCanned = CANNED_RESPONSES.filter(c =>
    !cannedFilter || c.shortcut.toLowerCase().includes(cannedFilter) || c.title.toLowerCase().includes(cannedFilter)
  );

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-full">
    <div className="flex flex-col h-full flex-1 min-w-0">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className={cn("w-9 h-9 rounded-full flex items-center justify-center", ch.bg)}>
            <ChannelIcon size={16} className={ch.color} />
          </div>
          <div>
            <h3 className="text-white font-medium text-sm">{visitorName || 'Visitor'}</h3>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500">{ch.label}</span>
              <span className="w-1 h-1 rounded-full bg-zinc-700" />
              <span className="text-[11px] text-zinc-500">{messages.length} messages</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {agentTakeover ? (
            <Button
              onClick={handleRelease}
              disabled={takingOver}
              className="bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/30 text-xs px-3 py-1 h-8"
            >
              <ArrowRightLeft size={14} className="mr-1.5" />
              {takingOver ? 'Releasing...' : 'Release to AI'}
            </Button>
          ) : (
            <Button
              onClick={handleTakeover}
              disabled={takingOver}
              className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 text-xs px-3 py-1 h-8"
            >
              <UserCheck size={14} className="mr-1.5" />
              {takingOver ? 'Taking over...' : 'Take Over'}
            </Button>
          )}

          <button
            onClick={onToggleInfo}
            className={cn(
              "p-2 rounded-lg transition-colors",
              showInfoPanel ? "bg-blue-500/10 text-blue-400" : "text-zinc-500 hover:text-white hover:bg-white/5"
            )}
            title="Visitor details"
          >
            <User size={16} />
          </button>

          {/* Product Directory toggle */}
          <button
            onClick={() => setShowProductDir(!showProductDir)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              showProductDir ? "bg-green-500/10 text-green-400" : "text-zinc-500 hover:text-white hover:bg-white/5"
            )}
            title="Product Directory"
          >
            <ShoppingBag size={16} />
          </button>

          {/* Create Zendesk Ticket — bottom-right context button */}
          <button
            onClick={() => setShowZendeskModal(true)}
            className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
            title="Create Zendesk Ticket"
          >
            <Ticket size={16} />
          </button>

          {/* Three-dots actions menu */}
          <ConversationActionsMenu
            conversationId={conversationId}
            visitorName={visitorName}
            visitorEmail={visitorEmail}
            visitorPhone={visitorPhone}
            channel={channel}
            onAction={(action) => {
              if (action === 'zendesk_ticket') setShowZendeskModal(true);
            }}
          />
        </div>
      </div>

      {/* ─── Messages ─── */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
              <MessageSquare size={20} className="text-zinc-600" />
            </div>
            <p className="text-zinc-500 text-sm">No messages yet</p>
            <p className="text-zinc-600 text-xs">Start the conversation by sending a message</p>
          </div>
        ) : (
          <>
            {/* Date separator for first message */}
            {messages.length > 0 && (
              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[10px] text-zinc-600 font-medium">
                  {new Date(messages[0].created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
                <div className="flex-1 h-px bg-white/5" />
              </div>
            )}
            {messages.map((msg, idx) => {
              // Insert date separator between messages on different days
              const showDateSep = idx > 0 && new Date(msg.created_at).toDateString() !== new Date(messages[idx - 1].created_at).toDateString();

              return (
                <div key={msg.id}>
                  {showDateSep && (
                    <div className="flex items-center gap-3 py-2 my-2">
                      <div className="flex-1 h-px bg-white/5" />
                      <span className="text-[10px] text-zinc-600 font-medium">
                        {new Date(msg.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </span>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "flex group",
                      msg.sender_type === 'visitor' ? "justify-start" : "justify-end",
                      msg.sender_type === 'system' && "justify-center"
                    )}
                    onMouseEnter={() => setHoveredMessage(msg.id)}
                    onMouseLeave={() => setHoveredMessage(null)}
                  >
                    {msg.sender_type === 'system' ? (
                      <div className="flex items-center gap-2 text-[11px] text-zinc-600 bg-zinc-900/50 px-4 py-1.5 rounded-full border border-white/5">
                        <Zap size={10} />
                        {msg.content}
                      </div>
                    ) : msg.is_internal ? (
                      <div className="max-w-[70%] rounded-xl px-4 py-2.5 bg-yellow-500/5 border border-yellow-500/20 border-dashed">
                        <div className="flex items-center gap-1.5 mb-1">
                          <FileText size={11} className="text-yellow-500" />
                          <span className="text-[10px] font-medium text-yellow-500">Internal Note</span>
                        </div>
                        <p className="text-sm text-yellow-200/80 whitespace-pre-wrap">{msg.content}</p>
                        <span className="text-[10px] text-yellow-500/40 mt-1 block text-right">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    ) : (
                      <div className="relative max-w-[70%]">
                        {/* Hover actions */}
                        {hoveredMessage === msg.id && msg.sender_type !== 'visitor' && (
                          <div className="absolute -top-3 right-0 flex items-center gap-0.5 bg-zinc-800 border border-white/10 rounded-lg px-1 py-0.5 shadow-lg z-10">
                            <button
                              onClick={() => copyMessage(msg.content)}
                              className="p-1 text-zinc-400 hover:text-white rounded transition-colors"
                              title="Copy"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                        )}

                        <div className={cn(
                          "rounded-2xl px-4 py-2.5",
                          msg.sender_type === 'visitor'
                            ? "bg-zinc-800/80 text-white rounded-bl-md"
                            : msg.sender_type === 'ai'
                              ? "bg-gradient-to-br from-blue-600/20 to-indigo-600/10 text-blue-50 border border-blue-500/20 rounded-br-md"
                              : "bg-blue-600 text-white rounded-br-md"
                        )}>
                          {/* Sender label */}
                          <div className="flex items-center gap-1.5 mb-1">
                            {msg.sender_type === 'visitor' && (
                              <div className="w-4 h-4 rounded-full bg-zinc-700 flex items-center justify-center">
                                <User size={9} className="text-zinc-400" />
                              </div>
                            )}
                            {msg.sender_type === 'ai' && <Bot size={12} className="text-blue-400" />}
                            {msg.sender_type === 'agent' && <UserCheck size={12} className="text-blue-200" />}
                            <span className="text-[10px] font-medium opacity-70">
                              {msg.sender_type === 'visitor' ? visitorName || 'Visitor'
                                : msg.sender_type === 'ai' ? 'Lyro AI'
                                : msg.sender_name || 'Agent'}
                            </span>
                            {msg.ai_confidence != null && (
                              <span className="text-[10px] opacity-40 ml-1">
                                {Math.round(msg.ai_confidence * 100)}% confident
                              </span>
                            )}
                          </div>

                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                          <div className="flex items-center justify-end gap-1.5 mt-1">
                            <span className="text-[10px] opacity-40">
                              {formatTime(msg.created_at)}
                            </span>
                            {msg.auto_reply_channel && (
                              <span className="text-[10px] opacity-30">via {msg.auto_reply_channel}</span>
                            )}
                            {msg.sender_type === 'agent' && msg.read_at && (
                              <CheckCheck size={11} className="text-blue-400 opacity-60" />
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ─── Reply Input ─── */}
      <div className="px-4 py-3 border-t border-white/5 relative">
        {/* Channel indicator badge */}
        {channel && channel !== 'web' && (
          <div className="flex items-center gap-1.5 mb-2 px-2">
            <ChannelIcon size={12} className={ch.color} />
            <span className="text-[11px] text-zinc-500">Replying via <span className={cn("font-medium", ch.color)}>{ch.label}</span></span>
          </div>
        )}

        {/* WhatsApp 24h reply window warning */}
        {channel === 'whatsapp' && messages.length > 0 && (() => {
          const lastVisitorMsg = [...messages].reverse().find(m => m.sender_type === 'visitor');
          if (lastVisitorMsg) {
            const hoursSince = (Date.now() - new Date(lastVisitorMsg.created_at).getTime()) / 3600000;
            if (hoursSince > 24) {
              return (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                  <AlertCircle size={14} className="text-orange-400 flex-shrink-0" />
                  <span className="text-xs text-orange-400">24-hour WhatsApp reply window has expired. The visitor may not receive your message.</span>
                </div>
              );
            }
          }
          return null;
        })()}

        {!agentTakeover && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <Bot size={14} className="text-blue-400 flex-shrink-0" />
            <span className="text-xs text-blue-400">Lyro AI is auto-replying to this conversation.</span>
            <button
              onClick={handleTakeover}
              className="ml-auto text-xs text-blue-400 hover:text-blue-300 font-medium underline underline-offset-2 flex-shrink-0"
            >
              Take over
            </button>
          </div>
        )}

        {/* Canned Response Dropdown */}
        {showCannedResponses && agentTakeover && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-20">
            <div className="p-2 border-b border-white/5">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider px-2">Canned Responses</span>
            </div>
            {filteredCanned.map((cr, idx) => (
              <button
                key={idx}
                onClick={() => insertCannedResponse(cr.content)}
                className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <code className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">{cr.shortcut}</code>
                  <span className="text-xs text-zinc-300 font-medium">{cr.title}</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1 line-clamp-1">{cr.content}</p>
              </button>
            ))}
            {filteredCanned.length === 0 && (
              <p className="text-xs text-zinc-600 px-4 py-3">No matching responses</p>
            )}
          </div>
        )}

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="absolute bottom-full left-4 mb-2 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl p-3 z-20">
            <div className="grid grid-cols-10 gap-1">
              {EMOJI_LIST.map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => insertEmoji(emoji)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className={cn(
          "flex flex-col rounded-xl border transition-colors",
          agentTakeover ? "bg-[#161920] border-zinc-700 focus-within:border-blue-500" : "bg-zinc-900/50 border-zinc-800"
        )}>
          <textarea
            ref={inputRef}
            value={replyText}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendReply();
              }
              if (e.key === 'Escape') {
                setShowCannedResponses(false);
                setShowEmojiPicker(false);
              }
            }}
            placeholder={agentTakeover ? "Type your reply... (use / for canned responses)" : "Take over to reply manually"}
            disabled={!agentTakeover}
            rows={2}
            className={cn(
              "w-full bg-transparent py-3 px-4 text-sm text-white focus:outline-none placeholder:text-zinc-600 resize-none",
              !agentTakeover && "opacity-50 cursor-not-allowed"
            )}
          />

          {/* Toolbar */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-white/5">
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowCannedResponses(false);
                }}
                disabled={!agentTakeover}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  agentTakeover ? "text-zinc-500 hover:text-white hover:bg-white/5" : "text-zinc-700 cursor-not-allowed"
                )}
                title="Emoji"
              >
                <Smile size={16} />
              </button>
              <button
                disabled={!agentTakeover}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  agentTakeover ? "text-zinc-500 hover:text-white hover:bg-white/5" : "text-zinc-700 cursor-not-allowed"
                )}
                title="Attach file"
              >
                <Paperclip size={16} />
              </button>
              <button
                onClick={() => {
                  setShowCannedResponses(!showCannedResponses);
                  setShowEmojiPicker(false);
                  setShowAiTools(false);
                  setCannedFilter('');
                }}
                disabled={!agentTakeover}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  agentTakeover ? "text-zinc-500 hover:text-white hover:bg-white/5" : "text-zinc-700 cursor-not-allowed"
                )}
                title="Canned responses"
              >
                <Zap size={16} />
              </button>
              {/* AI Tools */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowAiTools(!showAiTools);
                    setShowEmojiPicker(false);
                    setShowCannedResponses(false);
                  }}
                  disabled={!agentTakeover || !replyText.trim()}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    agentTakeover && replyText.trim() ? "text-purple-400 hover:text-purple-300 hover:bg-purple-500/10" : "text-zinc-700 cursor-not-allowed"
                  )}
                  title="AI Tools"
                >
                  <Wand2 size={16} />
                </button>
                {showAiTools && (
                  <div className="absolute bottom-full left-0 mb-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl py-1 z-30">
                    <div className="px-3 py-1.5 border-b border-white/5">
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">AI Rewrite</span>
                    </div>
                    {[
                      { label: 'Rewrite', desc: 'Rephrase your message' },
                      { label: 'Elaborate', desc: 'Add more detail' },
                      { label: 'Shorten', desc: 'Make it concise' },
                      { label: 'Formalize', desc: 'Professional tone' },
                    ].map((tool) => (
                      <button
                        key={tool.label}
                        onClick={() => {
                          setShowAiTools(false);
                          // Placeholder: in production this calls an AI API
                          const prefix = `[${tool.label}] `;
                          setReplyText(prefix + replyText);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors"
                      >
                        <span className="text-xs text-zinc-300 font-medium">{tool.label}</span>
                        <p className="text-[10px] text-zinc-600">{tool.desc}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-600">
                {replyText.length > 0 && `${replyText.length} chars`}
              </span>
              <Button
                onClick={handleSendReply}
                disabled={!agentTakeover || sending || !replyText.trim()}
                className={cn(
                  "h-8 px-4 flex items-center gap-1.5 rounded-lg text-xs font-medium transition-all",
                  replyText.trim() && agentTakeover
                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                    : "bg-zinc-800 text-zinc-600"
                )}
              >
                <Send size={13} />
                {sending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Product Directory Panel (right side) */}
    <ProductDirectory
      open={showProductDir}
      onClose={() => setShowProductDir(false)}
      onSendProduct={async (product) => {
        // Send product card as a message
        try {
          await apiFetch(`/api/inbox/conversations/${conversationId}/messages`, {
            method: 'POST',
            body: JSON.stringify({
              content: `🛍️ ${product.title}\n💰 ${product.currency || '$'}${product.price}\n${product.handle ? `🔗 View product` : ''}`,
              sender_type: 'agent',
              message_type: 'product_card',
            }),
          });
          loadMessages();
        } catch (e) {
          console.error('Failed to send product:', e);
        }
      }}
    />

    {/* Zendesk Ticket Modal */}
    <ZendeskTicketModal
      open={showZendeskModal}
      conversationId={conversationId}
      visitorName={visitorName}
      visitorEmail={visitorEmail}
      messages={messages}
      onClose={() => setShowZendeskModal(false)}
      onCreated={() => loadMessages()}
    />
    </div>
  );
}
