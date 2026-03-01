# 11 — Connect Domain: Full Implementation Plan

## Overview

Three domain features, all triggered from the **"Connect Domain"** button:

| Feature | Purpose | Where |
|---------|---------|-------|
| **A. Widget Embedding Domains** | Whitelist domains where the chat widget can load | RightSidebar → "Connect domain", Settings → Installation |
| **B. Custom Branded Domain** | Serve the live-chat page at `support.theircompany.com` | Settings → Chat Page |
| **C. Email Sending Domain** | Verify domain for SPF/DKIM/DMARC so emails come from `@theirdomain.com` | Settings → Email → Domains tab |

---

## Current State (What Exists)

- **Widget loader** (`public/loader.js`) — loads from hardcoded `localhost:3000`, no origin validation
- **Widget config** (`widget_configs` table) — appearance/behavior settings, no domain columns
- **Workspaces table** — has plan/billing columns, no domain columns
- **Email settings page** — Domains tab exists with empty table, "Add domain" button does nothing
- **RightSidebar** — "Connect domain" link is `<a href="#">` (no-op)
- **Backend** — zero domain infrastructure (no routes, services, or migrations)

---

## A. Widget Embedding Domains

### What It Does
Users whitelist domains (e.g., `myshop.com`, `*.myshop.com`) where their widget is allowed to load. The widget loader checks against this list and refuses to render on unauthorized domains.

### Database

**Migration: `031_domains.sql`**

```sql
-- Allowed widget embedding domains
CREATE TABLE IF NOT EXISTS widget_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    domain VARCHAR(500) NOT NULL,           -- e.g., "myshop.com" or "*.myshop.com"
    verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),         -- TXT record value for verification
    verification_method VARCHAR(50) DEFAULT 'dns_txt',  -- dns_txt | meta_tag | file_upload
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workspace_id, domain)
);
CREATE INDEX idx_widget_domains_workspace ON widget_domains(workspace_id);
CREATE INDEX idx_widget_domains_domain ON widget_domains(domain);
```

### Backend Routes

**File: `forefront-backend/src/modules/domains/domain.routes.ts`**

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/domains/widget` | Yes | List all widget domains for workspace |
| `POST` | `/domains/widget` | Yes | Add a new domain (generates verification token) |
| `DELETE` | `/domains/widget/:id` | Yes | Remove a domain |
| `POST` | `/domains/widget/:id/verify` | Yes | Trigger DNS TXT verification |
| `GET` | `/domains/widget/check` | No (public) | Widget calls this: `?domain=x&workspaceId=y` → returns `{ allowed: true/false }` |

### Backend Service

**File: `forefront-backend/src/modules/domains/domain.service.ts`**

```
class DomainService {
    // Widget domains
    addWidgetDomain(workspaceId, domain) → generates verification_token
    removeWidgetDomain(workspaceId, domainId)
    listWidgetDomains(workspaceId) → returns all domains
    verifyWidgetDomain(workspaceId, domainId) → uses Node.js dns.resolveTxt()
    isWidgetDomainAllowed(workspaceId, origin) → checks against whitelist + wildcards
    
    // DNS verification engine (shared)
    generateVerificationToken(workspaceId) → "antigravity-verify=<uuid>"
    checkDnsTxtRecord(domain, expectedToken) → boolean
    pollDnsVerification(domainId) → runs on interval until verified or timeout
}
```

### DNS Verification Logic

```typescript
import dns from 'dns/promises';

async checkDnsTxtRecord(domain: string, expectedToken: string): Promise<boolean> {
    try {
        const records = await dns.resolveTxt(domain);
        const flat = records.flat();
        return flat.some(r => r.includes(expectedToken));
    } catch {
        return false;
    }
}
```

### Widget Loader Update

**File: `public/loader.js`** — Add origin check:

```javascript
// Before mounting widget, check if current domain is allowed
const currentDomain = window.location.hostname;
const resp = await fetch(`${API_BASE}/domains/widget/check?domain=${currentDomain}&workspaceId=${workspaceId}`);
const { allowed } = await resp.json();
if (!allowed) {
    console.warn('[Antigravity] Widget not authorized for this domain.');
    return;
}
```

### Frontend Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `DomainConnectModal` | `src/components/settings/domains/DomainConnectModal.tsx` | Modal: enter domain, see DNS records to add, verify button |
| `WidgetDomainsTable` | `src/components/settings/domains/WidgetDomainsTable.tsx` | Table showing all domains with status badges |
| `DnsRecordDisplay` | `src/components/settings/domains/DnsRecordDisplay.tsx` | Copyable DNS record instructions |

### User Flow

```
1. User clicks "Connect domain" (RightSidebar or Installation tab)
2. DomainConnectModal opens
3. User enters domain: "myshop.com"
4. Backend generates verification token: "antigravity-verify=abc123"
5. Modal shows: "Add this TXT record to your DNS settings:"
   ┌──────────────────────────────────────────────┐
   │ Type: TXT                                     │
   │ Host: @                                       │
   │ Value: antigravity-verify=abc123              │
   │                              [Copy]           │
   └──────────────────────────────────────────────┘
