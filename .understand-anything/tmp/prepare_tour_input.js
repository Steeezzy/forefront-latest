const fs = require('fs');

const assembledPath = '/Users/karthikj/Downloads/forefrontthemeclone/.understand-anything/intermediate/assembled-graph.json';
const layersPath = '/Users/karthikj/Downloads/forefrontthemeclone/.understand-anything/intermediate/layers.json';
const outputPath = '/Users/karthikj/Downloads/forefrontthemeclone/.understand-anything/tmp/ua-tour-input.json';

const graph = JSON.parse(fs.readFileSync(assembledPath, 'utf8'));
const layers = JSON.parse(fs.readFileSync(layersPath, 'utf8'));

// Format layers to match expected input: array of {id, name, description}
const layerMetadata = layers.map(l => ({
  id: l.id,
  name: l.name,
  description: l.description
}));

const tourInput = {
  nodes: graph.nodes,
  edges: graph.edges,
  layers: layerMetadata
};

fs.writeFileSync(outputPath, JSON.stringify(tourInput, null, 2), 'utf8');
console.log(`Successfully generated ${outputPath}`);
console.log(`- Nodes: ${graph.nodes.length}`);
console.log(`- Edges: ${graph.edges.length}`);
console.log(`- Layers: ${layerMetadata.length}`);
