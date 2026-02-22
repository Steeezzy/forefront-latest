# 02 — Live Chat & Inbox

## Current State
- ✅ Socket.IO server with real-time messaging
- ✅ Conversations & messages tables (CRUD)
- ✅ AI auto-response on visitor messages
- ❌ No agent-side inbox UI (static empty state only)
- ❌ No conversation assignment, status, or filtering
- ❌ No typing indicators, read receipts, or canned responses
- ❌ No visitor tracking (page, browser, location)
- ❌ No pre-chat forms or surveys
- ❌ No ticketing system
- ❌ No file sharing in chat

---

## What Tidio Has
- Unified inbox (all channels in one view)
- Conversation list with filters (Open, My, Unassigned, Solved, All)
- Agent assignment + transfer
- Typing preview (see what visitor types before sending)
- Canned responses (macros)
- Internal notes + @mentions between agents
- Pre-chat surveys/forms
- File sharing (images, PDFs, etc.)
- Visitor info panel (name, email, location, browser, pages visited)
- Conversation tags and categories
- Ticketing (convert chat → ticket)
- Operating hours and offline messages
- Mobile app support

---

## Implementation Plan

### Step 1: Conversation Model Enhancement

```sql
-- Migration: 007_conversation_enhancement.sql
ALTER TABLE conversations ADD COLUMN assigned_user_id UUID REFERENCES users(id);
ALTER TABLE conversations ADD COLUMN channel VARCHAR(50) DEFAULT 'web'; -- web, messenger, instagram, whatsapp, email
ALTER TABLE conversations ADD COLUMN priority VARCHAR(20) DEFAULT 'normal'; -- low, normal, high, urgent
ALTER TABLE conversations ADD COLUMN tags TEXT[] DEFAULT '{}';
ALTER TABLE conversations ADD COLUMN is_read BOOLEAN DEFAULT false;
ALTER TABLE conversations ADD COLUMN last_message_preview TEXT;
ALTER TABLE conversations ADD COLUMN last_message_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE conversations ADD COLUMN closed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE conversations ADD COLUMN closed_by UUID REFERENCES users(id);

-- Visitor info
ALTER TABLE conversations ADD COLUMN visitor_name VARCHAR(255);
ALTER TABLE conversations ADD COLUMN visitor_email VARCHAR(255);
ALTER TABLE conversations ADD COLUMN visitor_phone VARCHAR(50);
ALTER TABLE conversations ADD COLUMN visitor_metadata JSONB DEFAULT '{}'; -- browser, os, location, etc.

-- Message types
ALTER TABLE messages ADD COLUMN message_type VARCHAR(50) DEFAULT 'text'; -- text, file, system, note
ALTER TABLE messages ADD COLUMN metadata JSONB DEFAULT '{}'; -- file URL, note metadata, etc.
ALTER TABLE messages ADD COLUMN is_internal BOOLEAN DEFAULT false; -- true = internal note
```

### Step 2: Inbox Backend API
**Module: `modules/inbox/`**

**Conversation Endpoints:**
- `GET /inbox/conversations` — List with filters:
  - `?status=open|closed|snoozed`
  - `?assigned_to=me|unassigned|<userId>`
  - `?channel=web|messenger|etc`
  - `?search=<query>` (search messages)
  - `?tags=<tag1,tag2>`
  - Pagination: `?page=1&limit=20`
- `GET /inbox/conversations/:id` — Full conversation with messages
- `PATCH /inbox/conversations/:id` — Update status, assign, add tags
- `POST /inbox/conversations/:id/assign` — Assign to agent
- `POST /inbox/conversations/:id/transfer` — Transfer to another agent
- `POST /inbox/conversations/:id/close` — Close conversation
- `POST /inbox/conversations/:id/snooze` — Snooze until datetime

**Message Endpoints:**
- `POST /inbox/conversations/:id/messages` — Send message (agent response)
- `POST /inbox/conversations/:id/notes` — Add internal note
- `POST /inbox/conversations/:id/files` — Upload file attachment

**Canned Responses (Macros):**
```sql
-- Migration: 008_canned_responses.sql
CREATE TABLE canned_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  shortcut VARCHAR(100) NOT NULL, -- e.g. "/thanks"
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

- `GET /macros` — List canned responses
- `POST /macros` — Create macro
- `PATCH /macros/:id` — Update macro
- `DELETE /macros/:id` — Delete macro

### Step 3: Real-Time Socket Events Enhancement
**Enhance `socket.server.ts`:**

```typescript
// New events to add:
'typing_start'        // Visitor/agent started typing
'typing_stop'         // Stopped typing
'message_read'        // Message was read by agent
'conversation_assign' // Conversation assigned to agent
'conversation_update' // Status change
'visitor_online'      // Visitor connected
'visitor_offline'     // Visitor disconnected
'visitor_page_view'   // Visitor navigated to new page
'agent_online'        // Agent came online
'agent_offline'       // Agent went offline
```

**Agent Presence System:**
- Track online agents via Redis Set (`online_agents:<workspace_id>`)
- Broadcast presence changes to dashboard
- Show green/yellow/red status dots

### Step 4: Visitor Tracking
**Backend — Visitor sessions**

```sql
-- Migration: 009_visitor_tracking.sql
CREATE TABLE visitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  visitor_id VARCHAR(255) NOT NULL, -- Client-generated ID
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  total_visits INTEGER DEFAULT 1,
  current_page TEXT,
  browser VARCHAR(100),
  os VARCHAR(100),
  ip_address INET,
  country VARCHAR(100),
  city VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  custom_properties JSONB DEFAULT '{}',
  UNIQUE(workspace_id, visitor_id)
);

CREATE TABLE page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  duration_seconds INTEGER,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Socket Event:** Widget sends `visitor_page_view` with URL, title, referrer on every navigation.

### Step 5: Pre-Chat Forms

```sql
-- Migration: 010_prechat_forms.sql
CREATE TABLE prechat_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT false,
  fields JSONB NOT NULL DEFAULT '[]', -- [{name,label,type,required}]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Fields types:** `text`, `email`, `phone`, `dropdown`, `textarea`

### Step 6: Ticketing System

```sql
-- Migration: 011_tickets.sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id),
  subject VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'open', -- open, pending, solved, closed
  priority VARCHAR(20) DEFAULT 'normal',
  assigned_to UUID REFERENCES users(id),
  tags TEXT[] DEFAULT '{}',
  source VARCHAR(50) DEFAULT 'chat', -- chat, email, manual
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP WITH TIME ZONE
);
```

- `POST /tickets` — Create ticket (or convert from chat)
- `GET /tickets` — List with filters
- `PATCH /tickets/:id` — Update status, assign, priority

---

## Frontend Changes Required
> ⚠️ ASK USER BEFORE IMPLEMENTING

- Inbox page: conversation list sidebar + chat main area + visitor info panel
- Real-time typing indicators
- Agent presence badges
- Canned response picker (type `/` to trigger)
- File upload UI in chat
- Pre-chat form builder UI in Settings
- Ticket management table view
