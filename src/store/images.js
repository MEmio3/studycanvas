import { getDB } from './db.js';
import { generateId } from '../utils/uuid.js';

export async function saveImage(blob, mimeType, width, height) {
  const db = await getDB();
  const storageKey = 'img_' + generateId();
  
  const imageRecord = {
    storageKey,
    blob,
    mimeType,
    width,
    height
  };
  
  await db.put('images', imageRecord);
  return storageKey;
}

export async function getImage(storageKey) {
  const db = await getDB();
  return await db.get('images', storageKey);
}

export async function deleteImage(storageKey) {
  const db = await getDB();
  await db.delete('images', storageKey);
}
