export class TopBar {
  constructor(container, notebook, activePage, onModeChange, onFlagChange) {
    this.container = container;
    this.notebook = notebook;
    this.activePage = activePage;
    this.onModeChange = onModeChange;
    this.onFlagChange = onFlagChange;
    this.currentMode = 'edit';
    this.saveState = activePage?.saveState || 'saved';

    document.addEventListener('app-savestate-change', (e) => {
      this.saveState = e.detail.state;
      this.updateSaveIndicator();
    });
  }

  setActivePage(page) {
    this.activePage = page;
    this.saveState = page?.saveState || 'saved';
    this.render();
  }

  getIndicatorMarkup() {
    if (this.saveState === 'saved') {
      return `<span style="color: var(--save-state-saved);">●</span> <span style="color: var(--text-secondary);">Saved</span>`;
    }
    if (this.saveState === 'saving') {
      return `<i class="ti ti-loader" style="animation: spin 1s linear infinite;"></i> <span style="color: var(--text-secondary);">Saving...</span>`;
    }
    if (this.saveState === 'unsaved') {
      return `<span style="color: var(--save-state-unsaved);">●</span> <span style="color: var(--save-state-unsaved);">Unsaved changes</span>`;
    }
    if (this.saveState === 'error') {
      return `<span style="color: var(--save-state-error);">●</span> <span style="color: var(--save-state-error); cursor: pointer;" id="btn-retry-save">Save failed — click to retry</span>`;
    }
    return '';
  }

