import OpenAI from 'openai';
import { env } from '../config/env.js';

let openai: OpenAI | null = null;

function getOpenAIClient() {
  if (!openai) {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient();
  
  console.log('[Embeddings] Generating embedding via OpenAI...');
  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.replace(/\n/g, ' '),
    dimensions: 1536 // Standard for text-embedding-3-small
  });

  return response.data[0].embedding;
}