6. User adds TXT record at their DNS provider
7. User clicks "Verify" → backend checks dns.resolveTxt()
8. If found → domain marked verified, widget now loads on that domain
9. If not found → "Record not found yet. DNS can take up to 48h. We'll keep checking."
   → Backend starts background polling (check every 5 min for 48h)
```

---

## B. Custom Branded Domain (Chat Page)

### What It Does
Users point `support.theirdomain.com` to Antigravity so their public chat page is served at their own domain instead of `app.antigravity.com/chat/workspace-id`.

### Database Addition

```sql
-- Add to 031_domains.sql
CREATE TABLE IF NOT EXISTS custom_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    domain VARCHAR(500) NOT NULL UNIQUE,     -- "support.myshop.com"
    target_type VARCHAR(50) DEFAULT 'chat_page',  -- chat_page | knowledge_base
    
    -- DNS verification
    verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    cname_target VARCHAR(255) DEFAULT 'custom.antigravity.com',  -- what CNAME should point to
    
    -- SSL
    ssl_status VARCHAR(50) DEFAULT 'pending',    -- pending | provisioning | active | failed
    ssl_expires_at TIMESTAMPTZ,
    
    -- Timestamps
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_custom_domains_domain ON custom_domains(domain);
CREATE INDEX idx_custom_domains_workspace ON custom_domains(workspace_id);
```

### Backend Routes (added to `domain.routes.ts`)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/domains/custom` | Yes | List custom domains for workspace |
| `POST` | `/domains/custom` | Yes | Add custom domain |
| `DELETE` | `/domains/custom/:id` | Yes | Remove custom domain |
| `POST` | `/domains/custom/:id/verify` | Yes | Verify CNAME record |
| `GET` | `/domains/custom/resolve/:domain` | No (public) | Look up which workspace owns this domain |

### DNS Records Required

```
Type: CNAME
Host: support              (or whatever subdomain)
Value: custom.antigravity.com

Type: TXT
Host: _antigravity.support (verification subdomain)
Value: antigravity-verify=<token>
```

### Service Methods

```
class DomainService {
    // Custom domain
    addCustomDomain(workspaceId, domain)
    removeCustomDomain(workspaceId, domainId)
    verifyCustomDomain(workspaceId, domainId) → checks CNAME + TXT
    resolveCustomDomain(hostname) → returns workspaceId
    
    // CNAME verification
    checkCnameRecord(domain, expectedTarget) → uses dns.resolveCname()
}
```

### Reverse Proxy / SSL Strategy

**For Development (local):**
- Skip SSL, use host header matching in Next.js middleware
- Add to `src/middleware.ts`: check `req.headers.host`, look up workspace, rewrite to `/chat/[workspaceId]`

**For Production (choose one):**

| Approach | Effort | How |
|----------|--------|-----|
| **Caddy** (recommended) | Medium | `on_demand_tls` directive auto-provisions Let's Encrypt certs. Caddy calls your `/domains/custom/resolve/:domain` endpoint to validate before issuing cert. |
| **Cloudflare for SaaS** | Low | Use Cloudflare's Custom Hostnames API. They handle SSL + routing. $2/domain/month at scale. |
| **Nginx + Certbot** | High | Manual cert management, cron jobs for renewal. Not recommended. |

**Caddy Config Example (production):**
```
{
    on_demand_tls {
        ask http://localhost:3001/domains/custom/resolve/check
    }
}

:443 {
    tls {
        on_demand
    }
    reverse_proxy localhost:3000 {
        header_up X-Forwarded-Host {host}
        header_up X-Custom-Domain {host}
    }
}
```

### Next.js Middleware Update

**File: `src/middleware.ts`**

```typescript
// Check if request is from a custom domain
const host = request.headers.get('x-custom-domain') || request.headers.get('host');
if (host && !host.includes('localhost') && !host.includes('antigravity.com')) {
    // Look up workspace by custom domain
    const res = await fetch(`${BACKEND_URL}/domains/custom/resolve/${host}`);
    if (res.ok) {
        const { workspaceId } = await res.json();
        // Rewrite to the chat page for this workspace
        return NextResponse.rewrite(new URL(`/chat/${workspaceId}`, request.url));
    }
}
```

---

## C. Email Sending Domain (SPF/DKIM/DMARC)

### What It Does
Allows users to send ticket/notification emails from `support@theirdomain.com` instead of `noreply@antigravity.com`. Requires DNS verification for deliverability.

