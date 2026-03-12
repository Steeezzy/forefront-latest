import { OpenAI } from 'openai';
import { env } from '../config/env.js';

let openai: OpenAI | null = null;

export const generateEmbedding = async (text: string): Promise<number[]> => {
    try {
        if (!openai) {
            if (!env.OPENAI_API_KEY) {
                throw new Error("OPENAI_API_KEY is missing from environment variables");
            }
            openai = new OpenAI({
                apiKey: env.OPENAI_API_KEY
            });
        }

        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text.replace(/\n/g, ' '),
        });

        return response.data[0].embedding;
    } catch (error: any) {
        console.error("Error generating embedding with OpenAI:", error.message);
        throw error;
    }
};
