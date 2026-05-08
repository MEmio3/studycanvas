import { getDB } from './db.js';

export async function saveWatchProgress(progress) {
  const db = await getDB();
  progress.updatedAt = new Date().toISOString();
  await db.put('watch_progress', progress);
  return progress;
}

export async function getWatchProgress(notebookId) {
  const db = await getDB();
  const progress = await db.get('watch_progress', notebookId);
  if (progress) return progress;
  
  return {
    notebookId,
    updatedAt: new Date().toISOString(),
    videos: {}
  };
}

export async function deleteWatchProgress(notebookId) {
  const db = await getDB();
  await db.delete('watch_progress', notebookId);
}

