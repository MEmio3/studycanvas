import { getDB } from './db.js';
import { generateId } from '../utils/uuid.js';

export async function createDeck(title = "Untitled Deck") {
  const db = await getDB();
  const deck = {
    deckId: generateId(),
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pages: [],
    settings: {
      defaultTtsSpeed: 1.0,
      defaultTtsVoice: "en-US-Standard",
      defaultSlideTransition: "slide",
      autoAdvance: false,
      autoAdvanceDelayMs: 3000
    }
  };
  await db.put('decks', deck);
  return deck;
}

export async function getDeck(deckId) {
  const db = await getDB();
  return await db.get('decks', deckId);
}

export async function getAllDecks() {
  const db = await getDB();
  return await db.getAll('decks');
}

export async function updateDeck(deck) {
  const db = await getDB();
  deck.updatedAt = new Date().toISOString();
  await db.put('decks', deck);
  return deck;
}

export async function deleteDeck(deckId) {
  const db = await getDB();
  await db.delete('decks', deckId);
}
