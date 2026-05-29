const fs = require('fs');
const path = require('path');

const projectRoot = '/Users/karthikj/Downloads/forefrontthemeclone';
const assembledPath = path.join(projectRoot, '.understand-anything/intermediate/assembled-graph.json');
const layersPath = path.join(projectRoot, '.understand-anything/intermediate/layers.json');
const tourPath = path.join(projectRoot, '.understand-anything/intermediate/tour.json');

const finalGraphPath = path.join(projectRoot, '.understand-anything/knowledge-graph.json');
const finalMetaPath = path.join(projectRoot, '.understand-anything/meta.json');

try {
  console.log('Starting final assembly of the knowledge graph...');

  const graph = JSON.parse(fs.readFileSync(assembledPath, 'utf8'));
  const layers = JSON.parse(fs.readFileSync(layersPath, 'utf8'));
  const tour = JSON.parse(fs.readFileSync(tourPath, 'utf8'));

  // Combine into final graph conforming strictly to KnowledgeGraphSchema
  const finalGraph = {
    version: "1.0.0",
    kind: "codebase",
    project: {
      name: "Tidio Competitor Chatbot Platform",
      languages: ["TypeScript", "JavaScript", "SQL", "Liquid", "HTML", "CSS"],
      frameworks: ["Next.js", "React", "Express", "Socket.IO", "BullMQ"],
      description: "AI-powered customer support chatbot platform with multilingual support for 22 Indian languages using Sarvam AI.",
      analyzedAt: new Date().toISOString(),
      gitCommitHash: "latest"
    },
    nodes: graph.nodes,
    edges: graph.edges,
    layers: layers,
    tour: tour
  };

  // Write knowledge-graph.json
  fs.writeFileSync(finalGraphPath, JSON.stringify(finalGraph, null, 2), 'utf8');
  console.log(`- Compiled final knowledge-graph.json with ${graph.nodes.length} nodes, ${graph.edges.length} edges, ${layers.length} layers, and ${tour.length} tour steps.`);

  // Create metadata
  const meta = {
    totalNodes: graph.nodes.length,
    totalEdges: graph.edges.length,
    layersCount: layers.length,
    tourStepsCount: tour.length,
    lastUpdated: new Date().toISOString()
  };

  // Write meta.json
  fs.writeFileSync(finalMetaPath, JSON.stringify(meta, null, 2), 'utf8');
  console.log(`- Created meta.json:`, JSON.stringify(meta, null, 2));

  // Sync to worktree directory if it exists
  const worktreeDest = '/Users/karthikj/.gemini/antigravity/worktrees/forefrontthemeclone/understand-user-intent/.understand-anything';
  if (fs.existsSync(path.dirname(worktreeDest))) {
    if (!fs.existsSync(worktreeDest)) {
      fs.mkdirSync(worktreeDest, { recursive: true });
    }
    
    // Copy files
    fs.copyFileSync(finalGraphPath, path.join(worktreeDest, 'knowledge-graph.json'));
    fs.copyFileSync(finalMetaPath, path.join(worktreeDest, 'meta.json'));
    
    const fingerprintsSrc = path.join(projectRoot, '.understand-anything/fingerprints.json');
    if (fs.existsSync(fingerprintsSrc)) {
      fs.copyFileSync(fingerprintsSrc, path.join(worktreeDest, 'fingerprints.json'));
    }
    
    console.log(`- Successfully synchronized .understand-anything to active worktree at: ${worktreeDest}`);
  } else {
    console.log(`- Worktree directory does not exist yet at: ${path.dirname(worktreeDest)}. Saved files locally in project root.`);
  }

  console.log('Final assembly completed successfully!');
} catch (err) {
  console.error('Error during final assembly:', err.stack || err);
  process.exit(1);
}
