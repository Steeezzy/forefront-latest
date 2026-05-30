const fs = require('fs');

const filePath = '/Users/karthikj/Downloads/forefrontthemeclone/.understand-anything/intermediate/assembled-graph.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('Sample file paths in the graph:');
const fileNodes = data.nodes.filter(n => n.type === 'file');
console.log('Total file nodes:', fileNodes.length);
fileNodes.slice(0, 50).forEach(n => {
  console.log(`- ${n.id} (${n.filePath})`);
});
