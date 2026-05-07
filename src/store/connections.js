import { getDB } from './db.js';
import { generateId } from '../utils/uuid.js';

const EDGE_COLORS = {
  sequence: '#1D9E75',
  reference: '#5A7A6E',
  branch: '#D4A017'
};

export async function createConnection(deckId, sourcePageId, targetPageId, type = 'sequence', label = '', color = null) {
  const db = await getDB();
  const connection = {
    connectionId: generateId(),
    deckId,
    sourcePageId,
    targetPageId,
    type,
    label,
    color: color || EDGE_COLORS[type] || EDGE_COLORS.sequence,
    createdAt: new Date().toISOString()
  };
  await db.put('connections', connection);
  return connection;
}

export async function getConnectionsForDeck(deckId) {
  const db = await getDB();
  return await db.getAllFromIndex('connections', 'deckId', deckId);
}

export async function getConnection(connectionId) {
  const db = await getDB();
  return await db.get('connections', connectionId);
}

export async function updateConnection(connection) {
  const db = await getDB();
  await db.put('connections', connection);
  return connection;
}

export async function deleteConnection(connectionId) {
  const db = await getDB();
  await db.delete('connections', connectionId);
}

export async function deleteAllConnectionsForDeck(deckId) {
  const db = await getDB();
  const connections = await getConnectionsForDeck(deckId);
  const tx = db.transaction('connections', 'readwrite');
  for (const conn of connections) {
    tx.store.delete(conn.connectionId);
  }
  await tx.done;
}

export function getEdgeColor(type) {
  return EDGE_COLORS[type] || EDGE_COLORS.sequence;
}
