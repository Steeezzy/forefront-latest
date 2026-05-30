# Qestron Master Memory And Architecture

Created: 2026-05-21
Status: Phase 2 backend foundation started. VAPI code exists, but DB migration still needs to be run before using the new VAPI routes in a live backend.

Secret setup note: `VAPI_MASTER_KEY` has been added to the ignored local backend env file at `forefront-backend/.env`. The value must never be copied into tracked files, docs, frontend code, or logs.

## Why This Note Exists

This is the current architecture memory for Qestron after reviewing the Claude conversation and inspecting the local project. It records the decisions, current repo truth, planned VAPI/Hermes direction, gateway architecture, and staged execution plan so future work does not restart from confusion.

Current execution scope: VAPI backend foundation only. Do not restructure the repo or start gateway/monorepo work until the VAPI backend is validated.

## 2026-05-21 Build Update

Implemented the first VAPI backend slice:

- Added additive migration `forefront-backend/migrations/110_vapi_voice_integration.sql`.
- Added VAPI env config in `forefront-backend/src/config/env.ts`.
- Added VAPI service wrapper in `forefront-backend/src/services/vapi.service.ts`.
- Added VAPI routes in `forefront-backend/src/modules/vapi/vapi.routes.ts`.
- Registered VAPI routes in `forefront-backend/src/app.ts`.
- Added non-blocking VAPI assistant sync hooks to `forefront-backend/src/modules/voice/voice.routes.ts`.

New backend endpoints:

- `GET /api/vapi/health`
- `POST /api/vapi/voice-agents/:id/sync`
- `POST /api/vapi/tools`
- `POST /api/webhooks/vapi`

Build note: `npm run build` in `forefront-backend` now passes. A shared integration event contact type was updated to include `source`, matching existing webhook payload usage.

## What Was Reviewed

- The Claude conversation about Hermes Agent, VAPI, platform key abstraction, the three gateway system, and monorepo structure.
- The local repo at `/Users/karthikj/Downloads/forefrontthemeclone`.
- The repo is also the Obsidian vault because `.obsidian/` exists at the root.
- Existing frontend/backend shape:
  - Frontend: Next.js app in `src/app`.
  - Backend: Fastify app in `forefront-backend`.
  - Current voice UI: `src/components/voice-agents/CreateAgentModal.tsx`.
  - Current voice backend: `forefront-backend/src/modules/voice/voice.routes.ts`.
  - Current Twilio voice webhook: `forefront-backend/src/webhooks/twilioVoice.routes.ts`.
  - Current Sarvam client: `forefront-backend/src/services/SarvamClient.ts`.
- Existing agent/orchestration shape:
  - Hermes MCP server exists at `forefront-backend/mcp/qestron-mcp-server.js`.
  - Hermes config snippet exists at `forefront-backend/mcp/hermes-config-snippet.yaml`.
  - Backend MCP routes exist at `forefront-backend/src/modules/mcp/mcp.routes.ts`.
  - Anthropic Managed Agent service exists at `forefront-backend/src/services/anthropic-managed-agent.service.ts`.
  - Managed agent run logging exists through `forefront-backend/migrations/108_managed_agent_runs.sql`.
- Existing customer intelligence foundation:
  - Memory Agent summary exists at `PHASE1_MEMORY_AGENT.md`.
  - Customer memory tables exist in `forefront-backend/migrations/062_customer_memory.sql`.

## Locked Decisions

### VAPI Usage

Qestron will not send customers to VAPI's website. VAPI is infrastructure only.

The user-facing control plane is Qestron's own UI at `app.qestron.com`. Qestron's backend calls VAPI's REST APIs using Qestron's master key. Customers configure voice agents inside Qestron, and VAPI runs invisibly underneath.

VAPI is treated like Stripe: users interact with Qestron, while the external provider runs under the hood.

### Platform Key Abstraction

Users should not bring their own VAPI, Kimi, Anthropic, ElevenLabs, Sarvam, or Twilio keys by default.

Qestron owns and stores provider keys in the backend vault/environment. All external calls are proxied through `api.qestron.com`, and usage is attributed to each workspace.

This creates one Qestron account, one bill, and no provider setup for the customer.

### Voice Stack

Old direction:

```text
Twilio -> manual STT -> Kimi/Claude/Sarvam routing -> ElevenLabs/Sarvam TTS -> Twilio
```

New direction:

