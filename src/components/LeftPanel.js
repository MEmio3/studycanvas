import Sortable from 'sortablejs';
import { renderPageCard } from './PageCard.js';

export class LeftPanel {
  constructor(container, options = {}) {
    this.container = container;
    this.sections = options.sections || [];
    this.subsections = options.subsections || [];
    this.pages = options.pages || [];
    this.activePageId = options.activePageId || null;
    this.onPageSelect = options.onPageSelect || null;
    this.onPageReorder = options.onPageReorder || null;
    this.onNewPage = options.onNewPage || null;
    this.onAddSection = options.onAddSection || null;
    this.onAddSubsection = options.onAddSubsection || null;
    this.onRenameSection = options.onRenameSection || null;
    this.onRenameSubsection = options.onRenameSubsection || null;
    this.onDeleteSection = options.onDeleteSection || null;
    this.onDeleteSubsection = options.onDeleteSubsection || null;
    this.onDeletePage = options.onDeletePage || null;
    this.onMovePageToSubsection = options.onMovePageToSubsection || null;
    this.searchQuery = '';
  }

  updateData(sections, subsections, pages, activePageId) {
    this.sections = sections || [];
    this.subsections = subsections || [];
    this.pages = pages || [];
    if (activePageId !== undefined) this.activePageId = activePageId;
    this.render();
  }

  updatePages(pages, activePageId) {
    this.pages = pages || [];
    if (activePageId !== undefined) this.activePageId = activePageId;
    this.render();
  }

  getActiveSubsectionId() {
    const activePage = this.pages.find(p => p.pageId === this.activePageId);
    return activePage?.subsectionId || null;
  }

  getActiveSectionId() {
    const activePage = this.pages.find(p => p.pageId === this.activePageId);
    return activePage?.sectionId || null;
  }

