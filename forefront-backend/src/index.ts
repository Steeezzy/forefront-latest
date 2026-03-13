import app from './app.js';

const PORT = process.env.PORT || 10000;

import { SocketServer } from './sockets/socket.server.js';
import { workflowScheduler } from './services/workflow/WorkflowScheduler.js';

const start = async () => {
    try {
        await app.ready();
        new SocketServer(app.server);

        // Start the workflow scheduler (checks for idle conversations/tickets every 60s)
        workflowScheduler.start();

        await app.listen({ port: Number(PORT), host: '0.0.0.0' });
        console.log(`Running on port ${PORT}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGTERM', () => {
    workflowScheduler.stop();
    process.exit(0);
});
process.on('SIGINT', () => {
    workflowScheduler.stop();
    process.exit(0);
});

start();
