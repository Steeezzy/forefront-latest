# Queue Ownership

| Queue            | Owner           |
| ---------------- | --------------- |
| ai-jobs          | ai-runtime      |
| embeddings       | rag             |
| campaign-jobs    | workflow-engine |
| notifications    | notifications   |
| voice-processing | voice-service   |

Rules:
- Only the owner can change schema or retry policies.
- Consumers must use shared-types event contracts.
