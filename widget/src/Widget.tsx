import React, { useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { io, Socket } from 'socket.io-client';
import './styles.css';

interface WidgetConfig {
  primaryColor: string;
  textColor: string;
  backgroundColor: string;
  position: 'bottom-right' | 'bottom-left';
  welcomeMessage: string;
  offlineMessage: string;
  inputPlaceholder: string;
  agentName: string;
  agentAvatarUrl: string;
  showAgentPhoto: boolean;
  showTypingIndicator: boolean;
  collectEmailBeforeChat: boolean;
}

interface Message {
  id: string;
  content: string;
  sender_type: 'visitor' | 'agent' | 'ai' | 'system';
  created_at: string;
}

const Widget: React.FC<{ workspaceId: string; config: WidgetConfig }> = ({
  workspaceId,
  config,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [visitorInfo, setVisitorInfo] = useState({ name: '', email: '' });
  const [showPreChatForm, setShowPreChatForm] = useState(config.collectEmailBeforeChat);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate visitor ID
    let visitorId = localStorage.getItem('forefront_visitor_id');
    if (!visitorId) {
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('forefront_visitor_id', visitorId);
    }

    // Connect to socket
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      auth: { workspaceId, visitorId },
    });

    newSocket.on('connect', () => {
      console.log('Widget connected');
    });

    newSocket.on('new_message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
      if (message.sender_type !== 'visitor') {
        setIsTyping(false);
      }
    });

    newSocket.on('typing_indicator', (data: { isTyping: boolean }) => {
      setIsTyping(data.isTyping);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [workspaceId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const startConversation = () => {
    if (!socket) return;

    // Create conversation
    socket.emit('start_conversation', {
      visitorId: localStorage.getItem('forefront_visitor_id'),
      visitorName: visitorInfo.name,
      visitorEmail: visitorInfo.email,
    });

    socket.once('conversation_created', (data: { conversationId: string }) => {
      setConversationId(data.conversationId);
      setShowPreChatForm(false);
      
      // Add welcome message
      setMessages([
        {
          id: 'welcome',
          content: config.welcomeMessage,
          sender_type: 'agent',
          created_at: new Date().toISOString(),
        },
      ]);
    });
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !socket || !conversationId) return;

    socket.emit('send_message', {
      conversationId,
      content: newMessage,
      senderType: 'visitor',
    });

    setNewMessage('');
  };

  const handleTyping = () => {
    if (!socket || !conversationId) return;
    socket.emit('typing_start', { conversationId, userType: 'visitor' });
  };

  return (
    <div className={`forefront-widget ${config.position} ${isOpen ? 'open' : ''}`}>
      {/* Chat Bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="chat-bubble"
          style={{ backgroundColor: config.primaryColor }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window" style={{ backgroundColor: config.backgroundColor }}>
          {/* Header */}
          <div
            className="chat-header"
            style={{ backgroundColor: config.primaryColor, color: config.textColor }}
          >
            <div className="header-content">
              {config.showAgentPhoto && (
                <img
                  src={config.agentAvatarUrl || '/default-avatar.png'}
                  alt={config.agentName}
                  className="agent-avatar"
                />
              )}
              <div className="agent-info">
                <h3>{config.agentName}</h3>
                <span className="status">Online</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="close-btn">
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="messages-container">
            {showPreChatForm ? (
              <div className="pre-chat-form">
                <p>Please provide your information to start chatting:</p>
                <input
                  type="text"
                  placeholder="Your name"
                  value={visitorInfo.name}
                  onChange={(e) => setVisitorInfo({ ...visitorInfo, name: e.target.value })}
                  className="form-input"
                />
                <input
                  type="email"
                  placeholder="Your email"
                  value={visitorInfo.email}
                  onChange={(e) => setVisitorInfo({ ...visitorInfo, email: e.target.value })}
                  className="form-input"
                />
                <button
                  onClick={startConversation}
                  className="start-chat-btn"
                  style={{ backgroundColor: config.primaryColor, color: config.textColor }}
                >
                  Start Chat
                </button>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message ${message.sender_type === 'visitor' ? 'visitor' : 'agent'}`}
                  >
                    <div
                      className="message-bubble"
                      style={
                        message.sender_type === 'visitor'
                          ? { backgroundColor: config.primaryColor, color: config.textColor }
                          : {}
                      }
                    >
                      {message.content}
                    </div>
                  </div>
                ))}

                {isTyping && config.showTypingIndicator && (
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          {!showPreChatForm && (
            <div className="input-container">
              <input
                type="text"
                placeholder={config.inputPlaceholder}
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="message-input"
              />
              <button
                onClick={sendMessage}
                className="send-btn"
                style={{ backgroundColor: config.primaryColor, color: config.textColor }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Widget loader
(window as any).ForefrontWidget = {
  init: ({ workspaceId }: { workspaceId: string }) => {
    // Fetch widget config
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/widget/config/${workspaceId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const config = data.data;
          
          // Create container
          const container = document.createElement('div');
          container.id = 'forefront-widget-container';
          document.body.appendChild(container);
          
          // Mount React
          const root = createRoot(container);
          root.render(<Widget workspaceId={workspaceId} config={config} />);
        }
      })
      .catch((err) => console.error('Failed to load widget:', err));
  },
};
