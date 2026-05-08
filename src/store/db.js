import { openDB } from 'idb';

const DB_NAME = 'studycanvas_db';
const DB_VERSION = 4;

let dbPromise;

export function initDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      async upgrade(db, oldVersion, newVersion, transaction) {
        // ... previous versions
        if (oldVersion < 1) {
          db.createObjectStore('decks', { keyPath: 'deckId' });
          const pageStore = db.createObjectStore('pages', { keyPath: 'pageId' });
          pageStore.createIndex('deckId', 'deckId');
          db.createObjectStore('images', { keyPath: 'storageKey' });
        }
        
        if (oldVersion < 3) {
          if (!db.objectStoreNames.contains('playlists')) {
            db.createObjectStore('playlists', { keyPath: 'deckId' });
          }
          if (!db.objectStoreNames.contains('watch_progress')) {
            db.createObjectStore('watch_progress', { keyPath: 'deckId' });
          }
        }

        if (oldVersion < 4) {
          // 1. Create new stores
          const notebookStore = db.createObjectStore('notebooks', { keyPath: 'notebookId' });
          
          const sectionStore = db.createObjectStore('sections', { keyPath: 'sectionId' });
          sectionStore.createIndex('notebookId', 'notebookId');
          
          const subsectionStore = db.createObjectStore('subsections', { keyPath: 'subsectionId' });
          subsectionStore.createIndex('sectionId', 'sectionId');
          subsectionStore.createIndex('notebookId', 'notebookId');

          // Update pages store indexes
          const pageStore = transaction.objectStore('pages');
          if (pageStore.indexNames.contains('deckId')) {
            pageStore.deleteIndex('deckId');
          }
          pageStore.createIndex('notebookId', 'notebookId');
          pageStore.createIndex('subsectionId', 'subsectionId');

          // 2. Migrate Data (if 'decks' exists)
          if (db.objectStoreNames.contains('decks')) {
            const decksStore = transaction.objectStore('decks');
            const allDecks = await decksStore.getAll();
            const allPages = await pageStore.getAll();
            
            for (const deck of allDecks) {
              const notebook = {
                ...deck,
                notebookId: deck.deckId,
                sections: []
              };
              delete notebook.deckId;
              
              // Create default section
              const sectionId = crypto.randomUUID();
              notebook.sections.push(sectionId);
              await notebookStore.put(notebook);

              const section = {
                sectionId,
                notebookId: notebook.notebookId,
                title: 'All Pages',
                order: 0,
                isCollapsed: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                subsections: []
              };

              // Create default subsection
              const subsectionId = crypto.randomUUID();
              section.subsections.push(subsectionId);
              await sectionStore.put(section);

              const subsection = {
                subsectionId,
                sectionId,
                notebookId: notebook.notebookId,
                title: 'Uncategorised',
                order: 0,
                isCollapsed: false,
                isBuiltIn: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                pages: []
              };

              // Update pages for this notebook
              const notebookPages = allPages.filter(p => p.deckId === deck.deckId);
              notebookPages.sort((a, b) => a.order - b.order);
              
              for (const p of notebookPages) {
                subsection.pages.push(p.pageId);
                const page = { ...p };
                page.notebookId = notebook.notebookId;
                page.sectionId = sectionId;
                page.subsectionId = subsectionId;
                if (page.topic) {
                  page.legacyTopic = page.topic;
                  page.title = page.title + (page.topic ? ` - ${page.topic}` : '');
                }
                page.saveState = 'saved';
                delete page.deckId;
                delete page.topic;
                await pageStore.put(page);
              }
              
              await subsectionStore.put(subsection);
            }
            
            db.deleteObjectStore('decks');
          }

          // Note: playlists and watch_progress keyed by deckId.
          // Since we can't easily rename keyPath, we copy to new stores.
          if (db.objectStoreNames.contains('playlists')) {
            const oldPlaylists = await transaction.objectStore('playlists').getAll();
            db.deleteObjectStore('playlists');
            const newPlaylists = db.createObjectStore('playlists', { keyPath: 'notebookId' });
            for (const pl of oldPlaylists) {
              pl.notebookId = pl.deckId;
              delete pl.deckId;
              await newPlaylists.put(pl);
            }
          }
          
          if (db.objectStoreNames.contains('watch_progress')) {
            const oldProg = await transaction.objectStore('watch_progress').getAll();
            db.deleteObjectStore('watch_progress');
            const newProg = db.createObjectStore('watch_progress', { keyPath: 'notebookId' });
            for (const wp of oldProg) {
              wp.notebookId = wp.deckId;
              delete wp.deckId;
              await newProg.put(wp);
            }
          }

          // Flow layouts
          if (db.objectStoreNames.contains('flow_layouts')) {
            const oldFlows = await transaction.objectStore('flow_layouts').getAll();
            db.deleteObjectStore('flow_layouts');
            const newFlows = db.createObjectStore('flow_layouts', { keyPath: 'notebookId' });
            for (const fl of oldFlows) {
              fl.notebookId = fl.deckId;
              delete fl.deckId;
              await newFlows.put(fl);
            }
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
