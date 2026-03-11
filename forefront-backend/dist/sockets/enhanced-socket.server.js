import { Server as SocketIOServer } from 'socket.io';
import * as crypto from 'crypto';
import { verifyToken } from '../utils/jwt.js';
import { ChatService } from '../modules/chat/chat.service.js';
import { InboxService } from '../modules/inbox/inbox.service.js';
import { VisitorService } from '../modules/visitor/visitor.service.js';
import { EnhancedRAGService } from '../modules/chat/enhanced-rag.service.js';
import { UsageService } from '../modules/usage/usage.service.js';
export class EnhancedSocketServer {
    io;
    chatService;
    inboxService;
    visitorService;
    enhancedRAG;
    usageService;
    onlineAgents = new Map(); // workspaceId -> Set of userIds
    constructor(server) {
        this.chatService = new ChatService();
        this.inboxService = new InboxService();
        this.visitorService = new VisitorService();
        this.enhancedRAG = new EnhancedRAGService();
        this.usageService = new UsageService();
        this.io = new SocketIOServer(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            }
        });
        this.io.on('connection', (socket) => this.handleConnection(socket));
    }
    handleConnection(socket) {
        console.log(`Socket connected: ${socket.id}`);
        // Auth handling
        let token = socket.handshake.auth.token;
        // Fallback securely to HttpOnly Cookie parsed from the connection headers
        if (!token && socket.handshake.headers.cookie) {
            const cookieHeader = socket.handshake.headers.cookie;
            const match = cookieHeader.match(/(?:^|; )token=([^;]*)/);
            if (match && match[1]) {
                token = match[1];
            }
        }
        const workspaceId = socket.handshake.auth.workspaceId;
        const visitorId = socket.handshake.auth.visitorId;
        const isAgent = !!token;
        if (token) {
            const decoded = verifyToken(token);
            if (decoded && typeof decoded !== 'string' && 'userId' in decoded) {
                socket.data.user = decoded;
                socket.data.isAgent = true;
                socket.join(`workspace:${decoded.workspaceId}`);
                socket.join(`user:${decoded.userId}`);
                // Track online agent
                this.addOnlineAgent(decoded.workspaceId, decoded.userId);
                // Broadcast agent online
                this.io.to(`workspace:${decoded.workspaceId}`).emit('agent_online', {
                    userId: decoded.userId,
                    timestamp: new Date(),
                });
                console.log(`Agent authenticated: ${decoded.userId} for workspace ${decoded.workspaceId}`);
            }
        }
        else if (workspaceId) {
            // Visitor connection
            socket.data.workspaceId = workspaceId;
            socket.data.visitorId = visitorId;
            socket.data.isAgent = false;
            socket.join(`workspace:${workspaceId}:visitors`);
            console.log(`Visitor connected: ${visitorId} for workspace ${workspaceId}`);
            // Broadcast visitor online
            this.io.to(`workspace:${workspaceId}`).emit('visitor_online', {
                visitorId,
                timestamp: new Date(),
            });
        }
        // Join conversation room
        socket.on('join_conversation', (conversationId) => {
            socket.join(conversationId);
            console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
        });
        // Leave conversation room
        socket.on('leave_conversation', (conversationId) => {
            socket.leave(conversationId);
            console.log(`Socket ${socket.id} left conversation ${conversationId}`);
        });
        // Send message
        socket.on('send_message', async (data) => {
            try {
                console.log(`Received message in conversation ${data.conversationId}:`, data);
                // Save to DB
                const message = await this.inboxService.addMessage({
                    conversationId: data.conversationId,
                    content: data.content,
                    senderType: data.senderType,
                    senderId: data.senderId,
                    messageType: 'text',
                    isInternal: false,
                });
                // Emit to room
                this.io.to(data.conversationId).emit('new_message', message);
                // Emit to workspace for inbox updates
                const conversation = await this.inboxService.getConversationById(data.conversationId, socket.data.user?.workspaceId || socket.data.workspaceId);
                if (conversation) {
                    this.io.to(`workspace:${conversation.workspace_id}`).emit('conversation_updated', {
                        conversationId: data.conversationId,
                        lastMessage: message,
                        unread: data.senderType === 'visitor',
                    });
                }
                // AI Trigger for visitor messages
                if (data.senderType === 'visitor' && conversation) {
                    await this.usageService.incrementMessageCount(conversation.workspace_id);
                    const limitReached = await this.usageService.checkLimit(conversation.workspace_id);
                    if (limitReached) {
                        this.io.to(data.conversationId).emit('new_message', {
                            id: crypto.randomUUID(),
                            conversation_id: data.conversationId,
                            sender_type: 'system',
                            content: 'Usage limit reached. Please upgrade your plan.',
                            created_at: new Date(),
                        });
                        return;
                    }
                    // Generate AI response
                    this.enhancedRAG.resolveAIResponse(conversation.workspace_id, data.conversationId, data.content, { enableEscalation: true, escalationThreshold: 50 })
                        .then(async (aiResponse) => {
                        if (aiResponse) {
                            // Save AI message
                            const aiMessage = await this.inboxService.addMessage({
                                conversationId: data.conversationId,
                                content: aiResponse.content,
                                senderType: 'ai',
                                messageType: 'text',
                                isInternal: false,
                                metadata: {
                                    confidence: aiResponse.confidence,
                                    sources: aiResponse.sources,
                                    model: aiResponse.model,
                                    tokensUsed: aiResponse.tokensUsed,
                                },
                            });
                            // Emit AI message
                            this.io.to(data.conversationId).emit('new_message', aiMessage);
                            // Handle escalation
                            if (aiResponse.shouldEscalate) {
                                this.io.to(`workspace:${conversation.workspace_id}`).emit('escalation_needed', {
                                    conversationId: data.conversationId,
                                    reason: 'low_confidence',
                                    confidence: aiResponse.confidence,
                                });
                            }
                            // Update conversation with AI response info
                            this.io.to(`workspace:${conversation.workspace_id}`).emit('conversation_updated', {
                                conversationId: data.conversationId,
                                lastMessage: aiMessage,
                            });
                        }
                    })
                        .catch(err => console.error('AI Generation failed', err));
                }
            }
            catch (e) {
                console.error('Error sending message:', e);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });
        // Typing indicators
        socket.on('typing_start', (data) => {
            socket.to(data.conversationId).emit('typing_indicator', {
                conversationId: data.conversationId,
                userType: data.userType,
                isTyping: true,
            });
        });
        socket.on('typing_stop', (data) => {
            socket.to(data.conversationId).emit('typing_indicator', {
                conversationId: data.conversationId,
                userType: data.userType,
                isTyping: false,
            });
        });
        // Mark messages as read
        socket.on('mark_read', async (data) => {
            try {
                if (socket.data.user?.userId) {
                    await this.inboxService.markMessagesAsRead(data.conversationId, socket.data.user.userId);
                    socket.to(data.conversationId).emit('messages_read', {
                        conversationId: data.conversationId,
                        readBy: socket.data.user.userId,
                    });
                }
            }
            catch (e) {
                console.error('Error marking messages as read:', e);
            }
        });
        // Visitor page tracking
        socket.on('visitor_page_view', async (data) => {
            try {
                if (socket.data.workspaceId) {
                    await this.visitorService.trackPageView({
                        visitorId: data.visitorId,
                        pageUrl: data.pageUrl,
                        pageTitle: data.pageTitle,
                        referrer: data.referrer,
                    });
                    // Notify agents
                    this.io.to(`workspace:${socket.data.workspaceId}`).emit('visitor_page_view', {
                        visitorId: data.visitorId,
                        pageUrl: data.pageUrl,
                        pageTitle: data.pageTitle,
                        timestamp: new Date(),
                    });
                }
            }
            catch (e) {
                console.error('Error tracking page view:', e);
            }
        });
        // Get copilot suggestions
        socket.on('get_copilot_suggestions', async (data, callback) => {
            try {
                if (socket.data.user?.workspaceId && socket.data.user?.userId) {
                    const suggestions = await this.enhancedRAG.suggestReplies(data.conversationId, socket.data.user.workspaceId);
                    callback({ success: true, suggestions });
                }
                else {
                    callback({ success: false, error: 'Unauthorized' });
                }
            }
            catch (e) {
                console.error('Error getting copilot suggestions:', e);
                callback({ success: false, error: 'Failed to get suggestions' });
            }
        });
        // Disconnect
        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
            if (socket.data.isAgent && socket.data.user) {
                // Remove from online agents
                this.removeOnlineAgent(socket.data.user.workspaceId, socket.data.user.userId);
                // Broadcast agent offline
                this.io.to(`workspace:${socket.data.user.workspaceId}`).emit('agent_offline', {
                    userId: socket.data.user.userId,
                    timestamp: new Date(),
                });
            }
            else if (socket.data.workspaceId && socket.data.visitorId) {
                // Mark visitor offline
                this.visitorService.setVisitorOffline(socket.data.visitorId);
                this.io.to(`workspace:${socket.data.workspaceId}`).emit('visitor_offline', {
                    visitorId: socket.data.visitorId,
                    timestamp: new Date(),
                });
            }
        });
    }
    addOnlineAgent(workspaceId, userId) {
        if (!this.onlineAgents.has(workspaceId)) {
            this.onlineAgents.set(workspaceId, new Set());
        }
        this.onlineAgents.get(workspaceId).add(userId);
    }
    removeOnlineAgent(workspaceId, userId) {
        const agents = this.onlineAgents.get(workspaceId);
        if (agents) {
            agents.delete(userId);
            if (agents.size === 0) {
                this.onlineAgents.delete(workspaceId);
            }
        }
    }
    getOnlineAgents(workspaceId) {
        return Array.from(this.onlineAgents.get(workspaceId) || []);
    }
}
export const createSocketServer = (server) => {
    return new EnhancedSocketServer(server);
};
//# sourceMappingURL=enhanced-socket.server.js.map