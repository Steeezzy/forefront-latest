import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

socket.on('connect', () => {
    console.log('Connected to server:', socket.id);

    // Join a conversation room (simulating a conversation ID)
    const conversationId = '3120b8f8-01af-4cb6-bcf4-ea41a89b86d3'; // Valid ID from previous step
    // Actually, let's create a conversation first via API to be clean, but for now let's assume one exists or just join a random room.
    // The server doesn't validate room existence for joining, but adding a message requires a valid conversation ID in DB.

    // We need a valid conversation ID. 
    // Let's just try to send a message to a random UUID and see if it fails (it should fail FK constraint)
    // Or we can fetch one first. 

    console.log('Joining room...');
    socket.emit('join_room', conversationId);

    console.log('Sending message...');
    socket.emit('send_message', {
        conversationId: conversationId,
        content: 'Hello from test script!',
        senderType: 'visitor'
    });
});

socket.on('new_message', (msg) => {
    console.log('Received new_message:', msg);
    if (msg.sender_type === 'ai') {
        console.log('AI Response Received! Disconnecting.');
        socket.disconnect();
    }
});

socket.on('error', (err) => {
    console.error('Socket error:', err);
    socket.disconnect();
});
