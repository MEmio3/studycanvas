import { getDB } from './db.js';
import { generateId } from '../utils/uuid.js';
import { updateDeck, getDeck } from './decks.js';

export async function createPage(deckId, title = "Untitled Page") {
  const db = await getDB();
  const deck = await getDeck(deckId);
  if (!deck) throw new Error("Deck not found");

  const page = {
    pageId: generateId(),
    deckId,
    order: deck.pages.length,
    title,
    topic: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    images: [],
    textBlock: {
      rawText: "",
      sentences: [],
      source: "Manual",
      sourceUrl: ""
    },
    notes: "",
    isFlagged: false,
    reviewCount: 0,
    lastReviewedAt: null,
    flowPosition: null
  };

  await db.put('pages', page);
  
  deck.pages.push(page.pageId);
  await updateDeck(deck);
  
  return page;
}

export async function getPage(pageId) {
  const db = await getDB();
  return await db.get('pages', pageId);
}

export async function getPagesForDeck(deckId) {
  const db = await getDB();
  const pages = await db.getAllFromIndex('pages', 'deckId', deckId);
  return pages.sort((a, b) => a.order - b.order);
}

export async function updatePage(page) {
  const db = await getDB();
  page.updatedAt = new Date().toISOString();
  await db.put('pages', page);
  return page;
}

export async function deletePage(pageId) {
  const db = await getDB();
  const page = await getPage(pageId);
  if (!page) return;
  
  for (const img of page.images) {
    await db.delete('images', img.storageKey);
  }

  const deck = await getDeck(page.deckId);
  if (deck) {
    deck.pages = deck.pages.filter(id => id !== pageId);
    await updateDeck(deck);
  }

  await db.delete('pages', pageId);
}
