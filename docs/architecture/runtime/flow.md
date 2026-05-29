# Runtime Flow

High-level execution path:

Frontend (web/widget/shopify)
  -> backend-api
     -> workflow-engine
        -> ai-runtime
           -> memory + rag
        -> worker-service
           -> notifications + integrations + voice-service

Rules:
- frontend calls backend-api only.
- backend-api only orchestrates by delegating to workflow-engine.
- workflow-engine owns cross-domain orchestration.
