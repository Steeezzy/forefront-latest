import app from './app.js';

const PORT = process.env.PORT || 3001;

import { SocketServer } from './sockets/socket.server.js';

const start = async () => {
    try {
        await app.ready();
        new SocketServer(app.server);

        await app.listen({ port: Number(PORT), host: '0.0.0.0' });
        console.log(`Server running at http://localhost:${PORT}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
