import { openDB } from 'idb';

const DB_NAME = 'studycanvas_db';
const DB_VERSION = 3;

let dbPromise;

export function initDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // v1 stores
        if (!db.objectStoreNames.contains('decks')) {
          db.createObjectStore('decks', { keyPath: 'deckId' });
        }
        if (!db.objectStoreNames.contains('pages')) {
          const pageStore = db.createObjectStore('pages', { keyPath: 'pageId' });
          pageStore.createIndex('deckId', 'deckId');
        }
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'storageKey' });
        }

        // v2 stores — Flow View (Removed)
        // ... handled in prior commits, leaving empty to avoid crashes for early adopters

        // v3 stores — YouTube Mode
        if (oldVersion < 3) {
          if (!db.objectStoreNames.contains('playlists')) {
            db.createObjectStore('playlists', { keyPath: 'deckId' });
          }
          if (!db.objectStoreNames.contains('watch_progress')) {
            db.createObjectStore('watch_progress', { keyPath: 'deckId' });
          }
        }
      },
    });
  }
  return dbPromise;
}

export async function getDB() {
  return await initDB();
}
