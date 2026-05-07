export class FlowPort {
  /**
   * @param {string} type - 'input' or 'output'
   * @param {string} pageId - ID of the page this port belongs to
   * @param {Object} callbacks - { onPortMouseDown, onPortMouseUp, onPortHover }
   */
  constructor(type, pageId, callbacks) {
    this.type = type;
    this.pageId = pageId;
    this.callbacks = callbacks;
    this.element = this._createDOM();
  }

  _createDOM() {
    const el = document.createElement('div');
    el.className = `flow-port ${this.type}`;
    el.dataset.pageId = this.pageId;
    el.dataset.portType = this.type;
    
    // Accessibility
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', this.type === 'output' 
      ? `Output port. Drag to create connection.` 
      : `Input port.`);
    el.title = this.type === 'output' ? 'Drag to connect' : '';

    this._attachEvents(el);
    return el;
  }

  _attachEvents(el) {
    el.addEventListener('mousedown', (e) => {
      e.stopPropagation(); // Prevent node drag
      if (this.callbacks.onPortMouseDown) {
        this.callbacks.onPortMouseDown(e, this);
      }
    });

    el.addEventListener('mouseup', (e) => {
      e.stopPropagation();
      if (this.callbacks.onPortMouseUp) {
        this.callbacks.onPortMouseUp(e, this);
      }
    });

    el.addEventListener('mouseenter', (e) => {
      if (this.callbacks.onPortHover) {
        this.callbacks.onPortHover(e, this, true);
      }
    });

    el.addEventListener('mouseleave', (e) => {
      if (this.callbacks.onPortHover) {
        this.callbacks.onPortHover(e, this, false);
      }
    });
  }

  setHighlight(isHighlighted) {
    if (isHighlighted) {
      this.element.classList.add('highlight');
    } else {
      this.element.classList.remove('highlight');
    }
  }

  setInvalid(isInvalid) {
    if (isInvalid) {
      this.element.classList.add('invalid');
    } else {
      this.element.classList.remove('invalid');
    }
  }
}
