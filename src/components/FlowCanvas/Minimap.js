export class Minimap {
  constructor(container, canvasInstance) {
    this.container = container;
    this.canvasInstance = canvasInstance; // Reference to FlowCanvas to read state
    
    this.element = this._createDOM();
    this.canvas = this.element.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    
    this.isDragging = false;
    this.isOpen = true;
    
    this._attachEvents();
    this.update();
  }

  _createDOM() {
    const el = document.createElement('div');
    el.className = 'flow-minimap';
    
    el.innerHTML = `
      <button class="flow-minimap-toggle" title="Toggle Minimap"><i class="ti ti-minus"></i></button>
      <canvas width="180" height="110"></canvas>
    `;
    
    this.container.appendChild(el);
    return el;
  }

  _attachEvents() {
    const toggleBtn = this.element.querySelector('.flow-minimap-toggle');
    
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.isOpen = !this.isOpen;
      
      if (this.isOpen) {
        this.element.style.height = '110px';
        toggleBtn.innerHTML = '<i class="ti ti-minus"></i>';
        this.update();
      } else {
        this.element.style.height = '24px';
        toggleBtn.innerHTML = '<i class="ti ti-plus"></i>';
      }
    });
    
    // Pan via minimap
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this._panToMinimapCoord(e);
    });
    
    window.addEventListener('mousemove', (e) => {
      if (this.isDragging && this.isOpen) {
        this._panToMinimapCoord(e);
      }
    });
    
    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.canvasInstance._scheduleSave();
      }
    });
  }

  _panToMinimapCoord(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    
    const bounds = this._getBounds();
    const scale = Math.min(
      rect.width / Math.max(bounds.width, 1000),
      rect.height / Math.max(bounds.height, 1000)
    );
    
    // Click coordinate in real canvas space
    const realX = bounds.minX + (x / scale);
    const realY = bounds.minY + (y / scale);
    
    // Center viewport on real coordinate
    const wrapperRect = this.canvasInstance.wrapper.getBoundingClientRect();
    const viewportX = (wrapperRect.width / 2) - (realX * this.canvasInstance.viewport.zoom);
    const viewportY = (wrapperRect.height / 2) - (realY * this.canvasInstance.viewport.zoom);
    
    this.canvasInstance.viewport.x = viewportX;
    this.canvasInstance.viewport.y = viewportY;
    this.canvasInstance._updateTransform();
    this.update();
  }

  _getBounds() {
    if (this.canvasInstance.nodes.size === 0) {
      return { minX: 0, minY: 0, maxX: 1000, maxY: 1000, width: 1000, height: 1000 };
    }
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    this.canvasInstance.nodes.forEach(node => {
      if (node.x < minX) minX = node.x;
      if (node.y < minY) minY = node.y;
      if (node.x + node.width > maxX) maxX = node.x + node.width;
      if (node.y + node.height > maxY) maxY = node.y + node.height;
    });
    
    // Add padding
    minX -= 200; minY -= 200; maxX += 200; maxY += 200;
    
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
  }

  update() {
    if (!this.isOpen) return;
    
    const bounds = this._getBounds();
    const rect = this.canvas.getBoundingClientRect();
    
    const scale = Math.min(
      rect.width / Math.max(bounds.width, 1000),
      rect.height / Math.max(bounds.height, 1000)
    );
    
    // Offset to center the minimap content
    const offsetX = (rect.width - bounds.width * scale) / 2;
    const offsetY = (rect.height - bounds.height * scale) / 2;
    
    this.ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Draw edges
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = '#3A3F4E';
    this.canvasInstance.edges.forEach(edge => {
      const sourceNode = edge.sourceNode;
      const targetNode = edge.targetNode;
      
      const sx = offsetX + (sourceNode.x + sourceNode.width - bounds.minX) * scale;
      const sy = offsetY + (sourceNode.y + sourceNode.height/2 - bounds.minY) * scale;
      const tx = offsetX + (targetNode.x - bounds.minX) * scale;
      const ty = offsetY + (targetNode.y + targetNode.height/2 - bounds.minY) * scale;
      
      this.ctx.beginPath();
      this.ctx.moveTo(sx, sy);
      this.ctx.lineTo(tx, ty); // Simple straight line for minimap
      this.ctx.stroke();
    });
    
    // Draw nodes
    this.canvasInstance.nodes.forEach(node => {
      const x = offsetX + (node.x - bounds.minX) * scale;
      const y = offsetY + (node.y - bounds.minY) * scale;
      const w = node.width * scale;
      const h = node.height * scale;
      
      this.ctx.fillStyle = node.page.topic ? '#1D9E75' : '#3A3F4E';
      this.ctx.fillRect(x, y, w, h);
    });
    
    // Draw Viewport Rect
    const wrapperRect = this.canvasInstance.wrapper.getBoundingClientRect();
    const vpZoom = this.canvasInstance.viewport.zoom;
    const vpX = this.canvasInstance.viewport.x;
    const vpY = this.canvasInstance.viewport.y;
    
    const realVpX = -vpX / vpZoom;
    const realVpY = -vpY / vpZoom;
    const realVpW = wrapperRect.width / vpZoom;
    const realVpH = wrapperRect.height / vpZoom;
    
    const mmX = offsetX + (realVpX - bounds.minX) * scale;
    const mmY = offsetY + (realVpY - bounds.minY) * scale;
    const mmW = realVpW * scale;
    const mmH = realVpH * scale;
    
    this.ctx.fillStyle = 'rgba(29, 158, 117, 0.25)';
    this.ctx.strokeStyle = '#1D9E75';
    this.ctx.lineWidth = 1;
    
    this.ctx.fillRect(mmX, mmY, mmW, mmH);
    this.ctx.strokeRect(mmX, mmY, mmW, mmH);
  }
}
