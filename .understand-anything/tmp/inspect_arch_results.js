const fs = require('fs');

const path = '/Users/karthikj/Downloads/forefrontthemeclone/.understand-anything/tmp/ua-arch-results.json';
const results = JSON.parse(fs.readFileSync(path, 'utf8'));

console.log('--- FILE STATS ---');
console.log(`Total File Nodes: ${results.fileStats.totalFileNodes}`);
console.log('Node Type Counts:', results.fileStats.nodeTypeCounts);

console.log('\n--- DIRECTORY GROUPS ---');
Object.keys(results.directoryGroups).forEach(group => {
  console.log(`- ${group}: ${results.directoryGroups[group].length} files`);
});

console.log('\n--- PATTERN MATCHES ---');
console.log(results.patternMatches);

console.log('\n--- DEPLOYMENT TOPOLOGY ---');
console.log({
  hasDockerfile: results.deploymentTopology.hasDockerfile,
  hasCompose: results.deploymentTopology.hasCompose,
  hasCI: results.deploymentTopology.hasCI,
  infraFilesCount: results.deploymentTopology.infraFiles.length
});

console.log('\n--- DOCUMENTATION COVERAGE ---');
console.log(`Coverage: ${results.docCoverage.coverageRatio} (${results.docCoverage.groupsWithDocs}/${results.docCoverage.totalGroups})`);
console.log('Undocumented Groups:', results.docCoverage.undocumentedGroups);

console.log('\n--- DOMINANT DEPENDENCY DIRECTIONS ---');
results.dependencyDirection.forEach(d => {
  console.log(`  ${d.dependent} -> depends on -> ${d.dependsOn}`);
});
