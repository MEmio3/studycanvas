import { getAllNotebooks, createNotebook, updateNotebook } from '../store/notebooks.js';
import { createSection } from '../store/sections.js';
import { createSubsection } from '../store/subsections.js';
import { createPage } from '../store/pages.js';

export class DeckManager {
  constructor(appContainer) {
    this.container = appContainer;
    this.notebooks = [];
  }

  async mount() {
    this.container.innerHTML = this.renderLoading();
    await this.loadNotebooks();
    this.render();
    this.attachEvents();
  }

  unmount() {
    this.container.innerHTML = '';
  }

  async loadNotebooks() {
    this.notebooks = await getAllNotebooks();
    this.notebooks.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  renderLoading() {
    return `<div class="deck-manager-loading flex-center" style="height: 100vh;">Loading your notebooks...</div>`;
  }

  render() {
    const html = `
      <div class="deck-manager" style="padding: var(--space-32); max-width: 1200px; margin: 0 auto; width: 100%;">
        <div class="deck-manager-header flex-between" style="margin-bottom: var(--space-32);">
          <div class="logo-text">study<span>canvas</span></div>
          <div style="display: flex; align-items: center; background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: 4px 12px; min-width: 200px;">
            <i class="ti ti-search" style="color: var(--text-tertiary);"></i>
            <input type="text" id="search-input" placeholder="Search notebooks..." style="border: none; background: transparent; padding: 4px; margin-left: 8px; flex-grow: 1; outline: none; color: var(--text-primary);">
          </div>
          <div class="deck-manager-actions" style="display: flex; gap: var(--space-12);">
            <button class="ghost" id="btn-import"><i class="ti ti-file-import"></i> Import</button>
            <input type="file" id="import-json-input" accept=".json" style="display: none;">
            <button class="primary" id="btn-new-deck"><i class="ti ti-plus"></i> New Notebook</button>
          </div>
        </div>
        
        <h2 style="margin-bottom: var(--space-24);">Your Notebooks (${this.notebooks.length})</h2>
        
        ${this.notebooks.length === 0 ? this.renderEmptyState() : this.renderNotebookGrid()}
      </div>
    `;
    this.container.innerHTML = html;
  }

  renderEmptyState() {
    return `
      <div class="empty-state flex-center" style="flex-direction: column; gap: var(--space-16); padding: var(--space-32) 0; color: var(--text-secondary);">
        <i class="ti ti-books" style="font-size: 48px; opacity: 0.5;"></i>
        <h3>Nothing here yet</h3>
        <p>Create a new notebook to get started</p>
      </div>
    `;
  }

  renderNotebookGrid() {
    const cardsHtml = this.notebooks.map(nb => {
      const date = new Date(nb.updatedAt).toLocaleDateString();
      const pageCount = nb.sections?.length || 0;
      return `
        <div class="card deck-card" data-id="${nb.notebookId}" style="cursor: pointer; transition: transform var(--transition-fast); border-left: 4px solid ${nb.color || 'var(--accent-primary)'}; position: relative;">
          <div class="deck-thumbnail" style="height: 120px; background-color: var(--bg-base); border-radius: var(--radius-md) var(--radius-md) 0 0; margin: calc(var(--space-16) * -1) calc(var(--space-16) * -1) var(--space-16) calc(var(--space-16) * -1); display: flex; align-items: center; justify-content: center; position: relative;">
            <span style="font-size: 32px;">${nb.emoji || '📚'}</span>
            <button class="ghost icon-only deck-menu-btn" data-id="${nb.notebookId}" style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.5); opacity: 0; transition: opacity 0.2s;">
              <i class="ti ti-dots"></i>
            </button>
          </div>
          <h3 style="margin-bottom: var(--space-4);">${nb.title}</h3>
          <div class="deck-meta flex-between caption-text">
            <span>${pageCount} section${pageCount !== 1 ? 's' : ''}</span>
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
          card.style.display = title.includes(query) ? 'block' : 'none';
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
        importDeckFromJson(file, () => {
          this.loadNotebooks();
          alert('Notebook imported successfully!');
        }, (err) => {
          alert('Failed to import: ' + err.message);
        });
        importInput.value = '';
      });
    }

    const newBtn = this.container.querySelector('#btn-new-deck');
    if (newBtn) {
      newBtn.addEventListener('click', async () => {
        const title = prompt("Enter notebook title:", "Untitled Notebook");
        if (title !== null) {
          const notebook = await createNotebook(title || "Untitled Notebook");
          // Create default section + subsection
          const section = await createSection(notebook.notebookId, 'All Pages', 0);
          const sub = await createSubsection(notebook.notebookId, section.sectionId, 'Uncategorised', true, 0);
          section.subsections = [sub.subsectionId];
          const { updateSection } = await import('../store/sections.js');
          await updateSection(section.sectionId, { subsections: section.subsections });
          notebook.sections = [section.sectionId];
          await updateNotebook(notebook);
          // Create first page
          await createPage(notebook.notebookId, section.sectionId, sub.subsectionId, "Page 1");
          window.location.hash = `deck/${notebook.notebookId}`;
        }
      });
    }

    const cards = this.container.querySelectorAll('.deck-card');
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.deck-menu-btn')) return;
        const id = card.getAttribute('data-id');
        window.location.hash = `deck/${id}`;
      });
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-4px)';
        const btn = card.querySelector('.deck-menu-btn');
        if (btn) btn.style.opacity = '1';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        const btn = card.querySelector('.deck-menu-btn');
        if (btn) btn.style.opacity = '0';
      });
    });

    const menuBtns = this.container.querySelectorAll('.deck-menu-btn');
    menuBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const notebookId = btn.getAttribute('data-id');
        this.showNotebookMenu(notebookId, btn);
      });
    });
  }

  showNotebookMenu(notebookId, anchorEl) {
    if (this._contextMenu) this._contextMenu.remove();
    
    const menu = document.createElement('div');
    menu.style.cssText = `
      position: absolute; z-index: 100;
      background: var(--bg-elevated); border: 1px solid var(--border-default);
      border-radius: var(--radius-md); box-shadow: var(--shadow-elevated);
      min-width: 150px; padding: 4px 0; font-size: 13px;
    `;
    
    const rect = anchorEl.getBoundingClientRect();
    menu.style.top = (rect.bottom + window.scrollY + 4) + 'px';
    menu.style.left = rect.left + 'px';

    menu.innerHTML = `
      <div class="ctx-item" data-action="rename" style="padding: 6px 12px; cursor: pointer;">Rename</div>
      <div style="border-top: 1px solid var(--border-default); margin: 4px 0;"></div>
      <div class="ctx-item" data-action="delete" style="padding: 6px 12px; cursor: pointer; color: var(--delete-btn-color);">Delete Notebook</div>
    `;

    menu.querySelectorAll('.ctx-item').forEach(item => {
      item.addEventListener('mouseenter', () => item.style.background = 'var(--bg-hover)');
      item.addEventListener('mouseleave', () => item.style.background = 'transparent');
    });

    menu.querySelector('[data-action="rename"]').addEventListener('click', async () => {
      menu.remove();
      const notebook = this.notebooks.find(n => n.notebookId === notebookId);
      const newTitle = prompt("Enter new title:", notebook.title);
      if (newTitle && newTitle !== notebook.title) {
        notebook.title = newTitle;
        const { updateNotebook } = await import('../store/notebooks.js');
        await updateNotebook(notebook);
        this.loadNotebooks();
      }
    });

    menu.querySelector('[data-action="delete"]').addEventListener('click', () => {
      menu.remove();
      import('./DeleteConfirm.js').then(({ showDeleteConfirm }) => {
        showDeleteConfirm(anchorEl, 'Notebook', 'This will permanently delete this notebook and all its pages. This cannot be undone.', async () => {
          const { deleteNotebook } = await import('../store/notebooks.js');
          await deleteNotebook(notebookId);
          this.loadNotebooks();
        });
      });
    });

    document.body.appendChild(menu);
    this._contextMenu = menu;

    setTimeout(() => {
      document.addEventListener('click', this._closeCtxHandler = () => {
        if (this._contextMenu) this._contextMenu.remove();
      }, { once: true });
    }, 10);
  }
}

