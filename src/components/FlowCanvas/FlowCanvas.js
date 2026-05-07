import { getFlowLayout, saveFlowLayout, generateDefaultLayout } from '../../store/flowLayout.js';
import { getConnectionsForDeck, createConnection, updateConnection, deleteConnection } from '../../store/connections.js';
import { undoManager } from '../../services/undoManager.js';
import { FlowNode } from './FlowNode.js';
import { FlowEdge } from './FlowEdge.js';
import { GhostEdge } from './GhostEdge.js';
import { ConnectionTypePopup } from './ConnectionTypePopup.js';
import { EdgeEditor } from './EdgeEditor.js';

export class FlowCanvas {
  constructor(container, deckId, pages) {
    this.container = container;
    this.deckId = deckId;
    this.pages = pages;
    
    this.viewport = { x: 0, y: 0, zoom: 1.0 };
    this.nodes = new Map(); // pageId -> FlowNode
    this.edges = new Map(); // connectionId -> FlowEdge
    this.connections = []; // Raw connection data
    
    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };
    
    this.draggedNodes = [];
    this.isDraggingNode = false;
    this.nodeDragStart = { x: 0, y: 0 };
    
    // Edge Drawing State
    this.isDrawingEdge = false;
    this.ghostEdge = null;
    this.drawSourceNode = null;
    this.hoveredTargetPort = null;
    
    this.saveTimeout = null;
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

