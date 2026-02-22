# 03 — Lyro AI Chatbot

## Current State
- ✅ Sarvam AI integration (`SarvamClient`)
- ✅ RAG pipeline (pgvector semantic search → Sarvam chat completion)
- ✅ Agent personality (system prompt, tone)
- ✅ Real-time AI responses via Socket.IO
- ❌ No conversation context/memory (only single-turn)
- ❌ No language detection or auto-translation
- ❌ No AI confidence scoring
- ❌ No human handoff logic
- ❌ No copilot for agents
- ❌ No smart actions (order lookup, product recommendations)
- ❌ No AI analytics (resolution rate, handoff rate)

---

## What Tidio Lyro Has
- Multi-turn conversation with memory
- Knowledge-grounded answers (anti-hallucination)
- Confidence scoring with escalation on low confidence
- Human handoff with smooth transition
- Smart Actions (API calls: order status, product catalog, CRM)
- Copilot (suggests replies to live agents)
- Multilingual auto-detection + translation
- Customizable tone and communication style
- AI analytics dashboard

---

## Implementation Plan

### Step 1: Conversation Memory (Multi-Turn)
**Enhance `rag.service.ts`:**

```typescript
// Instead of single-turn, pass conversation history
async resolveAIResponse(
  workspaceId: string,
  conversationId: string,
  userMessage: string
): Promise<AIResponse> {
  // 1. Fetch last N messages from conversation
  const history = await chatService.getMessages(conversationId, { limit: 10 });

  // 2. Get relevant knowledge chunks
  const chunks = await this.searchKnowledge(workspaceId, userMessage);

  // 3. Build messages array with history + context
  const messages = [
    { role: 'system', content: buildSystemPrompt(agent, chunks) },
    ...history.map(m => ({
      role: m.sender_type === 'visitor' ? 'user' : 'assistant',
      content: m.content
    })),
    { role: 'user', content: userMessage }
  ];

  // 4. Call Sarvam AI with full context
  const result = await sarvamClient.chatCompletion(messages, config);
  return result;
}
```

### Step 2: Confidence Scoring & Escalation

```typescript
interface AIResponse {
  content: string;
  confidence: number; // 0-100
  sources: string[];  // Knowledge chunks used
  shouldEscalate: boolean;
}
```

**Confidence Calculation:**
- `100`: Exact FAQ match found
- `80-99`: Strong semantic match (cosine similarity > 0.85)
- `50-79`: Moderate match, AI generated supplementary context
- `0-49`: Low/no match → suggest escalation

**Escalation Rules:**
```typescript
if (confidence < 50) {
  // Auto-escalate: assign to available agent
  await assignToAgent(conversationId, workspaceId);
  return { content: "Let me connect you with a human agent.", shouldEscalate: true };
}
```

```sql
-- Migration: 012_ai_analytics.sql
ALTER TABLE messages ADD COLUMN ai_confidence FLOAT;
ALTER TABLE messages ADD COLUMN ai_sources TEXT[];
ALTER TABLE messages ADD COLUMN ai_model VARCHAR(100);
ALTER TABLE messages ADD COLUMN ai_tokens_used INTEGER;

CREATE TABLE ai_escalations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  reason VARCHAR(255), -- low_confidence, user_requested, keyword_trigger
  ai_confidence FLOAT,
  original_question TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Step 3: Language Detection & Translation
**Using Sarvam AI's language capabilities:**

```typescript
async detectAndTranslate(message: string, targetLang: string = 'en') {
  // 1. Detect language
  const detected = await sarvamClient.identifyLanguage(message);

  // 2. If non-English, translate for RAG search
  let searchQuery = message;
  if (detected.language !== 'en') {
    searchQuery = await sarvamClient.translate(message, detected.language, 'en');
  }

  // 3. Perform RAG search in English
  const response = await this.resolveAIResponse(workspaceId, conversationId, searchQuery);

  // 4. Translate response back if needed
  if (detected.language !== 'en') {
    response.content = await sarvamClient.translate(response.content, 'en', detected.language);
  }

  return response;
}
```

**Supported languages:** English + 22 Indian languages via Sarvam AI.

### Step 4: Copilot for Agents
**New module: `modules/copilot/`**

```typescript
// When agent is viewing a conversation, suggest replies
async suggestReply(conversationId: string, workspaceId: string): Promise<string[]> {
  const history = await chatService.getMessages(conversationId, { limit: 5 });
  const lastVisitorMessage = history.filter(m => m.sender_type === 'visitor').pop();

  if (!lastVisitorMessage) return [];

  const chunks = await this.searchKnowledge(workspaceId, lastVisitorMessage.content);

  const suggestions = await sarvamClient.chatCompletion([
    { role: 'system', content: `Generate 3 professional reply suggestions. Knowledge: ${chunks}` },
    { role: 'user', content: lastVisitorMessage.content }
  ]);

  return parseSuggestions(suggestions);
}
```

**API:**
- `GET /copilot/suggest?conversationId=<id>` — Get 3 reply suggestions
- `POST /copilot/rewrite` — Rewrite agent draft into professional tone

### Step 5: Smart Actions (Phase 3+)
**Extensible action system:**

```sql
-- Migration: 013_smart_actions.sql
CREATE TABLE smart_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL, -- e.g. "Check Order Status"
  description TEXT,
  action_type VARCHAR(50) NOT NULL, -- api_call, shopify, hubspot, custom
  config JSONB NOT NULL, -- endpoint, headers, mapping
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Built-in Actions:**
1. **Check Order Status** — Query Shopify Orders API
2. **Product Recommendations** — Search product catalog
3. **Book Appointment** — Calendly/custom scheduling
4. **Update Customer Info** — CRM integration

**AI Tool Calling:**
The AI model decides when to invoke a smart action based on user intent, executes the API call, and incorporates the result into Its response.

### Step 6: Unanswered Questions Tracker

```sql
-- Migration: 014_unanswered_questions.sql
CREATE TABLE unanswered_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  frequency INTEGER DEFAULT 1,
  last_asked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved BOOLEAN DEFAULT false,
  resolved_with UUID REFERENCES knowledge_sources(id)
);
```

- When AI confidence < threshold, log the question
- Aggregate similar questions by semantic similarity
- Show in dashboard: "Top unanswered questions" → one-click "Add to Knowledge Base"

---

## Frontend Changes Required
> ⚠️ ASK USER BEFORE IMPLEMENTING

- Copilot panel in Inbox (reply suggestions below chat input)
- AI confidence badge on AI messages
- Escalation indicator + notification for agents
- Unanswered questions dashboard in Chatbot section
- Smart Actions configuration page in Chatbot → Actions
