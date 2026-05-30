const fs = require('fs');

const outputPath = '/Users/karthikj/Downloads/forefrontthemeclone/.understand-anything/intermediate/tour.json';

const tour = [
  {
    order: 1,
    title: "Project Overview",
    description: "Welcome to the AI-powered Customer Support Platform. Start with the main project README to understand the core monorepo architecture, design goals, and modular backend and frontend relationships.",
    nodeIds: ["document:README.md"]
  },
  {
    order: 2,
    title: "Backend Bootstrapping & Entry",
    description: "Examine how the backend initializes, loads database connections for PostgreSQL and MongoDB, initializes Redis cache layers, sets up Express middlewares, and prepares the Socket.io real-time chat gateway.",
    nodeIds: ["file:forefront-backend/src/index.ts", "config:forefront-backend/package.json"],
    languageLesson: "The backend codebase leverages NodeNext module resolution inside its TypeScript settings to cleanly integrate native ES module imports with standard Node.js libraries."
  },
  {
    order: 3,
    title: "Primary Indian AI Client",
    description: "Explore the custom Sarvam AI service client designed to deliver robust multilingual chatbot conversations, automatic language identification, translation, and speech-to-text transitions across 22 Indian languages.",
    nodeIds: ["file:forefront-backend/src/services/SarvamClient.ts"],
    languageLesson: "Graceful failovers are essential in AI integrations. When calling the Sarvam APIs, we wrap requests in exponential backoffs and fallback pipelines if standard quotas are reached."
  },
  {
    order: 4,
    title: "RAG Engine & Vector Operations",
    description: "Trace how knowledge bases are ingested and parsed. This step reveals the semantic chunking flow and how vector embeddings are generated and migrated to fuel intelligent Q&A and copilot answers.",
    nodeIds: ["file:forefront-backend/src/services/rag/EmbeddingService.ts", "file:forefront-backend/src/services/rag/ConversaService.ts"]
  },
  {
    order: 5,
    title: "State-Machine Chatbot Workflows",
    description: "Analyze the core workflow engine responsible for stepping through visual chatbot flows. It handles conditional branching, customer lead captures, wait durations, and custom automated email replies.",
    nodeIds: ["file:forefront-backend/src/services/flow/FlowExecutionEngine.ts", "file:forefront-backend/src/services/flow/NodeExecutorRegistry.ts"]
  },
  {
    order: 6,
    title: "PostgreSQL Database Schema",
    description: "Inspect the database layout that persists relational states, including knowledge base configurations, team structures, visitor sessions, and custom CRM tables.",
    nodeIds: ["table:forefront-backend/migrations/002_knowledge_base_expansion.sql", "table:forefront-backend/migrations/003_user_profiles.sql"],
    languageLesson: "Each relational database update uses numbered, transactional schema migrations (up and down) to maintain database version control safely."
  },
  {
    order: 7,
    title: "Shopify Theme Extension",
    description: "Understand how the platform achieves a 'zero-config' installation on Shopify shops using theme app extensions, rendering the chat widget block automatically with zero layout distortion.",
    nodeIds: ["file:shopify-app/extensions/theme-app-extension/blocks/widget_embed_block.liquid", "file:shopify-app/extensions/theme-app-extension/assets/widget.js"]
  },
  {
    order: 8,
    title: "Optimized Chat Widget",
    description: "Examine the visitor-facing chat widget. It is designed to be highly lightweight and is compiled into a standalone bundle using Vite for maximum performance and instant load speeds.",
    nodeIds: ["file:widget/src/Widget.tsx", "file:widget/vite.config.ts"]
  },
  {
    order: 9,
    title: "Admin Dashboard Dashboard",
    description: "Explore the Next.js admin dashboard where business owners manage conversations, review agent performance logs, track AI confidence score analytics, and edit their customer service settings.",
    nodeIds: ["file:src/components/chat/ChatWindow.tsx", "file:src/components/analytics/OverviewTab.tsx"]
  },
  {
    order: 10,
    title: "Dockerization & Process Orchestration",
    description: "Understand how the entire monorepo stack is packaged and run in dev and production using Dockerfiles and multi-stage builds coupled with multi-service docker-compose.",
    nodeIds: ["service:Dockerfile", "service:docker-compose.yml"],
    languageLesson: "Multi-stage builds allow separating build tools (such as TypeScript compilers) from the final execution environment, producing lightweight images under 100MB."
  }
];

fs.writeFileSync(outputPath, JSON.stringify(tour, null, 2), 'utf8');
console.log(`Tour successfully written to ${outputPath}`);
