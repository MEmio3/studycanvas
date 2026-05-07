export class ConnectionSummaryPanel {
  constructor(container, canvasInstance) {
    this.container = container;
    this.canvasInstance = canvasInstance;
    
    this.isOpen = false;
    this.element = this._createDOM();
    this.container.appendChild(this.element);
  }

  _createDOM() {
    const el = document.createElement('div');
    el.className = 'flow-summary-panel';
    
    // Create the button to toggle this panel
    this.toggleBtn = document.createElement('button');
    this.toggleBtn.className = 'ghost icon-only';
    this.toggleBtn.style.position = 'absolute';
    this.toggleBtn.style.top = '16px';
    this.toggleBtn.style.right = '16px';
    this.toggleBtn.style.zIndex = '40';
    this.toggleBtn.innerHTML = '<i class="ti ti-list-details"></i>';
    this.toggleBtn.title = 'View all connections';
    this.container.appendChild(this.toggleBtn);
    
    this._attachEvents(el);
    return el;
  }

  _attachEvents(el) {
    this.toggleBtn.addEventListener('click', () => {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        el.classList.add('open');
        this.renderList();
      } else {
        el.classList.remove('open');
      }
    });

    el.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('.close-btn');
      if (closeBtn) {
        this.isOpen = false;
        el.classList.remove('open');
        return;
      }
      
      const deleteBtn = e.target.closest('.conn-delete-btn');
      if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        document.dispatchEvent(new CustomEvent('flow-delete-connection', { detail: { id } }));
        return;
      }
      
      const row = e.target.closest('.conn-row');
      if (row) {
        const id = row.dataset.id;
        const edge = this.canvasInstance.edges.get(id);
        if (edge) {
          // Center canvas on edge
          const mid = edge.labelGroup ? 
            { x: edge.labelGroup.transform.baseVal[0].matrix.e, y: edge.labelGroup.transform.baseVal[0].matrix.f } : 
            { x: (edge.sourceNode.x + edge.targetNode.x)/2, y: (edge.sourceNode.y + edge.targetNode.y)/2 };
          
          const wrapperRect = this.canvasInstance.wrapper.getBoundingClientRect();
          this.canvasInstance.viewport.x = (wrapperRect.width / 2) - (mid.x * this.canvasInstance.viewport.zoom);
          this.canvasInstance.viewport.y = (wrapperRect.height / 2) - (mid.y * this.canvasInstance.viewport.zoom);
          this.canvasInstance._updateTransform();
          
          this.canvasInstance.edges.forEach(e => e.setSelected(false));
          edge.setSelected(true);
        }
      }
      
      const clearAllBtn = e.target.closest('#clear-all-conn');
      if (clearAllBtn) {
        if (confirm(`Remove all ${this.canvasInstance.connections.length} connections? Page positions are kept.`)) {
          document.dispatchEvent(new CustomEvent('flow-clear-all-connections'));
        }
      }
    });
  }

  renderList() {
    const connections = this.canvasInstance.connections;
    const nodes = this.canvasInstance.nodes;
    
    let html = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="margin: 0;">Connections (${connections.length})</h3>
        <button class="ghost icon-only close-btn" style="padding: 4px;"><i class="ti ti-x"></i></button>
      </div>
    `;
    
    const types = ['sequence', 'reference', 'branch'];
    const colors = { sequence: '#1D9E75', reference: '#5A7A6E', branch: '#D4A017' };
    
    types.forEach(type => {
      const typeConns = connections.filter(c => c.type === type);
      if (typeConns.length > 0) {
        html += `<div class="conn-group-title">${type} (${typeConns.length})</div>`;
        typeConns.forEach(c => {
          const s = nodes.get(c.sourcePageId)?.page.title || 'Unknown';
          const t = nodes.get(c.targetPageId)?.page.title || 'Unknown';
          const label = c.label ? ` <span style="color: ${colors[type]};">"${c.label}"</span>` : '';
          
          html += `
            <div class="conn-row" data-id="${c.connectionId}">
              <div style="flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${s} → ${t}${label}
              </div>
              <button class="ghost icon-only conn-delete-btn" data-id="${c.connectionId}" style="padding: 2px; color: var(--text-tertiary);"><i class="ti ti-x"></i></button>
            </div>
          `;
        });
      }
    });
    
    if (connections.length > 0) {
      html += `
        <div style="margin-top: 24px; text-align: center;">
          <button id="clear-all-conn" class="ghost" style="color: #E05252; width: 100%;">Clear All Connections</button>
        </div>
      `;
    }
    
    this.element.innerHTML = html;
  }
}
