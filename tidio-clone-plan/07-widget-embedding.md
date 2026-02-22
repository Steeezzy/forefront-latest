# 07 — Chat Widget & Embedding

## Current State
- ✅ Basic `src/widget/index.tsx` and `src/widget/chat-widget.tsx` (stubs)
- ❌ No standalone embeddable widget
- ❌ No widget configuration API
- ❌ No widget customization (colors, position, branding)
- ❌ No embed code generator
- ❌ No Shopify/WordPress installation

---

## What Tidio Has
- Floating chat bubble (bottom-right/left)
- Customizable colors, branding, logo
- Pre-chat form integration
- Offline mode with message collection
- Multilingual widget (auto-detect browser language)
- Mobile responsive
- JS API (`tidioChatApi`) for programmatic control
- Auto-messages triggered by flows
- File sharing in widget
- CSAT survey after chat
- Embed via `<script>` tag or platform plugins

---

## Implementation Plan

### Step 1: Widget Configuration

```sql
-- Migration: 019_widget_config.sql
CREATE TABLE widget_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID UNIQUE NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Appearance
  primary_color VARCHAR(20) DEFAULT '#3B82F6',
  text_color VARCHAR(20) DEFAULT '#FFFFFF',
  background_color VARCHAR(20) DEFAULT '#FFFFFF',
  position VARCHAR(20) DEFAULT 'bottom-right', -- bottom-right, bottom-left
  offset_x INTEGER DEFAULT 20, -- pixels from edge
  offset_y INTEGER DEFAULT 20,
  bubble_icon VARCHAR(50) DEFAULT 'chat', -- chat, headset, wave, custom
  custom_icon_url TEXT,
  logo_url TEXT,
  
  -- Content
  welcome_message TEXT DEFAULT 'Hi! How can we help you?',
  offline_message TEXT DEFAULT 'We are currently offline. Leave a message!',
  input_placeholder TEXT DEFAULT 'Type a message...',
  
  -- Behavior
  auto_open_delay INTEGER, -- seconds before auto-opening (null = disabled)
  show_on_mobile BOOLEAN DEFAULT true,
  show_agent_photo BOOLEAN DEFAULT true,
  show_branding BOOLEAN DEFAULT true, -- "Powered by ForefrontAgent"
  collect_email_before_chat BOOLEAN DEFAULT false,
  
  -- Pages
  hidden_pages TEXT[] DEFAULT '{}', -- URL patterns where widget is hidden
  
  -- Language
  default_language VARCHAR(10) DEFAULT 'en',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**API Endpoints:**
- `GET /widget/config/:workspaceId` — Public endpoint: get widget config
- `PATCH /widget/config` — Authenticated: update widget config
- `GET /widget/embed-code` — Get embed `<script>` snippet

### Step 2: Standalone Widget Build System
**The widget must be a standalone JS bundle (not part of the Next.js app)**

```
/widget
  /src
    index.ts         -- Entry point: creates iframe or shadow DOM
    Widget.tsx       -- Main React component
    ChatWindow.tsx   -- Chat interface
    ChatBubble.tsx   -- Floating button
    PreChatForm.tsx  -- Email/name collection form
    MessageList.tsx  -- Messages display
    MessageInput.tsx -- Input with file upload
    CSATSurvey.tsx   -- Post-chat rating
    api.ts           -- Socket.IO + REST calls
    styles.css       -- Self-contained styles
  vite.config.ts     -- Build as single JS file
  package.json
```

**Build output:** Single `widget.js` file (~50KB) deployable to CDN.

### Step 3: Widget Embed Code

```html
<!-- Embed Code -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['ForefrontWidget']=o;w[o]=w[o]||function(){
    (w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s);fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','fw','https://widget.yourdomain.com/widget.js'));
  
  fw('init', { workspaceId: 'YOUR_WORKSPACE_ID' });
</script>
```

### Step 4: Widget JS API

```typescript
// Exposed global API
window.ForefrontWidget = {
  open: () => {},           // Open chat window
  close: () => {},          // Close chat window
  toggle: () => {},         // Toggle open/close
  sendMessage: (msg) => {}, // Send message programmatically
  setVisitor: (data) => {}, // Set visitor info (name, email, etc.)
  hide: () => {},           // Hide widget entirely
  show: () => {},           // Show widget
  onMessage: (cb) => {},    // Listen for new messages
  onOpen: (cb) => {},       // Listen for widget open
  onClose: (cb) => {},      // Listen for widget close
};
```

### Step 5: Widget Communication
**Socket.IO connection from widget:**

```typescript
// Widget connects with workspace ID
const socket = io('https://api.yourdomain.com', {
  auth: { workspaceId, visitorId },
  transports: ['websocket', 'polling']
});

// Widget events:
socket.emit('visitor_connected', { page, browser, os, referrer });
socket.emit('send_message', { content, type: 'text' });
socket.emit('typing_start');
socket.emit('typing_stop');
socket.emit('page_view', { url, title });

// Widget listens:
socket.on('new_message', (msg) => { /* display in chat */ });
socket.on('typing_indicator', (data) => { /* show typing dots */ });
socket.on('agent_assigned', (agent) => { /* show agent info */ });
socket.on('trigger_flow', (flow) => { /* execute flow in widget */ });
```

### Step 6: Platform Installation Guides

**Shopify App Embed:**
- Create `extensions/forefront-chat/` with `shopify.extension.toml`
- App Embed block (`chat-embed.liquid`) that injects the widget script
- Merchants enable via Theme Editor → App Embeds

**WordPress Plugin:**
- Simple plugin that adds the embed `<script>` to `wp_footer`
- Settings page for workspace ID input

**Generic Installation:**
- Copy-paste `<script>` tag into site's `</body>`

---

## Frontend Changes Required
> ⚠️ ASK USER BEFORE IMPLEMENTING

- Settings → Live Chat → Appearance page: color picker, position, branding toggle
- Settings → Live Chat → Installation tab: embed code display with copy button
- Widget preview within settings page
- Platform-specific installation guides (Shopify, WordPress, Custom)
