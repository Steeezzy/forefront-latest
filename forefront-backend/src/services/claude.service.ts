import { env } from '../config/env.js';

export class ClaudeService {
  /**
   * Constructs system prompt from workspace config fields: 
   * business_name, voice_agent_name, chatbot_personality, 
   * knowledge_entries, business_hours, departments
   */
  buildSystemPrompt(workspaceConfig: any): string {
    const {
      business_name = 'the business',
      voice_agent_name = 'Agent',
      chatbot_personality = 'helpful and friendly',
      knowledge_entries = [],
      business_hours = {},
      departments = []
    } = workspaceConfig;

    let prompt = `You are ${voice_agent_name}, an AI assistant for ${business_name}.
Your personality is: ${chatbot_personality}.

Here is the known information (Knowledge Base) about ${business_name}:
`;

    if (Array.isArray(knowledge_entries) && knowledge_entries.length > 0) {
      knowledge_entries.forEach(k => {
        prompt += `- Q: ${k.question}\n  A: ${k.answer}\n`;
      });
    } else {
      prompt += "- No specific FAQs provided.\n";
    }

    prompt += `\nBusiness Hours: ${JSON.stringify(business_hours)}\n`;
    prompt += `Departments: ${JSON.stringify(departments)}\n`;

    prompt += `\nInstructions: Answer the user's questions based ONLY on the knowledge provided. 
If you do not know the answer, politely say you don't know and offer to connect them to a human representative.
Keep your responses conversational and concise since this may be used for voice interactions.`;

    return prompt;
  }

  /**
   * Calls Claude API (or equivalent LLM) with system prompt + messages
   */
  async generateResponse(workspaceId: string, userMessage: string, conversationHistory: any[] = [], workspaceConfig: any): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(workspaceConfig);

    const messages = [...conversationHistory, { role: 'user', content: userMessage }];

    if (!env.CLAUDE_API_KEY) {
      console.warn('CLAUDE_API_KEY is missing. Using fallback echo logic.');
      return `[Mock AI Response for ${workspaceConfig.business_name}]: I hear you saying '${userMessage}'. Our knowledge base is currently offline.`;
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 300,
          system: systemPrompt,
          messages: messages
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Claude API error ${response.status}: ${errBody}`);
      }

      const data: any = await response.json();
      return data.content[0].text;

    } catch (error) {
      console.error('Claude service generation error:', error);
      throw error;
    }
  }
}

export const claudeService = new ClaudeService();
