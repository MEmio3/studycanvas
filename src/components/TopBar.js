export class TopBar {
  constructor(container, deck, activePage, onModeChange, onTopicChange) {
    this.container = container;
    this.deck = deck;
    this.activePage = activePage;
    this.onModeChange = onModeChange;
    this.onTopicChange = onTopicChange;
    this.currentMode = 'edit';
  }

  setActivePage(page) {
    this.activePage = page;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="top-bar flex-between" style="padding: var(--space-12) var(--space-24); border-bottom: 1px solid var(--border-default); background: var(--bg-surface);">
        <div class="logo-text" style="cursor: pointer;" id="tb-logo">study<span>canvas</span></div>
        <div class="deck-title" style="flex-grow: 1; margin: 0 var(--space-24); display: flex; align-items: center; gap: var(--space-12);">
          <input type="text" id="tb-deck-title" value="${this.deck.title}" style="background: transparent; border: none; font-size: 16px; font-weight: 600; padding: var(--space-4); width: 100%; max-width: 400px;" placeholder="Untitled Deck">
          <input type="text" id="tb-page-topic" value="${this.activePage?.topic || ''}" style="background: var(--bg-base); border: 1px solid var(--border-default); border-radius: var(--radius-sm); font-size: 12px; padding: var(--space-4) var(--space-8); width: 120px;" placeholder="Add topic...">
        </div>
        <div class="page-counter meta-text" style="margin-right: var(--space-24);" id="tb-counter">
          Page 1 of ${this.deck.pages.length}
        </div>
        <div class="mode-switch" style="display: flex; background: var(--bg-base); border-radius: var(--radius-md); padding: 2px;">
          <div style="position: relative;" id="export-dropdown-wrapper">
            <button class="ghost icon-only" id="btn-export" title="Export Deck"><i class="ti ti-download"></i></button>
            <div id="export-dropdown" style="display: none; position: absolute; right: 0; top: 100%; background: var(--bg-elevated); border: 1px solid var(--border-default); border-radius: var(--radius-md); box-shadow: 0 4px 12px rgba(0,0,0,0.5); z-index: 100; min-width: 180px; padding: var(--space-8); flex-direction: column; gap: 4px;">
              <button class="ghost" id="btn-export-json" style="width: 100%; text-align: left; justify-content: flex-start;"><i class="ti ti-json" style="margin-right: 8px;"></i> As JSON (Backup)</button>
              <button class="ghost" id="btn-export-pdf" style="width: 100%; text-align: left; justify-content: flex-start;"><i class="ti ti-file-type-pdf" style="margin-right: 8px;"></i> As PDF Summary</button>
            </div>
          </div>
          <button class="ghost icon-only" id="btn-settings" title="Settings"><i class="ti ti-settings"></i></button>
          <button class="mode-btn ${this.currentMode === 'edit' ? 'primary' : 'ghost'}" data-mode="edit" style="border: none; padding: var(--space-4) var(--space-12);">Edit</button>
          <button class="mode-btn ${this.currentMode === 'slide' ? 'primary' : 'ghost'}" data-mode="slide" style="border: none; padding: var(--space-4) var(--space-12);">Slide</button>
          <button class="mode-btn ${this.currentMode === 'present' ? 'primary' : 'ghost'}" data-mode="present" style="border: none; padding: var(--space-4) var(--space-12);">Present</button>
        </div>
      </div>
    `;
    this.attachEvents();
  }

  updateCounter(current, total) {
    const counter = this.container.querySelector('#tb-counter');
    if (counter) counter.textContent = `Page ${current} of ${total}`;
  }

  attachEvents() {
    this.container.querySelector('#tb-logo').addEventListener('click', () => {
      window.location.hash = '';
    });

    const titleInput = this.container.querySelector('#tb-deck-title');
    if (titleInput) {
      titleInput.addEventListener('blur', () => {
        this.deck.title = titleInput.value || "Untitled Deck";
        document.dispatchEvent(new CustomEvent('deck-title-changed', { detail: this.deck.title }));
      });
    }

    const topicInput = this.container.querySelector('#tb-page-topic');
    if (topicInput) {
      topicInput.addEventListener('blur', () => {
        if (this.onTopicChange) this.onTopicChange(topicInput.value);
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
        const { getAllPagesForDeck } = await import('../store/pages.js');
        const pages = await getAllPagesForDeck(this.deck.deckId);
        await exportDeckAsJson(this.deck, pages);
      });
    }

    const pdfBtn = this.container.querySelector('#btn-export-pdf');
    if (pdfBtn) {
      pdfBtn.addEventListener('click', async () => {
        const { exportDeckAsPdf } = await import('../services/export.js');
        const { getAllPagesForDeck } = await import('../store/pages.js');
        const pages = await getAllPagesForDeck(this.deck.deckId);
        await exportDeckAsPdf(this.deck, pages);
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
        }
      });
    });
  }
}
