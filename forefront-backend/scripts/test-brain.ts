import { io } from "socket.io-client";

// CONFIGURATION
const SERVER_URL = "http://localhost:3001"; // Default backend port is 3001 in server.ts
const WORKSPACE_ID = "6820b0dc-e53c-49fe-813d-b361272bf572";
const CONVERSATION_ID = "41cbcbac-807a-4a15-81f8-b61a160f8cae";

console.log(`🤖 Initializing Forefront Brain Test...`);
console.log(`🎯 Target: ${SERVER_URL}`);
console.log(`🆔 Conversation: ${CONVERSATION_ID}\n`);

const socket = io(SERVER_URL, {
    transports: ["websocket"],
    auth: {
        workspaceId: WORKSPACE_ID,
    },
});

let startTime = 0;

socket.on("connect", () => {
    console.log("✅ Socket Connected! ID:", socket.id);

    // 1. JOIN ROOM (This matches socket.server.ts: socket.on('join_room', ...))
    socket.emit("join_room", CONVERSATION_ID);

    // 2. SEND A MESSAGE (The RAG Trigger)
    const testQuestion = "What is your refund policy?";
    console.log(`\n📤 Sending Question: "${testQuestion}"`);
    console.log(`⏳ Waiting for Brain to think...`);

    startTime = Date.now();

    // Matches socket.server.ts: socket.on('send_message', ...)
    socket.emit("send_message", {
        conversationId: CONVERSATION_ID,
        content: testQuestion,
        senderType: 'visitor'
    });
});

// Matches socket.server.ts: this.io.to(data.conversationId).emit('new_message', message);
socket.on("new_message", (data: any) => {
    const duration = Date.now() - startTime;

    if (data.sender_type === "ai") {
        console.log(`\n🧠 AI RESPONSE (${duration}ms):`);
        console.log("------------------------------------------------");
        console.log(data.content);
        console.log("------------------------------------------------");

        console.log("\n✅ Test Passed. Closing connection.");
        socket.disconnect();
        process.exit(0);
    } else if (data.sender_type === "visitor") {
        console.log(`\n✅ Visitor message acknowledged.`);
    }
});

socket.on("error", (err) => {
    console.error("❌ Socket Error:", err);
    process.exit(1);
});

// Timeout Safety
setTimeout(() => {
    console.error("\n❌ Timeout: AI took too long (>10s) to reply.");
    process.exit(1);
}, 60000);
