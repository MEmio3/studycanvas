import { getFlowLayout, saveFlowLayout, generateDefaultLayout } from '../../store/flowLayout.js';
import { getConnectionsForDeck, createConnection, updateConnection, deleteConnection } from '../../store/connections.js';
import { undoManager } from '../../services/undoManager.js';
import { FlowNode } from './FlowNode.js';
import { FlowEdge } from './FlowEdge.js';
import { GhostEdge } from './GhostEdge.js';
import { ConnectionTypePopup } from './ConnectionTypePopup.js';
import { EdgeEditor } from './EdgeEditor.js';
import { Minimap } from './Minimap.js';
import { FlowToolbar } from './FlowToolbar.js';
import { BulkActionBar } from './BulkActionBar.js';
import { ConnectionSummaryPanel } from './ConnectionSummaryPanel.js';
import { AutoLayoutPopup } from './AutoLayoutPopup.js';
import { gridLayout, layeredLayout } from '../../services/autoLayout.js';

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
    this.boundEvents = [];
  }

  async render() {
    this.container.innerHTML = `
      <div class="flow-canvas-wrapper" id="flow-canvas-wrapper">
        <div class="flow-viewport" id="flow-viewport">
          <svg class="flow-edge-layer" id="flow-edge-layer"></svg>
          <div class="flow-node-layer" id="flow-node-layer"></div>
        </div>
        <div id="flow-ui-layer">
          ${this.pages.length === 0 ? `
            <div class="flow-empty-state" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: var(--text-secondary); background: var(--bg-surface); padding: 24px; border-radius: 8px; border: 1px dashed var(--border-default);">
              <i class="ti ti-plug" style="font-size: 32px; margin-bottom: 8px; display: block;"></i>
              <p>Your canvas is empty.</p>
              <p style="font-size: 13px; margin-top: 4px;">Click the <b>+</b> button or use the Left Panel to create pages.</p>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    this.wrapper = this.container.querySelector('#flow-canvas-wrapper');
    this.viewportEl = this.container.querySelector('#flow-viewport');
    this.edgeLayer = this.container.querySelector('#flow-edge-layer');
    this.nodeLayer = this.container.querySelector('#flow-node-layer');
    this.uiLayer = this.container.querySelector('#flow-ui-layer');

    await this._loadData();
    this._attachCanvasEvents();
    this._initUIChrome();
    this._updateTransform();
  }

  async _loadData() {
    let layout = await getFlowLayout(this.deckId);
    let positions = layout?.nodes;
    
    if (!positions || Object.keys(positions).length === 0 && this.pages.length > 0) {
      positions = generateDefaultLayout(this.pages);
      this._scheduleSave();
    }

    if (layout?.viewport) {
      this.viewport = layout.viewport;
    }

    this.pages.forEach(page => {
      const pos = positions?.[page.pageId] || { x: 0, y: 0, width: 220, height: 130 };
      
      const node = new FlowNode(page, pos, {
        onNodeMouseDown: this._onNodeMouseDown.bind(this),
        onNodeDoubleClick: this._onNodeDoubleClick.bind(this),
        onNodeContextMenu: () => {}, // TODO
        onPortMouseDown: this._onPortMouseDown.bind(this),
        onPortMouseUp: this._onPortMouseUp.bind(this),
        onPortHover: this._onPortHover.bind(this)
      });
      
      this.nodes.set(page.pageId, node);
      this.nodeLayer.appendChild(node.element);
    });

    this.connections = await getConnectionsForDeck(this.deckId);
    this.connections.forEach(conn => this._renderEdge(conn));
  }

  _initUIChrome() {
    this.minimap = new Minimap(this.uiLayer, this);
    this.toolbar = new FlowToolbar(this.uiLayer, this);
    this.bulkBar = new BulkActionBar(this.uiLayer, this);
    this.summaryPanel = new ConnectionSummaryPanel(this.uiLayer, this);
    
    // Listen to custom events from UI elements
    const autoLayoutHandler = () => this._showAutoLayoutPopup();
    const fitScreenHandler = () => this._fitToScreen();
    const bulkConnectHandler = (e) => this._handleBulkConnect(e.detail.connections);
    const bulkDeleteHandler = (e) => this._handleBulkDelete(e.detail.pageIds);
    const delConnHandler = (e) => this._deleteConnection(e.detail.id);
    const clearConnHandler = () => this._clearAllConnections();

    document.addEventListener('flow-auto-layout', autoLayoutHandler);
    document.addEventListener('flow-fit-screen', fitScreenHandler);
    document.addEventListener('flow-bulk-connect', bulkConnectHandler);
    document.addEventListener('flow-bulk-delete', bulkDeleteHandler);
    document.addEventListener('flow-delete-connection', delConnHandler);
    document.addEventListener('flow-clear-all-connections', clearConnHandler);

    this.boundEvents = [
      { event: 'flow-auto-layout', handler: autoLayoutHandler },
      { event: 'flow-fit-screen', handler: fitScreenHandler },
      { event: 'flow-bulk-connect', handler: bulkConnectHandler },
      { event: 'flow-bulk-delete', handler: bulkDeleteHandler },
      { event: 'flow-delete-connection', handler: delConnHandler },
      { event: 'flow-clear-all-connections', handler: clearConnHandler }
    ];
  }

  _renderEdge(connection) {
    const sourceNode = this.nodes.get(connection.sourcePageId);
    const targetNode = this.nodes.get(connection.targetPageId);
    if (!sourceNode || !targetNode) return;
    
    const edge = new FlowEdge(connection, sourceNode, targetNode, {
      onEdgeClick: this._onEdgeClick.bind(this),
      onEdgeDoubleClick: this._onEdgeDoubleClick.bind(this)
    });
    
    this.edges.set(connection.connectionId, edge);
    this.edgeLayer.appendChild(edge.element);
    if (this.minimap) this.minimap.update();
  }

  _updateConnectedEdges(nodeId) {
    this.edges.forEach(edge => {
      if (edge.connection.sourcePageId === nodeId || edge.connection.targetPageId === nodeId) {
        edge.update();
      }
    });
  }

  _attachCanvasEvents() {
    this.wrapper.addEventListener('mousedown', (e) => {
      if (e.target.closest('.flow-node') || e.target.closest('.flow-popup') || e.target.closest('#flow-ui-layer')) return;
      if (e.target.closest('.flow-edge-layer path')) return;
      
      this.isPanning = true;
      this.wrapper.classList.add('panning');
      this.panStart = { x: e.clientX - this.viewport.x, y: e.clientY - this.viewport.y };
      
      this.nodes.forEach(node => node.setSelected(false));
      this.edges.forEach(edge => edge.setSelected(false));
      if (this.bulkBar) this.bulkBar.update(0);
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
        if (this.minimap) this.minimap.update();
      } else if (this.isDrawingEdge && this.ghostEdge) {
        const rect = this.wrapper.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left - this.viewport.x) / this.viewport.zoom;
        const mouseY = (e.clientY - rect.top - this.viewport.y) / this.viewport.zoom;
        
        if (this.hoveredTargetPort) {
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
        
        if (this.draggedNodes.length > 0) {
           const nodesMoved = this.draggedNodes.map(n => ({ id: n.page.pageId, x: n.x, y: n.y, startX: n.startX, startY: n.startY }));
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
                 if (this.minimap) this.minimap.update();
                 this._scheduleSave();
               },
               undo: () => {
                 nodesMoved.forEach(n => {
                   const node = this.nodes.get(n.id);
                   node.updatePosition(n.startX, n.startY);
                   this._updateConnectedEdges(n.id);
                 });
                 if (this.minimap) this.minimap.update();
                 this._scheduleSave();
               }
             });
           }
        }
        
        this.draggedNodes = [];
        this._scheduleSave();
      }
      if (this.isDrawingEdge) {
        this._cancelEdgeDraw();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.isDrawingEdge) this._cancelEdgeDraw();
        this.nodes.forEach(node => node.setSelected(false));
        this.edges.forEach(edge => edge.setSelected(false));
        if (this.bulkBar) this.bulkBar.update(0);
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.target.closest('input, textarea')) {
        this._deleteSelectedEdges();
      }
      // Alt+L for auto layout
      if (e.altKey && e.key.toLowerCase() === 'l' && !e.target.closest('input, textarea')) {
        e.preventDefault();
        this._showAutoLayoutPopup();
      }
      // Ctrl+Shift+F for fit screen
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        this._fitToScreen();
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
    
    if (this.bulkBar) this.bulkBar.update(this.draggedNodes.length);
    
    // Sync LeftPanel active page
    if (this.draggedNodes.length === 1) {
      document.dispatchEvent(new CustomEvent('flow-node-selected', { detail: { id: node.page.pageId } }));
    }
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
    this._cancelEdgeDraw();

    if (port.type !== 'input' || sourceId === targetId) return;

    const existingSeq = this.connections.find(c => c.sourcePageId === sourceId && c.targetPageId === targetId && c.type === 'sequence');
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
          if (edge) { edge.element.remove(); this.edges.delete(conn.connectionId); }
          if (this.minimap) this.minimap.update();
        }
      });
    }, () => {}).element.ownerDocument.body.appendChild(document.querySelector('#app'));
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

  // Edge Interaction
  _onEdgeClick(e, edge) {
    if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
      this.nodes.forEach(n => n.setSelected(false));
      this.edges.forEach(e => e.setSelected(false));
    }
    edge.setSelected(true);
  }

  _onEdgeDoubleClick(e, edge) {
    const rect = this.wrapper.getBoundingClientRect();
    const popup = new EdgeEditor(
      edge.connection, edge.sourceNode.page.title || 'Untitled', edge.targetNode.page.title || 'Untitled',
      e.clientX, e.clientY,
      async (connId, type, label) => {
        const conn = this.connections.find(c => c.connectionId === connId);
        const oldType = conn.type; const oldLabel = conn.label;
        conn.type = type; conn.label = label; conn.color = type === 'sequence' ? '#1D9E75' : type === 'reference' ? '#5A7A6E' : '#D4A017';
        await updateConnection(conn); edge.update();
        
        undoManager.push({
          label: 'Edit connection',
          execute: async () => { conn.type = type; conn.label = label; conn.color = type === 'sequence' ? '#1D9E75' : type === 'reference' ? '#5A7A6E' : '#D4A017'; await updateConnection(conn); edge.update(); },
          undo: async () => { conn.type = oldType; conn.label = oldLabel; conn.color = oldType === 'sequence' ? '#1D9E75' : oldType === 'reference' ? '#5A7A6E' : '#D4A017'; await updateConnection(conn); edge.update(); }
        });
      },
      async (connId) => {
        await this._deleteConnection(connId);
      },
      () => {}
    );
    document.body.appendChild(popup.element);
  }

  async _deleteConnection(connId) {
    const edge = this.edges.get(connId);
    if (!edge) return;
    const connData = edge.connection;
    await deleteConnection(connId);
    this.connections = this.connections.filter(c => c.connectionId !== connId);
    edge.element.remove();
    this.edges.delete(connId);
    if (this.minimap) this.minimap.update();
    
    this._showToast('Connection deleted — Undo?', 'warning', true);
    
    undoManager.push({
      label: 'Delete connection',
      execute: async () => {
         await deleteConnection(connId);
         this.connections = this.connections.filter(c => c.connectionId !== connId);
         const e = this.edges.get(connId); if(e) { e.element.remove(); this.edges.delete(connId); }
         if (this.minimap) this.minimap.update();
      },
      undo: async () => {
         await createConnection(this.deckId, connData.sourcePageId, connData.targetPageId, connData.type, connData.label, connData.color);
         this.connections.push(connData);
         this._renderEdge(connData);
      }
    });
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
    
    if (this.minimap) this.minimap.update();
    this._showToast(`${selectedEdges.length} connection(s) deleted`, 'warning');
    
    undoManager.push({
       label: 'Delete connections',
       execute: async () => {
          for (const conn of connDatas) {
             await deleteConnection(conn.connectionId);
             this.connections = this.connections.filter(c => c.connectionId !== conn.connectionId);
             const e = this.edges.get(conn.connectionId); if(e) { e.element.remove(); this.edges.delete(conn.connectionId); }
          }
          if (this.minimap) this.minimap.update();
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

  async _clearAllConnections() {
    const connDatas = [...this.connections];
    for (const conn of connDatas) {
      await deleteConnection(conn.connectionId);
      const e = this.edges.get(conn.connectionId);
      if (e) e.element.remove();
    }
    this.connections = [];
    this.edges.clear();
    if (this.minimap) this.minimap.update();
    this._showToast('All connections removed — Undo?', 'warning', true);
    
    undoManager.push({
      label: 'Clear connections',
      execute: async () => {
         for (const conn of connDatas) {
           await deleteConnection(conn.connectionId);
           const e = this.edges.get(conn.connectionId); if(e) { e.element.remove(); }
         }
         this.connections = []; this.edges.clear();
         if (this.minimap) this.minimap.update();
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

  async _handleBulkConnect(connectionsToCreate) {
    const created = [];
    for (const c of connectionsToCreate) {
      const exists = this.connections.find(x => x.sourcePageId === c.source && x.targetPageId === c.target && x.type === 'sequence');
      if (!exists) {
        const conn = await createConnection(this.deckId, c.source, c.target, 'sequence', '');
        this.connections.push(conn);
        this._renderEdge(conn);
        created.push(conn);
      }
    }
    
    if (created.length > 0) {
      this._showToast(`${created.length} connection(s) created`, 'success');
      undoManager.push({
        label: 'Auto-connect',
        execute: async () => {
          for (const conn of created) {
            await createConnection(this.deckId, conn.sourcePageId, conn.targetPageId, conn.type, conn.label, conn.color);
            this.connections.push(conn); this._renderEdge(conn);
          }
        },
        undo: async () => {
          for (const conn of created) {
            await deleteConnection(conn.connectionId);
            this.connections = this.connections.filter(c => c.connectionId !== conn.connectionId);
            const edge = this.edges.get(conn.connectionId); if (edge) { edge.element.remove(); this.edges.delete(conn.connectionId); }
          }
          if (this.minimap) this.minimap.update();
        }
      });
    }
  }

  async _handleBulkDelete(pageIds) {
    // Delete from DB and dispatch 'delete-page'
    pageIds.forEach(id => {
      document.dispatchEvent(new CustomEvent('delete-page', { detail: { id } }));
    });
    // Visual removal
    pageIds.forEach(id => {
      const node = this.nodes.get(id);
      if (node) { node.element.remove(); this.nodes.delete(id); }
      
      // Remove connected edges
      const edgesToRemove = [];
      this.edges.forEach(edge => {
        if (edge.connection.sourcePageId === id || edge.connection.targetPageId === id) {
          edgesToRemove.push(edge);
        }
      });
      edgesToRemove.forEach(e => {
        e.element.remove();
        this.edges.delete(e.connection.connectionId);
        this.connections = this.connections.filter(c => c.connectionId !== e.connection.connectionId);
      });
    });
    
    this.draggedNodes = [];
    if (this.bulkBar) this.bulkBar.update(0);
    if (this.minimap) this.minimap.update();
  }

  // Layout & Viewport
  _showAutoLayoutPopup() {
    const rect = this.wrapper.getBoundingClientRect();
    const popup = new AutoLayoutPopup(rect.left + rect.width / 2 - 140, rect.top + rect.height / 2 - 100,
      (alg, spacing, animate) => {
        let newPositions;
        const nodesArray = Array.from(this.nodes.values()).map(n => n.page);
        if (alg === 'Grid') {
          newPositions = gridLayout(nodesArray, spacing);
        } else {
          newPositions = layeredLayout(nodesArray, this.connections, alg, spacing);
        }
        
        const oldPositions = {};
        this.nodes.forEach((node, id) => { oldPositions[id] = { x: node.x, y: node.y }; });
        
        const applyLayout = (positions) => {
          this.nodes.forEach((node, id) => {
            if (positions[id]) {
              if (animate) node.element.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
              node.updatePosition(positions[id].x, positions[id].y);
              if (animate) {
                 setTimeout(() => { node.element.style.transition = ''; }, 400);
              }
              this._updateConnectedEdges(id);
            }
          });
          if (this.minimap) this.minimap.update();
          this._fitToScreen();
          this._scheduleSave();
        };
        
        applyLayout(newPositions);
        this._showToast('Layout applied', 'success');
        
        undoManager.push({
          label: 'Auto Layout',
          execute: () => applyLayout(newPositions),
          undo: () => applyLayout(oldPositions)
        });
      },
      () => {}
    );
    document.body.appendChild(popup.element);
  }

  _fitToScreen() {
    if (this.nodes.size === 0) return;
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    this.nodes.forEach(node => {
      if (node.x < minX) minX = node.x;
      if (node.y < minY) minY = node.y;
      if (node.x + node.width > maxX) maxX = node.x + node.width;
      if (node.y + node.height > maxY) maxY = node.y + node.height;
    });
    
    const padding = 100;
    const contentW = maxX - minX + padding * 2;
    const contentH = maxY - minY + padding * 2;
    
    const wrapperRect = this.wrapper.getBoundingClientRect();
    const scaleX = wrapperRect.width / contentW;
    const scaleY = wrapperRect.height / contentH;
    
    this.viewport.zoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.2), 1.0);
    this.viewport.x = (wrapperRect.width - contentW * this.viewport.zoom) / 2 - minX * this.viewport.zoom + padding * this.viewport.zoom;
    this.viewport.y = (wrapperRect.height - contentH * this.viewport.zoom) / 2 - minY * this.viewport.zoom + padding * this.viewport.zoom;
    
    this._updateTransform();
    this._scheduleSave();
    if (this.minimap) this.minimap.update();
  }

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
    if (this.minimap) this.minimap.update();
  }

  _updateTransform() {
    this.viewportEl.style.transform = `translate(${this.viewport.x}px, ${this.viewport.y}px) scale(${this.viewport.zoom})`;
    if (this.minimap) this.minimap.update();
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
    document.dispatchEvent(new CustomEvent('show-toast', { detail: { message, type, allowUndo } }));
  }

  unmount() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this._scheduleSave();
    }
    this.boundEvents.forEach(({ event, handler }) => {
      document.removeEventListener(event, handler);
    });
    this.container.innerHTML = '';
  }
}
