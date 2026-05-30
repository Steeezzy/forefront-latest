
import { sarvamClient } from '../src/services/SarvamClient.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testSarvam() {
    console.log("🚀 Testing Sarvam AI Integration...\n");

    // 1. Language Identification (Mocked/Future)
    // 2. Translation
    console.log("Testing Translation...");
    try {
        const translated = await sarvamClient.translate("Hello, how are you?", "en-IN", "hi-IN");
        console.log(`✅ [Translation] "Hello, how are you?" -> "${translated}"`);
    } catch (e: any) {
        console.error("❌ [Translation] Failed:", e.message);
    }

    // 3. TTS
    console.log("\nTesting TTS...");
    try {
        const audioBase64 = await sarvamClient.textToSpeech("नमस्ते, मैं आपकी कैसे मदद कर सकता हूँ?", "hi-IN");
        if (audioBase64) {
            console.log(`✅ [TTS] Generated audio (${audioBase64.length} chars base64)`);
        }
    } catch (e: any) {
        console.error("❌ [TTS] Failed:", e.message);
    }

    // 4. Chat
    console.log("\nTesting Chat...");
    try {
        const response: any = await sarvamClient.chatCompletion([
            { role: "user", content: "What is the capital of India?" }
        ]);
        console.log(`✅ [Chat] Response: "${response.choices[0].message.content}"`);
    } catch (e: any) {
        console.error("❌ [Chat] Failed:", e.message);
    }

    // 5. STT (Need a dummy file)
    console.log("\nTesting STT (with dummy buffer)...");
    try {
        // Create a small empty buffer just to hit the endpoint
        const dummyBuffer = Buffer.from("RIFF....WAVEfmt ....data....", "binary");
        await sarvamClient.speechToText(dummyBuffer);
        console.log("✅ [STT] Request sent (result might be invalid audio error, which is good)");
    } catch (e: any) {
        console.log(`ℹ️ [STT] Result: ${e.message}`);
    }
}

testSarvam();
