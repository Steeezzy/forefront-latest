console.log('server.ts: Start of file');
import app from './app.js';
console.log('server.ts: Imported app');
import multipart from '@fastify/multipart';
console.log('server.ts: Imported multipart');
const PORT = process.env.PORT || 3001;
import { EnhancedSocketServer } from './sockets/enhanced-socket.server.js';
console.log('server.ts: Imported EnhancedSocketServer');
// Migration runner will be called separately or handled by deployment
const start = async () => {
    try {
        // Debug: Log all incoming requests
        // app.addHook('onRequest', async (request, reply) => {
        //     console.log(`[REQUEST] ${request.method} ${request.url} from ${request.ip}`);
        // });
        console.log('Registering multipart...');
        await app.register(multipart);
        console.log('Multipart registered.');
        console.log('App ready...');
        await app.ready();
        console.log('App is ready.');
        // Initialize enhanced socket server
        console.log('Initializing Socket Server...');
        new EnhancedSocketServer(app.server);
        console.log('Socket Server initialized.');
        // Listen on 0.0.0.0 to support 127.0.0.1 explicitly
        console.log('Starting server listen...');
        await app.listen({ port: Number(PORT), host: '0.0.0.0' });
        console.log(`Server running at http://localhost:${PORT}`);
    }
    catch (err) {
        console.error('Startup error:', err);
        process.exit(1);
    }
};
start();
