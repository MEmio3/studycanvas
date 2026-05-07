/**
 * Auto-layout algorithms for the Flow View
 */

export function gridLayout(nodesArray, spacing = 80) {
  const nodeWidth = 220;
  const nodeHeight = 130;
  const cols = Math.max(1, Math.ceil(Math.sqrt(nodesArray.length)));
  const positions = {};

  nodesArray.forEach((node, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions[node.pageId] = {
      x: 60 + col * (nodeWidth + spacing),
      y: 60 + row * (nodeHeight + spacing)
    };
  });

  return positions;
}

export function layeredLayout(nodesArray, connections, direction = 'LR', spacing = 80) {
  // A simplified Sugiyama-style layered layout
  // 1. Find roots (nodes with no incoming sequence connections)
  // 2. Assign layers (columns for LR, rows for TB) via BFS
  // 3. Assign positions within layers
  
  const seqEdges = connections.filter(c => c.type === 'sequence');
  
  const incoming = {};
  const outgoing = {};
  nodesArray.forEach(n => {
    incoming[n.pageId] = [];
    outgoing[n.pageId] = [];
  });
  
  seqEdges.forEach(e => {
    if (incoming[e.targetPageId]) incoming[e.targetPageId].push(e.sourcePageId);
    if (outgoing[e.sourcePageId]) outgoing[e.sourcePageId].push(e.targetPageId);
  });
  
  // Find roots (no incoming edges, or fallback to first node)
  let roots = nodesArray.filter(n => incoming[n.pageId].length === 0);
  if (roots.length === 0 && nodesArray.length > 0) roots = [nodesArray[0]];
  
  const layers = [];
  const assigned = new Set();
  
  let currentLayer = [...roots];
  while (currentLayer.length > 0) {
    layers.push(currentLayer);
    currentLayer.forEach(n => assigned.add(n.pageId));
    
    let nextLayer = [];
    currentLayer.forEach(n => {
      const children = outgoing[n.pageId] || [];
      children.forEach(childId => {
        if (!assigned.has(childId) && !nextLayer.some(c => c.pageId === childId)) {
          const childNode = nodesArray.find(nx => nx.pageId === childId);
          if (childNode) nextLayer.push(childNode);
        }
      });
    });
    
    // Add any unassigned nodes to the final layer
    if (nextLayer.length === 0 && assigned.size < nodesArray.length) {
      nextLayer = nodesArray.filter(n => !assigned.has(n.pageId));
    }
    
    currentLayer = nextLayer;
  }
  
  const positions = {};
  const nodeW = 220;
  const nodeH = 130;
  
  layers.forEach((layer, colIndex) => {
    layer.forEach((node, rowIndex) => {
      if (direction === 'LR') {
        positions[node.pageId] = {
          x: 60 + colIndex * (nodeW + spacing),
          y: 60 + rowIndex * (nodeH + spacing)
        };
      } else {
        positions[node.pageId] = {
          x: 60 + rowIndex * (nodeW + spacing),
          y: 60 + colIndex * (nodeH + spacing)
        };
      }
    });
  });
  
  return positions;
}
