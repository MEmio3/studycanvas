import { updateNotebook } from '../store/notebooks.js';
import { updatePage } from '../store/pages.js';
import { saveImage } from '../store/images.js';

export function importDeckFromJson(file, onComplete, onError) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.deck || !data.pages) {
        throw new Error('Invalid StudyCanvas format');
      }

      const newDeckId = crypto.randomUUID();
      const oldToNewPageMap = {};

      const deck = { ...data.deck };
      deck.deckId = newDeckId;
      deck.pages = [];

      for (const page of data.pages) {
        const newPageId = crypto.randomUUID();
        oldToNewPageMap[page.pageId] = newPageId;
        deck.pages.push(newPageId);
        
        page.pageId = newPageId;
        page.deckId = newDeckId;
        
        if (page.images) {
          for (const img of page.images) {
            if (img.base64Data) {
              let mimeType = img.mimeType || 'image/png';
              // Check if base64 string already has data URI scheme
              let base64String = img.base64Data;
              if (base64String.includes(',')) {
                base64String = base64String.split(',')[1];
              }
              const blob = await base64ToBlob(base64String, mimeType);
              const newStorageKey = `img_${crypto.randomUUID()}`;
              img.storageKey = newStorageKey;
              await saveImage(newStorageKey, blob);
              delete img.base64Data;
            }
          }
        }
        await updatePage(page);
      }

      await updateNotebook(deck);

      if (onComplete) onComplete(deck.deckId);
    } catch (err) {
      if (onError) onError(err);
    }
  };
  reader.readAsText(file);
}

function base64ToBlob(base64, mimeType) {
  return new Promise((resolve) => {
    const byteString = atob(base64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    resolve(new Blob([ab], { type: mimeType }));
  });
}
