import { getDB } from './db.js';
import { updateSubsection, getSubsectionsForNotebook } from './subsections.js';

export async function createPage(notebookId, sectionId, subsectionId, title = "Untitled Page") {
  const db = await getDB();
  const tx = db.transaction(['pages', 'subsections'], 'readwrite');
  const pageStore = tx.objectStore('pages');
  const subsectionStore = tx.objectStore('subsections');

  const subsection = await subsectionStore.get(subsectionId);
  if (!subsection) throw new Error("Subsection not found");

  const page = {
    pageId: crypto.randomUUID(),
    notebookId,
    sectionId,
    subsectionId,
    order: subsection.pages.length,
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    saveState: 'saved',
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

  await pageStore.put(page);
  
  subsection.pages.push(page.pageId);
  subsection.updatedAt = new Date().toISOString();
  await subsectionStore.put(subsection);
  
  await tx.done;
  return page;
}

export async function getPage(pageId) {
  const db = await getDB();
  return await db.get('pages', pageId);
}

export async function getPagesForNotebook(notebookId) {
  const db = await getDB();
  const pages = await db.getAllFromIndex('pages', 'notebookId', notebookId);
  // We can't strictly sort by order here easily without subsections context, 
  // but we return them for general bulk access (e.g. search, export)
  return pages;
}

export async function getPagesForSubsection(subsectionId) {
  const db = await getDB();
  const pages = await db.getAllFromIndex('pages', 'subsectionId', subsectionId);
  return pages.sort((a, b) => a.order - b.order);
}

export async function updatePage(page) {
  const db = await getDB();
  page.updatedAt = new Date().toISOString();
  await db.put('pages', page);
  return page;
}

export async function movePageToSubsection(pageId, targetSubsectionId, newOrder = null) {
  const db = await getDB();
  const tx = db.transaction(['pages', 'subsections'], 'readwrite');
  const pageStore = tx.objectStore('pages');
  const subsectionStore = tx.objectStore('subsections');

  const page = await pageStore.get(pageId);
  if (!page) throw new Error('Page not found');

  const targetSubsection = await subsectionStore.get(targetSubsectionId);
  if (!targetSubsection) throw new Error('Target subsection not found');

  if (page.subsectionId !== targetSubsectionId) {
    // Remove from old subsection
    const oldSubsection = await subsectionStore.get(page.subsectionId);
    if (oldSubsection) {
      oldSubsection.pages = oldSubsection.pages.filter(id => id !== pageId);
      await subsectionStore.put(oldSubsection);
    }

    // Add to new subsection
    page.subsectionId = targetSubsectionId;
    page.sectionId = targetSubsection.sectionId;
    page.notebookId = targetSubsection.notebookId;

    if (newOrder === null) {
      page.order = targetSubsection.pages.length;
      targetSubsection.pages.push(pageId);
    } else {
      page.order = newOrder;
      targetSubsection.pages.splice(newOrder, 0, pageId);
      // Re-order the rest
      for (let i = 0; i < targetSubsection.pages.length; i++) {
        if (i !== newOrder) {
          const p = await pageStore.get(targetSubsection.pages[i]);
          p.order = i;
          await pageStore.put(p);
        }
      }
    }
    
    await subsectionStore.put(targetSubsection);
  } else if (newOrder !== null) {
    // Reorder within same subsection
    // Handled specifically via UI array rearrangement normally, but can be done here
    const oldIndex = targetSubsection.pages.indexOf(pageId);
    if (oldIndex > -1) {
      targetSubsection.pages.splice(oldIndex, 1);
      targetSubsection.pages.splice(newOrder, 0, pageId);
      for (let i = 0; i < targetSubsection.pages.length; i++) {
        const p = await pageStore.get(targetSubsection.pages[i]);
        p.order = i;
        await pageStore.put(p);
      }
      await subsectionStore.put(targetSubsection);
    }
  }

  page.updatedAt = new Date().toISOString();
  await pageStore.put(page);
  await tx.done;
  return page;
}

export async function deletePage(pageId) {
  const db = await getDB();
  const tx = db.transaction(['pages', 'images', 'subsections'], 'readwrite');
  
  const page = await tx.objectStore('pages').get(pageId);
  if (!page) return;
  
  // Delete images
  const imageStore = tx.objectStore('images');
  for (const img of page.images) {
    await imageStore.delete(img.storageKey);
  }

  // Remove from subsection
  const subsectionStore = tx.objectStore('subsections');
  const subsection = await subsectionStore.get(page.subsectionId);
  if (subsection) {
    subsection.pages = subsection.pages.filter(id => id !== pageId);
    await subsectionStore.put(subsection);
  }

  await tx.objectStore('pages').delete(pageId);
  await tx.done;
}
