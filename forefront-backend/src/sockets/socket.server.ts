import { Server as SocketIOServer, Socket } from 'socket.io';
import type { Server as HttpServer } from 'http';
import crypto from 'crypto';
import { verifyToken } from '../utils/jwt.js';
import { ChatService } from '../modules/chat/chat.service.js';
import { AIService } from '../modules/ai/ai.service.js';
import { UsageService } from '../modules/usage/usage.service.js';

export class SocketServer {
    private io: SocketIOServer;
    private chatService: ChatService;
    private aiService: AIService;
    private usageService: UsageService;

    constructor(server: HttpServer) {
        this.chatService = new ChatService();
        this.aiService = new AIService();
        this.usageService = new UsageService();
        this.io = new SocketIOServer(server, {
            cors: {
                origin: '*', // Allow all for dev
                methods: ['GET', 'POST']
            }
        });

        this.io.on('connection', (socket) => this.handleConnection(socket));
    }

    private handleConnection(socket: Socket) {
        console.log(`Socket connected: ${socket.id}`);

        // Auth Middleware for sockets (optional for visitors initially, required for agents)
        const token = socket.handshake.auth.token;
        if (token) {
            const decoded = verifyToken(token);
            if (decoded && typeof decoded !== 'string' && 'userId' in decoded) {
                socket.data.user = decoded;
                console.log(`Socket authenticated: ${socket.id} for user ${decoded.userId}`);
            }
        }

        socket.on('join_room', (room: string) => {
            console.log(`Socket ${socket.id} joining room ${room}`);
            socket.join(room);
        });

        socket.on('send_message', async (data: { conversationId: string, content: string, senderType: 'visitor' | 'agent' }) => {
            try {
                console.log(`Received message in room ${data.conversationId}:`, data);

                // 1. Save to DB
                const message = await this.chatService.addMessage({
                    conversationId: data.conversationId,
                    content: data.content,
                    senderType: data.senderType
                });

                // 2. Emit to Room
                this.io.to(data.conversationId).emit('new_message', message);

                // 3. AI Trigger (Phase 5)
                if (data.senderType === 'visitor') {
                    // Fetch conversation to get workspaceId
                    const conversation = await this.chatService.getConversationById(data.conversationId);

                    if (conversation) {
                        // INCREMENT USAGE (Phase 7)
                        await this.usageService.incrementMessageCount(conversation.workspace_id);

                        this.aiService.generateResponse(data.conversationId, conversation.workspace_id)
                        // Check Usage Limit (Phase 6)
                        const limitReached = await this.usageService.checkLimit(conversation.workspace_id);
                        if (limitReached) {
                            console.log(`Usage limit reached for workspace ${conversation.workspace_id}. AI response blocked.`);
                            this.io.to(data.conversationId).emit('new_message', {
                                id: crypto.randomUUID(),
                                conversation_id: data.conversationId,
                                sender_type: 'system', // or ai
                                content: 'Usage limit reached. Please upgrade your plan.',
                                created_at: new Date()
                            });
                            return;
                        }

                        this.aiService.generateResponse(data.conversationId, conversation.workspace_id)
                            .then(aiMsg => {
                                if (aiMsg) {
                                    this.io.to(data.conversationId).emit('new_message', aiMsg);
                                }
                            })
                            .catch(err => console.error('AI Generation failed', err));
                    } else {
                        console.error('Conversation not found for AI trigger:', data.conversationId);
                    }
                }

            } catch (e) {
                console.error('Error sending message:', e);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    }
}
