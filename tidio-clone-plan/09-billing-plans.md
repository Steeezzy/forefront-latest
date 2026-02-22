# 09 — Billing & Plans

## Current State
- ✅ Stripe service (create customer, checkout, portal, webhooks)
- ✅ Razorpay service (create subscription, webhooks)
- ✅ Billing factory pattern (provider-agnostic)
- ✅ Usage guard middleware
- ✅ Plans config (`config/plans.ts`)
- ✅ Webhook event idempotency (billing_events table)
- ✅ Invoices table
- ✅ Usage credits table
- ❌ No usage-based billing (per-conversation metering)
- ❌ No Lyro AI conversation limits
- ❌ No Flows usage limits
- ❌ No plan upgrade prompts in-app
- ❌ No trial management
- ❌ No billing dashboard in frontend

---

## What Tidio Has
- **Free:** 50 conversations/mo, 50 Lyro AI (one-time), 100 Flows visitors
- **Starter ($29/mo):** 100 conversations, basic analytics
- **Growth ($59-349/mo):** 250-2,000 conversations, advanced analytics, canned responses
- **Plus ($749/mo):** 2,000-5,000 conversations, dedicated CSM, OpenAPI
- **Premium ($2,999/mo):** Unlimited, managed AI, priority support
- Separate Lyro AI add-on pricing
- Automatic plan upgrades at limit

---

## Implementation Plan

### Step 1: Enhanced Plans Configuration

```typescript
// config/plans.ts — Updated
export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    limits: {
      billable_conversations: 50,
      lyro_conversations: 50,      // One-time
      flow_visitors: 100,
      agents: 10,
      knowledge_sources: 5,
      smart_actions: 0,
    },
    features: {
      live_chat: true,
      basic_analytics: false,
      canned_responses: false,
      visitor_tracking: false,
      remove_branding: false,
      api_access: false,
    }
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 2900, // cents
    stripe_price_id: 'price_xxx',
    razorpay_plan_id: 'plan_xxx',
    limits: {
      billable_conversations: 100,
      lyro_conversations: 50,
      flow_visitors: 100,
      agents: 10,
      knowledge_sources: 10,
      smart_actions: 0,
    },
    features: {
      live_chat: true,
      basic_analytics: true,
      canned_responses: false,
      visitor_tracking: true,
      remove_branding: false,
      api_access: false,
    }
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: 5900,
    stripe_price_id: 'price_xxx',
    limits: {
      billable_conversations: 250, // scales to 2000
      lyro_conversations: 200,
      flow_visitors: 500,
      agents: 10,
      knowledge_sources: 50,
      smart_actions: 5,
    },
    features: {
      live_chat: true,
      basic_analytics: true,
      advanced_analytics: true,
      canned_responses: true,
      visitor_tracking: true,
      remove_branding: true, // add-on
      api_access: false,
    }
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    price: 74900,
    stripe_price_id: 'price_xxx',
    limits: {
      billable_conversations: 2000,
      lyro_conversations: 5000,
      flow_visitors: -1, // unlimited
      agents: 10,
      knowledge_sources: -1,
      smart_actions: -1,
    },
    features: {
      live_chat: true,
      basic_analytics: true,
      advanced_analytics: true,
      canned_responses: true,
      visitor_tracking: true,
      remove_branding: true,
      api_access: true,
      dedicated_csm: true,
    }
  }
};
```

### Step 2: Usage Metering Enhancement

```sql
-- Migration: 022_usage_metering.sql
CREATE TABLE usage_meters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  billable_conversations INTEGER DEFAULT 0,
  lyro_conversations INTEGER DEFAULT 0,
  flow_triggers INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  ai_tokens_used INTEGER DEFAULT 0,
  UNIQUE(workspace_id, period_start)
);
```

**Enhanced Usage Service:**
```typescript
class UsageService {
  async incrementBillableConversation(workspaceId: string): Promise<void> {
    // A "billable conversation" = any conversation where an agent sends at least 1 reply
    await this.incrementMeter(workspaceId, 'billable_conversations');
    await this.checkAndNotifyLimits(workspaceId);
  }

  async incrementLyroConversation(workspaceId: string): Promise<void> {
    await this.incrementMeter(workspaceId, 'lyro_conversations');
    await this.checkAndNotifyLimits(workspaceId);
  }

  async checkAndNotifyLimits(workspaceId: string): Promise<void> {
    const usage = await this.getCurrentUsage(workspaceId);
    const plan = await this.getWorkspacePlan(workspaceId);

    // At 80%: warning notification
    if (usage.billable_conversations / plan.limits.billable_conversations >= 0.8) {
      await this.sendLimitWarning(workspaceId, 'billable_conversations');
    }

    // At 100%: block or auto-upgrade
    if (usage.billable_conversations >= plan.limits.billable_conversations) {
      await this.handleLimitReached(workspaceId, 'billable_conversations');
    }
  }
}
```

### Step 3: Feature Gating Middleware

```typescript
// middleware/featureGate.ts
function requireFeature(featureName: string) {
  return async (req, reply) => {
    const workspace = req.workspace;
    const plan = PLANS[workspace.plan_id || 'free'];

    if (!plan.features[featureName]) {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'FEATURE_NOT_AVAILABLE',
          message: `${featureName} is not available on your current plan.`,
          upgrade_to: getUpgradePlan(featureName),
        }
      });
    }
  };
}

// Usage:
router.get('/analytics/advanced', authenticate, requireFeature('advanced_analytics'), handler);
```

### Step 4: Trial Management

```typescript
// On registration, start 14-day trial
async createWorkspaceWithTrial(userId: string, name: string) {
  const workspace = await createWorkspace({
    name,
    owner_id: userId,
    plan_id: 'growth', // Trial with Growth features
    subscription_status: 'trialing',
    trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  });

  // Schedule trial expiry check
  await trialQueue.add('check_trial', { workspaceId: workspace.id }, {
    delay: 14 * 24 * 60 * 60 * 1000 // 14 days
  });

  return workspace;
}
```

### Step 5: Billing Dashboard API

- `GET /billing/current` — Current plan, usage, next billing date
- `GET /billing/invoices` — Invoice history
- `GET /billing/usage` — Current period usage breakdown
- `POST /billing/upgrade` — Upgrade plan (creates Stripe checkout)
- `POST /billing/downgrade` — Downgrade at period end
- `POST /billing/cancel` — Cancel subscription
- `GET /billing/portal` — Stripe customer portal URL

---

## Frontend Changes Required
> ⚠️ ASK USER BEFORE IMPLEMENTING

- Settings → Billing page: current plan card, usage bars, upgrade/downgrade buttons
- Invoice history table
- Usage limit warning banners (80%, 100%)
- Upgrade modals when feature-gated endpoints return 403
- Plan comparison page
