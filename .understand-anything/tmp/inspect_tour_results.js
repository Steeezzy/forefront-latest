const fs = require('fs');

const path = '/Users/karthikj/Downloads/forefrontthemeclone/.understand-anything/tmp/ua-tour-results.json';
const results = JSON.parse(fs.readFileSync(path, 'utf8'));

console.log('--- ENTRY POINT CANDIDATES ---');
results.entryPointCandidates.forEach(c => {
  console.log(`- ${c.id} (Score: ${c.score}, Name: ${c.name})`);
});

console.log('\n--- BFS TRAVERSAL ---');
console.log(`Start Node: ${results.bfsTraversal.startNode}`);
console.log('Traversal length:', results.bfsTraversal.order.length);
console.log('Depth 0 nodes:', results.bfsTraversal.byDepth['0']);
console.log('Depth 1 nodes count:', (results.bfsTraversal.byDepth['1'] || []).length);
if (results.bfsTraversal.byDepth['1']) {
  console.log('Sample Depth 1 nodes:', results.bfsTraversal.byDepth['1'].slice(0, 10));
}
console.log('Depth 2 nodes count:', (results.bfsTraversal.byDepth['2'] || []).length);
if (results.bfsTraversal.byDepth['2']) {
  console.log('Sample Depth 2 nodes:', results.bfsTraversal.byDepth['2'].slice(0, 10));
}

console.log('\n--- NON-CODE FILES COUNTS ---');
console.log(`Documentation: ${results.nonCodeFiles.documentation.length}`);
console.log(`Infrastructure: ${results.nonCodeFiles.infrastructure.length}`);
console.log(`Data: ${results.nonCodeFiles.data.length}`);
console.log(`Config: ${results.nonCodeFiles.config.length}`);

console.log('\n--- SAMPLE INFRASTRUCTURE FILES ---');
results.nonCodeFiles.infrastructure.slice(0, 5).forEach(f => {
  console.log(`- ${f.id} (${f.name})`);
});

console.log('\n--- SAMPLE DATA FILES ---');
results.nonCodeFiles.data.slice(0, 5).forEach(f => {
  console.log(`- ${f.id} (${f.name})`);
});

console.log('\n--- CLUSTERS ---');
results.clusters.slice(0, 5).forEach((c, idx) => {
  console.log(`Cluster ${idx + 1} (Size: ${c.nodes.length}, Edges: ${c.edgeCount}):`);
  console.log('  Nodes:', c.nodes);
});
