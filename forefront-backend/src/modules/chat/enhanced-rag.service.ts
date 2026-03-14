import { pool } from '../../config/db.js';
import { generateEmbedding } from '../../utils/embeddings.js';
import { geminiChatCompletion, callSarvam } from '../../utils/gemini.js';
import { ChatService } from '../chat/chat.service.js';

export interface AIResponse {
  content: string;
  answer: string; // Alias for Shopify widget
  confidence: number;
  sources: string[];
  shouldEscalate: boolean;
  model: string;
  tokensUsed: number;
}

export class EnhancedRAGService {
  private chatService: ChatService;
  
  constructor() {
    this.chatService = new ChatService();
  }
  
  async resolveAIResponse(
    workspaceId: string,
    conversationId: string,
    userMessage: string,
    options: { enableEscalation?: boolean; escalationThreshold?: number } = {}
  ): Promise<AIResponse> {
    const { enableEscalation = true, escalationThreshold = 30 } = options;
    
    try {
      // 1. Fetch last N messages from conversation for context (if conversationId provided)
      let recentHistory: any[] = [];
      if (conversationId) {
        try {
          const history = await this.chatService.getMessages(conversationId);
          recentHistory = history.slice(-10); // Last 10 messages
        } catch (e) {
          console.warn(`[EnhancedRAG] Could not fetch history for conv ${conversationId}:`, e);
        }
      }
      
      // 2. Get relevant knowledge chunks
      const chunks = await this.searchKnowledge(workspaceId, userMessage);
      
      // 3. Fetch Agent "Personality"
      const { rows: agents } = await pool.query(
        `SELECT system_prompt, tone, name FROM agents WHERE workspace_id = $1 AND is_active = true LIMIT 1`,
        [workspaceId]
      );
      
      const agent = agents[0] || {
        system_prompt: "You are a helpful customer support agent.",
        tone: "professional",
        name: "Support Agent"
      };
      
      // 4. Calculate confidence based on similarity scores
      const confidence = this.calculateConfidence(chunks, userMessage);
      
      // 5. Build messages array with history + context
      const messages = this.buildMessages(agent, recentHistory, chunks, userMessage);
      
      // 6. Call Gemini AI
      const result = await geminiChatCompletion(messages, {
        temperature: 0.7,
        max_tokens: 500
      });

      const content = result.choices?.[0]?.message?.content || "";

      if (!content) {
        throw new Error("Empty response from Gemini");
      }

      return {
        content,
        answer: content,
        confidence,
        sources: chunks.map(c => c.source_id),
        shouldEscalate: false,
        model: 'gemini-2.0-flash',
        tokensUsed: result.usage?.total_tokens || 0
      };
      
    } catch (error: any) {
      console.error("Enhanced RAG failed:", error.message);
      
      // Fallback: Try Sarvam-M with simplified prompt
      try {
        const fallbackPrompt = `You are a helpful customer support agent. The user asked: "${userMessage}"

Provide a helpful, concise response. If you don't have enough context, give a general helpful response.`;
        
        const fallbackResult = await callSarvam(fallbackPrompt);
        
        const content = fallbackResult || "I apologize, but I'm having trouble connecting to my AI brain. Please try again or contact support.";
        
        return {
          content,
          answer: content,
          confidence: 30, // Lower confidence for fallback
          sources: [],
          shouldEscalate: false,
          model: 'sarvam-m',
          tokensUsed: content.length / 4,
        };
      } catch (fallbackError: any) {
        console.error("Fallback Sarvam-M call also failed:", fallbackError.message);
        
        const content = "I apologize, but I'm having trouble connecting to my AI brain. Please try again or contact support.";
        return {
          content,
          answer: content,
          confidence: 0,
          sources: [],
          shouldEscalate: true,
          model: 'error',
          tokensUsed: 0,
        };
      }
    }
  }
  
  private async searchKnowledge(workspaceId: string, query: string): Promise<any[]> {
    const vector = await generateEmbedding(query);
    const vectorStr = JSON.stringify(vector);
    
    const vectorQuery = `
      SELECT kv.content_chunk, kv.source_id, kv.embedding <=> $2::vector as distance
      FROM knowledge_vectors kv
      JOIN knowledge_sources ks ON kv.source_id = ks.id
      WHERE ks.agent_id IN (SELECT id FROM agents WHERE workspace_id = $1)
      ORDER BY kv.embedding <=> $2::vector
      LIMIT 5
    `;
    
    const { rows } = await pool.query(vectorQuery, [workspaceId, vectorStr]);
    console.log(`[EnhancedRAG] searchKnowledge found ${rows.length} chunks for workspace ${workspaceId}`);
    return rows;
  }
  
