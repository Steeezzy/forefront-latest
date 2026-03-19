/**
 * Gemini AI Client - Unified LLM interface
 * Replaces Sarvam and Groq with Google's Gemini (free tier)
 */

/**
 * Sarvam-M LLM Client
 * Primary LLM for Questron AI responses
 */
export async function callSarvam(prompt: string): Promise<string> {
  const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SARVAM_API_KEY}`
    },
    body: JSON.stringify({
      model: 'sarvam-m',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
      temperature: 0.3
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sarvam API error: ${response.status} ${errorText}`);
  }
  
  const data: any = await response.json();

  // Remove thinking process — only keep final answer
  const rawAnswer = data.choices?.[0]?.message?.content || '';
  const cleanAnswer = rawAnswer
    .replace(/<think[\s\S]*?<\/think>/gi, '')  // remove <think> blocks
    .replace(/\*\*/g, '')                         // remove markdown bold
    .trim();

  // If empty after cleaning, use a fallback
  return cleanAnswer || "I couldn't find an answer to that question.";
}

export async function callGemini(
  prompt: string,
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: options.maxTokens || 1024,
          temperature: options.temperature || 0.3
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${error}`);
  }

  const data: any = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}

/**
 * Chat completion using Gemini (OpenAI-compatible interface)
 */
export async function geminiChatCompletion(
  messages: Array<{ role: string; content: string }>,
  options: { temperature?: number; max_tokens?: number } = {}
): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  // Convert OpenAI message format to Gemini format
  const prompt = messages
    .map(m => {
      if (m.role === 'system') return `System: ${m.content}`;
      if (m.role === 'user') return `User: ${m.content}`;
      if (m.role === 'assistant') return `Assistant: ${m.content}`;
      return m.content;
    })
    .join('\n\n');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: options.max_tokens || 1024,
          temperature: options.temperature || 0.7
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${error}`);
  }

  const data: any = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

  return {
    choices: [{ message: { content }, index: 0, role: 'assistant' }],
    model: 'gemini-2.0-flash',
    usage: { total_tokens: content.length / 4 } // Rough estimate
  };
}
