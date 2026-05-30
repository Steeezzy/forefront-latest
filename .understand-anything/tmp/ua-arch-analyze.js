const fs = require('fs');
const path = require('path');

// Grab args
const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  console.error('Usage: node ua-arch-analyze.js <inputPath> <outputPath>');
  process.exit(1);
}

try {
  const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const { fileNodes, importEdges, allEdges } = input;

  // A. Directory Grouping
  const filePaths = fileNodes.map(n => n.filePath);

  function getCommonPrefix(paths) {
    if (paths.length === 0) return [];
    const splitPaths = paths.map(p => p.split('/'));
    const dirSegments = splitPaths.map(p => p.slice(0, -1));
    if (dirSegments.length === 0) return [];
    
    let common = [...dirSegments[0]];
    for (let i = 1; i < dirSegments.length; i++) {
      const current = dirSegments[i];
      let j = 0;
      while (j < common.length && j < current.length && common[j] === current[j]) {
        j++;
      }
      common = common.slice(0, j);
    }
    return common;
  }

  const commonPrefixSegments = getCommonPrefix(filePaths);
  const commonPrefix = commonPrefixSegments.length > 0 ? commonPrefixSegments.join('/') + '/' : '';

  const directoryGroups = {};
  fileNodes.forEach(node => {
    const relativePath = node.filePath.startsWith(commonPrefix) 
      ? node.filePath.slice(commonPrefix.length) 
      : node.filePath;
    
    const segments = relativePath.split('/');
    let group = 'root';
    if (segments.length > 1) {
      group = segments[0];
    } else {
      // It's at the root level relative to the prefix
      // Let's group flat files by extension or pattern if appropriate, otherwise 'root'
      const ext = path.extname(node.name);
      if (node.name.includes('config') || ext === '.json' || ext === '.mjs' || ext === '.js') {
        group = 'root';
      } else {
        group = 'root';
      }
    }
    
    if (!directoryGroups[group]) {
      directoryGroups[group] = [];
    }
    directoryGroups[group].push(node.id);
  });

  // B. Node Type Grouping
  const nodeTypeGroups = {};
  fileNodes.forEach(node => {
    const type = node.type;
    if (!nodeTypeGroups[type]) {
      nodeTypeGroups[type] = [];
    }
    nodeTypeGroups[type].push(node.id);
  });

  // C. Import Adjacency Matrix
  // Map node ID to its directory group
  const nodeToGroup = {};
  Object.keys(directoryGroups).forEach(group => {
    directoryGroups[group].forEach(id => {
      nodeToGroup[id] = group;
    });
  });

  const fileFanOut = {};
  const fileFanIn = {};
  fileNodes.forEach(n => {
    fileFanOut[n.id] = 0;
    fileFanIn[n.id] = 0;
  });

  const groupImportsFrom = {};
  const groupImportsBy = {};
  Object.keys(directoryGroups).forEach(g => {
    groupImportsFrom[g] = new Set();
    groupImportsBy[g] = new Set();
  });

  importEdges.forEach(edge => {
    const sourceGroup = nodeToGroup[edge.source];
    const targetGroup = nodeToGroup[edge.target];

    if (fileFanOut[edge.source] !== undefined) fileFanOut[edge.source]++;
    if (fileFanIn[edge.target] !== undefined) fileFanIn[edge.target]++;

    if (sourceGroup && targetGroup && sourceGroup !== targetGroup) {
      groupImportsFrom[sourceGroup].add(targetGroup);
      groupImportsBy[targetGroup].add(sourceGroup);
    }
  });

  // D. Cross-Category Dependency Analysis (allEdges)
  // Maps configures, deploys, documents, etc.
  const crossCategoryCounts = {};
  allEdges.forEach(edge => {
    const sourceNode = fileNodes.find(n => n.id === edge.source);
    const targetNode = fileNodes.find(n => n.id === edge.target);
    if (sourceNode && targetNode) {
      const fromType = sourceNode.type;
      const toType = targetNode.type;
      const edgeType = edge.type;
      if (fromType !== toType) {
        const key = `${fromType}->${toType}:${edgeType}`;
        crossCategoryCounts[key] = (crossCategoryCounts[key] || 0) + 1;
      }
    }
  });

  const crossCategoryEdges = Object.keys(crossCategoryCounts).map(key => {
    const [types, edgeType] = key.split(':');
    const [fromType, toType] = types.split('->');
    return {
      fromType,
      toType,
      edgeType,
      count: crossCategoryCounts[key]
    };
  });

  // E. Inter-Group Import Frequency
  const interGroupImportCounts = {};
  importEdges.forEach(edge => {
    const sourceGroup = nodeToGroup[edge.source];
    const targetGroup = nodeToGroup[edge.target];
    if (sourceGroup && targetGroup && sourceGroup !== targetGroup) {
      const key = `${sourceGroup}->${targetGroup}`;
      interGroupImportCounts[key] = (interGroupImportCounts[key] || 0) + 1;
    }
  });

  const interGroupImports = Object.keys(interGroupImportCounts).map(key => {
    const [from, to] = key.split('->');
    return {
      from,
      to,
      count: interGroupImportCounts[key]
    };
  });

  // F. Intra-Group Import Density
  const intraGroupDensity = {};
  Object.keys(directoryGroups).forEach(group => {
    let internalEdges = 0;
    let totalEdges = 0;

    importEdges.forEach(edge => {
      const srcGroup = nodeToGroup[edge.source];
      const tgtGroup = nodeToGroup[edge.target];
      if (srcGroup === group || tgtGroup === group) {
        totalEdges++;
        if (srcGroup === group && tgtGroup === group) {
          internalEdges++;
        }
      }
    });

    const density = totalEdges > 0 ? (internalEdges / totalEdges) : 0;
    intraGroupDensity[group] = {
      internalEdges,
      totalEdges,
      density: parseFloat(density.toFixed(3))
    };
  });

  // G. Directory Pattern Matching
  function matchDirectoryPattern(dirName) {
    const name = dirName.toLowerCase();
    if (/routes|api|controllers|endpoints|handlers|serializers|routers|controller/.test(name)) return 'api';
    if (/services|core|lib|domain|logic|internal|composables|mailers|jobs|channels|signals/.test(name)) return 'service';
    if (/models|db|data|persistence|repository|entities|migrations|sql|database|schema|entity/.test(name)) return 'data';
    if (/components|views|pages|ui|layouts|screens/.test(name)) return 'ui';
    if (/middleware|plugins|interceptors|guards/.test(name)) return 'middleware';
    if (/utils|helpers|common|shared|tools|pkg|templatetags/.test(name)) return 'utility';
    if (/config|constants|env|settings|management|commands|wsgi|asgi/.test(name)) return 'config';
    if (/__tests__|test|tests|spec|specs/.test(name)) return 'test';
    if (/types|interfaces|schemas|contracts|dtos|dto|request|response/.test(name)) return 'types';
    if (/hooks/.test(name)) return 'hooks';
    if (/store|state|reducers|actions|slices/.test(name)) return 'state';
    if (/assets|static|public/.test(name)) return 'assets';
    if (/cmd|bin|entry/.test(name)) return 'entry';
    if (/docs|documentation|wiki/.test(name)) return 'documentation';
    if (/deploy|deployment|infra|infrastructure|k8s|kubernetes|helm|charts|terraform|tf|docker/.test(name)) return 'infrastructure';
    if (/\.github|\.gitlab|\.circleci/.test(name)) return 'ci-cd';
    return null;
  }

  const patternMatches = {};
  Object.keys(directoryGroups).forEach(group => {
    const match = matchDirectoryPattern(group);
    if (match) {
      patternMatches[group] = match;
    }
  });

  // H. Deployment Topology Detection
  const hasDockerfile = filePaths.some(p => p.toLowerCase().includes('dockerfile'));
  const hasCompose = filePaths.some(p => p.toLowerCase().includes('docker-compose'));
  const hasK8s = filePaths.some(p => p.toLowerCase().includes('k8s') || p.toLowerCase().includes('kubernetes') || p.toLowerCase().includes('helm'));
  const hasTerraform = filePaths.some(p => p.toLowerCase().includes('.tf'));
  const hasCI = filePaths.some(p => p.toLowerCase().includes('.github/workflows') || p.toLowerCase().includes('.gitlab-ci'));

  const infraFiles = fileNodes
    .filter(n => {
      const p = n.filePath.toLowerCase();
      return p.includes('dockerfile') || p.includes('docker-compose') || p.includes('.tf') || p.includes('.github/workflows') || p.includes('makefile');
    })
    .map(n => n.filePath);

  const deploymentTopology = {
    hasDockerfile,
    hasCompose,
    hasK8s,
    hasTerraform,
    hasCI,
    infraFiles
  };

  // I. Data Pipeline Detection
  const schemaFiles = filePaths.filter(p => p.endsWith('.sql') || p.endsWith('.graphql') || p.endsWith('.proto') || p.endsWith('.prisma'));
  const migrationFiles = filePaths.filter(p => p.includes('migrations/'));
  const dataModelFiles = filePaths.filter(p => p.includes('models/'));
  const apiHandlerFiles = filePaths.filter(p => p.includes('routes/') || p.includes('controllers/') || p.includes('endpoints/') || p.includes('handlers/'));

  const dataPipeline = {
    schemaFiles,
    migrationFiles,
    dataModelFiles,
    apiHandlerFiles
  };

  // J. Documentation Coverage
  let groupsWithDocs = 0;
  const undocumentedGroups = [];
  Object.keys(directoryGroups).forEach(group => {
    const files = directoryGroups[group];
    const hasDoc = files.some(id => {
      const node = fileNodes.find(n => n.id === id);
      return node && (node.type === 'document' || node.name.toLowerCase().endsWith('.md'));
    });
    if (hasDoc) {
      groupsWithDocs++;
    } else {
      undocumentedGroups.push(group);
    }
  });

  const totalGroups = Object.keys(directoryGroups).length;
  const coverageRatio = totalGroups > 0 ? parseFloat((groupsWithDocs / totalGroups).toFixed(3)) : 0;

  const docCoverage = {
    groupsWithDocs,
    totalGroups,
    coverageRatio,
    undocumentedGroups
  };

  // K. Dependency Direction
  const dependencyDirectionMap = {};
  interGroupImports.forEach(imp => {
    const key1 = `${imp.from}->${imp.to}`;
    const key2 = `${imp.to}->${imp.from}`;
    if (!dependencyDirectionMap[key1] && !dependencyDirectionMap[key2]) {
      const forwardCount = imp.count;
      const reverseImp = interGroupImports.find(i => i.from === imp.to && i.to === imp.from);
      const reverseCount = reverseImp ? reverseImp.count : 0;
      if (forwardCount >= reverseCount) {
        dependencyDirectionMap[key1] = { dependent: imp.from, dependsOn: imp.to };
      } else {
        dependencyDirectionMap[key2] = { dependent: imp.to, dependsOn: imp.from };
      }
    }
  });

  const dependencyDirection = Object.values(dependencyDirectionMap);

  // File Stats
  const filesPerGroup = {};
  Object.keys(directoryGroups).forEach(g => {
    filesPerGroup[g] = directoryGroups[g].length;
  });

  const nodeTypeCounts = {};
  fileNodes.forEach(n => {
    nodeTypeCounts[n.type] = (nodeTypeCounts[n.type] || 0) + 1;
  });

  const fileStats = {
    totalFileNodes: fileNodes.length,
    filesPerGroup,
    nodeTypeCounts
  };

  const outputResult = {
    scriptCompleted: true,
    directoryGroups,
    nodeTypeGroups,
    crossCategoryEdges,
    interGroupImports,
    intraGroupDensity,
    patternMatches,
    deploymentTopology,
    dataPipeline,
    docCoverage,
    dependencyDirection,
    fileStats,
    fileFanIn,
    fileFanOut
  };

  fs.writeFileSync(outputPath, JSON.stringify(outputResult, null, 2), 'utf8');
  console.log(`Successfully completed structural analysis. Results written to ${outputPath}`);
} catch (err) {
  console.error('Fatal error during structural analysis:', err.stack || err);
  process.exit(1);
}
