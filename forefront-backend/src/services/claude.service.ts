import { chatResponse } from './llm.service.js';

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
      system_prompt,
      knowledge_entries = [],
      business_hours = {},
      departments = [],
      customer_context = null,
    } = workspaceConfig;

    let prompt = '';

    if (typeof system_prompt === 'string' && system_prompt.trim()) {
      prompt += `${system_prompt.trim()}\n\n`;
    }

    prompt += `You are ${voice_agent_name}, an AI assistant for ${business_name}.
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

    if (customer_context) {
      prompt += `Customer Context: ${JSON.stringify(customer_context)}\n`;
    }

    prompt += `\nInstructions: Answer the user's questions based ONLY on the knowledge provided. 
If you do not know the answer, politely say you don't know and offer to connect them to a human representative.
Keep your responses conversational and concise since this may be used for voice interactions.`;

    return prompt;
  }

  /**
   * Calls the Qwen/OpenRouter client while preserving the legacy Claude service contract.
   */
  async generateResponse(workspaceId: string, userMessage: string, conversationHistory: any[] = [], workspaceConfig: any): Promise<string> {
    void workspaceId;

    const systemPrompt = this.buildSystemPrompt(workspaceConfig);
    const messages = [...conversationHistory, { role: 'user', content: userMessage }].map((message: any) => ({
      role: (message.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: String(message.content || ''),
    }));

    try {
      if (!process.env.OPENROUTER_API_KEY) {
        console.warn('OPENROUTER_API_KEY is missing. Using fallback echo logic.');
        return `[Mock AI Response for ${workspaceConfig.business_name}]: I hear you saying '${userMessage}'. Our knowledge base is currently offline.`;
      }

      return await chatResponse(systemPrompt, messages);
    } catch (error) {
      console.error('Qwen/OpenRouter service generation error:', error);
      throw error;
    }
  }
}

export const claudeService = new ClaudeService();