### Database Addition

```sql
-- Add to 031_domains.sql
CREATE TABLE IF NOT EXISTS email_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    domain VARCHAR(500) NOT NULL,            -- "myshop.com"
    
    -- Verification records
    spf_verified BOOLEAN DEFAULT false,
    dkim_verified BOOLEAN DEFAULT false,
    dmarc_verified BOOLEAN DEFAULT false,
    
    -- DKIM keys
    dkim_selector VARCHAR(100),              -- e.g., "antigravity" → antigravity._domainkey.myshop.com
    dkim_public_key TEXT,                    -- public key to put in DNS
    dkim_private_key TEXT,                   -- private key for signing (encrypted at rest)
    
    -- Expected DNS records (shown to user)
    required_records JSONB DEFAULT '[]',
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending',    -- pending | partial | verified | failed
    verified_at TIMESTAMPTZ,
    last_checked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workspace_id, domain)
);
CREATE INDEX idx_email_domains_workspace ON email_domains(workspace_id);
```

### DNS Records Required (shown to user)

```
1. SPF Record:
   Type: TXT
   Host: @
   Value: v=spf1 include:mail.antigravity.com ~all

2. DKIM Record:
   Type: TXT
   Host: antigravity._domainkey
   Value: v=DKIM1; k=rsa; p=<generated-public-key>

3. DMARC Record:
   Type: TXT
   Host: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:dmarc@antigravity.com

4. Return-Path (CNAME):
   Type: CNAME
   Host: bounce
   Value: bounce.antigravity.com
```

### Backend Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/domains/email` | Yes | List email domains |
| `POST` | `/domains/email` | Yes | Add email domain (generates DKIM keys + required records) |
| `DELETE` | `/domains/email/:id` | Yes | Remove email domain |
| `POST` | `/domains/email/:id/verify` | Yes | Check all DNS records (SPF, DKIM, DMARC) |
| `GET` | `/domains/email/:id/records` | Yes | Get required DNS records to display |

### Service Methods

```
class EmailDomainService {
    addEmailDomain(workspaceId, domain) {
        // 1. Generate DKIM key pair (crypto.generateKeyPairSync)
        // 2. Create required_records JSON
        // 3. Store in email_domains
        // 4. Return records for user to add
    }
    
    verifyEmailDomain(workspaceId, domainId) {
        // Check each record type:
        // dns.resolveTxt(domain) → find SPF
        // dns.resolveTxt(`${selector}._domainkey.${domain}`) → find DKIM
        // dns.resolveTxt(`_dmarc.${domain}`) → find DMARC
        // Update individual verified flags
    }
    
    generateDkimKeys() → { publicKey, privateKey, selector }
    checkSpfRecord(domain) → boolean
    checkDkimRecord(domain, selector, expectedKey) → boolean
    checkDmarcRecord(domain) → boolean
}
```

### DKIM Key Generation

```typescript
import crypto from 'crypto';

function generateDkimKeys() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    
    // Extract just the base64 part for DNS record
    const dnsPublicKey = publicKey
        .replace('-----BEGIN PUBLIC KEY-----', '')
        .replace('-----END PUBLIC KEY-----', '')
        .replace(/\n/g, '');
    
    return {
        publicKey: dnsPublicKey,
        privateKey, // store encrypted
        selector: 'antigravity',
    };
}
```

---

## Implementation Order

### Phase 1: Foundation (1-2 days)
| Step | Task | Files |
|------|------|-------|
| 1.1 | Create migration `031_domains.sql` with all 3 tables | `forefront-backend/migrations/031_domains.sql` |
| 1.2 | Run migration | Terminal |
| 1.3 | Create `DomainService` with DNS verification engine | `forefront-backend/src/modules/domains/domain.service.ts` |
| 1.4 | Create domain routes (widget + custom + email) | `forefront-backend/src/modules/domains/domain.routes.ts` |
| 1.5 | Register routes in `app.ts` | `forefront-backend/src/app.ts` |

### Phase 2: Widget Domains UI (1 day)
| Step | Task | Files |
|------|------|-------|
| 2.1 | Create `DomainConnectModal` component | `src/components/settings/domains/DomainConnectModal.tsx` |
| 2.2 | Create `DnsRecordDisplay` component | `src/components/settings/domains/DnsRecordDisplay.tsx` |
| 2.3 | Create `WidgetDomainsTable` component | `src/components/settings/domains/WidgetDomainsTable.tsx` |
| 2.4 | Wire "Connect domain" link in `RightSidebar.tsx` | `src/components/dashboard/RightSidebar.tsx` |
| 2.5 | Add domain list to Installation tab in settings | `src/components/settings/InstallationView.tsx` |
| 2.6 | Update widget `loader.js` with domain check | `public/loader.js` |

