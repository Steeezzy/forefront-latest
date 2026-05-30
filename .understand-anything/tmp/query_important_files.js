const fs = require('fs');

const path = '/Users/karthikj/Downloads/forefrontthemeclone/.understand-anything/tmp/ua-tour-results.json';
const results = JSON.parse(fs.readFileSync(path, 'utf8'));

const backendFiles = [];
const frontendFiles = [];
const widgetFiles = [];
const shopifyFiles = [];

Object.keys(results.nodeSummaryIndex).forEach(id => {
  const node = results.nodeSummaryIndex[id];
  if (node.type === 'file') {
    if (id.includes('forefront-backend/src/services')) {
      backendFiles.push({ id, ...node });
    } else if (id.includes('forefront-backend/src/controllers')) {
      backendFiles.push({ id, ...node });
    } else if (id.includes('forefront-backend/src/routes')) {
      backendFiles.push({ id, ...node });
    } else if (id.startsWith('file:src/components')) {
      frontendFiles.push({ id, ...node });
    } else if (id.startsWith('file:src/pages')) {
      frontendFiles.push({ id, ...node });
    } else if (id.includes('widget/')) {
      widgetFiles.push({ id, ...node });
    } else if (id.includes('shopify-app/')) {
      shopifyFiles.push({ id, ...node });
    }
  }
});

console.log('--- SAMPLE SERVICES/CONTROLLERS ---');
backendFiles.slice(0, 30).forEach(f => {
  console.log(`- ${f.id} (${f.name})`);
});

console.log('\n--- SAMPLE FRONTEND COMPONENTS/PAGES ---');
frontendFiles.slice(0, 15).forEach(f => {
  console.log(`- ${f.id} (${f.name})`);
});

console.log('\n--- WIDGET FILES ---');
widgetFiles.forEach(f => {
  console.log(`- ${f.id} (${f.name})`);
});

console.log('\n--- SHOPIFY FILES ---');
shopifyFiles.forEach(f => {
  console.log(`- ${f.id} (${f.name})`);
});
