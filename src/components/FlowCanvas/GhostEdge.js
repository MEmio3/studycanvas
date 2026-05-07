import { calculateBezierPath } from '../../services/edgePath.js';

export class GhostEdge {
  constructor(sourceNode) {
    this.sourceNode = sourceNode;
    this.targetX = 0;
    this.targetY = 0;
    
    this.element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.element.setAttribute('fill', 'none');
    this.element.setAttribute('stroke', 'var(--edge-ghost)');
    this.element.setAttribute('stroke-width', '2');
    this.element.setAttribute('stroke-dasharray', '5 5');
    this.element.style.pointerEvents = 'none'; // Don't interfere with mouse events
    
    this.updateTarget(sourceNode.x + sourceNode.width + 6, sourceNode.y + sourceNode.height / 2);
  }

  updateTarget(x, y) {
    this.targetX = x;
    this.targetY = y;
    
    const sourceX = this.sourceNode.x + this.sourceNode.width + 6;
    const sourceY = this.sourceNode.y + (this.sourceNode.height / 2);
    
    const d = calculateBezierPath(sourceX, sourceY, x, y);
    this.element.setAttribute('d', d);
  }

  setValid(isValid) {
    if (isValid) {
      this.element.setAttribute('stroke', 'var(--edge-ghost)');
    } else {
      this.element.setAttribute('stroke', 'var(--port-invalid)');
    }
  }

  remove() {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
