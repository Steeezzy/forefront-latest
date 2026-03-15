# 06 — Analytics & Dashboard

## Current State
- ✅ Frontend `AnalyticsPage` with Overview + AI Support tabs
- ✅ Frontend components: `AnalyticsSidebar`, `AnalyticsHeader`, `OverviewTab`, `AISupportTab`
- ✅ Usage service tracks message counts
- ❌ No analytics backend API
- ❌ No metrics aggregation
- ❌ No real-time dashboard data
- ❌ No CSV/PDF report export
- ❌ Human Support and Sales tabs are placeholders

---

## What Tidio Has
- **Overview:** Total conversations, average response time, customer satisfaction
- **AI Support:** Conversa resolution rate, handoff rate, top questions, confidence distribution
- **Human Support:** Agent performance (response time, conversations handled, CSAT)
- **Sales & Leads:** Leads captured, conversion rate, revenue attributed
- Date range filters, comparison periods
- Export to CSV

---

## Implementation Plan

### Step 1: Metrics Tables

```sql
-- Migration: 018_analytics.sql
CREATE TABLE conversation_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  channel VARCHAR(50),
  first_response_time_seconds INTEGER, -- Time to first agent/AI response
  resolution_time_seconds INTEGER,     -- Time from open to close
  message_count INTEGER DEFAULT 0,
  ai_message_count INTEGER DEFAULT 0,
  agent_message_count INTEGER DEFAULT 0,
  visitor_message_count INTEGER DEFAULT 0,
  was_escalated BOOLEAN DEFAULT false,
  ai_resolved BOOLEAN DEFAULT false,   -- Resolved without human intervention
  csat_rating INTEGER,                 -- 1-5 customer satisfaction
  csat_comment TEXT,
  resolved_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE daily_aggregates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_conversations INTEGER DEFAULT 0,
  ai_conversations INTEGER DEFAULT 0,
  human_conversations INTEGER DEFAULT 0,
  avg_first_response_seconds FLOAT,
  avg_resolution_seconds FLOAT,
  avg_csat FLOAT,
  total_messages INTEGER DEFAULT 0,
  ai_resolutions INTEGER DEFAULT 0,
  escalations INTEGER DEFAULT 0,
  leads_captured INTEGER DEFAULT 0,
  UNIQUE(workspace_id, date)
);
```

### Step 2: Metrics Collection Service
**Service: `services/MetricsCollector.ts`**

```typescript
class MetricsCollector {
  // Call when conversation is closed
  async recordConversationMetrics(conversationId: string): Promise<void> {
    const conversation = await getConversation(conversationId);
    const messages = await getMessages(conversationId);

    const firstVisitorMsg = messages.find(m => m.sender_type === 'visitor');
    const firstResponse = messages.find(m =>
      m.sender_type !== 'visitor' && m.created_at > firstVisitorMsg?.created_at
    );

    const metrics = {
      workspace_id: conversation.workspace_id,
      conversation_id: conversationId,
      channel: conversation.channel,
      first_response_time_seconds: timeDiff(firstVisitorMsg, firstResponse),
      resolution_time_seconds: timeDiff(conversation.created_at, conversation.closed_at),
      message_count: messages.length,
      ai_message_count: messages.filter(m => m.sender_type === 'ai').length,
      agent_message_count: messages.filter(m => m.sender_type === 'agent').length,
      visitor_message_count: messages.filter(m => m.sender_type === 'visitor').length,
      was_escalated: conversation.was_escalated || false,
      ai_resolved: !messages.some(m => m.sender_type === 'agent'),
    };

    await insertMetrics(metrics);
    await updateDailyAggregates(conversation.workspace_id);
  }
}
```

### Step 3: Analytics API
**Module: `modules/analytics/`**

**Endpoints:**
- `GET /analytics/overview` — Summary metrics for date range
  - `?from=2025-01-01&to=2025-01-31`
  - Returns: total conversations, avg response time, avg CSAT, trend vs previous period

- `GET /analytics/ai-support` — AI-specific metrics
  - Returns: resolution rate, handoff rate, top unanswered questions, confidence distribution

- `GET /analytics/human-support` — Agent performance
  - Returns: per-agent stats (conversations, response time, CSAT)

- `GET /analytics/leads` — Sales metrics
  - Returns: leads captured (via flows), conversion events

- `GET /analytics/conversations` — Time-series data
  - Returns: conversations per day/hour for charts

- `GET /analytics/export` — Export CSV
  - `?type=overview|ai|agents&from=&to=`

### Step 4: CSAT Collection
**After conversation close, trigger CSAT survey:**

```typescript
// When agent closes a conversation
socket.emit('csat_request', {
  conversationId,
  question: "How would you rate your experience?",
  options: [1, 2, 3, 4, 5]
});

// Widget collects response
socket.on('csat_response', async (data) => {
  await updateMetrics(data.conversationId, {
    csat_rating: data.rating,
    csat_comment: data.comment
  });
});
```

### Step 5: Real-time Dashboard Stats
**Socket emits for live dashboard:**
- `dashboard_stats` — Every 30s broadcast: active conversations, online visitors, agents online, avg wait time

### Step 6: Daily Aggregation Job
**BullMQ scheduled job:**

```typescript
// Run at midnight UTC
const aggregationJob = new Queue('aggregation', { connection: redisConfig });
aggregationJob.add('daily_aggregate', {}, {
  repeat: { pattern: '0 0 * * *' } // Cron: midnight daily
});
```

---

## Frontend Changes Required
> ⚠️ ASK USER BEFORE IMPLEMENTING

- Wire existing Overview tab to real API data
- Wire AI Support tab to real API data
- Build Human Support tab (agent leaderboard table)
- Build Sales & Leads tab (conversion funnel, lead list)
- Date range picker component
- Export button
- Real-time stats badges in dashboard
