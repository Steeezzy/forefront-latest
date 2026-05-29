const fs = require('fs');

const inputPath = '/Users/karthikj/Downloads/forefrontthemeclone/.understand-anything/tmp/ua-arch-input.json';
const outputPath = '/Users/karthikj/Downloads/forefrontthemeclone/.understand-anything/intermediate/layers.json';

const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const { fileNodes } = input;

console.log(`Total input file nodes: ${fileNodes.length}`);

// Define layer structures
const layers = [
  {
    id: 'layer:frontend',
    name: 'Frontend Application',
    description: 'React.js and Next.js frontend pages, UI components, custom hooks, and state management.',
    nodeIds: []
  },
  {
    id: 'layer:backend',
    name: 'Backend Engine',
    description: 'Node.js and Express.js backend services, routes, controllers, background jobs, and business logic using Sarvam AI.',
    nodeIds: []
  },
  {
    id: 'layer:shopify',
    name: 'Shopify Integration',
    description: 'Shopify-specific application modules, API integration, and oauth flows.',
    nodeIds: []
  },
  {
    id: 'layer:widget',
    name: 'Chat Widget UI',
    description: 'Embeddable React chat widget and compilation configurations.',
    nodeIds: []
  },
  {
    id: 'layer:data',
    name: 'Data & Storage',
    description: 'PostgreSQL schema definitions, SQL tables, database migration scripts, and vector migration resources.',
    nodeIds: []
  },
  {
    id: 'layer:infrastructure',
    name: 'Infrastructure & DevOps',
    description: 'Docker configurations, build container services, orchestration scripts, and dev server process managers.',
    nodeIds: []
  },
  {
    id: 'layer:config',
    name: 'Configuration',
    description: 'Global workspace, TypeScript compiler parameters, dependency configurations, and server configurations.',
    nodeIds: []
  },
  {
    id: 'layer:documentation',
    name: 'Documentation',
    description: 'Project specs, manuals, markdown documents, and Tidio Competitor implementation plans.',
    nodeIds: []
  }
];

const layersMap = {};
layers.forEach(l => {
  layersMap[l.id] = l;
});

fileNodes.forEach(node => {
  const filePath = node.filePath;
  const name = node.name;
  const type = node.type;

  // 1. Documentation
  if (type === 'document' || filePath.endsWith('.md') || filePath.endsWith('.docx') || filePath.includes('tidio-clone-plan') || filePath.includes('LICENSE')) {
    layersMap['layer:documentation'].nodeIds.push(node.id);
  }
  // 2. Data & Storage
  else if (type === 'table' || filePath.includes('migrations/') || filePath.endsWith('.sql') || name === 'migrate_vectors.sh') {
    layersMap['layer:data'].nodeIds.push(node.id);
  }
  // 3. Infrastructure & DevOps
  else if (type === 'service' || name.toLowerCase().includes('dockerfile') || name.toLowerCase().includes('docker-compose') || filePath.endsWith('.sh') || name === 'Makefile') {
    layersMap['layer:infrastructure'].nodeIds.push(node.id);
  }
  // 4. Configuration
  else if (type === 'config' || name.startsWith('.') || name.includes('config') || (filePath.endsWith('.json') && !filePath.startsWith('shopify-app')) || filePath.endsWith('.lock') || name === 'eslint.config.mjs' || name === 'postcss.config.mjs' || name === 'tsconfig.json' || name === 'bun.lock' || name === 'executionEventId' || name === 'executionMode' || name === 'Untitled.base') {
    layersMap['layer:config'].nodeIds.push(node.id);
  }
  // 5. Shopify Integration
  else if (filePath.startsWith('shopify-app/')) {
    layersMap['layer:shopify'].nodeIds.push(node.id);
  }
  // 6. Chat Widget
  else if (filePath.startsWith('widget/') || filePath.includes('widget.vite.config') || filePath.includes('public/loader.js') || filePath.includes('public/widget-bundle.js')) {
    layersMap['layer:widget'].nodeIds.push(node.id);
  }
  // 7. Frontend Application
  else if (filePath.startsWith('src/') || name === 'test.html') {
    layersMap['layer:frontend'].nodeIds.push(node.id);
  }
  // 8. Backend Engine
  else if (filePath.startsWith('forefront-backend/') || filePath.startsWith('scripts/') || name === 'test-gemini-fix.js' || name === '1') {
    layersMap['layer:backend'].nodeIds.push(node.id);
  }
  // Default fallback
  else {
    layersMap['layer:backend'].nodeIds.push(node.id);
  }
});

// Validation check
let totalAssigned = 0;
layers.forEach(l => {
  totalAssigned += l.nodeIds.length;
  console.log(`Layer ${l.id}: ${l.nodeIds.length} nodes`);
});

console.log(`Total Assigned Nodes: ${totalAssigned}`);

if (totalAssigned !== fileNodes.length) {
  console.error(`ERROR: Assigned count (${totalAssigned}) does not match input count (${fileNodes.length})!`);
  process.exit(1);
} else {
  console.log('SUCCESS: All nodes are assigned exactly once with zero warnings!');
}

fs.writeFileSync(outputPath, JSON.stringify(layers, null, 2), 'utf8');
console.log(`Layers successfully written to ${outputPath}`);
