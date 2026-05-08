import { getDB } from './db.js';

export async function saveWatchProgress(progress) {
  const db = await getDB();
  progress.updatedAt = new Date().toISOString();
  await db.put('watch_progress', progress);
  return progress;
}

export async function getWatchProgress(deckId) {
  const db = await getDB();
  const progress = await db.get('watch_progress', deckId);
  if (progress) return progress;
  
  // Return empty structure if not found
  return {
    deckId,
    updatedAt: new Date().toISOString(),
    videos: {}
  };
}

export async function deleteWatchProgress(deckId) {
  const db = await getDB();
  await db.delete('watch_progress', deckId);
}
