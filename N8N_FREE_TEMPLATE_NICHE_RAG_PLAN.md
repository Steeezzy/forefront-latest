# N8N Free Template Niche RAG Plan

This plan powers a webhook-free niche automation recommendation engine in this project.

## Category Coverage

- AI
- Sales
- IT Ops
- Marketing
- Document Ops
- Support
- Other

## Included Free-Template Knowledge (Seed Set)

The backend knowledge base currently includes representative free templates from each category, including:

- AI: RAG chatbot for company docs, chat with database, Gmail auto-labeling, local RAG with Ollama.
- Sales: company news before calls, Salesforce sync from Sheets, Google Maps lead gen, AI SDR pipeline.
- IT Ops: workflow backup, error alerting, SSL monitoring, auto-heal workflow patterns.
- Marketing: YouTube summarization, Search Console exports, LinkedIn content automation, competitor pricing monitor.
- Document Ops: CV screening, expense extraction, PDF parsing, OCR invoice extraction.
- Support: human-in-loop email response, website chatbot, WhatsApp support bot, ITSM ticket automation.
- Other: hiring automation, onboarding automation, AI scrum assistant, email-to-Jira.

## Niche-Focused Output

The recommender generates, for each client niche:

- Best-fit template set by business problem and selected categories.
- Non-technical implementation blueprint (phase-wise actions).
- Required app checklist and launch checklist.
- New industry opportunities for expansion.

## Webhook-Free Rule

- Public webhook-dependent templates are excluded by default.
- Recommendations prefer schedule, polling, inbox, manual, chat, and internal event trigger modes.

## Backend APIs

- `GET /api/workflows/niche-rag/categories`
- `GET /api/workflows/niche-rag/industries`
- `GET /api/workflows/niche-rag/templates`
- `POST /api/workflows/niche-rag/recommend`

## Frontend

- New planner UI: `/panel/automation/rag-workflows`
- Entry point button added in `/panel/automation`.
