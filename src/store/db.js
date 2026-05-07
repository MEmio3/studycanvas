import { openDB } from 'idb';

const DB_NAME = 'studycanvas_db';
const DB_VERSION = 1;

let dbPromise;

export function initDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
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
      },
    });
  }
  return dbPromise;
}

export async function getDB() {
  return await initDB();
}
