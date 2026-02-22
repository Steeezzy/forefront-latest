# 08 — Channels & Integrations

## Current State
- ✅ Frontend settings pages for Facebook, Instagram, WhatsApp, Email
- ✅ Zendesk import service (knowledge only)
- ❌ No actual channel connections (all pages are placeholders)
- ❌ No unified message routing from external channels
- ❌ No Facebook Messenger / Instagram DM / WhatsApp Business API
- ❌ No email channel (receiving/sending support emails)
- ❌ No Shopify order integration
- ❌ No third-party integrations (Zapier, Make, HubSpot, Slack)

---

## What Tidio Has
- **Messenger:** Facebook Messenger integration (receive/send DMs)
- **Instagram:** Instagram DM integration
- **WhatsApp:** WhatsApp Business API
- **Email:** Receive support emails as conversations, reply from inbox
- **Shopify:** Order lookup, product recommendations, cart view
- **WordPress:** Plugin for easy installation
- **Zapier/Make:** Automation connectors
- **HubSpot/Mailchimp:** CRM sync contacts
- **Slack:** Notifications for new conversations
- **Google Analytics:** Track chat events

---

## Implementation Plan

### Step 1: Channel Abstraction Layer
**Create a unified channel interface:**

```typescript
// services/channels/ChannelAdapter.ts
interface ChannelAdapter {
  name: string;
  connect(config: ChannelConfig): Promise<void>;
  disconnect(): Promise<void>;
  sendMessage(recipientId: string, message: OutgoingMessage): Promise<void>;
  handleWebhook(payload: any): Promise<IncomingMessage>;
}

interface IncomingMessage {
  channelType: 'messenger' | 'instagram' | 'whatsapp' | 'email';
  externalId: string;        // External conversation/thread ID
  senderExternalId: string;  // External user ID
  senderName?: string;
  content: string;
  contentType: 'text' | 'image' | 'file';
  attachments?: Attachment[];
  metadata: any;
}
```

**Message Router:**
```typescript
class MessageRouter {
  async routeIncoming(message: IncomingMessage, workspaceId: string) {
    // 1. Find or create visitor by externalId
    const visitor = await findOrCreateVisitor(message, workspaceId);

    // 2. Find or create conversation
    const conversation = await findOrCreateConversation(visitor, message.channelType, workspaceId);

    // 3. Store message
    await chatService.addMessage({
      conversationId: conversation.id,
      content: message.content,
      senderType: 'visitor',
      metadata: { channel: message.channelType, ...message.metadata }
    });

    // 4. Trigger AI (same RAG pipeline)
    await aiService.generateResponse(conversation.id, workspaceId);

    // 5. Emit to inbox via Socket.IO
    io.to(`workspace:${workspaceId}`).emit('new_message', { ... });
  }

  async routeOutgoing(conversationId: string, message: string) {
    const conversation = await getConversation(conversationId);
    const adapter = this.getAdapter(conversation.channel);
    await adapter.sendMessage(conversation.visitor_external_id, { text: message });
  }
}
```

### Step 2: Channel Configurations

```sql
-- Migration: 020_channel_configs.sql
CREATE TABLE channel_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  channel_type VARCHAR(50) NOT NULL, -- messenger, instagram, whatsapp, email
  is_active BOOLEAN DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}', -- API keys, page tokens, etc.
  webhook_secret VARCHAR(255),
  connected_at TIMESTAMP WITH TIME ZONE,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'disconnected', -- connected, disconnected, error
  error_message TEXT,
  UNIQUE(workspace_id, channel_type)
);
```

**API Endpoints:**
- `GET /integrations/channels` — List configured channels
- `POST /integrations/channels/:type/connect` — Connect channel
- `POST /integrations/channels/:type/disconnect` — Disconnect
- `GET /integrations/channels/:type/status` — Check connection status

### Step 3: Facebook Messenger
**Requirements:** Facebook App, Page Token, Webhook verification

