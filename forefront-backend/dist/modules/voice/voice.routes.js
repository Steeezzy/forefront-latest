import { sarvamClient } from '../../services/SarvamClient.js';
import { z } from 'zod';
// Zod schemas for validation
const TTSSchema = z.object({
    text: z.string().min(1),
    language_code: z.string().default('hi-IN'), // Default to Hindi
    speaker: z.string().default('meera')
});
export const voiceRoutes = async (fastify) => {
    // POST /voice/stt - Speech to Text
    // Expects multipart/form-data with 'file' field
    fastify.post('/stt', async (request, reply) => {
        try {
            const data = await request.file();
            if (!data) {
                return reply.status(400).send({ error: "No audio file uploaded" });
            }
            // Convert stream to buffer
            const buffer = await data.toBuffer();
            // Get language if provided in fields, else default
            // multipart fields are accessible via data.fields if using @fastify/multipart 
            // BUT request.file() returns a single file. 
            // Let's assume the language code is passed as a query param or we just default for now to keep it simple
            // OR checks parts.
            // For simplicity in this iteration: default to 'hi-IN' or 'en-IN' (handled in SarvamClient default)
            // If we need dynamic language, we'd need to parse fields.
            const transcription = await sarvamClient.speechToText(buffer);
            return { transcript: transcription.transcript };
        }
        catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: error.message || "STT failed" });
        }
    });
    // POST /voice/tts - Text to Speech
    fastify.post('/tts', async (request, reply) => {
        try {
            const body = TTSSchema.parse(request.body);
            const audioBase64 = await sarvamClient.textToSpeech(body.text, body.language_code, body.speaker);
            return { audio: audioBase64 };
        }
        catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: error.message || "TTS failed" });
        }
    });
};
