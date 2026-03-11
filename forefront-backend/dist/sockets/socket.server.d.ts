import type { Server as HttpServer } from 'http';
export declare class SocketServer {
    private io;
    private chatService;
    private aiService;
    private usageService;
    constructor(server: HttpServer);
    private handleConnection;
}
//# sourceMappingURL=socket.server.d.ts.map