  updateSaveIndicator() {
    const el = this.container.querySelector('#tb-save-indicator');
    if (el) {
      el.innerHTML = this.getIndicatorMarkup();
      const retryBtn = el.querySelector('#btn-retry-save');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          document.dispatchEvent(new CustomEvent('app-shortcut-save'));
        });
      }
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="top-bar flex-between" style="padding: var(--space-12) var(--space-24); border-bottom: 1px solid var(--border-default); background: var(--bg-surface);">
        <div class="logo-text" style="cursor: pointer;" id="tb-logo">study<span>canvas</span></div>
        <div class="deck-title" style="flex-grow: 1; margin: 0 var(--space-24); display: flex; flex-direction: column; justify-content: center;">
          <div style="display: flex; align-items: center; gap: var(--space-12);">
            <div style="font-size: 16px;">${this.notebook.emoji || '📚'}</div>
            <input type="text" id="tb-deck-title" value="${this.notebook.title}" style="background: transparent; border: none; font-size: 16px; font-weight: 600; padding: var(--space-4); width: 100%; max-width: 400px;" placeholder="Untitled Notebook">
            <button class="ghost icon-only" id="btn-flag-page" title="Flag this page" style="color: ${this.activePage?.isFlagged ? 'var(--amber)' : 'inherit'};">
              <i class="ti ${this.activePage?.isFlagged ? 'ti-star-filled' : 'ti-star'}"></i>
            </button>
          </div>
          <div id="tb-playlist-title" style="font-size: 11px; color: var(--text-secondary); margin-left: 4px; display: none;">📋 Playlist Name</div>
        </div>
        
        <div id="tb-save-indicator" class="meta-text" style="margin-right: var(--space-16); font-size: 11px; display: flex; align-items: center; gap: 4px; min-width: 120px;" role="status" aria-live="polite">
          ${this.getIndicatorMarkup()}
        </div>

        <div class="page-counter meta-text" style="margin-right: var(--space-24); font-size: 13px;" id="tb-counter">
          Page 1 of ${this.notebook.pages?.length || 0}
        </div>
        
        <div class="mode-switch" style="display: flex; background: var(--bg-base); border-radius: var(--radius-md); padding: 2px;">
          <div style="position: relative;" id="export-dropdown-wrapper">
            <button class="ghost icon-only" id="btn-export" title="Export Notebook"><i class="ti ti-download"></i></button>
            <div id="export-dropdown" style="display: none; position: absolute; right: 0; top: 100%; background: var(--bg-elevated); border: 1px solid var(--border-default); border-radius: var(--radius-md); box-shadow: 0 4px 12px rgba(0,0,0,0.5); z-index: 100; min-width: 180px; padding: var(--space-8); flex-direction: column; gap: 4px;">
              <button class="ghost" id="btn-export-json" style="width: 100%; text-align: left; justify-content: flex-start;"><i class="ti ti-json" style="margin-right: 8px;"></i> As JSON (Backup)</button>
              <button class="ghost" id="btn-export-pdf" style="width: 100%; text-align: left; justify-content: flex-start;"><i class="ti ti-file-type-pdf" style="margin-right: 8px;"></i> As PDF Summary</button>
            </div>
          </div>
          <button class="ghost icon-only" id="btn-settings" title="Settings"><i class="ti ti-settings"></i></button>
          <button class="mode-btn ${this.currentMode === 'edit' ? 'primary' : 'ghost'}" data-mode="edit" style="border: none; padding: var(--space-4) var(--space-12);">Edit</button>
          <button class="mode-btn ${this.currentMode === 'slide' ? 'primary' : 'ghost'}" data-mode="slide" style="border: none; padding: var(--space-4) var(--space-12);">Slide</button>
          <button class="mode-btn ${this.currentMode === 'present' ? 'primary' : 'ghost'}" data-mode="present" style="border: none; padding: var(--space-4) var(--space-12);">Present</button>
          <button class="mode-btn ${this.currentMode === 'watch' ? 'primary' : 'ghost'}" data-mode="watch" style="border: none; padding: var(--space-4) var(--space-12);"><i class="ti ti-brand-youtube" style="margin-right: 4px;"></i>Watch</button>
        </div>
      </div>
    `;
    this.attachEvents();
    this.updateSaveIndicator();
  }

  updateCounter(current, total) {
    const counter = this.container.querySelector('#tb-counter');
    if (counter) {
      counter.textContent = `Page ${current} of ${total}`;
    }
  }

  setWatchProgressText(text) {
    const counter = this.container.querySelector('#tb-counter');
    if (counter) {
      counter.textContent = text;
    }
  }

  setPlaylistTitle(title) {
    const pt = this.container.querySelector('#tb-playlist-title');
    if (pt) {
      if (title) {
        pt.textContent = `📋 ${title}`;
        pt.style.display = 'block';
      } else {
        pt.style.display = 'none';
      }
    }
  }

  attachEvents() {
    this.container.querySelector('#tb-logo').addEventListener('click', () => {
      window.location.hash = '';
    });

    const titleInput = this.container.querySelector('#tb-deck-title');
    if (titleInput) {
      titleInput.addEventListener('blur', () => {
        this.notebook.title = titleInput.value || "Untitled Notebook";
        document.dispatchEvent(new CustomEvent('deck-title-changed', { detail: this.notebook.title }));
      });
      titleInput.addEventListener('input', () => {
        document.dispatchEvent(new CustomEvent('app-savestate-change', { detail: { state: 'unsaved' } }));
        // Simulate immediate save for title change
        document.dispatchEvent(new CustomEvent('deck-title-changed', { detail: titleInput.value || "Untitled Notebook" }));
      });
    }

    const flagBtn = this.container.querySelector('#btn-flag-page');
    if (flagBtn) {
      flagBtn.addEventListener('click', () => {
        if (this.activePage) {
           this.activePage.isFlagged = !this.activePage.isFlagged;
           if (this.onFlagChange) this.onFlagChange(this.activePage.isFlagged);
           this.render();
           // Notify autosave
           document.dispatchEvent(new CustomEvent('app-savestate-change', { detail: { state: 'unsaved' } }));
        }
      });
    }

    const exportBtn = this.container.querySelector('#btn-export');
    const exportDropdown = this.container.querySelector('#export-dropdown');
    
    if (exportBtn && exportDropdown) {
      exportBtn.addEventListener('click', (e) => {
        exportDropdown.style.display = exportDropdown.style.display === 'none' ? 'flex' : 'none';
        e.stopPropagation();
      });
      document.addEventListener('click', () => {
        exportDropdown.style.display = 'none';
      });
    }

    const jsonBtn = this.container.querySelector('#btn-export-json');
    if (jsonBtn) {
      jsonBtn.addEventListener('click', async () => {
        const { exportDeckAsJson } = await import('../services/export.js');
        const { getPagesForNotebook } = await import('../store/pages.js');
        const pages = await getPagesForNotebook(this.notebook.notebookId);
        await exportDeckAsJson(this.notebook, pages);
      });
    }

    const pdfBtn = this.container.querySelector('#btn-export-pdf');
    if (pdfBtn) {
      pdfBtn.addEventListener('click', async () => {
        const { exportDeckAsPdf } = await import('../services/export.js');
        const { getPagesForNotebook } = await import('../store/pages.js');
        const pages = await getPagesForNotebook(this.notebook.notebookId);
        await exportDeckAsPdf(this.notebook, pages);
      });
    }

    const settingsBtn = this.container.querySelector('#btn-settings');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('open-settings'));
      });
    }

    this.container.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.target.getAttribute('data-mode');
        if (mode !== this.currentMode) {
          this.currentMode = mode;
          this.render();
          if (this.onModeChange) this.onModeChange(mode);
          // Explicit save trigger on mode change
          document.dispatchEvent(new CustomEvent('app-shortcut-save'));
        }
      });
    });
  }
}
