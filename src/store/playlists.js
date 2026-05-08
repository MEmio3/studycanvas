import { getDB } from './db.js';

export async function savePlaylist(playlist) {
  const db = await getDB();
  await db.put('playlists', playlist);
  return playlist;
}

export async function getPlaylist(deckId) {
  const db = await getDB();
  return await db.get('playlists', deckId);
}

export async function deletePlaylist(deckId) {
  const db = await getDB();
  await db.delete('playlists', deckId);
}
