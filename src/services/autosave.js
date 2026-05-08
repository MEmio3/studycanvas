import { updatePage } from '../store/pages.js';

let saveTimeout = null;
let currentSavePromise = null;

// Track current active page for saving context
let activePage = null;

export function setActivePageForAutosave(page) {
  if (activePage && activePage.pageId !== page?.pageId && activePage.saveState === 'unsaved') {
    // Immediate save old page if switching
    forceSavePage(activePage);
  }
  activePage = page;
}

export function notifyChange(page) {
  if (!page) return;
  page.saveState = 'unsaved';
  
  // Dispatch event for UI update
  document.dispatchEvent(new CustomEvent('app-savestate-change', { detail: { state: 'unsaved' } }));

  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    forceSavePage(page);
  }, 1500);
}

export async function forceSavePage(page) {
  if (!page || page.saveState === 'saved') return;

  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }

  // If already saving, we might wait or just let the previous save finish.
  // A robust implementation queues saves. For now, simple await.
  if (currentSavePromise) {
    await currentSavePromise;
  }

  page.saveState = 'saving';
  document.dispatchEvent(new CustomEvent('app-savestate-change', { detail: { state: 'saving' } }));

  try {
    currentSavePromise = updatePage(page);
    await currentSavePromise;
    page.saveState = 'saved';
    document.dispatchEvent(new CustomEvent('app-savestate-change', { detail: { state: 'saved' } }));
  } catch (err) {
    console.error("Autosave failed:", err);
    page.saveState = 'error';
    document.dispatchEvent(new CustomEvent('app-savestate-change', { detail: { state: 'error' } }));
    
    document.dispatchEvent(new CustomEvent('app-toast', { 
      detail: { message: "Could not save changes — [Retry]", type: "error", action: "retry-save", pageId: page.pageId } 
    }));
  } finally {
    currentSavePromise = null;
  }
}

// Ensure synchronous save attempt on unload
window.addEventListener('beforeunload', (e) => {
  if (activePage && activePage.saveState === 'unsaved') {
    forceSavePage(activePage);
    e.preventDefault();
    e.returnValue = "You have unsaved changes. Leave anyway?";
  }
});
