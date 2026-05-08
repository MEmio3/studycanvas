import { getPagesForDeck } from '../../store/pages.js';

export class TtsPageSelector {
  constructor(container, deckId, onSelect, onClose) {
    this.container = container;
    this.deckId = deckId;
    this.onSelect = onSelect;
    this.onClose = onClose;
    this.pages = [];
    this.searchQuery = '';
  }

  async render() {
    this.pages = await getPagesForDeck(this.deckId);
    
    // Sort newest first
    this.pages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    this.container.innerHTML = `
      <div class="yt-modal-overlay" id="yt-tts-selector-overlay">
        <div class="yt-modal-content" style="width: 500px; max-height: 80vh; display: flex; flex-direction: column; padding: 0;">
          <div style="padding: var(--space-16); border-bottom: 1px solid var(--border-default); display: flex; justify-content: space-between; align-items: center; background: var(--capture-panel-header-bg); border-radius: var(--radius-lg) var(--radius-lg) 0 0;">
            <h3 style="font-size: 16px;">Select a page to listen to</h3>
            <button id="yt-tts-selector-close" class="ghost icon-only"><i class="ti ti-x"></i></button>
          </div>
          
          <div style="padding: var(--space-12); border-bottom: 1px solid var(--border-default);">
            <div style="position: relative;">
              <i class="ti ti-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-secondary);"></i>
              <input type="text" id="yt-tts-search" placeholder="Search pages..." style="width: 100%; padding: var(--space-8) var(--space-8) var(--space-8) 32px; background: var(--bg-base); border: 1px solid var(--border-default); border-radius: var(--radius-sm); color: var(--text-primary); font-size: 13px;">
            </div>
          </div>

          <div id="yt-tts-page-list" style="flex-grow: 1; overflow-y: auto; padding: var(--space-8);">
          </div>
        </div>
      </div>
    `;

    this.renderPageList();
    this.attachEvents();
    
    setTimeout(() => {
      const searchInput = this.container.querySelector('#yt-tts-search');
      if (searchInput) searchInput.focus();
    }, 50);
  }

  renderPageList() {
    const listEl = this.container.querySelector('#yt-tts-page-list');
    if (!listEl) return;
    
    listEl.innerHTML = '';

    const filtered = this.pages.filter(p => {
      if (!this.searchQuery) return true;
      const q = this.searchQuery.toLowerCase();
      const titleMatch = (p.title || '').toLowerCase().includes(q);
      const textMatch = (p.textBlock?.rawText || '').toLowerCase().includes(q);
      return titleMatch || textMatch;
    });

    if (filtered.length === 0) {
      if (this.pages.length === 0) {
        listEl.innerHTML = '<div style="padding: 32px; text-align: center; color: var(--text-secondary); font-size: 14px;">No pages in this deck yet. Save a capture to get started.</div>';
      } else {
        listEl.innerHTML = '<div style="padding: 32px; text-align: center; color: var(--text-secondary); font-size: 14px;">No pages match your search.</div>';
      }
      return;
    }

    filtered.forEach(page => {
      const row = document.createElement('div');
      row.style.padding = 'var(--space-12)';
      row.style.borderBottom = '1px solid var(--border-default)';
      row.style.cursor = 'pointer';
      row.style.display = 'flex';
      row.style.gap = 'var(--space-12)';
      row.style.borderRadius = 'var(--radius-sm)';
      row.style.transition = 'background 0.2s ease';
      
      row.addEventListener('mouseenter', () => row.style.background = 'var(--bg-hover)');
      row.addEventListener('mouseleave', () => row.style.background = 'transparent');
      
      let rawText = page.textBlock?.rawText || '';
      if (rawText.length > 80) rawText = rawText.substring(0, 80) + '...';

      let videoTimestampHtml = '';
      if (page.videoTimestamp) {
        videoTimestampHtml = `
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px; display: flex; align-items: center; gap: 4px;">
            <i class="ti ti-brand-youtube" style="color: var(--watch-complete-color);"></i> ${page.videoTimestamp.videoTitle} &middot; ${page.videoTimestamp.formatted}
          </div>
        `;
      }

      // We'll just show an icon placeholder if no image thumbnail is easily available synchronously
      row.innerHTML = `
        <div style="width: 48px; height: 36px; background: var(--bg-surface); border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid var(--border-default);">
          <i class="ti ti-photo" style="color: var(--text-tertiary); font-size: 18px;"></i>
        </div>
        <div style="flex-grow: 1; min-width: 0;">
          <div style="font-size: 14px; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${page.title}</div>
          <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.4; margin-top: 2px;">"${rawText}"</div>
          ${videoTimestampHtml}
        </div>
      `;

      row.addEventListener('click', () => {
        if (this.onSelect) this.onSelect(page);
        this.close();
      });

      listEl.appendChild(row);
    });
  }

  attachEvents() {
    const closeBtn = this.container.querySelector('#yt-tts-selector-close');
    const searchInput = this.container.querySelector('#yt-tts-search');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.renderPageList();
      });
    }

    this.keydownHandler = (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    };
    document.addEventListener('keydown', this.keydownHandler);
  }

  close() {
    document.removeEventListener('keydown', this.keydownHandler);
    if (this.onClose) this.onClose();
  }
}
