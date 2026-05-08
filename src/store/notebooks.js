import { getDB } from './db.js';

export async function createNotebook(title = "Untitled Notebook", emoji = "📚", color = "#1D9E75") {
  const db = await getDB();
  const notebook = {
    notebookId: crypto.randomUUID(),
    title,
    emoji,
    color,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sections: [],
    settings: {
      defaultTtsSpeed: 1.0,
      defaultTtsVoice: "en-US-Standard",
      defaultSlideTransition: "slide",
      autoAdvance: false,
      autoAdvanceDelayMs: 3000,
      playbackOrder: "sidebar"
    }
  };
  await db.put('notebooks', notebook);
  return notebook;
}

export async function getNotebook(notebookId) {
  const db = await getDB();
  return await db.get('notebooks', notebookId);
}

export async function getAllNotebooks() {
  const db = await getDB();
  return await db.getAll('notebooks');
}

export async function updateNotebook(notebook) {
  const db = await getDB();
  notebook.updatedAt = new Date().toISOString();
  await db.put('notebooks', notebook);
  return notebook;
}

export async function deleteNotebook(notebookId) {
  const db = await getDB();
  await db.delete('notebooks', notebookId);
}

// Deprecated aliases for backwards compatibility during transition
export const createDeck = createNotebook;
export const getDeck = getNotebook;
export const getAllDecks = getAllNotebooks;
export const updateDeck = updateNotebook;
export const deleteDeck = deleteNotebook;
