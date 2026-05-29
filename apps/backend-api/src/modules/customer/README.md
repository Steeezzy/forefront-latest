# Phase 1: Memory Agent - Customer Intelligence System

## Overview

The Memory Agent is the foundation of the Questron Agentic Upgrade. It provides persistent customer memory, AI-powered interaction analysis, and intelligent action recommendations.

## What Problem Does This Solve?

**Before (No Memory):**
- Customer calls Monday: "I want teeth whitening"
- Customer calls Wednesday: "Hi, I called about whitening"
- AI: "Sure! What service are you interested in?"
- Customer: "I JUST told you on Monday!" → *hangs up, goes to competitor*

**After (With Memory):**
- Customer calls Wednesday: "Hi, I called about whitening"
- AI: "Hi Maria! Yes, on Monday you asked about our whitening options. I remember Dr. Chen has an opening this Friday at 10 AM. Want me to book it?"
- Customer: "Yes!" → *books, leaves 5-star review*

## Architecture

### Database Schema

Three new tables (zero modifications to existing tables):

1. **customer_profiles** - Persistent customer memory
   - Demographics (name, phone, email)
   - Engagement metrics (total_interactions, lifetime_value)
   - AI insights (preferences, sentiment_trend, risk_score)
   - Action planning (next_action, next_action_date)

2. **interaction_logs** - Every customer touchpoint
   - Channel (call, SMS, chat, etc.)
   - Transcript and summary
   - Sentiment and outcome
   - Revenue attribution

3. **ai_actions_log** - Recommended actions
   - Action type (follow_up, win_back, review, etc.)
   - Status tracking (pending, executed)
   - Results tracking

### Backend Components

```
forefront-backend/src/
├── modules/customer/
│   ├── customer.routes.ts       ✓ REST API endpoints
│   ├── customer.controller.ts   ✓ Request handling
│   └── customer.service.ts      ✓ Business logic
├── agents/
│   └── memory.agent.ts          ✓ AI intelligence layer
└── jobs/
    └── customer_sync.ts         ✓ Background processing
```

## API Endpoints

All endpoints are prefixed with `/api/customers`

### List Customers
```
GET /api/customers/:workspaceId
Query Parameters:
  - search: string (searches name, phone, email)
  - sentiment: "positive" | "neutral" | "negative"
  - riskMin: number (0-100)
  - riskMax: number (0-100)
  - tag: string
  - nextAction: "follow_up" | "win_back" | "review" | "upsell"
  - page: number (default: 1)
  - limit: number (default: 20)

Response:
{
  "customers": [...],
  "total": 156,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

### Get Customer Profile
```
GET /api/customers/:workspaceId/:profileId

Response:
{
  "profile": {
    "id": "...",
    "name": "Maria Johnson",
    "phone": "+1234567890",
    "total_interactions": 5,
    "lifetime_value": 450.00,
    "risk_score": 25,
    "sentiment_trend": [...],
    "preferences": {"prefers_morning": true},
    "next_action": "review",
    "next_action_date": "2025-02-01"
  },
  "recentInteractions": [...],
  "aiNotes": "Patient prefers morning appointments..."
}
```

### Sync Interaction
```
POST /api/customers/:workspaceId/sync
Body:
{
  "phone": "+1234567890",
  "name": "Maria Johnson",
  "email": "maria@example.com",
  "channel": "call",
  "transcript": "Customer called about teeth whitening...",
  "outcome": "appointment_booked",
  "revenue": 150.00
}

Response:
{
  "profile": {...},
  "interaction": {...},
  "analysis": {
    "summary": "Customer interested in whitening, appointment scheduled",
    "sentiment": "positive",
    "risk_score": 15,
    "next_action": "review",
    "next_action_date": "2025-02-01"
  },
  "nextAction": "review"
}
```

### Get Interaction History
```
GET /api/customers/:workspaceId/:profileId/history
Query: limit (default: 50)

Response:
{
  "interactions": [...],
  "timeline": [
    {
      "type": "interaction",
      "created_at": "2025-01-20T10:00:00Z",
      "channel": "call",
      "summary": "...",
      "sentiment": "positive"
    },
    {
      "type": "action",
      "created_at": "2025-01-20T10:05:00Z",
      "action_type": "follow_up",
      "status": "pending"
    }
  ]
}
```

### Update Customer Notes
```
PUT /api/customers/:workspaceId/:profileId/notes
Body:
{
  "notes": "Customer prefers Dr. Chen. Allergic to latex."
}

Response:
{
  "updated": true,
  "profile": {...}
}
```

### Create Customer Action
```
POST /api/customers/:workspaceId/:profileId/action
Body:
{
  "actionType": "follow_up",
  "actionDetail": "Call to confirm satisfaction with treatment",
  "scheduledDate": "2025-02-01"
}

Response:
{
  "actionId": "...",
  "status": "pending"
}
```

### Get Risky Customers
```
GET /api/customers/:workspaceId/risky
Query: limit (default: 20)

Response:
{
  "customers": [
    {
      "id": "...",
      "name": "John Doe",
      "risk_score": 85,
      "last_interaction_summary": "Complained about wait time",
      "last_interaction_date": "2024-12-15T14:00:00Z"
    }
  ]
}
```

### Get Upcoming Actions
```
GET /api/customers/:workspaceId/upcoming-actions
Query: days (default: 7)

