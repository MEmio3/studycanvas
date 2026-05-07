import { calculateBezierPath, getBezierMidpoint } from '../../services/edgePath.js';

export class FlowEdge {
  constructor(connection, sourceNode, targetNode, callbacks) {
    this.connection = connection;
    this.sourceNode = sourceNode;
    this.targetNode = targetNode;
    this.callbacks = callbacks;
    
    this.selected = false;
    
    this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.element.dataset.connectionId = connection.connectionId;
    
    this.path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.path.setAttribute('fill', 'none');
    this.path.setAttribute('stroke', connection.color || 'var(--edge-sequence)');
    this.path.setAttribute('stroke-width', '2');
    
    if (connection.type === 'reference') {
      this.path.setAttribute('stroke-dasharray', '6 4');
    }
    
    this.arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    this.arrow.setAttribute('fill', connection.type === 'reference' ? 'none' : (connection.color || 'var(--edge-sequence)'));
    if (connection.type === 'reference') {
      this.arrow.setAttribute('stroke', connection.color || 'var(--edge-sequence)');
      this.arrow.setAttribute('stroke-width', '2');
    }

    this.labelGroup = null;
    
    this.element.appendChild(this.path);
    this.element.appendChild(this.arrow);
    
    this._attachEvents();
    this.update();
  }

  _attachEvents() {
    this.element.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      this.callbacks.onEdgeClick(e, this);
    });
    
    this.element.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.callbacks.onEdgeDoubleClick(e, this);
    });

    this.element.addEventListener('mouseenter', () => {
      this.path.setAttribute('stroke-width', '3');
      if (this.labelGroup && this.connection.label) {
         this.labelGroup.style.opacity = '1';
      }
    });

    this.element.addEventListener('mouseleave', () => {
      if (!this.selected) {
        this.path.setAttribute('stroke-width', '2');
      }
      if (this.labelGroup && this.connection.label && !this.selected) {
         this.labelGroup.style.opacity = '0.8';
      }
    });
  }

  setSelected(isSelected) {
    this.selected = isSelected;
    if (isSelected) {
      this.path.setAttribute('stroke-width', '3');
      // Additional selected styling if needed
      this.element.classList.add('selected');
    } else {
      this.path.setAttribute('stroke-width', '2');
      this.element.classList.remove('selected');
    }
  }

  update() {
    // Port positions
    const sourceX = this.sourceNode.x + this.sourceNode.width + 6; // Output port right edge
    const sourceY = this.sourceNode.y + (this.sourceNode.height / 2);
    
    const targetX = this.targetNode.x - 6; // Input port left edge
    const targetY = this.targetNode.y + (this.targetNode.height / 2);

    const d = calculateBezierPath(sourceX, sourceY, targetX, targetY);
    this.path.setAttribute('d', d);

    // Arrowhead angle calculation
    // We approximate the tangent at the end of the curve by looking slightly before the target
    const angle = Math.atan2(targetY - sourceY, Math.max(1, targetX - sourceX));
    const deg = angle * (180 / Math.PI);
    
    if (this.connection.type === 'reference') {
      // Open chevron
      this.arrow.setAttribute('points', '-6,-6 0,0 -6,6');
    } else {
      // Filled triangle
      this.arrow.setAttribute('points', '-8,-4 0,0 -8,4');
    }
    
    this.arrow.setAttribute('transform', `translate(${targetX}, ${targetY}) rotate(${deg})`);

    // Label
    if (this.connection.label) {
      const mid = getBezierMidpoint(sourceX, sourceY, targetX, targetY);
      
      if (!this.labelGroup) {
        this.labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        this.labelBg.setAttribute('fill', 'var(--edge-label-bg)');
        this.labelBg.setAttribute('stroke', this.connection.color || 'var(--edge-sequence)');
        this.labelBg.setAttribute('rx', '4');
        
        this.labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        this.labelText.setAttribute('fill', 'var(--text-secondary)');
        this.labelText.setAttribute('font-size', '10px');
        this.labelText.setAttribute('text-anchor', 'middle');
        this.labelText.setAttribute('dominant-baseline', 'middle');
        this.labelText.textContent = this.connection.label;
        
        this.labelGroup.appendChild(this.labelBg);
        this.labelGroup.appendChild(this.labelText);
        this.element.appendChild(this.labelGroup);
        this.labelGroup.style.opacity = '0.8';
      } else {
        this.labelText.textContent = this.connection.label;
      }
      
      this.labelGroup.setAttribute('transform', `translate(${mid.x}, ${mid.y})`);
      
      // We need to measure text to size the rect, but in SVG this can be tricky before insertion.
      // We'll estimate width based on char count: approx 6px per char + 12px padding
      const width = this.connection.label.length * 6 + 12;
      this.labelBg.setAttribute('x', -width / 2);
      this.labelBg.setAttribute('y', -9);
      this.labelBg.setAttribute('width', width);
      this.labelBg.setAttribute('height', 18);
    } else if (this.labelGroup) {
      this.element.removeChild(this.labelGroup);
      this.labelGroup = null;
    }
  }
}
