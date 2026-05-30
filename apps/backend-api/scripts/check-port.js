import net from 'net';
const client = new net.Socket();

console.log("Checking port 3001...");
const timeout = setTimeout(() => {
    console.log("Timeout connecting to 3001");
    client.destroy();
    process.exit(1);
}, 2000);

client.connect(3001, '127.0.0.1', () => {
    console.log('Port 3001 is OPEN (Server is running)');
    clearTimeout(timeout);
    client.destroy();
});

client.on('error', (err) => {
    console.log('Port 3001 CLOSED or ERROR:', err.message);
    clearTimeout(timeout);
    process.exit(1);
});
