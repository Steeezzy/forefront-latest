import Groq from 'groq-sdk';
import { env } from '../config/env.js';

const groq = new Groq({ 
  apiKey: env.GROQ_API_KEY || '' 
});

/**
 * Generate a chat completion using Groq (Free Tier)
 * Primarily used for fast, cost-effective processing and as a fallback
 */
export async function generateAnswer(prompt: string): Promise<string> {
  try {
    const response = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024
    });
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Groq API Error:', error);
    throw error;
  }
}

/**
 * Chat Completion using Groq (OpenAI-compatible messages)
 */
export async function groqChatCompletion(messages: any[]) {
    return groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages,
        max_tokens: 1024
    });
}
