const fs = require('fs');

const path = '/Users/karthikj/Downloads/forefrontthemeclone/.understand-anything/tmp/ua-tour-results.json';
const results = JSON.parse(fs.readFileSync(path, 'utf8'));

const targetNodeIds = [
  'document:README.md',
  'file:forefront-backend/src/index.ts',
  'config:forefront-backend/package.json',
  'file:forefront-backend/src/services/SarvamClient.ts',
  'file:forefront-backend/src/services/rag/EmbeddingService.ts',
  'file:forefront-backend/src/services/rag/ConversaService.ts',
  'file:forefront-backend/src/services/flow/FlowExecutionEngine.ts',
  'file:forefront-backend/src/services/flow/NodeExecutorRegistry.ts',
  'table:forefront-backend/migrations/002_knowledge_base_expansion.sql',
  'table:forefront-backend/migrations/003_user_profiles.sql',
  'file:shopify-app/extensions/theme-app-extension/blocks/widget_embed_block.liquid',
  'file:shopify-app/extensions/theme-app-extension/assets/widget.js',
  'file:widget/src/Widget.tsx',
  'config:widget/vite.config.ts',
  'file:src/components/chat/ChatWindow.tsx',
  'file:src/components/analytics/OverviewTab.tsx',
  'service:Dockerfile',
  'config:docker-compose.yml'
];

targetNodeIds.forEach(id => {
  const node = results.nodeSummaryIndex[id];
  if (node) {
    console.log(`✅ FOUND: ${id} (${node.name}, type: ${node.type})`);
  } else {
    console.log(`❌ NOT FOUND: ${id}`);
    // Find closest matches
    const key = id.split(':').pop();
    const matches = Object.keys(results.nodeSummaryIndex).filter(k => k.includes(key));
    if (matches.length > 0) {
      console.log(`   Suggestions:`, matches);
    }
  }
});