```typescript
// channels/MessengerAdapter.ts
class MessengerAdapter implements ChannelAdapter {
  async handleWebhook(payload: MessengerWebhookPayload): Promise<IncomingMessage> {
    // Parse FB Messenger webhook format
    // Extract: sender PSID, message text/attachments, timestamp
  }

  async sendMessage(psid: string, message: OutgoingMessage): Promise<void> {
    await fetch(`https://graph.facebook.com/v18.0/me/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: psid },
        message: { text: message.text },
        access_token: this.pageToken
      })
    });
  }
}
```

**Webhook route:** `POST /webhooks/messenger`

### Step 4: Instagram DMs
Similar to Messenger (same Facebook Graph API), but different webhook events.
**Webhook route:** `POST /webhooks/instagram`

### Step 5: WhatsApp Business API
**Requirements:** WhatsApp Business Account, Cloud API access

```typescript
// channels/WhatsAppAdapter.ts
class WhatsAppAdapter implements ChannelAdapter {
  async sendMessage(phoneNumber: string, message: OutgoingMessage): Promise<void> {
    await fetch(`https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: { body: message.text }
      })
    });
  }
}
```

**Webhook route:** `POST /webhooks/whatsapp`

### Step 6: Email Channel
**Approach:** Use IMAP/SMTP or a service like SendGrid Inbound Parse

```typescript
// channels/EmailAdapter.ts
class EmailAdapter implements ChannelAdapter {
  // Receive emails via webhook (SendGrid Inbound Parse or Mailgun)
  async handleWebhook(payload: EmailWebhookPayload): Promise<IncomingMessage> {
    return {
      channelType: 'email',
      externalId: payload.messageId,
      senderExternalId: payload.from,
      senderName: payload.fromName,
      content: payload.text || payload.html,
      contentType: 'text',
      metadata: { subject: payload.subject }
    };
  }

  // Send email replies via SMTP/SendGrid
  async sendMessage(email: string, message: OutgoingMessage): Promise<void> {
    await sendEmail({
      to: email,
      subject: `Re: ${message.threadSubject}`,
      text: message.text,
      inReplyTo: message.threadId
    });
  }
}
```

### Step 7: Shopify Integration

```sql
-- Migration: 021_shopify_integration.sql
CREATE TABLE shopify_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID UNIQUE NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  shop_domain VARCHAR(255) NOT NULL,
  access_token VARCHAR(255) NOT NULL, -- Encrypted
  scopes TEXT,
  installed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);
```

**Capabilities:**
- Lookup orders by email/order number
- View customer info and purchase history
- Product recommendations from catalog
- Abandoned cart data

**API:**
- `POST /integrations/shopify/install` — OAuth flow initiation
- `GET /integrations/shopify/callback` — OAuth callback
- `GET /integrations/shopify/orders?email=<email>` — Lookup orders
- `GET /integrations/shopify/customer?email=<email>` — Customer info

### Step 8: Third-Party Connectors
**Webhook-based integrations:**

- `POST /integrations/webhooks` — Register outgoing webhook
- Configure triggers: new_conversation, conversation_closed, new_lead, csat_submitted

**Zapier/Make compatible:**
- Provide webhook URLs for triggers
- Accept webhook payloads for actions

### Step 9: Slack Notifications

```typescript
// integrations/SlackNotifier.ts
class SlackNotifier {
  async notifyNewConversation(conversation: Conversation): Promise<void> {
    await fetch(slackWebhookUrl, {
      method: 'POST',
      body: JSON.stringify({
        text: `New conversation from ${conversation.visitor_name || 'Visitor'}`,
        blocks: [/* Rich message blocks */]
      })
    });
  }
}
```

---

## Frontend Changes Required
> ⚠️ ASK USER BEFORE IMPLEMENTING

- Settings → Facebook/Instagram/WhatsApp pages: Connect buttons, OAuth flows
- Settings → Email: SMTP config form or email forwarding setup
- Integrations page: Available integrations grid with connect/disconnect
- Inbox: Channel icon badges on conversations
- Shopify: Order lookup panel in inbox sidebar
