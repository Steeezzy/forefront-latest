# Tidio Clone — Architecture & Overview

## 🎯 Goal
Build a full-featured **AI-powered customer support platform** (Tidio competitor) with multilingual support (22 Indian languages + English) using **Sarvam AI** as the primary AI provider.

---

## 📊 What's Already Built

### Frontend (Next.js 15 + TailwindCSS)
| Area | Status | Notes |
|------|--------|-------|
| Landing Page | ✅ Complete | Dark theme, animations, hero sections |
| Auth (Login/Signup) | ✅ Complete | Cookie-based JWT flow |
| Panel Layout | ✅ Complete | Sidebar + Topbar + routing |
| Dashboard | ✅ Complete | Static overview cards |
| Chatbot Config | ✅ Complete | Agent settings, name, tone, system prompt |
| Data Sources | ✅ Complete | Website, CSV, Zendesk, Manual Q&A import modals |
| Playground (Test Lyro) | ✅ Complete | Socket-based test chat against knowledge base |
| Flows Pages | ⚠️ Shell Only | Routes exist (my-flows, templates, leads, sales, support, welcome) but no flow builder or logic |
| Inbox | ⚠️ Shell Only | Static empty state + integration grid. No real conversation list or chat view |
| Analytics | ⚠️ Partial | Overview tab + AI Support tab with mock data. No backend integration |
| Settings | ⚠️ Shell Only | Account, email, social media, macros, operating hours, notifications, workflows pages exist but are mostly placeholders |
| Widget | ⚠️ Minimal | Basic `index.tsx` and `chat-widget.tsx` exist but are stubs |
| Integrations | ⚠️ Shell Only | Page exists, no actual integrations |

### Backend (Fastify + TypeScript)
| Module | Status | Notes |
|--------|--------|-------|
| Auth | ✅ Complete | Register, login, logout, /me endpoint. JWT + HttpOnly cookies |
| Agents | ✅ Complete | CRUD for AI agents (system prompt, tone, goals) |
| Knowledge Base | ✅ Complete | Website scraping, CSV import, Zendesk import, Manual Q&A. pgvector embeddings |
| RAG Service | ✅ Complete | Semantic search → Sarvam AI chat completion |
| Chat Service | ✅ Complete | Conversations + messages CRUD |
| Socket.IO | ✅ Complete | Real-time messaging with AI auto-response |
| Billing | ✅ Complete | Stripe + Razorpay providers, webhook handling, plan management |
| Usage Tracking | ✅ Complete | Message count tracking + limit enforcement |
| AI Service | ✅ Complete | Sarvam AI integration + embedding generation |
| Flows Engine | ❌ Missing | DB table exists but no CRUD API or execution engine |
| Inbox Backend | ❌ Missing | No conversation list/filter/search/assign API |
| Analytics Backend | ❌ Missing | No metrics aggregation endpoints |
| Visitor Tracking | ❌ Missing | No real-time visitor presence or page tracking |
| Multi-Channel | ❌ Missing | No WhatsApp, Messenger, Instagram, or email integrations |
| Widget API | ❌ Missing | No widget config/embed endpoint |

### Database (PostgreSQL + pgvector)
**Existing tables:** `users`, `workspaces`, `agents`, `conversations`, `messages`, `flows`, `usage_logs`, `billing_events`, `invoices`, `usage_credits`, `idempotency_keys`, `knowledge_sources`, `knowledge_vectors`

---

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 15, React 19, Tailwind, Framer Motion | UI/UX |
| Backend | Fastify, TypeScript | API Server |
| Real-time | Socket.IO | Live chat, visitor tracking |
| Primary DB | PostgreSQL + pgvector | Relational data + vector similarity |
| Cache | Redis (planned) | Sessions, rate limiting, presence |
| AI (Chat) | Sarvam AI | Multilingual chat completion |
| AI (Embeddings) | fastembed (BAAI/bge-small-en-v1.5) | Knowledge base vectorization |
| Billing | Stripe + Razorpay | Subscriptions & payments |
| Queue | BullMQ (planned) | Background jobs (scraping, indexing) |

---

## 📁 Plan Documents

| File | Topic |
|------|-------|
| [01-auth-and-multitenancy.md](./01-auth-and-multitenancy.md) | Auth hardening, team invites, roles, workspace management |
| [02-live-chat-inbox.md](./02-live-chat-inbox.md) | Real-time inbox, conversation management, agent assignment |
| [03-lyro-ai-chatbot.md](./03-lyro-ai-chatbot.md) | AI agent, RAG enhancement, smart actions, copilot |
| [04-flows-automation.md](./04-flows-automation.md) | Visual flow builder, triggers, conditions, actions |
| [05-knowledge-base.md](./05-knowledge-base.md) | Knowledge expansion, suggestions, product catalog |
| [06-analytics-dashboard.md](./06-analytics-dashboard.md) | Metrics backend, real-time analytics, reports |
| [07-widget-embedding.md](./07-widget-embedding.md) | Embeddable chat widget, customization, installation |
| [08-channels-integrations.md](./08-channels-integrations.md) | WhatsApp, Messenger, Instagram, email, Shopify |
| [09-billing-plans.md](./09-billing-plans.md) | Tiered pricing, usage-based billing, metering |
| [10-deployment-ops.md](./10-deployment-ops.md) | Docker, CI/CD, monitoring, scaling |

---

## 🚀 Implementation Priority

```
Phase 1 (Core):  Auth hardening → Live Inbox → Widget
Phase 2 (AI):    Lyro AI enhancement → Knowledge Base expansion
Phase 3 (Auto):  Flows Engine → Automation builder
Phase 4 (Scale): Analytics → Multi-channel → Billing polish
Phase 5 (Ship):  Deployment → Monitoring → Documentation
```
