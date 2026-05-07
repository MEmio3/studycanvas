import { getAllDecks, createDeck } from '../store/decks.js';
import { createPage } from '../store/pages.js';

export class DeckManager {
  constructor(appContainer) {
    this.container = appContainer;
    this.decks = [];
  }

  async mount() {
    this.container.innerHTML = this.renderLoading();
    await this.loadDecks();
    this.render();
    this.attachEvents();
  }

  unmount() {
    this.container.innerHTML = '';
  }

  async loadDecks() {
    this.decks = await getAllDecks();
    // Sort by updated at descending
    this.decks.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  renderLoading() {
    return `<div class="deck-manager-loading flex-center" style="height: 100vh;">Loading your decks...</div>`;
  }

  render() {
    const html = `
      <div class="deck-manager" style="padding: var(--space-32); max-width: 1200px; margin: 0 auto; width: 100%;">
        <div class="deck-manager-header flex-between" style="margin-bottom: var(--space-32);">
          <div class="logo-text">study<span>canvas</span></div>
          <div style="display: flex; align-items: center; background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: 4px 12px; min-width: 200px;">
            <i class="ti ti-search" style="color: var(--text-tertiary);"></i>
            <input type="text" id="search-input" placeholder="Search decks..." style="border: none; background: transparent; padding: 4px; margin-left: 8px; flex-grow: 1; outline: none; color: var(--text-primary);">
          </div>
          <div class="deck-manager-actions" style="display: flex; gap: var(--space-12);">
            <button class="ghost" id="btn-import"><i class="ti ti-file-import"></i> Import</button>
            <input type="file" id="import-json-input" accept=".json" style="display: none;">
            <button class="primary" id="btn-new-deck"><i class="ti ti-plus"></i> New Deck</button>
          </div>
        </div>
        
        <h2 style="margin-bottom: var(--space-24);">Your Decks (${this.decks.length})</h2>
        
        ${this.decks.length === 0 ? this.renderEmptyState() : this.renderDeckGrid()}
      </div>
    `;
    this.container.innerHTML = html;
  }

  renderEmptyState() {
    return `
      <div class="empty-state flex-center" style="flex-direction: column; gap: var(--space-16); padding: var(--space-32) 0; color: var(--text-secondary);">
        <i class="ti ti-books" style="font-size: 48px; opacity: 0.5;"></i>
        <h3>Nothing here yet</h3>
        <p>Create a new deck to get started</p>
      </div>
    `;
  }

  renderDeckGrid() {
    const cardsHtml = this.decks.map(deck => {
      const date = new Date(deck.updatedAt).toLocaleDateString();
      return `
        <div class="card deck-card" data-id="${deck.deckId}" style="cursor: pointer; transition: transform var(--transition-fast);">
          <div class="deck-thumbnail" style="height: 120px; background-color: var(--bg-base); border-radius: var(--radius-md) var(--radius-md) 0 0; margin: calc(var(--space-16) * -1) calc(var(--space-16) * -1) var(--space-16) calc(var(--space-16) * -1); display: flex; align-items: center; justify-content: center;">
            <i class="ti ti-photo" style="font-size: 32px; color: var(--text-tertiary);"></i>
          </div>
          <h3 style="margin-bottom: var(--space-4);">${deck.title}</h3>
          <div class="deck-meta flex-between caption-text">
            <span>${deck.pages.length} pages</span>
            <span>${date}</span>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="deck-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-24);">
        ${cardsHtml}
      </div>
    `;
  }

  attachEvents() {
    const searchInput = this.container.querySelector('#search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const cards = this.container.querySelectorAll('.deck-card');
        cards.forEach(card => {
          const title = card.querySelector('h3').textContent.toLowerCase();
          if (title.includes(query)) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        });
      });
    }

    const importBtn = this.container.querySelector('#btn-import');
    const importInput = this.container.querySelector('#import-json-input');
    if (importBtn && importInput) {
      importBtn.addEventListener('click', () => importInput.click());
      importInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const { importDeckFromJson } = await import('../services/import.js');
        importDeckFromJson(file, (newDeckId) => {
          this.loadDecks();
          alert('Deck imported successfully!');
        }, (err) => {
          alert('Failed to import deck: ' + err.message);
        });
        importInput.value = ''; // Reset input
      });
    }

    const newDeckBtn = this.container.querySelector('#btn-new-deck');
    if (newDeckBtn) {
      newDeckBtn.addEventListener('click', async () => {
        const title = prompt("Enter deck title:", "Untitled Deck");
        if (title !== null) {
          const deck = await createDeck(title || "Untitled Deck");
          // Create first empty page
          await createPage(deck.deckId, "Page 1");
          window.location.hash = `deck/${deck.deckId}`;
        }
      });
    }

    const cards = this.container.querySelectorAll('.deck-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        window.location.hash = `deck/${id}`;
      });
      
      // Hover effect via JS or CSS (CSS is better, but doing inline for quick scaffolding if needed)
      card.addEventListener('mouseenter', () => card.style.transform = 'translateY(-4px)');
      card.addEventListener('mouseleave', () => card.style.transform = 'translateY(0)');
    });
  }
}
