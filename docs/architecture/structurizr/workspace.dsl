workspace "Questron" "Platform architecture" {
  model {
    user = person "End User" "Web or widget user"
    admin = person "Operator" "Internal admin"

    shopify = softwareSystem "Shopify" "Commerce platform"
    voice = softwareSystem "Voice Provider" "Telephony services"
    notify = softwareSystem "Notification Provider" "Email and SMS"

    system = softwareSystem "Questron Platform" {
      web = container "Web App" "Internal dashboard" "Next.js"
      widget = container "Widget" "Embeddable chat" "Vite/React"
      shopifyApp = container "Shopify App" "Commerce integration UI"
      backend = container "Backend API" "API gateway/BFF" "Node.js"
      workflow = container "Workflow Engine" "Orchestration runtime"
      ai = container "AI Runtime" "LLM execution"
      memory = container "Memory" "Context persistence"
      rag = container "RAG" "Retrieval and search"
      worker = container "Worker Service" "Async execution"
      notifications = container "Notifications" "Outbound messaging"
      integrations = container "Integrations" "External connectors"
      analytics = container "Analytics" "Metrics ingestion"
      crm = container "CRM" "Customer state"
      voiceSvc = container "Voice Service" "Voice processing"
      bus = container "Event Bus" "Async events and queues" "Redis Streams/BullMQ"
      sharedTypes = container "Shared Contracts" "Types and events"
    }

    user -> widget "Uses"
    user -> web "Uses"
    admin -> web "Manages"

    web -> backend "Calls API"
    widget -> backend "Calls API"
    shopifyApp -> backend "Calls API"

    backend -> workflow "Dispatches commands"
    workflow -> ai "Runs"
    workflow -> crm "Reads/writes"
    workflow -> memory "Reads/writes"
    workflow -> rag "Queries"
    workflow -> notifications "Triggers"
    workflow -> integrations "Invokes"
    workflow -> analytics "Emits events"
    workflow -> worker "Schedules"

    worker -> bus "Consumes/produces"
    backend -> bus "Produces events"
    notifications -> bus "Consumes"
    integrations -> bus "Consumes"
    voiceSvc -> bus "Consumes"
    rag -> bus "Consumes"
    ai -> bus "Consumes"

    shopify -> integrations "Connected to"
    voice -> voiceSvc "Calls"
    notify -> notifications "Sends via"

    web -> sharedTypes "Uses"
    backend -> sharedTypes "Uses"
    workflow -> sharedTypes "Uses"
  }

  views {
    systemContext system {
      include *
      autolayout lr
    }

    container system {
      include *
      autolayout lr
    }
  }
}
