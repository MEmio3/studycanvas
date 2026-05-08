export class LocationPicker {
  constructor(anchorEl, sections, subsections, lastSubsectionId, onSelect, onCreateNew, onCancel) {
    this.anchorEl = anchorEl;
    this.sections = sections;
    this.subsections = subsections;
    this.lastSubsectionId = lastSubsectionId;
    this.onSelect = onSelect;
    this.onCreateNew = onCreateNew;
    this.onCancel = onCancel;
    this.el = null;
  }

  render() {
    this.close();
    
    this.el = document.createElement('div');
    this.el.className = 'location-picker';
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-label', 'Choose where to save this page');
    this.el.style.cssText = `
      position: absolute; z-index: 200;
      background: var(--bg-elevated); border: 1px solid var(--border-default);
      border-radius: var(--radius-md); box-shadow: var(--shadow-elevated);
      width: 300px; max-height: 260px; overflow-y: auto;
      padding: 8px 0; font-size: 13px;
    `;

    // Position below anchor
    const rect = this.anchorEl.getBoundingClientRect();
    this.el.style.top = (rect.bottom + 4) + 'px';
    this.el.style.left = rect.left + 'px';
    this.el.style.position = 'fixed';

    let html = `<div style="padding: 4px 12px 8px; font-weight: 600; color: var(--text-secondary); font-size: 11px; text-transform: uppercase;">Save to:</div>`;

    this.sections.forEach(section => {
      const subs = this.subsections.filter(s => s.sectionId === section.sectionId).sort((a, b) => a.order - b.order);
      html += `<div style="padding: 4px 12px; font-weight: 600; color: var(--section-header-text); font-size: 12px;">${section.title}</div>`;
      
      subs.forEach(sub => {
        const isLast = sub.subsectionId === this.lastSubsectionId;
        html += `
          <div class="lp-item" data-sub-id="${sub.subsectionId}" data-section-id="${section.sectionId}" style="
            padding: 5px 12px 5px 24px; cursor: pointer; display: flex; align-items: center; justify-content: space-between;
            ${isLast ? 'background: rgba(29,158,117,0.1);' : ''}
          ">
            <span style="display: flex; align-items: center; gap: 6px;">
              <span style="color: var(--text-tertiary);">●</span>
              ${sub.title}
              ${isLast ? '<span style="font-size: 10px; color: var(--accent-primary);">last used</span>' : ''}
            </span>
            <span class="lp-select-btn" style="font-size: 11px; color: var(--accent-primary); font-weight: 500;">Select</span>
          </div>
        `;
      });
    });

    html += `
      <div style="border-top: 1px solid var(--border-default); margin: 4px 0;"></div>
      <div class="lp-item lp-create-new" style="padding: 6px 12px; cursor: pointer; color: var(--accent-primary); font-size: 12px;">
        <i class="ti ti-plus" style="font-size: 12px;"></i> Create new section & subsection
      </div>
      <div style="border-top: 1px solid var(--border-default); margin: 4px 0;"></div>
      <div class="lp-item lp-cancel" style="padding: 6px 12px; cursor: pointer; color: var(--text-secondary); text-align: center; font-size: 12px;">Cancel</div>
    `;

    this.el.innerHTML = html;
    document.body.appendChild(this.el);

    // Events
    this.el.querySelectorAll('.lp-item[data-sub-id]').forEach(item => {
      item.addEventListener('mouseenter', () => item.style.background = 'var(--bg-hover)');
      item.addEventListener('mouseleave', () => {
        const isLast = item.getAttribute('data-sub-id') === this.lastSubsectionId;
        item.style.background = isLast ? 'rgba(29,158,117,0.1)' : 'transparent';
      });
      item.addEventListener('click', () => {
        const subId = item.getAttribute('data-sub-id');
        const secId = item.getAttribute('data-section-id');
        localStorage.setItem('studycanvas_last_subsection', subId);
        this.close();
        if (this.onSelect) this.onSelect(secId, subId);
      });
    });

    const createNew = this.el.querySelector('.lp-create-new');
    if (createNew) {
      createNew.addEventListener('mouseenter', () => createNew.style.background = 'var(--bg-hover)');
      createNew.addEventListener('mouseleave', () => createNew.style.background = 'transparent');
      createNew.addEventListener('click', () => {
        this.close();
        if (this.onCreateNew) this.onCreateNew();
      });
    }

    const cancel = this.el.querySelector('.lp-cancel');
    if (cancel) {
      cancel.addEventListener('mouseenter', () => cancel.style.background = 'var(--bg-hover)');
      cancel.addEventListener('mouseleave', () => cancel.style.background = 'transparent');
      cancel.addEventListener('click', () => this.close());
    }

    // Close on outside click
    setTimeout(() => {
      this._outsideHandler = (e) => {
        if (!this.el?.contains(e.target)) this.close();
      };
      document.addEventListener('click', this._outsideHandler);
    }, 10);
  }

  close() {
    if (this.el) {
      this.el.remove();
      this.el = null;
    }
    if (this._outsideHandler) {
      document.removeEventListener('click', this._outsideHandler);
      this._outsideHandler = null;
    }
    if (this.onCancel) this.onCancel();
  }
}
