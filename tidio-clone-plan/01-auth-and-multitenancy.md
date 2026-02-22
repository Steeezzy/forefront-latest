# 01 — Auth & Multi-Tenancy

## Current State
- ✅ JWT-based auth with HttpOnly cookies
- ✅ Register/Login/Logout/Me endpoints
- ✅ Single user per workspace (owner)
- ❌ No team invites or roles
- ❌ No password reset or email verification
- ❌ No OAuth/SSO

---

## What Tidio Has
- Email + password auth
- Google/Facebook SSO
- Team member invites with roles (Admin, Operator)
- Per-operator permissions (view/respond chats, manage settings)
- Workspace switching
- API key management (OpenAPI access on Plus plan)

---

## Implementation Plan

### Step 1: User Profile Enhancement
**Backend — `auth.service.ts` + schema migration**

```sql
-- Migration: 003_user_profiles.sql
ALTER TABLE users ADD COLUMN name VARCHAR(255);
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN phone VARCHAR(50);
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN reset_token_expires_at TIMESTAMP WITH TIME ZONE;
```

**API Endpoints:**
- `PATCH /auth/profile` — Update name, avatar, phone
- `POST /auth/forgot-password` — Send reset email
- `POST /auth/reset-password` — Reset with token
- `POST /auth/verify-email` — Verify email token

### Step 2: Team Members & Roles
**Backend — New `team` module**

```sql
-- Migration: 004_team_members.sql
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'operator', -- 'admin' | 'operator'
  permissions JSONB DEFAULT '{}',
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending', -- pending | active | deactivated
  UNIQUE(workspace_id, user_id)
);
```

**API Endpoints:**
- `POST /team/invite` — Send invite email (requires admin role)
- `GET /team/members` — List workspace members
- `PATCH /team/members/:id` — Update role/permissions
- `DELETE /team/members/:id` — Remove member
- `POST /team/accept-invite` — Accept invitation (public, token-based)

**Permissions Object:**
```json
{
  "canViewChats": true,
  "canRespondChats": true,
  "canManageFlows": false,
  "canManageKnowledge": false,
  "canManageSettings": false,
  "canManageBilling": false,
  "canManageTeam": false
}
```

### Step 3: Workspace Management
**Backend — Enhance `workspaces` table**

```sql
-- Migration: 005_workspace_settings.sql
ALTER TABLE workspaces ADD COLUMN logo_url TEXT;
ALTER TABLE workspaces ADD COLUMN timezone VARCHAR(100) DEFAULT 'UTC';
ALTER TABLE workspaces ADD COLUMN default_language VARCHAR(10) DEFAULT 'en';
ALTER TABLE workspaces ADD COLUMN business_hours JSONB;
ALTER TABLE workspaces ADD COLUMN auto_reply_message TEXT;
ALTER TABLE workspaces ADD COLUMN offline_message TEXT;
```

**API Endpoints:**
- `GET /workspaces/current` — Get current workspace settings
- `PATCH /workspaces/current` — Update workspace settings
- `POST /workspaces` — Create additional workspace
- `GET /workspaces` — List user's workspaces

### Step 4: OAuth/SSO (Optional — Phase 5)
- Google OAuth via Passport.js or manual flow
- Facebook OAuth
- Store `oauth_provider` and `oauth_id` in users table

### Step 5: API Key Management
**Backend — New `api_keys` table**

```sql
-- Migration: 006_api_keys.sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL, -- bcrypt hash of the actual key
  key_prefix VARCHAR(10) NOT NULL, -- first 8 chars for display
  permissions JSONB DEFAULT '{}',
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP WITH TIME ZONE
);
```

**API Endpoints:**
- `POST /api-keys` — Generate new API key
- `GET /api-keys` — List keys (show prefix only)
- `DELETE /api-keys/:id` — Revoke key

---

## Frontend Changes Required
> ⚠️ ASK USER BEFORE IMPLEMENTING

- Settings → Account page: profile editing form
- Settings → Team page: invite members, manage roles
- Settings → API Keys page: generate/revoke keys
- Login page: "Forgot password?" link
- Signup page: email verification notice
