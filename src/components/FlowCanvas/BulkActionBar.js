export class BulkActionBar {
  constructor(container, canvasInstance) {
    this.container = container;
    this.canvasInstance = canvasInstance;
    
    this.element = this._createDOM();
    this.container.appendChild(this.element);
    
    this.update(0);
  }

  _createDOM() {
    const el = document.createElement('div');
    el.className = 'flow-bulk-bar';
    el.style.display = 'none';
    
    el.innerHTML = `
      <span id="bulk-count">0 nodes selected</span>
      <div style="width: 1px; height: 16px; background: var(--border-default); margin: 0 4px;"></div>
      <button id="bulk-seq" title="Connect selected nodes in their order">Auto-Connect in Sequence</button>
      <button id="bulk-tag">Tag All</button>
      <div style="width: 1px; height: 16px; background: var(--border-default); margin: 0 4px;"></div>
      <button id="bulk-delete" class="danger">Delete Selected</button>
      <button id="bulk-clear" class="ghost" style="margin-left: 8px;">✕ Clear</button>
    `;

    this._attachEvents(el);
    return el;
  }

  _attachEvents(el) {
    el.querySelector('#bulk-clear').addEventListener('click', () => {
      this.canvasInstance.nodes.forEach(n => n.setSelected(false));
      this.canvasInstance.draggedNodes = [];
      this.update(0);
    });

    el.querySelector('#bulk-seq').addEventListener('click', () => {
      const selected = Array.from(this.canvasInstance.nodes.values()).filter(n => n.selected);
      if (selected.length < 2) return;
      
      // Sort by order
      selected.sort((a, b) => a.page.order - b.page.order);
      
      const toConnect = [];
      for (let i = 0; i < selected.length - 1; i++) {
        toConnect.push({
          source: selected[i].page.pageId,
          target: selected[i+1].page.pageId
        });
      }
      
      document.dispatchEvent(new CustomEvent('flow-bulk-connect', { detail: { connections: toConnect } }));
    });
    
    el.querySelector('#bulk-tag').addEventListener('click', () => {
      // For future: open a small tag picker
      this.canvasInstance._showToast('Tag All feature coming soon', 'info');
    });

    el.querySelector('#bulk-delete').addEventListener('click', () => {
      const selected = Array.from(this.canvasInstance.nodes.values()).filter(n => n.selected);
      if (selected.length === 0) return;
      
      if (confirm(`Delete ${selected.length} pages and their connections? This cannot be undone.`)) {
         document.dispatchEvent(new CustomEvent('flow-bulk-delete', { detail: { pageIds: selected.map(n => n.page.pageId) } }));
      }
    });
  }

  update(count) {
    if (count >= 2) {
      this.element.style.display = 'flex';
      this.element.querySelector('#bulk-count').textContent = `${count} nodes selected`;
    } else {
      this.element.style.display = 'none';
    }
  }
}
