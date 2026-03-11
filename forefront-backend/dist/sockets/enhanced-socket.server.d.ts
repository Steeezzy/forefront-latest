import type { Server as HttpServer } from 'http';
export declare class EnhancedSocketServer {
    private io;
    private chatService;
    private inboxService;
    private visitorService;
    private enhancedRAG;
    private usageService;
    private onlineAgents;
    constructor(server: HttpServer);
    private handleConnection;
    private addOnlineAgent;
    private removeOnlineAgent;
    getOnlineAgents(workspaceId: string): string[];
}
export declare const createSocketServer: (server: HttpServer) => EnhancedSocketServer;
//# sourceMappingURL=enhanced-socket.server.d.ts.map