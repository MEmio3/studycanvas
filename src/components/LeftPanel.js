import Sortable from 'sortablejs';
import { renderPageCard } from './PageCard.js';

export class LeftPanel {
  constructor(container, pages, activePageId, onPageSelect, onPageReorder, onNewPage) {
    this.container = container;
    this.pages = pages;
    this.activePageId = activePageId;
    this.onPageSelect = onPageSelect;
    this.onPageReorder = onPageReorder;
    this.onNewPage = onNewPage;
  }

  updatePages(pages, activePageId) {
    this.pages = pages;
    if (activePageId) this.activePageId = activePageId;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="left-panel" style="width: 260px; height: 100%; border-right: 1px solid var(--border-default); background: var(--bg-surface); display: flex; flex-direction: column;">
        <div style="padding: var(--space-16); border-bottom: 1px solid var(--border-default);">
          <button class="primary" id="btn-add-page" style="width: 100%;"><i class="ti ti-plus"></i> New Page</button>
        </div>
        <div class="page-list scrollable" style="flex-grow: 1; padding: var(--space-12);" id="page-list-container">
          ${this.pages.map(p => renderPageCard(p, p.pageId === this.activePageId)).join('')}
        </div>
      </div>
    `;
    this.attachEvents();
  }

  attachEvents() {
    this.container.querySelector('#btn-add-page').addEventListener('click', () => {
      if (this.onNewPage) this.onNewPage();
    });

    const listEl = this.container.querySelector('#page-list-container');
    listEl.querySelectorAll('.page-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        if (this.onPageSelect) this.onPageSelect(id);
      });
    });

    if (this.pages.length > 0) {
      new Sortable(listEl, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: (evt) => {
          if (evt.oldIndex !== evt.newIndex && this.onPageReorder) {
            this.onPageReorder(evt.oldIndex, evt.newIndex);
          }
        }
      });
    }
  }
}
