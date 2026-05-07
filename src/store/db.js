import { openDB } from 'idb';

const DB_NAME = 'studycanvas_db';
const DB_VERSION = 2;

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

        // v2 stores — Flow View
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('connections')) {
            const connStore = db.createObjectStore('connections', { keyPath: 'connectionId' });
            connStore.createIndex('deckId', 'deckId');
          }
          if (!db.objectStoreNames.contains('flow_layouts')) {
            db.createObjectStore('flow_layouts', { keyPath: 'deckId' });
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
