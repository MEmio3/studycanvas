import { getFlowLayout, saveFlowLayout, generateDefaultLayout } from '../../store/flowLayout.js';
import { FlowNode } from './FlowNode.js';

export class FlowCanvas {
  constructor(container, deckId, pages) {
    this.container = container;
    this.deckId = deckId;
    this.pages = pages;
    
    this.viewport = { x: 0, y: 0, zoom: 1.0 };
    this.nodes = new Map(); // pageId -> FlowNode instance
    
    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };
    
    this.draggedNodes = [];
    this.isDraggingNode = false;
    this.nodeDragStart = { x: 0, y: 0 };
    
    this.saveTimeout = null;

    this.wrapper = null;
    this.viewportEl = null;
    this.edgeLayer = null;
  }

  async render() {
    this.container.innerHTML = `
      <div class="flow-canvas-wrapper" id="flow-canvas-wrapper">
        <div class="flow-viewport" id="flow-viewport">
          <svg class="flow-edge-layer" id="flow-edge-layer"></svg>
          <div class="flow-node-layer" id="flow-node-layer"></div>
        </div>
      </div>
    `;

    this.wrapper = this.container.querySelector('#flow-canvas-wrapper');
    this.viewportEl = this.container.querySelector('#flow-viewport');
    this.edgeLayer = this.container.querySelector('#flow-edge-layer');
    this.nodeLayer = this.container.querySelector('#flow-node-layer');

    await this._loadAndLayoutNodes();
    this._attachCanvasEvents();
    this._updateTransform();
  }

  async _loadAndLayoutNodes() {
    let layout = await getFlowLayout(this.deckId);
    let positions = layout?.nodes;
    
    if (!positions || Object.keys(positions).length === 0 && this.pages.length > 0) {
      positions = generateDefaultLayout(this.pages);
      this._scheduleSave(); // Save the auto-generated layout
    }

    if (layout?.viewport) {
      this.viewport = layout.viewport;
    }

    this.pages.forEach(page => {
      const pos = positions?.[page.pageId] || { x: 0, y: 0, width: 220, height: 130 };
      
      const node = new FlowNode(page, pos, {
        onNodeMouseDown: this._onNodeMouseDown.bind(this),
        onNodeDoubleClick: this._onNodeDoubleClick.bind(this),
        onNodeContextMenu: () => {},
        onPortMouseDown: () => {}, // Handled in Phase C
        onPortMouseUp: () => {},
        onPortHover: () => {}
      });
      
      this.nodes.set(page.pageId, node);
      this.nodeLayer.appendChild(node.element);
    });
  }

  _attachCanvasEvents() {
    // Pan
    this.wrapper.addEventListener('mousedown', (e) => {
      // Don't pan if clicking a node or popup
      if (e.target.closest('.flow-node') || e.target.closest('.flow-popup')) return;
      
      this.isPanning = true;
      this.wrapper.classList.add('panning');
      this.panStart = { x: e.clientX - this.viewport.x, y: e.clientY - this.viewport.y };
      
      // Deselect all on background click
      this.nodes.forEach(node => node.setSelected(false));
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isPanning) {
        this.viewport.x = e.clientX - this.panStart.x;
        this.viewport.y = e.clientY - this.panStart.y;
        this._updateTransform();
      } else if (this.isDraggingNode && this.draggedNodes.length > 0) {
        const dx = (e.clientX - this.nodeDragStart.x) / this.viewport.zoom;
        const dy = (e.clientY - this.nodeDragStart.y) / this.viewport.zoom;
        
        // 24px grid snap by default unless Alt is held
        const snap = e.altKey ? 1 : 24;

        this.draggedNodes.forEach(node => {
          let newX = node.startX + dx;
          let newY = node.startY + dy;
          
          if (snap > 1) {
            newX = Math.round(newX / snap) * snap;
            newY = Math.round(newY / snap) * snap;
          }
          
          node.updatePosition(newX, newY);
        });
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isPanning) {
        this.isPanning = false;
        this.wrapper.classList.remove('panning');
        this._scheduleSave();
      }
      if (this.isDraggingNode) {
        this.isDraggingNode = false;
        this.draggedNodes.forEach(node => {
          node.setDragging(false);
        });
        this.draggedNodes = [];
        this._scheduleSave();
      }
    });

    // Zoom
    this.wrapper.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault(); // Prevent browser zoom
        const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
        this._setZoom(this.viewport.zoom + zoomDelta, e.clientX, e.clientY);
      }
    }, { passive: false });
  }

  _onNodeMouseDown(e, node) {
    if (!node.selected) {
      if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
        this.nodes.forEach(n => n.setSelected(false));
      }
      node.setSelected(true);
    }

    this.isDraggingNode = true;
    this.nodeDragStart = { x: e.clientX, y: e.clientY };
    
    this.draggedNodes = Array.from(this.nodes.values()).filter(n => n.selected);
    this.draggedNodes.forEach(n => {
      n.startX = n.x;
      n.startY = n.y;
      n.setDragging(true);
    });
  }

  _onNodeDoubleClick(e, node) {
    // Tell main.js to switch to Edit mode for this page
    document.dispatchEvent(new CustomEvent('switch-mode', {
      detail: { mode: 'edit', pageId: node.page.pageId }
    }));
  }

  _setZoom(newZoom, originX, originY) {
    const minZoom = 0.2;
    const maxZoom = 3.0;
    const oldZoom = this.viewport.zoom;
    
    this.viewport.zoom = Math.min(Math.max(newZoom, minZoom), maxZoom);
    
    // Zoom around cursor
    const rect = this.wrapper.getBoundingClientRect();
    const mouseX = originX - rect.left;
    const mouseY = originY - rect.top;
    
    this.viewport.x = mouseX - (mouseX - this.viewport.x) * (this.viewport.zoom / oldZoom);
    this.viewport.y = mouseY - (mouseY - this.viewport.y) * (this.viewport.zoom / oldZoom);
    
    this._updateTransform();
    this._scheduleSave();
  }

  _updateTransform() {
    this.viewportEl.style.transform = `translate(${this.viewport.x}px, ${this.viewport.y}px) scale(${this.viewport.zoom})`;
  }

  _scheduleSave() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      const nodePositions = {};
      this.nodes.forEach((node, id) => {
        nodePositions[id] = { x: node.x, y: node.y, width: node.width, height: node.height };
      });
      saveFlowLayout(this.deckId, nodePositions, this.viewport);
    }, 1000);
  }

  unmount() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this._scheduleSave(); // Force immediate save on unmount (will happen async)
    }
    this.container.innerHTML = '';
  }
}
