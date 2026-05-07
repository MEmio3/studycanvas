export class TopBar {
  constructor(container, deck, onModeChange) {
    this.container = container;
    this.deck = deck;
    this.onModeChange = onModeChange;
    this.currentMode = 'edit';
  }

  render() {
    this.container.innerHTML = `
      <div class="top-bar flex-between" style="padding: var(--space-12) var(--space-24); border-bottom: 1px solid var(--border-default); background: var(--bg-surface);">
        <div class="logo-text" style="cursor: pointer;" id="tb-logo">study<span>canvas</span></div>
        <div class="deck-title" style="flex-grow: 1; margin: 0 var(--space-24);">
          <input type="text" id="tb-deck-title" value="${this.deck.title}" style="background: transparent; border: none; font-size: 16px; font-weight: 600; padding: var(--space-4); width: 100%; max-width: 400px;" placeholder="Untitled Deck">
        </div>
        <div class="page-counter meta-text" style="margin-right: var(--space-24);" id="tb-counter">
          Page 1 of ${this.deck.pages.length}
        </div>
        <div class="mode-switch" style="display: flex; background: var(--bg-base); border-radius: var(--radius-md); padding: 2px;">
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
    titleInput.addEventListener('blur', () => {
      this.deck.title = titleInput.value || "Untitled Deck";
      document.dispatchEvent(new CustomEvent('deck-title-changed', { detail: this.deck.title }));
    });

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
