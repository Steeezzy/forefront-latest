const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  console.error('Usage: node ua-tour-analyze.js <inputPath> <outputPath>');
  process.exit(1);
}

try {
  const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const { nodes, edges, layers } = input;

  console.log(`Analyzing graph with ${nodes.length} nodes and ${edges.length} edges`);

  // Build maps
  const nodeMap = {};
  nodes.forEach(n => {
    nodeMap[n.id] = n;
  });

  const fanIn = {};
  const fanOut = {};
  const adjList = {}; // outgoing
  const incomingAdjList = {}; // incoming

  nodes.forEach(n => {
    fanIn[n.id] = 0;
    fanOut[n.id] = 0;
    adjList[n.id] = [];
    incomingAdjList[n.id] = [];
  });

  edges.forEach(e => {
    if (fanOut[e.source] !== undefined) fanOut[e.source]++;
    if (fanIn[e.target] !== undefined) fanIn[e.target]++;
    if (adjList[e.source] !== undefined) adjList[e.source].push(e);
    if (incomingAdjList[e.target] !== undefined) incomingAdjList[e.target].push(e);
  });

  // A. Fan-In Ranking
  const fanInRanking = nodes
    .map(n => ({ id: n.id, fanIn: fanIn[n.id], name: n.name }))
    .sort((a, b) => b.fanIn - a.fanIn)
    .slice(0, 20);

  // B. Fan-Out Ranking
  const fanOutRanking = nodes
    .map(n => ({ id: n.id, fanOut: fanOut[n.id], name: n.name }))
    .sort((a, b) => b.fanOut - a.fanOut)
    .slice(0, 20);

  // C. Entry Point Candidates
  // Determine top 10% fan-out threshold
  const sortedFanOuts = Object.values(fanOut).sort((a, b) => b - a);
  const top10PercentIdx = Math.floor(sortedFanOuts.length * 0.1);
  const fanOutThreshold = sortedFanOuts[top10PercentIdx] || 1;

  // Determine bottom 25% fan-in threshold
  const sortedFanIns = Object.values(fanIn).sort((a, b) => a - b);
  const bottom25PercentIdx = Math.floor(sortedFanIns.length * 0.25);
  const fanInThreshold = sortedFanIns[bottom25PercentIdx] || 0;

  const entryPointCandidates = [];

  nodes.forEach(node => {
    let score = 0;

    if (node.type === 'document') {
      if (node.name.toLowerCase() === 'readme.md' && !node.filePath.includes('/')) {
        score += 5;
      } else if (node.name.endsWith('.md') && !node.filePath.includes('/')) {
        score += 2;
      }
    } else if (['file', 'config', 'service'].includes(node.type)) {
      const nameLower = node.name.toLowerCase();
      const isEntryName = /index\.(ts|js|jsx|tsx)|main\.(ts|js|py|rs|go|cpp|c)|app\.(ts|js|py|swift)|server\.(ts|js)|mod\.rs|manage\.py|wsgi\.py|asgi\.py|run\.py|__main__\.py|application\.java|main\.java|program\.cs|config\.ru|index\.php|app\.swift|application\.kt/.test(nameLower);
      
      if (isEntryName) {
        score += 3;
      }

      // Root level or 1 level deep (0 or 1 slash in path)
      const slashCount = (node.filePath.match(/\//g) || []).length;
      if (slashCount <= 1) {
        score += 1;
      }

      // High fan-out
      if (fanOut[node.id] >= fanOutThreshold) {
        score += 1;
      }

      // Low fan-in
      if (fanIn[node.id] <= fanInThreshold) {
        score += 1;
      }
    }

    if (score > 0) {
      entryPointCandidates.push({
        id: node.id,
        score,
        name: node.name,
        summary: node.summary
      });
    }
  });

  entryPointCandidates.sort((a, b) => b.score - a.score);
  const topEntryPointCandidates = entryPointCandidates.slice(0, 5);

  // D. Dependency Chains (BFS from Entry Points)
  // Let's find the top code entry point candidate (skip documentation nodes)
  const topCodeEntry = entryPointCandidates.find(c => {
    const node = nodeMap[c.id];
    return node && node.type !== 'document';
  });

  const startNodeId = topCodeEntry ? topCodeEntry.id : (nodes.find(n => n.type === 'file') || {}).id;

  const order = [];
  const depthMap = {};
  const byDepth = {};

  if (startNodeId) {
    const queue = [{ id: startNodeId, depth: 0 }];
    const visited = new Set();
    visited.add(startNodeId);

    while (queue.length > 0) {
      const current = queue.shift();
      order.push(current.id);
      depthMap[current.id] = current.depth;

      if (!byDepth[current.depth]) {
        byDepth[current.depth] = [];
      }
      byDepth[current.depth].push(current.id);

      const outgoing = adjList[current.id] || [];
      outgoing.forEach(edge => {
        if (['imports', 'calls'].includes(edge.type)) {
          if (!visited.has(edge.target)) {
            visited.add(edge.target);
            queue.push({ id: edge.target, depth: current.depth + 1 });
          }
        }
      });
    }
  }

  const bfsTraversal = {
    startNode: startNodeId,
    order,
    depthMap,
    byDepth
  };

  // E. Non-Code File Inventory
  const nonCodeFiles = {
    documentation: [],
    infrastructure: [],
    data: [],
    config: []
  };

  nodes.forEach(node => {
    const item = {
      id: node.id,
      name: node.name,
      type: node.type,
      summary: node.summary
    };

    if (node.type === 'document' || node.filePath.endsWith('.md') || node.filePath.endsWith('.docx')) {
      nonCodeFiles.documentation.push(item);
    } else if (['service', 'pipeline', 'resource'].includes(node.type) || node.filePath.includes('Dockerfile') || node.filePath.includes('docker-compose') || node.name === 'Makefile') {
      nonCodeFiles.infrastructure.push(item);
    } else if (['table', 'schema', 'endpoint'].includes(node.type) || node.filePath.endsWith('.sql') || node.filePath.endsWith('.prisma') || node.filePath.endsWith('.graphql')) {
      nonCodeFiles.data.push(item);
    } else if (node.type === 'config' || node.name.startsWith('.') || node.filePath.endsWith('.json') || node.filePath.endsWith('.lock')) {
      // Exclude it if it was already matched in other categories
      const alreadyMatched = nonCodeFiles.infrastructure.some(x => x.id === node.id) || nonCodeFiles.data.some(x => x.id === node.id);
      if (!alreadyMatched) {
        nonCodeFiles.config.push(item);
      }
    }
  });

  // F. Tightly Coupled Clusters
  // Pairwise mutual connectivity
  const mutualPairs = [];
  const visitedPairs = new Set();

  edges.forEach(edge => {
    const pairKey = [edge.source, edge.target].sort().join('<>');
    if (visitedPairs.has(pairKey)) return;
    visitedPairs.add(pairKey);

    const reverseEdge = edges.find(e => e.source === edge.target && e.target === edge.source && ['imports', 'calls'].includes(e.type));
    if (reverseEdge && ['imports', 'calls'].includes(edge.type)) {
      mutualPairs.push({
        nodes: [edge.source, edge.target],
        edgeCount: 2
      });
    }
  });

  // Expand clusters
  const clusters = [];
  mutualPairs.forEach(pair => {
    let clusterNodes = [...pair.nodes];
    // Try to expand by finding other nodes that connect to both
    nodes.forEach(n => {
      if (clusterNodes.includes(n.id)) return;
      
      let connectsToCount = 0;
      clusterNodes.forEach(cNode => {
        const hasEdge = edges.some(e => 
          (e.source === n.id && e.target === cNode) || 
          (e.source === cNode && e.target === n.id)
        );
        if (hasEdge) connectsToCount++;
      });

      if (connectsToCount >= 2 && clusterNodes.length < 5) {
        clusterNodes.push(n.id);
      }
    });

    // Compute edge count within the cluster
    let clusterEdgesCount = 0;
    edges.forEach(e => {
      if (clusterNodes.includes(e.source) && clusterNodes.includes(e.target)) {
        clusterEdgesCount++;
      }
    });

    clusters.push({
      nodes: clusterNodes,
      edgeCount: clusterEdgesCount
    });
  });

  // Sort clusters by edge density and limit to top 10
  clusters.sort((a, b) => b.edgeCount - a.edgeCount);
  const uniqueClustersMap = new Map();
  clusters.forEach(c => {
    const key = c.nodes.sort().join(',');
    if (!uniqueClustersMap.has(key)) {
      uniqueClustersMap.set(key, c);
    }
  });
  const topClusters = Array.from(uniqueClustersMap.values()).slice(0, 10);

  // G. Layer List
  const layersList = {
    count: layers.length,
    list: layers
  };

  // H. Node Summary Index
  const nodeSummaryIndex = {};
  nodes.forEach(n => {
    nodeSummaryIndex[n.id] = {
      name: n.name,
      type: n.type,
      summary: n.summary
    };
  });

  const outputResult = {
    scriptCompleted: true,
    entryPointCandidates: topEntryPointCandidates,
    fanInRanking,
    fanOutRanking,
    bfsTraversal,
    nonCodeFiles,
    clusters: topClusters,
    layers: layersList,
    nodeSummaryIndex,
    totalNodes: nodes.length,
    totalEdges: edges.length
  };

  fs.writeFileSync(outputPath, JSON.stringify(outputResult, null, 2), 'utf8');
  console.log(`Successfully completed graph topology analysis. Results written to ${outputPath}`);

} catch (err) {
  console.error('Fatal error during tour analysis:', err.stack || err);
  process.exit(1);
}
