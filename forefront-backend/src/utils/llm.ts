import { callGemini, geminiChatCompletion } from './gemini.js';

export { callGemini, geminiChatCompletion };

/**
 * Legacy wrapper - now uses Gemini
 * @deprecated Use callGemini directly
 */
export async function generateAnswer(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = 1024
): Promise<string> {
  return callGemini(`${systemPrompt}\n\nUser: ${userMessage}`, { maxTokens, temperature: 0.3 });
}
