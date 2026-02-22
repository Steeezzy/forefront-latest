# 04 — Flows & Automation

## Current State
- ✅ `flows` table exists in DB (id, workspace_id, name, definition_json, is_active)
- ✅ Frontend routes exist (my-flows, templates, leads, sales, support, welcome)
- ✅ Frontend flow components exist (16 files in `components/flows/`)
- ❌ No backend CRUD API for flows
- ❌ No flow execution engine
- ❌ No flow builder canvas (visual drag-and-drop)
- ❌ No trigger system
- ❌ No pre-built templates

---

## What Tidio Flows Has
- Visual drag-and-drop flow builder
- **Triggers:** First visit, returning visitor, chat icon clicked, specific page visit, form submitted, API event
- **Conditions:** URL match, browser/OS, language, chat status, visitor tag, time of day
- **Actions:** Send message, ask question, send form, apply tag, assign to agent, send email, webhook/Zapier, close chat, transfer
- 35+ pre-built templates
- Flow analytics (triggered count, completion rate)

---

## Implementation Plan

### Step 1: Flow Data Model
The existing `flows` table is sufficient. The `definition_json` column stores the full flow graph.

**Flow Definition Schema:**
```json
{
  "nodes": [
    {
      "id": "trigger_1",
      "type": "trigger",
      "trigger_type": "first_visit",
      "config": {},
      "position": { "x": 100, "y": 50 },
      "next": ["condition_1"]
    },
    {
      "id": "condition_1",
      "type": "condition",
      "condition_type": "url_contains",
      "config": { "value": "/pricing" },
      "position": { "x": 100, "y": 200 },
      "branches": {
        "yes": ["action_1"],
        "no": ["action_2"]
      }
    },
    {
      "id": "action_1",
      "type": "action",
      "action_type": "send_message",
      "config": { "message": "Need help choosing a plan?" },
      "position": { "x": 50, "y": 350 },
      "next": []
    }
  ]
}
```

### Step 2: Flows CRUD API
**Module: `modules/flows/`**

- `GET /flows` — List flows for workspace
- `POST /flows` — Create new flow
- `GET /flows/:id` — Get flow with definition
- `PATCH /flows/:id` — Update flow definition/name
- `DELETE /flows/:id` — Delete flow
- `POST /flows/:id/activate` — Activate flow
- `POST /flows/:id/deactivate` — Deactivate flow
- `POST /flows/:id/duplicate` — Clone a flow

### Step 3: Trigger Types
**Implement trigger evaluation in widget/socket:**

| Trigger | Event Source | Implementation |
|---------|-------------|----------------|
| `first_visit` | Widget load | Check visitor `first_seen_at === now` |
| `returning_visitor` | Widget load | Check visitor `total_visits > 1` |
| `page_visit` | Page navigation | Match URL pattern |
| `chat_opened` | Widget click | Socket event `chat_opened` |
| `time_on_page` | Timer | setTimeout in widget |
| `scroll_percentage` | Scroll event | IntersectionObserver in widget |
| `exit_intent` | Mouse leave | `mouseleave` on `document` |
| `api_event` | REST API | `POST /flows/trigger` endpoint |

### Step 4: Condition Types

| Condition | Check | Binary? |
|-----------|-------|---------|
| `url_contains` | Current URL includes string | Yes |
| `url_exact` | Current URL matches exactly | Yes |
| `browser` | User agent | Yes |
| `operating_system` | User agent | Yes |
| `language` | Browser language | Yes |
| `visitor_tag` | Visitor has tag | Yes |
| `chat_status` | Chat open/closed | Yes |
| `day_of_week` | Current day | Multi |
| `time_of_day` | Current hour | Multi |
| `custom_property` | Visitor metadata key | Yes |

### Step 5: Action Types

| Action | Implementation |
|--------|---------------|
| `send_message` | Emit chat message as "bot" |
| `ask_question` | Send message + wait for input, store answer |
| `send_form` | Send structured form (name, email, phone) |
| `apply_tag` | Add tag to visitor/conversation |
| `assign_agent` | Set `assigned_user_id` on conversation |
| `send_email` | Trigger email via Nodemailer/SendGrid |
| `webhook` | HTTP POST to external URL |
| `close_chat` | Set conversation status to "closed" |
| `transfer_chat` | Change assigned agent |
| `set_property` | Update visitor custom property |
| `delay` | Wait N seconds before next action |

### Step 6: Flow Execution Engine
**New service: `services/FlowEngine.ts`**

```typescript
class FlowEngine {
  async evaluateTriggers(event: TriggerEvent): Promise<Flow[]> {
    // Find all active flows matching this trigger type
    const flows = await getActiveFlowsByTrigger(event.workspaceId, event.type);
    return flows.filter(flow => this.matchesTrigger(flow, event));
  }

  async executeFlow(flow: Flow, context: FlowContext): Promise<void> {
    const definition = flow.definition_json;
    const triggerNode = definition.nodes.find(n => n.type === 'trigger');

    await this.executeNode(triggerNode, definition, context);
  }

  private async executeNode(node: FlowNode, definition: FlowDefinition, context: FlowContext): Promise<void> {
    switch (node.type) {
      case 'trigger':
        // Already matched, proceed to next
        for (const nextId of node.next) {
          await this.executeNode(findNode(definition, nextId), definition, context);
        }
        break;

      case 'condition':
        const result = this.evaluateCondition(node, context);
        const branch = result ? node.branches.yes : node.branches.no;
        for (const nextId of branch) {
          await this.executeNode(findNode(definition, nextId), definition, context);
        }
        break;

      case 'action':
        await this.executeAction(node, context);
        for (const nextId of node.next || []) {
          await this.executeNode(findNode(definition, nextId), definition, context);
        }
        break;
    }
  }
}
```

### Step 7: Flow Analytics

```sql
-- Migration: 015_flow_analytics.sql
CREATE TABLE flow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  visitor_id VARCHAR(255),
  conversation_id UUID REFERENCES conversations(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'running', -- running, completed, abandoned, error
  nodes_visited TEXT[] DEFAULT '{}',
  data_collected JSONB DEFAULT '{}'
);
```

- `GET /flows/:id/analytics` — Execution count, completion rate, avg time

### Step 8: Pre-Built Templates
Create 10-15 template flows stored in a JSON file:

| Template | Trigger | Purpose |
|----------|---------|---------|
| Welcome Message | `first_visit` | Greet new visitors |
| Returning Visitor | `returning_visitor` | Welcome back message |
| Pricing Page Helper | `page_visit: /pricing` | Offer pricing help |
| Lead Capture | `time_on_page: 30s` | Ask for email |
| Exit Intent Discount | `exit_intent` | Offer discount code |
| FAQ Bot | `chat_opened` | Common questions menu |
| Cart Abandonment | `page_visit: /cart` + `exit_intent` | Recover abandoned carts |
| Contact Form | `chat_opened` | Collect name, email, message |
| After Hours | `time_of_day: outside_hours` | Offline message |
| Product Recommendation | `page_visit: /products` | Suggest products |

---

## Frontend Changes Required
> ⚠️ ASK USER BEFORE IMPLEMENTING

- Visual flow builder canvas (React Flow / custom canvas)
- Node palette (drag triggers, conditions, actions)
- Node configuration panels
- Flow list management (activate/deactivate/delete/duplicate)
- Template gallery with preview
- Flow analytics dashboard