  renderSectionTree() {
    if (this.searchQuery) return this.renderSearchResults();

    return this.sections.map(section => {
      const sectionSubs = this.subsections
        .filter(s => s.sectionId === section.sectionId)
        .sort((a, b) => a.order - b.order);

      const subsHtml = section.isCollapsed ? '' : sectionSubs.map(sub => {
        const subPages = this.pages
          .filter(p => p.subsectionId === sub.subsectionId)
          .sort((a, b) => a.order - b.order);

        const isActiveSub = subPages.some(p => p.pageId === this.activePageId);
        const pageCount = subPages.length;

        const pagesHtml = sub.isCollapsed ? '' : subPages.map(p =>
          `<div style="padding-left: var(--tree-indent-page);">${renderPageCard(p, p.pageId === this.activePageId)}</div>`
        ).join('');

        return `
          <div class="tree-subsection" data-subsection-id="${sub.subsectionId}">
            <div class="tree-subsection-header" data-subsection-id="${sub.subsectionId}" style="
              display: flex; align-items: center; gap: 6px;
              padding: 5px 8px 5px var(--tree-indent-subsection);
              cursor: pointer; font-size: 13px;
              color: ${isActiveSub ? 'var(--subsection-active-text)' : 'var(--subsection-header-text)'};
              position: relative;
            ">
              <i class="ti ${sub.isCollapsed ? 'ti-chevron-right' : 'ti-chevron-down'}" style="font-size: 12px; flex-shrink: 0;" data-action="toggle-subsection"></i>
              <span class="subsection-title" style="flex-grow: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${sub.title}</span>
              <span class="subsection-count" style="font-size: 11px; color: var(--text-tertiary); flex-shrink: 0;">${pageCount} pg</span>
              <i class="ti ti-dots tree-ctx-btn" data-action="subsection-menu" data-subsection-id="${sub.subsectionId}" style="font-size: 14px; opacity: 0; cursor: pointer; flex-shrink: 0;"></i>
            </div>
            <div class="tree-subsection-pages" data-subsection-id="${sub.subsectionId}">
              ${pagesHtml}
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="tree-section" data-section-id="${section.sectionId}">
          <div class="tree-section-header" data-section-id="${section.sectionId}" style="
            display: flex; align-items: center; gap: 6px;
            padding: 6px 8px 6px var(--tree-indent-section);
            cursor: pointer; font-size: 13px; font-weight: 600;
            color: var(--section-header-text);
            background: var(--section-header-bg);
            border-top: 1px solid var(--border-default);
            position: relative;
          ">
            <i class="ti ${section.isCollapsed ? 'ti-chevron-right' : 'ti-chevron-down'}" style="font-size: 12px; flex-shrink: 0;" data-action="toggle-section"></i>
            <span class="section-title" style="flex-grow: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${section.title}</span>
            <i class="ti ti-dots tree-ctx-btn" data-action="section-menu" data-section-id="${section.sectionId}" style="font-size: 14px; opacity: 0; cursor: pointer; flex-shrink: 0;"></i>
          </div>
          <div class="tree-section-body" data-section-id="${section.sectionId}" style="${section.isCollapsed ? 'display:none;' : ''}">
            ${subsHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  renderSearchResults() {
    const q = this.searchQuery.toLowerCase();
    const results = this.pages.filter(p =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.notes || '').toLowerCase().includes(q)
    );

    if (results.length === 0) {
      return `<div style="padding: 16px; color: var(--text-secondary); text-align: center;">No pages found</div>`;
    }

    return results.map(p => {
      const sub = this.subsections.find(s => s.subsectionId === p.subsectionId);
      const sec = this.sections.find(s => s.sectionId === p.sectionId);
      const path = [sec?.title, sub?.title].filter(Boolean).join(' › ');
      return `
        <div style="padding: 0 8px;">
          ${renderPageCard(p, p.pageId === this.activePageId)}
          <div style="font-size: 10px; color: var(--text-tertiary); padding: 0 8px 8px 72px; margin-top: -4px;">${path}</div>
        </div>
      `;
    }).join('');
  }

  render() {
    const totalPages = this.pages.length;
    const totalSections = this.sections.length;

    this.container.innerHTML = `
      <div class="left-panel" role="tree" style="width: 260px; height: 100%; border-right: 1px solid var(--border-default); background: var(--bg-surface); display: flex; flex-direction: column;">
        <div style="padding: var(--space-12); border-bottom: 1px solid var(--border-default); display: flex; flex-direction: column; gap: 8px;">
          <button class="primary" id="btn-add-page" style="width: 100%;"><i class="ti ti-plus"></i> New Page</button>
        </div>
        <div style="padding: 8px 12px; border-bottom: 1px solid var(--border-default);">
          <div style="display: flex; align-items: center; background: var(--bg-base); border-radius: var(--radius-sm); padding: 4px 8px;">
            <i class="ti ti-search" style="color: var(--text-tertiary); font-size: 14px;"></i>
            <input type="text" id="lp-search" placeholder="Search pages..." value="${this.searchQuery}" style="border: none; background: transparent; padding: 2px 6px; flex-grow: 1; outline: none; color: var(--text-primary); font-size: 12px;">
          </div>
        </div>
        <div class="page-list scrollable" style="flex-grow: 1; overflow-y: auto;" id="tree-container">
          ${this.renderSectionTree()}
        </div>
        <div style="padding: 8px 12px; border-top: 1px solid var(--border-default);">
          <button class="ghost" id="btn-add-section" style="width: 100%; font-size: 12px; justify-content: flex-start;"><i class="ti ti-plus" style="font-size: 12px;"></i> Add Section</button>
        </div>
        <div style="padding: 6px 12px; border-top: 1px solid var(--border-default); font-size: 11px; color: var(--text-tertiary);">
          ${totalSections} section${totalSections !== 1 ? 's' : ''} · ${totalPages} page${totalPages !== 1 ? 's' : ''}
        </div>
      </div>
    `;
    this.attachEvents();
  }

  attachEvents() {
    // New page
    this.container.querySelector('#btn-add-page')?.addEventListener('click', (e) => {
      import('./LocationPicker.js').then(({ LocationPicker }) => {
        const lastSubId = localStorage.getItem('studycanvas_last_subsection') || this.getActiveSubsectionId();
        const picker = new LocationPicker(
          e.currentTarget,
          this.sections,
          this.subsections,
          lastSubId,
          (sectionId, subId) => {
            if (this.onNewPage) this.onNewPage(subId);
          },
          () => {
            if (this.onNewPage) this.onNewPage('new');
          }
        );
        picker.render();
      });
    });

    // Add section
    this.container.querySelector('#btn-add-section')?.addEventListener('click', () => {
      if (this.onAddSection) this.onAddSection();
    });

    // Search
    this.container.querySelector('#lp-search')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      const tree = this.container.querySelector('#tree-container');
      if (tree) tree.innerHTML = this.renderSectionTree();
      this.attachTreeEvents();
    });

    this.attachTreeEvents();
  }

  attachTreeEvents() {
    const tree = this.container.querySelector('#tree-container');
    if (!tree) return;

    // Section toggle
    tree.querySelectorAll('[data-action="toggle-section"]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const header = el.closest('.tree-section-header');
        const sectionId = header.getAttribute('data-section-id');
        const section = this.sections.find(s => s.sectionId === sectionId);
        if (section) {
          section.isCollapsed = !section.isCollapsed;
          this.render();
        }
      });
    });

    // Section header click (also toggles)
    tree.querySelectorAll('.tree-section-header').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-action]')) return;
        const sectionId = el.getAttribute('data-section-id');
        const section = this.sections.find(s => s.sectionId === sectionId);
        if (section) {
          section.isCollapsed = !section.isCollapsed;
          this.render();
        }
      });
    });

    // Subsection toggle
    tree.querySelectorAll('[data-action="toggle-subsection"]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const header = el.closest('.tree-subsection-header');
        const subId = header.getAttribute('data-subsection-id');
        const sub = this.subsections.find(s => s.subsectionId === subId);
        if (sub) {
          sub.isCollapsed = !sub.isCollapsed;
          this.render();
        }
      });
    });

    // Subsection header click
    tree.querySelectorAll('.tree-subsection-header').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-action]')) return;
        const subId = el.getAttribute('data-subsection-id');
        const sub = this.subsections.find(s => s.subsectionId === subId);
        if (sub) {
          sub.isCollapsed = !sub.isCollapsed;
          this.render();
        }
      });
    });

    // Page card clicks
    tree.querySelectorAll('.page-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        const btn = card.querySelector('.page-ctx-btn');
        if (btn) btn.style.opacity = '1';
      });
      card.addEventListener('mouseleave', () => {
        const btn = card.querySelector('.page-ctx-btn');
        if (btn) btn.style.opacity = '0';
      });

      card.addEventListener('click', (e) => {
        const ctxBtn = e.target.closest('[data-action="page-menu"]');
        if (ctxBtn) {
          e.stopPropagation();
          const pageId = ctxBtn.getAttribute('data-page-id');
          if (this.onDeletePage) this.onDeletePage(pageId, ctxBtn);
          return;
        }

        const target = e.target.closest('[data-action="watch-jump"]');
        if (target) {
          e.stopPropagation();
          const videoId = target.getAttribute('data-video-id');
          const time = parseFloat(target.getAttribute('data-time'));
          document.dispatchEvent(new CustomEvent('app-watch-jump', { detail: { videoId, time } }));
          return;
        }
        const id = card.getAttribute('data-id');
        if (this.onPageSelect) this.onPageSelect(id);
      });
    });

    // Context menu buttons — section
    tree.querySelectorAll('[data-action="section-menu"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sectionId = btn.getAttribute('data-section-id');
        this.showSectionContextMenu(sectionId, e);
      });
    });

    // Context menu buttons — subsection
    tree.querySelectorAll('[data-action="subsection-menu"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const subId = btn.getAttribute('data-subsection-id');
        this.showSubsectionContextMenu(subId, e);
      });
    });

    // Hover to show context buttons
    tree.querySelectorAll('.tree-section-header, .tree-subsection-header').forEach(header => {
      header.addEventListener('mouseenter', () => {
        const btn = header.querySelector('.tree-ctx-btn');
        if (btn) btn.style.opacity = '1';
        const count = header.querySelector('.subsection-count');
        if (count) count.style.display = 'none';
      });
      header.addEventListener('mouseleave', () => {
        const btn = header.querySelector('.tree-ctx-btn');
        if (btn) btn.style.opacity = '0';
        const count = header.querySelector('.subsection-count');
        if (count) count.style.display = '';
      });
    });

    // Sortable for page cards within each subsection
    tree.querySelectorAll('.tree-subsection-pages').forEach(el => {
      const subId = el.getAttribute('data-subsection-id');
      if (el.children.length > 0) {
        new Sortable(el, {
          animation: 150,
          group: 'pages',
          ghostClass: 'sortable-ghost',
          onEnd: (evt) => {
            if (this.onPageReorder) {
              const pageId = evt.item.querySelector('.page-card')?.getAttribute('data-id');
              const newSubId = evt.to.getAttribute('data-subsection-id');
              this.onPageReorder(pageId, newSubId, evt.newIndex);
            }
          }
        });
      }
    });

    // Collapse/expand all shortcuts
    document.addEventListener('app-shortcut-collapse-all', () => {
      this.sections.forEach(s => s.isCollapsed = true);
      this.render();
    });
    document.addEventListener('app-shortcut-expand-all', () => {
      this.sections.forEach(s => s.isCollapsed = false);
      this.subsections.forEach(s => s.isCollapsed = false);
      this.render();
    });
  }

  showSectionContextMenu(sectionId, e) {
    this.closeContextMenu();
    const section = this.sections.find(s => s.sectionId === sectionId);
    if (!section) return;

    const menu = document.createElement('div');
    menu.className = 'tree-context-menu';
    menu.style.cssText = `position: fixed; top: ${e.clientY}px; left: ${e.clientX}px; background: var(--bg-elevated); border: 1px solid var(--border-default); border-radius: var(--radius-md); box-shadow: var(--shadow-elevated); z-index: 200; min-width: 180px; padding: 4px 0; font-size: 13px;`;
    menu.innerHTML = `
      <div class="ctx-item" data-action="rename">Rename section</div>
      <div style="border-top: 1px solid var(--border-default); margin: 4px 0;"></div>
      <div class="ctx-item" data-action="add-sub">Add subsection</div>
      <div style="border-top: 1px solid var(--border-default); margin: 4px 0;"></div>
      <div class="ctx-item" data-action="collapse-subs">Collapse all subsections</div>
      <div class="ctx-item" data-action="expand-subs">Expand all subsections</div>
      <div style="border-top: 1px solid var(--border-default); margin: 4px 0;"></div>
      <div class="ctx-item" data-action="delete" style="color: var(--delete-btn-color);">Delete section</div>
    `;

    // Style items
    menu.querySelectorAll('.ctx-item').forEach(item => {
      item.style.cssText = 'padding: 6px 12px; cursor: pointer;';
      item.addEventListener('mouseenter', () => item.style.background = 'var(--bg-hover)');
      item.addEventListener('mouseleave', () => item.style.background = 'transparent');
    });

    menu.querySelector('[data-action="rename"]').addEventListener('click', () => {
      this.closeContextMenu();
      this.inlineRenameSection(sectionId);
    });
    menu.querySelector('[data-action="add-sub"]').addEventListener('click', () => {
      this.closeContextMenu();
      if (this.onAddSubsection) this.onAddSubsection(sectionId);
    });
    menu.querySelector('[data-action="collapse-subs"]').addEventListener('click', () => {
      this.closeContextMenu();
      this.subsections.filter(s => s.sectionId === sectionId).forEach(s => s.isCollapsed = true);
      this.render();
    });
    menu.querySelector('[data-action="expand-subs"]').addEventListener('click', () => {
      this.closeContextMenu();
      this.subsections.filter(s => s.sectionId === sectionId).forEach(s => s.isCollapsed = false);
      this.render();
    });
    menu.querySelector('[data-action="delete"]').addEventListener('click', () => {
      this.closeContextMenu();
      const anchor = this.container.querySelector(`.tree-section-header[data-section-id="${sectionId}"]`);
      if (this.onDeleteSection) this.onDeleteSection(sectionId, anchor);
    });

    document.body.appendChild(menu);
    this._contextMenu = menu;
    setTimeout(() => {
      document.addEventListener('click', this._closeCtxHandler = () => this.closeContextMenu(), { once: true });
    }, 10);
  }

  showSubsectionContextMenu(subId, e) {
    this.closeContextMenu();
    const sub = this.subsections.find(s => s.subsectionId === subId);
    if (!sub) return;

    const menu = document.createElement('div');
    menu.className = 'tree-context-menu';
    menu.style.cssText = `position: fixed; top: ${e.clientY}px; left: ${e.clientX}px; background: var(--bg-elevated); border: 1px solid var(--border-default); border-radius: var(--radius-md); box-shadow: var(--shadow-elevated); z-index: 200; min-width: 180px; padding: 4px 0; font-size: 13px;`;
    menu.innerHTML = `
      <div class="ctx-item" data-action="rename">Rename subsection</div>
      <div style="border-top: 1px solid var(--border-default); margin: 4px 0;"></div>
      <div class="ctx-item" data-action="add-page">Add page here</div>
      <div style="border-top: 1px solid var(--border-default); margin: 4px 0;"></div>
      <div class="ctx-item" data-action="delete" style="color: ${sub.isBuiltIn ? 'var(--text-tertiary)' : 'var(--delete-btn-color)'}; ${sub.isBuiltIn ? 'opacity: 0.5; pointer-events: none;' : ''}">Delete subsection</div>
    `;

    menu.querySelectorAll('.ctx-item').forEach(item => {
      item.style.cssText = 'padding: 6px 12px; cursor: pointer;';
      item.addEventListener('mouseenter', () => item.style.background = 'var(--bg-hover)');
      item.addEventListener('mouseleave', () => item.style.background = 'transparent');
    });

    menu.querySelector('[data-action="rename"]').addEventListener('click', () => {
      this.closeContextMenu();
      this.inlineRenameSubsection(subId);
    });
    menu.querySelector('[data-action="add-page"]').addEventListener('click', () => {
      this.closeContextMenu();
      if (this.onNewPage) this.onNewPage(subId);
    });
    if (!sub.isBuiltIn) {
      menu.querySelector('[data-action="delete"]').addEventListener('click', () => {
        this.closeContextMenu();
        const anchor = this.container.querySelector(`.tree-subsection-header[data-subsection-id="${subId}"]`);
        if (this.onDeleteSubsection) this.onDeleteSubsection(subId, anchor);
      });
    }

    document.body.appendChild(menu);
    this._contextMenu = menu;
    setTimeout(() => {
      document.addEventListener('click', this._closeCtxHandler = () => this.closeContextMenu(), { once: true });
    }, 10);
  }

  closeContextMenu() {
    if (this._contextMenu) {
      this._contextMenu.remove();
      this._contextMenu = null;
    }
  }

  inlineRenameSection(sectionId) {
    const header = this.container.querySelector(`.tree-section-header[data-section-id="${sectionId}"] .section-title`);
    if (!header) return;
    const section = this.sections.find(s => s.sectionId === sectionId);
    if (!section) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = section.title;
    input.style.cssText = 'background: var(--bg-base); border: 1px solid var(--accent-primary); border-radius: 3px; padding: 1px 4px; font-size: 13px; font-weight: 600; width: 100%; color: var(--text-primary); outline: none;';
    header.replaceWith(input);
    input.focus();
    input.select();

    const save = () => {
      const val = input.value.trim();
      if (val && val !== section.title) {
        if (this.onRenameSection) this.onRenameSection(sectionId, val);
      }
      this.render();
    };
    input.addEventListener('blur', save);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') input.blur();
      if (e.key === 'Escape') { input.value = section.title; input.blur(); }
    });
  }

  inlineRenameSubsection(subId) {
    const header = this.container.querySelector(`.tree-subsection-header[data-subsection-id="${subId}"] .subsection-title`);
    if (!header) return;
    const sub = this.subsections.find(s => s.subsectionId === subId);
    if (!sub) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = sub.title;
    input.style.cssText = 'background: var(--bg-base); border: 1px solid var(--accent-primary); border-radius: 3px; padding: 1px 4px; font-size: 13px; width: 100%; color: var(--text-primary); outline: none;';
    header.replaceWith(input);
    input.focus();
    input.select();

    const save = () => {
      const val = input.value.trim();
      if (val && val !== sub.title) {
        if (this.onRenameSubsection) this.onRenameSubsection(subId, val);
      }
      this.render();
    };
    input.addEventListener('blur', save);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') input.blur();
      if (e.key === 'Escape') { input.value = sub.title; input.blur(); }
    });
  }
}
