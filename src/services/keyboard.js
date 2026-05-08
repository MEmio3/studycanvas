import { forceSavePage } from './autosave.js';

let globalShortcutsEnabled = true;

export function setGlobalShortcutsEnabled(enabled) {
  globalShortcutsEnabled = enabled;
}

export function initGlobalKeyboardShortcuts(appState) {
  document.addEventListener('keydown', (e) => {
    if (!globalShortcutsEnabled) return;

    // Ctrl/Cmd + S: Save current page immediately
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      if (!e.shiftKey) {
        e.preventDefault();
        // Dispatch event for UI to force save
        document.dispatchEvent(new CustomEvent('app-shortcut-save'));
      } else {
        // Ctrl/Cmd + Shift + S: Save all unsaved pages (for future if needed)
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('app-shortcut-save-all'));
      }
    }

    // Ctrl/Cmd + Shift + N: Add new section
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'n' || e.key === 'N')) {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('app-shortcut-new-section'));
    }

    // Ctrl/Cmd + Shift + B: Add new subsection
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('app-shortcut-new-subsection'));
    }

    // Ctrl/Cmd + M: Move to subsection
    if ((e.ctrlKey || e.metaKey) && (e.key === 'm' || e.key === 'M') && !e.shiftKey) {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('app-shortcut-move-page'));
    }

    // Ctrl/Cmd + [ : Collapse all sections
    if ((e.ctrlKey || e.metaKey) && e.key === '[') {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('app-shortcut-collapse-all'));
    }

    // Ctrl/Cmd + ] : Expand all sections
    if ((e.ctrlKey || e.metaKey) && e.key === ']') {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('app-shortcut-expand-all'));
    }

    // Delete handling requires focus checks, so usually managed in components
    // Ctrl/Cmd + Backspace is also mostly managed in Edit Mode component
  });
}
