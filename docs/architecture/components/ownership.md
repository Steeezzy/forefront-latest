# Domain Ownership

| Module          | Responsibility         |
| --------------- | ---------------------- |
| backend-api     | external API gateway   |
| workflow-engine | orchestration runtime  |
| ai-runtime      | LLM execution          |
| memory          | contextual persistence |
| rag             | retrieval and search   |
| worker-service  | async execution        |
| notifications   | outbound messaging     |
| integrations    | external systems       |
| crm             | customer state         |
| analytics       | metrics ingestion      |
| voice-service   | voice processing       |
| shared-types    | shared contracts       |
| shared-ui       | shared UI primitives   |

Notes:
- backend-api must stay thin and delegate orchestration to workflow-engine.
- shared-types must not depend on other domains.
