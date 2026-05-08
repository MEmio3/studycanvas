import { getDB } from './db.js';

export async function createSubsection(notebookId, sectionId, title, isBuiltIn = false, order = 0) {
  const db = await getDB();
  const subsectionId = crypto.randomUUID();
  const newSubsection = {
    subsectionId,
    sectionId,
    notebookId,
    title,
    order,
    isCollapsed: false,
    isBuiltIn,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pages: []
  };
  await db.put('subsections', newSubsection);
  return newSubsection;
}

export async function getSubsectionsForSection(sectionId) {
  const db = await getDB();
  const index = db.transaction('subsections').store.index('sectionId');
  const subsections = await index.getAll(sectionId);
  return subsections.sort((a, b) => a.order - b.order);
}

export async function getSubsectionsForNotebook(notebookId) {
  const db = await getDB();
  const index = db.transaction('subsections').store.index('notebookId');
  const subsections = await index.getAll(notebookId);
  return subsections.sort((a, b) => a.order - b.order);
}

export async function updateSubsection(subsectionId, updates) {
  const db = await getDB();
  const tx = db.transaction('subsections', 'readwrite');
  const store = tx.objectStore('subsections');
  const subsection = await store.get(subsectionId);
  if (!subsection) throw new Error('Subsection not found');

  const updatedSubsection = { ...subsection, ...updates, updatedAt: new Date().toISOString() };
  await store.put(updatedSubsection);
  await tx.done;
  return updatedSubsection;
}

export async function deleteSubsection(subsectionId) {
  const db = await getDB();
  await db.delete('subsections', subsectionId);
}

export async function reorderSubsections(sectionId, orderedSubsectionIds) {
  const db = await getDB();
  const tx = db.transaction('subsections', 'readwrite');
  const store = tx.objectStore('subsections');

  for (let i = 0; i < orderedSubsectionIds.length; i++) {
    const id = orderedSubsectionIds[i];
    const sub = await store.get(id);
    if (sub && sub.sectionId === sectionId) {
      sub.order = i;
      sub.updatedAt = new Date().toISOString();
      store.put(sub);
    }
  }
  await tx.done;
}

export async function moveSubsectionToSection(subsectionId, newSectionId, order = 0) {
  const db = await getDB();
  const tx = db.transaction(['sections', 'subsections'], 'readwrite');
  const sectionStore = tx.objectStore('sections');
  const subsectionStore = tx.objectStore('subsections');

  const subsection = await subsectionStore.get(subsectionId);
  if (!subsection) throw new Error('Subsection not found');

  const oldSectionId = subsection.sectionId;
  
  if (oldSectionId !== newSectionId) {
    // Remove from old section array
    const oldSection = await sectionStore.get(oldSectionId);
    if (oldSection) {
      oldSection.subsections = oldSection.subsections.filter(id => id !== subsectionId);
      sectionStore.put(oldSection);
    }
    
    // Add to new section array
    const newSection = await sectionStore.get(newSectionId);
    if (newSection) {
      newSection.subsections.splice(order, 0, subsectionId);
      sectionStore.put(newSection);
    }
    
    subsection.sectionId = newSectionId;
  }
  
  subsection.order = order;
  subsection.updatedAt = new Date().toISOString();
  await subsectionStore.put(subsection);
  await tx.done;
}