Response:
{
  "actions": {
    "2025-01-25": [
      {
        "id": "...",
        "name": "Maria Johnson",
        "next_action": "review",
        "next_action_date": "2025-01-25"
      }
    ],
    "2025-01-26": [...]
  }
}
```

## Memory Agent Intelligence

The Memory Agent (`memory.agent.ts`) provides AI-powered analysis:

### Interaction Analysis
- Extracts sentiment (positive/neutral/negative)
- Detects customer preferences
- Generates 2-line summaries
- Calculates risk scores
- Recommends next actions

### Risk Score Calculation
Factors considered (0-100 scale):
- **Time since last interaction** (max 30 points)
  - 90+ days: 30 points
  - 60-90 days: 20 points
  - 30-60 days: 10 points
- **Sentiment trend** (max 30 points)
  - 6 points per negative interaction (last 5)
- **Declining engagement** (max 20 points)
  - Comparing recent vs older interaction frequency
- **Low value vs high interaction** (max 20 points)
  - Many interactions but low spend = browsing not buying

### Next Action Recommendations
- **risk_score > 70**: Win-back campaign (next day)
- **risk_score > 40**: Follow-up (3 days)
- **Satisfied + high value**: Review request (7 days)
- **Low risk**: No action needed

## Background Job: Customer Sync

Runs every 5 minutes to:
1. Find unanalyzed interactions
2. Analyze with Claude AI
3. Update customer profiles
4. Create recommended actions
5. Calculate risk scores (periodic)

**Safety Features:**
- Non-blocking (doesn't affect existing systems)
- Error handling (failed analysis doesn't break sync)
- Rate limiting (max 50 interactions per run)
- Idempotency (won't re-analyze same interaction)

## Integration Points

### Safe, Non-Breaking Integration

This system is **completely additive**:
- ✅ New tables (doesn't touch existing tables)
- ✅ New routes (doesn't modify existing routes)
- ✅ New services (imports existing, doesn't replace)
- ✅ Background job (reads only, doesn't interfere)

### How to Use in Existing Code

**Example: Log a call interaction**
```typescript
import { customerService } from './modules/customer/customer.service.js';

// After a call ends (in Twilio webhook handler)
const profile = await customerService.findOrCreateProfile(
  workspaceId,
  callerPhone,
  callerName
);

await customerService.logInteraction(
  workspaceId,
  profile.id,
  {
    channel: 'call',
    raw_transcript: transcript,
    outcome: 'appointment_booked',
    revenue: 150.00
  }
);

// Analysis happens automatically in background job
```

**Example: Check risky customers**
```typescript
const riskyCustomers = await customerService.getRiskyCustomers(workspaceId);
// Display in dashboard, trigger alerts, etc.
```

## Claude AI Integration

The system uses Claude Haiku for:
- Interaction analysis
- Sentiment detection
- Preference extraction
- Next action recommendations

**Prompt Structure:**
```
Customer Context:
- Name, phone, interaction history
- Lifetime value, current risk score
- Previous sentiment trend

Current Interaction:
- Channel, transcript, outcome

Output: JSON with analysis
```

**Fallback Behavior:**
- If Claude API fails: Uses default analysis
- If JSON parsing fails: Returns safe defaults
- System continues working even if AI is unavailable

## Performance Considerations

- **Database indexes** on all common queries
- **Pagination** for list endpoints
- **JSONB** for flexible metadata storage
- **Background processing** for expensive operations
- **Rate limiting** to prevent overload

## Future Enhancements (Phase 2+)

This foundation enables:
- **Phase 2**: Proactive outreach campaigns
- **Phase 3**: Business intelligence reports
- **Phase 4**: Smart scheduling optimization
- **Phase 5**: Multi-channel unification

## Monitoring

Check job status:
```bash
# Logs show sync activity
[CustomerSync] Found 15 interactions to analyze
[CustomerSync] Completed: 15 success, 0 errors
```

Check database:
```sql
-- Count customers by risk level
SELECT
  CASE
    WHEN risk_score > 70 THEN 'high'
    WHEN risk_score > 40 THEN 'medium'
    ELSE 'low'
  END as risk_level,
  COUNT(*)
FROM customer_profiles
GROUP BY risk_level;

-- Recent interactions
SELECT * FROM interaction_logs
ORDER BY created_at DESC
LIMIT 10;

-- Pending actions
SELECT * FROM ai_actions_log
WHERE status = 'pending';
```

## Testing

The system can be tested without affecting production:
1. Create test workspace
2. Sync test interactions via API
3. Check customer profiles
4. Verify AI analysis
5. Review recommended actions

## Migration

Run the migration:
```bash
psql $DATABASE_URL -f migrations/062_customer_memory.sql
```

Start the backend (job starts automatically):
```bash
npm run dev
```

## Support

- All code is in `forefront-backend/src/modules/customer/`
- Database schema in `migrations/062_customer_memory.sql`
- AI logic in `agents/memory.agent.ts`
- Background job in `jobs/customer_sync.ts`
