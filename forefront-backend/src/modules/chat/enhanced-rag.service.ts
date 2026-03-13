import { pool } from '../../config/db.js';
import { generateEmbedding } from '../../utils/embeddings.js';
import { env } from '../../config/env.js';
import { sarvamClient } from '../../services/SarvamClient.js';
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
    const { enableEscalation = true, escalationThreshold = 50 } = options;
    
    try {
      // 1. Fetch last N messages from conversation for context
      const history = await this.chatService.getMessages(conversationId);
      const recentHistory = history.slice(-10); // Last 10 messages
      
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
      
      // 5. Check for escalation
      if (enableEscalation && confidence < escalationThreshold) {
        await this.logEscalation(conversationId, workspaceId, userMessage, confidence);
        
        const content = "I'm not entirely sure about that. Let me connect you with a human agent who can help you better.";
        return {
          content,
          answer: content,
          confidence,
          sources: [],
          shouldEscalate: true,
          model: 'sarvam-1',
          tokensUsed: 0,
        };
      }
      
      // 6. Build messages array with history + context
      const messages = this.buildMessages(agent, recentHistory, chunks, userMessage);
      
      // 7. Call Sarvam AI with full context
      if (!env.SARVAM_API_KEY) {
        console.warn("RAG: No Sarvam API Key. Falling back to Groq.");
        const { groqChatCompletion } = await import('../../utils/llm.js');
        const groqResult: any = await groqChatCompletion(messages);
        
        const content = groqResult.choices?.[0]?.message?.content || "I'm having trouble with Groq fallback.";
        return {
          content,
          answer: content,
          confidence,
          sources: chunks.map(c => c.source_id),
          shouldEscalate: false,
          model: 'groq-llama3',
          tokensUsed: groqResult.usage?.total_tokens || 0,
        };
      }
      
      const result: any = await sarvamClient.chatCompletion(messages, {
        temperature: 0.7,
        max_tokens: 500,
      });
      
      const content = result.choices?.[0]?.message?.content || "I'm having trouble generating a response right now.";
      const tokensUsed = result.usage?.total_tokens || 0;
      
      return {
        content,
        answer: content,
        confidence,
        sources: chunks.map(c => c.source_id),
        shouldEscalate: false,
        model: result.model || 'sarvam-1',
        tokensUsed,
      };
      
    } catch (error: any) {
      console.error("Enhanced RAG failed:", error.message);
      
      const content = "I apologize, but I'm experiencing technical difficulties. Details: " + error.message;
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

Use the following knowledge to answer the user's question:
${contextText || "No specific knowledge found. Use general customer service best practices."}

Instructions:
1. Be concise and helpful
2. If you don't know something, admit it
3. Use the knowledge provided above
4. Be professional but friendly
5. Answer in the same language as the user's question`;

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

      const result: any = await sarvamClient.chatCompletion([
        { role: 'user', content: prompt }
      ], {
        temperature: 0.8,
        max_tokens: 300,
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

      const result: any = await sarvamClient.chatCompletion([
        { role: 'user', content: prompt }
      ], {
        temperature: 0.7,
        max_tokens: 300,
      });
      
      return result.choices?.[0]?.message?.content || draft;
    } catch (error) {
      console.error('Failed to rewrite draft:', error);
      return draft;
    }
  }
}

export const enhancedRAGService = new EnhancedRAGService();
