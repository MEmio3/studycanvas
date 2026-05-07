import { getDB } from './db.js';

/**
 * Get the saved flow layout for a deck.
 * Returns null if no layout has been saved yet.
 */
export async function getFlowLayout(deckId) {
  const db = await getDB();
  return await db.get('flow_layouts', deckId) || null;
}

/**
 * Save or update the flow layout for a deck.
 */
export async function saveFlowLayout(deckId, nodes, viewport) {
  const db = await getDB();
  const layout = {
    deckId,
    updatedAt: new Date().toISOString(),
    nodes: nodes || {},
    viewport: viewport || { x: 0, y: 0, zoom: 1.0 }
  };
  await db.put('flow_layouts', layout);
  return layout;
}

/**
 * Delete the flow layout for a deck.
 */
export async function deleteFlowLayout(deckId) {
  const db = await getDB();
  await db.delete('flow_layouts', deckId);
}

/**
 * Generate a default grid layout for pages that have no stored positions.
 * @param {Array} pages - Array of page objects
 * @param {number} spacing - Gap between nodes (default 80px)
 * @returns {Object} - Map of pageId → { x, y, width, height }
 */
export function generateDefaultLayout(pages, spacing = 80) {
  const nodeWidth = 220;
  const nodeHeight = 130;
  const cols = Math.max(1, Math.ceil(Math.sqrt(pages.length)));
  const nodes = {};

  pages.forEach((page, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    nodes[page.pageId] = {
      x: 60 + col * (nodeWidth + spacing),
      y: 60 + row * (nodeHeight + spacing),
      width: nodeWidth,
      height: nodeHeight
    };
  });

  return nodes;
}
