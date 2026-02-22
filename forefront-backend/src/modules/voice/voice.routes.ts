import { FastifyInstance } from 'fastify';
import { sarvamClient } from '../../services/SarvamClient.js';
import { z } from 'zod';

// Zod schemas for validation
const TTSSchema = z.object({
    text: z.string().min(1),
    language_code: z.string().default('hi-IN'), // Default to Hindi
    speaker: z.string().default('meera')
});

export const voiceRoutes = async (fastify: FastifyInstance) => {

    // POST /voice/stt - Speech to Text
    // Expects multipart/form-data with 'file' field
    fastify.post('/stt', async (request: any, reply: any) => {
        try {
            const data = await request.file();
            if (!data) {
                return reply.status(400).send({ error: "No audio file uploaded" });
            }

            // Convert stream to buffer
            const buffer = await data.toBuffer();
            const transcription: any = await sarvamClient.speechToText(buffer);
            return { transcript: transcription.transcript };
        } catch (error: any) {
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
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({ error: error.message || "TTS failed" });
        }
    });
};