```text
Twilio Indian numbers -> VAPI voice runtime
  -> STT provider: Deepgram or Sarvam
  -> LLM provider: Kimi/Moonshot or another configured endpoint
  -> TTS provider: ElevenLabs or Sarvam
  -> Tool calls: Qestron backend
```

Twilio remains important for Indian phone numbers and telephony ownership. VAPI handles the live voice interaction stack.

### Hermes vs Claude Managed Agents

Hermes is the background/autonomous orchestrator. Claude Managed Agents are a reasoning transport Hermes or the backend can use.

Hermes should not be treated as the realtime phone-call engine. VAPI owns realtime call flow, speech, streaming, and voice tool-call timing. Hermes owns background intelligence, scheduled tasks, cross-workspace operations, diagnostics, retries, and self-improving skills.

Claude Managed Agents should remain available for structured reasoning, JSON extraction, transcript analysis, support diagnostics, and other tasks where Hermes/backend need Claude's reasoning. Existing backend support should be reused rather than replaced blindly.

Important boundary:

```text
VAPI = realtime voice interaction runtime
Fastify backend = source of truth, auth, billing, usage, DB writes, secure provider proxy
Hermes = autonomous background operator through approved tools/MCP
Claude Managed Agents = reasoning sessions used by Hermes/backend
```

### Three Gateways

Gateway 1: Admin Builder at `app.qestron.com`

- Client owner/admin control panel.
- Voice agent builder.
- Chatbot configuration.
- CRM.
- Staff management.
- Website/domain setup.
- Worker PWA access tokens.
- Onboarding and partner help.
- Billing and usage.

Gateway 2: Worker PWA at `[client].qestron.app`

- Staff-facing app for doctors, receptionists, nurses, admins, and other roles.
- First open imports a workspace using URL/token or invite flow.
- Role is encoded server-side and enforced on every API call.
- UI changes based on role, but authorization never trusts only the client.

Gateway 3: Developer Portal at `dev.qestron.com`

- Internal team, partner agents, and enterprise developer access.
- VAPI assistant debugger and raw config editor.
- Niche Pack Studio.
- Integration Builder.
- Workspace inspector.
- Agent session debugger.
- Hermes console.
- API docs and sandbox.
- Platform analytics.

### Repo Layout

Use staged migration to a pnpm/Turbo monorepo. Do not immediately move everything, because the current repo already has many existing changes and working app/backend paths.

Target final structure:

```text
qestron/
  apps/
    web/          # Gateway 1 admin builder
    pwa/          # Gateway 2 worker app
    dev-portal/   # Gateway 3 developer portal
    marketing/    # qestron.com
    api/          # api.qestron.com Fastify backend
  packages/
    db/
    types/
    ui/
    config/
    agents/
```

Current structure stays in place until the migration phase:

```text
forefrontthemeclone/
  src/                 # current Next.js app
  forefront-backend/   # current Fastify backend
  .obsidian/           # vault config
```

## Implementation Roadmap

### Phase 1: Memory Note

- Create `QESTRON_MASTER_MEMORY.md`.
- Confirm it renders as plain Markdown in Obsidian.
- No code changes.
- No repo restructuring.

### Phase 2: VAPI Backend Foundation

Add backend support without changing the frontend first.

- Environment/config:
  - `VAPI_MASTER_KEY`
  - `VAPI_WEBHOOK_SECRET`
  - provider keys for Kimi/Moonshot, ElevenLabs, Sarvam, Deepgram, Twilio as needed
- Database:
  - Add VAPI assistant IDs to voice agents.
  - Add VAPI phone number/call IDs to phone/call records.
  - Add webhook event logging.
  - Add per-workspace voice-minute usage tracking.
- Routes:
  - `POST /api/webhooks/vapi`
  - `POST /api/vapi/tools`
  - Admin/internal routes for provisioning assistants and syncing config.
- Security:
  - Verify VAPI webhook authenticity.
  - Do not expose provider keys to frontend.
  - Make all tool calls workspace-scoped.

### Phase 3: Connect Current Voice Agent UI To VAPI

- Creating a Qestron voice agent provisions a VAPI assistant.
- Updating a Qestron voice agent updates the linked VAPI assistant.
- Deleting or disabling a voice agent disables the VAPI assistant or unlinks it safely.
- Phone number assignment links a Twilio/imported number to the VAPI assistant.
- Voice preview remains supported, either through current Sarvam preview or a provider-specific preview abstraction.
- VAPI tool calls should call Qestron backend for:
  - doctor/staff availability
  - appointment creation/rescheduling
  - CRM/customer lookup
  - support ticket creation
  - SMS/email/in-app notifications
  - interaction logging

