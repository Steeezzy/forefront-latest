const fs = require('fs');

const assembledPath = '/Users/karthikj/Downloads/forefrontthemeclone/.understand-anything/intermediate/assembled-graph.json';
const outputPath = '/Users/karthikj/Downloads/forefrontthemeclone/.understand-anything/tmp/ua-arch-input.json';

const graph = JSON.parse(fs.readFileSync(assembledPath, 'utf8'));

const fileTypes = new Set(['file', 'config', 'document', 'service', 'pipeline', 'table', 'schema', 'resource', 'endpoint']);

// Get all file-level nodes
const fileNodes = graph.nodes
  .filter(n => fileTypes.has(n.type))
  .map(n => {
    // Keep only required properties
    return {
      id: n.id,
      type: n.type,
      name: n.name,
      filePath: n.filePath,
      summary: n.summary,
      tags: n.tags || []
    };
  });

const fileNodeIds = new Set(fileNodes.map(n => n.id));

// Filter edges to only include those where both source and target are file-level nodes
const fileLevelEdges = graph.edges.filter(e => fileNodeIds.has(e.source) && fileNodeIds.has(e.target));

const importEdges = fileLevelEdges.filter(e => e.type === 'imports').map(e => ({
  source: e.source,
  target: e.target,
  type: e.type
}));

const allEdges = fileLevelEdges.map(e => ({
  source: e.source,
  target: e.target,
  type: e.type
}));

const inputData = {
  fileNodes,
  importEdges,
  allEdges
};

fs.writeFileSync(outputPath, JSON.stringify(inputData, null, 2), 'utf8');
console.log(`Successfully generated ${outputPath}`);
console.log(`- File Nodes: ${fileNodes.length}`);
console.log(`- Import Edges (file-level): ${importEdges.length}`);
console.log(`- All Edges (file-level): ${allEdges.length}`);