    await this._loadData();
    this._attachCanvasEvents();
    this._updateTransform();
  }

  async _loadData() {
    // 1. Load layout
    let layout = await getFlowLayout(this.deckId);
    let positions = layout?.nodes;
    
    if (!positions || Object.keys(positions).length === 0 && this.pages.length > 0) {
      positions = generateDefaultLayout(this.pages);
      this._scheduleSave();
    }

    if (layout?.viewport) {
      this.viewport = layout.viewport;
    }

    // 2. Render nodes
    this.pages.forEach(page => {
      const pos = positions?.[page.pageId] || { x: 0, y: 0, width: 220, height: 130 };
      
      const node = new FlowNode(page, pos, {
        onNodeMouseDown: this._onNodeMouseDown.bind(this),
        onNodeDoubleClick: this._onNodeDoubleClick.bind(this),
        onNodeContextMenu: () => {},
        onPortMouseDown: this._onPortMouseDown.bind(this),
        onPortMouseUp: this._onPortMouseUp.bind(this),
        onPortHover: this._onPortHover.bind(this)
      });
      
      this.nodes.set(page.pageId, node);
      this.nodeLayer.appendChild(node.element);
    });

    // 3. Load & Render Connections
    this.connections = await getConnectionsForDeck(this.deckId);
    this.connections.forEach(conn => this._renderEdge(conn));
  }

  _renderEdge(connection) {
    const sourceNode = this.nodes.get(connection.sourcePageId);
    const targetNode = this.nodes.get(connection.targetPageId);
    
    if (!sourceNode || !targetNode) return; // Pages might have been deleted
    
    const edge = new FlowEdge(connection, sourceNode, targetNode, {
      onEdgeClick: this._onEdgeClick.bind(this),
      onEdgeDoubleClick: this._onEdgeDoubleClick.bind(this)
    });
    
    this.edges.set(connection.connectionId, edge);
    this.edgeLayer.appendChild(edge.element);
  }

  _updateConnectedEdges(nodeId) {
    this.edges.forEach(edge => {
      if (edge.connection.sourcePageId === nodeId || edge.connection.targetPageId === nodeId) {
        edge.update();
      }
    });
  }

  _attachCanvasEvents() {
    // Pan & Draw End
    this.wrapper.addEventListener('mousedown', (e) => {
      if (e.target.closest('.flow-node') || e.target.closest('.flow-popup')) return;
      if (e.target.closest('.flow-edge-layer path')) return; // Don't pan if clicking edge
      
      this.isPanning = true;
      this.wrapper.classList.add('panning');
      this.panStart = { x: e.clientX - this.viewport.x, y: e.clientY - this.viewport.y };
      
      this.nodes.forEach(node => node.setSelected(false));
      this.edges.forEach(edge => edge.setSelected(false));
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isPanning) {
        this.viewport.x = e.clientX - this.panStart.x;
        this.viewport.y = e.clientY - this.panStart.y;
        this._updateTransform();
      } else if (this.isDraggingNode && this.draggedNodes.length > 0) {
        const dx = (e.clientX - this.nodeDragStart.x) / this.viewport.zoom;
        const dy = (e.clientY - this.nodeDragStart.y) / this.viewport.zoom;
        const snap = e.altKey ? 1 : 24;

        this.draggedNodes.forEach(node => {
          let newX = node.startX + dx;
          let newY = node.startY + dy;
          if (snap > 1) {
            newX = Math.round(newX / snap) * snap;
            newY = Math.round(newY / snap) * snap;
          }
          node.updatePosition(newX, newY);
          this._updateConnectedEdges(node.page.pageId);
        });
      } else if (this.isDrawingEdge && this.ghostEdge) {
        const rect = this.wrapper.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left - this.viewport.x) / this.viewport.zoom;
        const mouseY = (e.clientY - rect.top - this.viewport.y) / this.viewport.zoom;
        
        if (this.hoveredTargetPort) {
          // Snap to target port
          const targetNode = this.nodes.get(this.hoveredTargetPort.pageId);
          this.ghostEdge.updateTarget(targetNode.x - 6, targetNode.y + targetNode.height / 2);
        } else {
          this.ghostEdge.updateTarget(mouseX, mouseY);
        }
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (this.isPanning) {
        this.isPanning = false;
        this.wrapper.classList.remove('panning');
        this._scheduleSave();
      }
      if (this.isDraggingNode) {
        this.isDraggingNode = false;
        this.draggedNodes.forEach(node => node.setDragging(false));
        
        // Push move undo event
        if (this.draggedNodes.length > 0) {
           const nodesMoved = this.draggedNodes.map(n => ({ id: n.page.pageId, x: n.x, y: n.y, startX: n.startX, startY: n.startY }));
           // Check if actually moved
           if (nodesMoved.some(n => n.x !== n.startX || n.y !== n.startY)) {
             const label = nodesMoved.length > 1 ? `Move ${nodesMoved.length} pages` : 'Move page';
             undoManager.push({
               label,
               execute: () => {
                 nodesMoved.forEach(n => {
                   const node = this.nodes.get(n.id);
                   node.updatePosition(n.x, n.y);
                   this._updateConnectedEdges(n.id);
                 });
                 this._scheduleSave();
               },
               undo: () => {
                 nodesMoved.forEach(n => {
                   const node = this.nodes.get(n.id);
                   node.updatePosition(n.startX, n.startY);
                   this._updateConnectedEdges(n.id);
                 });
                 this._scheduleSave();
               }
             });
           }
        }
        
        this.draggedNodes = [];
        this._scheduleSave();
      }
      if (this.isDrawingEdge) {
        this._cancelEdgeDraw(); // Fallback if released outside a port
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.isDrawingEdge) this._cancelEdgeDraw();
        this.nodes.forEach(node => node.setSelected(false));
        this.edges.forEach(edge => edge.setSelected(false));
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.target.closest('input, textarea')) {
        this._deleteSelectedEdges();
      }
    });

    this.wrapper.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
        this._setZoom(this.viewport.zoom + zoomDelta, e.clientX, e.clientY);
      }
    }, { passive: false });
  }

  // Node Events
  _onNodeMouseDown(e, node) {
    if (!node.selected) {
      if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
        this.nodes.forEach(n => n.setSelected(false));
        this.edges.forEach(edge => edge.setSelected(false));
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
    document.dispatchEvent(new CustomEvent('switch-mode', {
      detail: { mode: 'edit', pageId: node.page.pageId }
    }));
  }

  // Edge Drawing Events
  _onPortMouseDown(e, port) {
    if (port.type !== 'output') return;
    
    this.isDrawingEdge = true;
    this.drawSourceNode = this.nodes.get(port.pageId);
    
    this.ghostEdge = new GhostEdge(this.drawSourceNode);
    this.edgeLayer.appendChild(this.ghostEdge.element);
  }

  _onPortHover(e, port, isEntering) {
    if (!this.isDrawingEdge || port.type !== 'input') return;
    
    if (isEntering) {
      this.hoveredTargetPort = port;
      const isValid = port.pageId !== this.drawSourceNode.page.pageId;
      port.setInvalid(!isValid);
      port.setHighlight(isValid);
      this.ghostEdge.setValid(isValid);
    } else {
      this.hoveredTargetPort = null;
      port.setInvalid(false);
      port.setHighlight(false);
      this.ghostEdge.setValid(true);
    }
  }

  async _onPortMouseUp(e, port) {
    if (!this.isDrawingEdge) return;
    e.stopPropagation();

    const sourceId = this.drawSourceNode.page.pageId;
    const targetId = port.pageId;

    this._cancelEdgeDraw(); // Clean up ghost edge

    if (port.type !== 'input' || sourceId === targetId) {
      // Invalid drop
      return;
    }

    // Check for existing sequence
    const existingSeq = this.connections.find(c => c.sourcePageId === sourceId && c.targetPageId === targetId && c.type === 'sequence');
    
    // Show Popup
    const rect = this.wrapper.getBoundingClientRect();
    const targetNode = this.nodes.get(targetId);
    const midX = (this.drawSourceNode.x + targetNode.x) / 2;
    const midY = (this.drawSourceNode.y + targetNode.y) / 2;
    
    const screenX = (midX * this.viewport.zoom) + this.viewport.x + rect.left;
    const screenY = (midY * this.viewport.zoom) + this.viewport.y + rect.top;

    new ConnectionTypePopup(screenX, screenY, async (type, label) => {
      if (type === 'sequence' && existingSeq) {
        this._showToast('This connection already exists', 'info');
        return;
      }
      
      const conn = await createConnection(this.deckId, sourceId, targetId, type, label);
      this.connections.push(conn);
      this._renderEdge(conn);
      this._showToast('Connection added', 'success');
      
      undoManager.push({
        label: 'Add connection',
        execute: async () => {
          await createConnection(this.deckId, sourceId, targetId, type, label, conn.color);
          this.connections.push(conn);
          this._renderEdge(conn);
        },
        undo: async () => {
          await deleteConnection(conn.connectionId);
          this.connections = this.connections.filter(c => c.connectionId !== conn.connectionId);
          const edge = this.edges.get(conn.connectionId);
          if (edge) {
            edge.element.remove();
            this.edges.delete(conn.connectionId);
          }
        }
      });
    }, () => {
      // Cancelled
    }).element.ownerDocument.body.appendChild(document.querySelector('#app')); // Append to body so it overlays canvas
  }

  _cancelEdgeDraw() {
    this.isDrawingEdge = false;
    this.drawSourceNode = null;
    this.hoveredTargetPort = null;
    if (this.ghostEdge) {
      this.ghostEdge.remove();
      this.ghostEdge = null;
    }
  }

  // Edge Selection & Editing
  _onEdgeClick(e, edge) {
    if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
      this.nodes.forEach(n => n.setSelected(false));
      this.edges.forEach(e => e.setSelected(false));
    }
    edge.setSelected(true);
  }

  _onEdgeDoubleClick(e, edge) {
    const rect = this.wrapper.getBoundingClientRect();
    const screenX = e.clientX;
    const screenY = e.clientY;

    const popup = new EdgeEditor(
      edge.connection,
      edge.sourceNode.page.title || 'Untitled',
      edge.targetNode.page.title || 'Untitled',
      screenX, screenY,
      async (connId, type, label) => {
        // Save
        const conn = this.connections.find(c => c.connectionId === connId);
        const oldType = conn.type;
        const oldLabel = conn.label;
        
        conn.type = type;
        conn.label = label;
        // Map color to type
        conn.color = type === 'sequence' ? '#1D9E75' : type === 'reference' ? '#5A7A6E' : '#D4A017';
        
        await updateConnection(conn);
        edge.update();
        
        undoManager.push({
          label: 'Edit connection',
          execute: async () => {
            conn.type = type; conn.label = label; conn.color = type === 'sequence' ? '#1D9E75' : type === 'reference' ? '#5A7A6E' : '#D4A017';
            await updateConnection(conn); edge.update();
          },
          undo: async () => {
            conn.type = oldType; conn.label = oldLabel; conn.color = oldType === 'sequence' ? '#1D9E75' : oldType === 'reference' ? '#5A7A6E' : '#D4A017';
            await updateConnection(conn); edge.update();
          }
        });
      },
      async (connId) => {
        // Delete
        await deleteConnection(connId);
        const connData = this.connections.find(c => c.connectionId === connId);
        this.connections = this.connections.filter(c => c.connectionId !== connId);
        edge.element.remove();
        this.edges.delete(connId);
        
        this._showToast('Connection deleted — Undo?', 'warning', true);
        
        undoManager.push({
          label: 'Delete connection',
          execute: async () => {
             await deleteConnection(connId);
             this.connections = this.connections.filter(c => c.connectionId !== connId);
             const e = this.edges.get(connId); if(e) { e.element.remove(); this.edges.delete(connId); }
          },
          undo: async () => {
             await createConnection(this.deckId, connData.sourcePageId, connData.targetPageId, connData.type, connData.label, connData.color);
             this.connections.push(connData);
             this._renderEdge(connData);
          }
        });
      },
      () => {} // Cancel
    );
    
    document.body.appendChild(popup.element);
  }

  async _deleteSelectedEdges() {
    const selectedEdges = Array.from(this.edges.values()).filter(e => e.selected);
    if (selectedEdges.length === 0) return;
    
    const connDatas = selectedEdges.map(e => e.connection);
    
    for (const edge of selectedEdges) {
      await deleteConnection(edge.connection.connectionId);
      this.connections = this.connections.filter(c => c.connectionId !== edge.connection.connectionId);
      edge.element.remove();
      this.edges.delete(edge.connection.connectionId);
    }
    
    this._showToast(`${selectedEdges.length} connection(s) deleted`, 'warning');
    
    undoManager.push({
       label: 'Delete connections',
       execute: async () => {
          for (const conn of connDatas) {
             await deleteConnection(conn.connectionId);
             this.connections = this.connections.filter(c => c.connectionId !== conn.connectionId);
             const e = this.edges.get(conn.connectionId); if(e) { e.element.remove(); this.edges.delete(conn.connectionId); }
          }
       },
       undo: async () => {
          for (const conn of connDatas) {
             await createConnection(this.deckId, conn.sourcePageId, conn.targetPageId, conn.type, conn.label, conn.color);
             this.connections.push(conn);
             this._renderEdge(conn);
          }
       }
    });
  }

  // Zoom & Transform
  _setZoom(newZoom, originX, originY) {
    const minZoom = 0.2;
    const maxZoom = 3.0;
    const oldZoom = this.viewport.zoom;
    
    this.viewport.zoom = Math.min(Math.max(newZoom, minZoom), maxZoom);
    
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

  _showToast(message, type, allowUndo = false) {
    document.dispatchEvent(new CustomEvent('show-toast', {
      detail: { message, type, allowUndo }
    }));
  }

  unmount() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this._scheduleSave();
    }
    this.container.innerHTML = '';
  }
}