### Phase 4: Expand Hermes

Extend the existing Hermes MCP bridge instead of creating a separate orchestration system.

- Add MCP/backend tools for:
  - VAPI health and call quality checks
  - processing completed VAPI calls
  - triggering Memory Agent work
  - triggering Care/Ops/Security/Finance/Growth workflows
  - workspace diagnostics
  - managed agent run history
- Keep deterministic writes in Fastify:
  - billing
  - auth
  - usage limits
  - provider key access
  - database updates
  - audit logs
- Hermes calls approved backend tools and records outcomes.

### Phase 5: Build The Gateways

- Gateway 1 starts from the current `src/app/panel` experience and evolves into the admin builder.
- Gateway 2 should be added after the worker token, role, and server authorization model are finalized.
- Gateway 3 should be added after VAPI logs, Hermes logs, and workspace inspection data exist.
- Do not build Gateway 3 as a visual shell first. It should be useful for debugging real VAPI/Hermes/backend state.

### Phase 6: Staged Monorepo Migration

- Baseline current builds before moving files.
- Add `pnpm-workspace.yaml` and `turbo.json`.
- Move current frontend into `apps/web`.
- Move `forefront-backend` into `apps/api`.
- Add package aliases only after builds pass.
- Add `apps/pwa` and `apps/dev-portal` after shared package boundaries are clear.
- Create shared packages:
  - `packages/types`
  - `packages/ui`
  - `packages/db`
  - `packages/agents`
  - `packages/config`

## Testing And Acceptance Criteria

### Phase 1

- `QESTRON_MASTER_MEMORY.md` exists in the vault root.
- Markdown renders cleanly in Obsidian.
- No app/backend files changed.

### Before VAPI Work

- Run current frontend build and backend build to capture baseline failures.
- Record any existing failures before introducing VAPI changes.

### VAPI Foundation

- Webhook signature validation works.
- VAPI webhook payloads are logged idempotently.
- VAPI tool-call handler returns valid JSON for success and failure cases.
- Assistant provisioning creates and stores the VAPI assistant ID.
- Assistant updates are idempotent and workspace-scoped.
- Call-ended webhook creates or updates interaction logs.
- Usage metering records voice minutes by workspace.

### Hermes

- Hermes can discover Qestron MCP tools.
- MCP token protection rejects invalid requests.
- Hermes can trigger memory sync.
- Managed agent runs are logged.
- Failed tasks are visible and retryable.
- Hermes cannot bypass Fastify authorization or billing rules.

### Gateways

- Gateway 1 admin flows configure real backend state.
- Gateway 2 role UI matches server-enforced permissions.
- Gateway 3 shows real VAPI/Hermes/backend logs.
- Each app can run independently after monorepo migration.

## Key Risks

- Do not let Hermes become an unrestricted database writer. It should act through audited backend tools.
- Do not duplicate VAPI state and Qestron state without clear ownership. Qestron DB should store canonical workspace config; VAPI stores the runtime assistant representation.
- Do not expose provider keys to users or frontend bundles.
- Do not migrate to monorepo before capturing baseline build state.
- Do not build the developer portal before there are real logs and operations to inspect.
- Re-verify VAPI and Hermes docs before implementation because provider APIs can change.

## Reference Links

- Hermes v0.14.0 release: https://github.com/NousResearch/hermes-agent/releases/tag/v2026.5.16
- VAPI tools and tool calls: https://docs.vapi.ai/tools/
- VAPI webhook events: https://docs.vapi.ai/cli/webhook
- VAPI phone calling and Twilio import: https://docs.vapi.ai/phone-calling

## Short Answer To The Original Confusion

Yes, Qestron can use VAPI fully inside its own website. Users do not need to visit VAPI. Qestron's frontend collects configuration, Qestron's backend stores it, and Qestron's backend provisions/updates VAPI through the API.

Hermes should not do everything. It should run the background OS-agent layer: memory, ops, care, security, finance, growth, diagnostics, and long-running automation. VAPI should handle realtime voice calls. Fastify should remain the controlled backend and source of truth. Claude Managed Agents remain a reasoning option used by Hermes/backend where useful.