  private calculateConfidence(chunks: any[], query: string): number {
    if (chunks.length === 0) return 0;
    
    // Calculate average similarity (distance is 1 - similarity for cosine)
    const avgSimilarity = chunks.reduce((sum, chunk) => {
      const similarity = 1 - (chunk.distance || 0);
      return sum + similarity;
    }, 0) / chunks.length;
    
    // Convert to percentage
    let confidence = Math.round(avgSimilarity * 100);
    
    // Boost confidence if we have exact keyword matches
    const queryWords = query.toLowerCase().split(/\s+/);
    let keywordMatches = 0;
    
    for (const chunk of chunks) {
      const chunkText = (chunk.content_chunk || '').toLowerCase();
      for (const word of queryWords) {
        if (word.length > 3 && chunkText.includes(word)) {
          keywordMatches++;
        }
      }
    }
    
    // Boost by up to 20 points for keyword matches
    const keywordBoost = Math.min(20, keywordMatches * 2);
    confidence = Math.min(100, confidence + keywordBoost);
    
    return confidence;
  }
  
  private buildMessages(agent: any, history: any[], chunks: any[], currentMessage: string): any[] {
    const contextText = chunks.map((c: any) => c.content_chunk).join("\n\n");
    
    const systemPrompt = `${agent.system_prompt}
    
Your name is ${agent.name}.
Tone: ${agent.tone}

CONTEXT FROM KNOWLEDGE BASE:
${contextText || "No specific matches found in the knowledge base. Answer based on general knowledge but stay in character."}

STRICT INSTRUCTIONS:
1. USE the provided context to answer if relevant.
2. If the context doesn't contain the answer, you can use your general knowledge, but prioritize the knowledge base.
3. Keep responses CONCISE (max 150 words).
4. Use a ${agent.tone} tone.
5. If someone greets you (hi, hello), greet them back friendly.
6. Answer in the same language as the user's question.`;

    const messages = [
      { role: 'system', content: systemPrompt },
    ];
    
    // Add conversation history
    for (const msg of history) {
      const role = msg.sender_type === 'visitor' ? 'user' : 'assistant';
      messages.push({ role, content: msg.content });
    }
    
    // Add current message
    messages.push({ role: 'user', content: currentMessage });
    
    return messages;
  }
  
  private async logEscalation(
    conversationId: string,
    workspaceId: string,
    question: string,
    confidence: number
  ) {
    try {
      await pool.query(
        `INSERT INTO ai_escalations (conversation_id, workspace_id, reason, ai_confidence, original_question)
         VALUES ($1, $2, $3, $4, $5)`,
        [conversationId, workspaceId, 'low_confidence', confidence, question]
      );
      
      // Also log as unanswered question for future training
      await pool.query(
        `INSERT INTO unanswered_questions (workspace_id, question, frequency, ai_confidence)
         VALUES ($1, $2, 1, $3)
         ON CONFLICT (workspace_id, normalized_question) 
         DO UPDATE SET frequency = unanswered_questions.frequency + 1, last_asked_at = CURRENT_TIMESTAMP`,
        [workspaceId, question, confidence]
      );
    } catch (error) {
      console.error('Failed to log escalation:', error);
    }
  }
  
  // Copilot: Suggest replies for agents
  async suggestReplies(conversationId: string, workspaceId: string): Promise<string[]> {
    try {
      const history = await this.chatService.getMessages(conversationId);
      const lastVisitorMessage = history
        .filter(m => m.sender_type === 'visitor')
        .pop();
      
      if (!lastVisitorMessage) return [];
      
      const chunks = await this.searchKnowledge(workspaceId, lastVisitorMessage.content);
      const contextText = chunks.map(c => c.content_chunk).join('\n\n');
      
      const prompt = `You are a helpful assistant suggesting professional replies to customer support queries.

Knowledge available:
${contextText || "No specific knowledge available."}

Customer message: "${lastVisitorMessage.content}"

Suggest 3 professional, helpful replies. Each reply should be concise (1-2 sentences max). Format as a JSON array of strings.`;

      const result = await geminiChatCompletion([{ role: 'user', content: prompt }], {
        temperature: 0.8,
        max_tokens: 300
      });

      const content = result.choices?.[0]?.message?.content || '[]';
      
      // Try to parse JSON, fallback to splitting by newlines
      try {
        const suggestions = JSON.parse(content);
        if (Array.isArray(suggestions)) return suggestions.slice(0, 3);
      } catch {
      // Fallback: split by newlines and clean up
      return content
        .split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
        .slice(0, 3);
      }
      
      return [];
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      return [];
    }
  }
  
  // Rewrite agent draft in professional tone
  async rewriteDraft(draft: string, tone: string = 'professional'): Promise<string> {
    try {
      const prompt = `Rewrite the following customer support message in a ${tone} tone. Keep it concise and helpful.

Original: "${draft}"

Rewritten:`;

      const result = await geminiChatCompletion([{ role: 'user', content: prompt }], {
        temperature: 0.7,
        max_tokens: 300
      });

      return result.choices?.[0]?.message?.content || draft;
    } catch (error) {
      console.error('Failed to rewrite draft:', error);
      return draft;
    }
  }
}

export const enhancedRAGService = new EnhancedRAGService();
