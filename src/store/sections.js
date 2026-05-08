import { getDB } from './db.js';

export async function createSection(notebookId, title, order = 0) {
  const db = await getDB();
  const sectionId = crypto.randomUUID();
  const newSection = {
    sectionId,
    notebookId,
    title,
    order,
    isCollapsed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subsections: []
  };
  await db.put('sections', newSection);
  return newSection;
}

export async function getSectionsForNotebook(notebookId) {
  const db = await getDB();
  const index = db.transaction('sections').store.index('notebookId');
  const sections = await index.getAll(notebookId);
  return sections.sort((a, b) => a.order - b.order);
}

export async function updateSection(sectionId, updates) {
  const db = await getDB();
  const tx = db.transaction('sections', 'readwrite');
  const store = tx.objectStore('sections');
  const section = await store.get(sectionId);
  if (!section) throw new Error('Section not found');

  const updatedSection = { ...section, ...updates, updatedAt: new Date().toISOString() };
  await store.put(updatedSection);
  await tx.done;
  return updatedSection;
}

export async function deleteSection(sectionId) {
  const db = await getDB();
  await db.delete('sections', sectionId);
}

export async function reorderSections(notebookId, orderedSectionIds) {
  const db = await getDB();
  const tx = db.transaction('sections', 'readwrite');
  const store = tx.objectStore('sections');

  for (let i = 0; i < orderedSectionIds.length; i++) {
    const id = orderedSectionIds[i];
    const section = await store.get(id);
    if (section && section.notebookId === notebookId) {
      section.order = i;
      section.updatedAt = new Date().toISOString();
      store.put(section);
    }
  }
  await tx.done;
}
