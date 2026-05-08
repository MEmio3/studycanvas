import { getDB } from './db.js';

export async function savePlaylist(playlist) {
  const db = await getDB();
  await db.put('playlists', playlist);
  return playlist;
}

export async function getPlaylist(notebookId) {
  const db = await getDB();
  return await db.get('playlists', notebookId);
}

export async function deletePlaylist(notebookId) {
  const db = await getDB();
  await db.delete('playlists', notebookId);
}