### Phase 3: Email Domain UI (1 day)
| Step | Task | Files |
|------|------|-------|
| 3.1 | Create `AddEmailDomainModal` component | `src/components/settings/email/AddEmailDomainModal.tsx` |
| 3.2 | Create `EmailDnsRecords` component (SPF/DKIM/DMARC display) | `src/components/settings/email/EmailDnsRecords.tsx` |
| 3.3 | Wire "Add domain" button in Email → Domains tab | `src/app/panel/settings/email/page.tsx` |
| 3.4 | Populate domains table with real data from API | `src/app/panel/settings/email/page.tsx` |
| 3.5 | Add DKIM key generation to backend | `forefront-backend/src/modules/domains/domain.service.ts` |

### Phase 4: Custom Branded Domain (1-2 days)
| Step | Task | Files |
|------|------|-------|
| 4.1 | Create `CustomDomainSettings` component | `src/components/settings/domains/CustomDomainSettings.tsx` |
| 4.2 | Add to Chat Page settings view | `src/components/settings/ChatPageView.tsx` |
| 4.3 | Add Next.js middleware for custom domain routing | `src/middleware.ts` |
| 4.4 | Create public chat page route if not exists | `src/app/chat/[workspaceId]/page.tsx` |
| 4.5 | (Production only) Caddy/Cloudflare SSL config | Infrastructure |

### Phase 5: Background Polling & Polish (0.5 day)
| Step | Task | Files |
|------|------|-------|
| 5.1 | Add DNS polling service (cron-style, checks every 5 min) | `forefront-backend/src/services/DnsPollingService.ts` |
| 5.2 | Add domain status webhooks/SSE for real-time UI updates | `forefront-backend/src/modules/domains/domain.routes.ts` |
| 5.3 | Add toast notifications for verification success | Frontend |
| 5.4 | Update "Tidio" branding references → "Antigravity" | Email settings page |

---

## File Tree (New Files)

```
forefront-backend/
  migrations/
    031_domains.sql                          ← 3 tables
  src/
    modules/
      domains/
        domain.routes.ts                     ← 12 API endpoints
        domain.service.ts                    ← DNS verification, DKIM generation
    services/
      DnsPollingService.ts                   ← Background DNS checker

src/
  components/
    settings/
      domains/
        DomainConnectModal.tsx               ← Main "Connect Domain" modal
        DnsRecordDisplay.tsx                 ← Copyable DNS record card
        WidgetDomainsTable.tsx               ← Widget domains list
        CustomDomainSettings.tsx             ← Custom domain config
      email/
        AddEmailDomainModal.tsx              ← Email domain modal with SPF/DKIM/DMARC
        EmailDnsRecords.tsx                  ← Email DNS records display
```

---

## API Summary (12 Endpoints)

```
── Widget Domains ──
GET    /domains/widget                  → List whitelisted domains
POST   /domains/widget                  → Add domain (+ generate token)
DELETE /domains/widget/:id              → Remove domain
POST   /domains/widget/:id/verify       → DNS TXT verification
GET    /domains/widget/check            → Public: is domain allowed? (widget calls this)

── Custom Branded Domain ──
GET    /domains/custom                  → List custom domains
POST   /domains/custom                  → Add custom domain
DELETE /domains/custom/:id              → Remove custom domain
POST   /domains/custom/:id/verify       → CNAME + TXT verification
GET    /domains/custom/resolve/:domain  → Public: lookup workspace by domain

── Email Domains ──
GET    /domains/email                   → List email domains
POST   /domains/email                   → Add domain (generates DKIM keys)
DELETE /domains/email/:id               → Remove domain
POST   /domains/email/:id/verify        → Check SPF + DKIM + DMARC
GET    /domains/email/:id/records       → Get required DNS records
```

---

## Key Dependencies

| Dependency | Purpose | Already Available? |
|------------|---------|-------------------|
| `dns/promises` | DNS lookups (TXT, CNAME, MX) | ✅ Node.js built-in |
| `crypto` | DKIM RSA key generation | ✅ Node.js built-in |
| Caddy or Cloudflare | SSL for custom domains (production) | ❌ Infrastructure |
| No external packages needed for DNS | Everything uses Node.js `dns` module | ✅ |

---

## Security Considerations

1. **Rate limiting** on `/domains/widget/check` (public endpoint) — prevent abuse
2. **DNS verification is mandatory** before marking domain as active — prevents domain spoofing
3. **DKIM private keys** must be encrypted at rest in the database
4. **Widget origin check** should also validate against `Referer` header as fallback
5. **Custom domain resolve** endpoint should be cached (Redis, 5-min TTL) to avoid DB hit on every request
6. **Wildcard domains** (`*.myshop.com`) require extra validation — only allow if base domain is verified first
