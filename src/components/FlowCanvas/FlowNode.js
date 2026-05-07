import { FlowPort } from './FlowPort.js';

export class FlowNode {
  constructor(page, initialPos, callbacks) {
    this.page = page;
    this.x = initialPos.x;
    this.y = initialPos.y;
    this.width = initialPos.width || 220;
    this.height = initialPos.height || 130;
    this.callbacks = callbacks;
    
    this.selected = false;
    this.active = false;
    
    this.element = this._createDOM();
    this.updatePosition(this.x, this.y);
  }

  _createDOM() {
    const el = document.createElement('div');
    el.className = 'flow-node';
    if (!this.page.text && !this.page.blocks?.length) {
       el.classList.add('no-content');
    }
    el.dataset.pageId = this.page.pageId;

    // Order badge
    const orderBadge = document.createElement('div');
    orderBadge.className = 'node-order';
    orderBadge.textContent = this.page.order + 1;
    el.appendChild(orderBadge);

    // Flag badge
    if (this.page.isFlagged) {
      const flag = document.createElement('div');
      flag.className = 'node-flag';
      flag.innerHTML = '<i class="ti ti-flag-filled"></i>';
      el.appendChild(flag);
    }

    // Thumbnail
    const thumb = document.createElement('div');
    thumb.className = 'node-thumbnail';
    const firstImage = this.page.images?.[0];
    if (firstImage) {
      const img = document.createElement('img');
      img.src = firstImage;
      thumb.appendChild(img);
    } else {
      thumb.innerHTML = '<i class="ti ti-photo" style="color: var(--text-tertiary);"></i>';
    }
    el.appendChild(thumb);

    // Body container
    const body = document.createElement('div');
    body.className = 'node-body';

    // Title
    const title = document.createElement('div');
    title.className = 'node-title';
    title.textContent = this.page.title || 'Untitled Page';
    body.appendChild(title);

    // Topic Pill
    if (this.page.topic) {
      const topic = document.createElement('div');
      topic.className = 'node-topic';
      topic.textContent = this.page.topic;
      body.appendChild(topic);
    }

    // Meta Row
    const meta = document.createElement('div');
    meta.className = 'node-meta';
    
    const sentenceCount = this.page.text ? this.page.text.split(/[.!?]+/).filter(Boolean).length : 0;
    const imageCount = this.page.images ? this.page.images.length : 0;
    
    meta.innerHTML = `
      <span title="${sentenceCount} sentences"><i class="ti ti-message-circle-2"></i> ${sentenceCount}</span>
      <span title="${imageCount} images"><i class="ti ti-camera"></i> ${imageCount}</span>
    `;
    body.appendChild(meta);

    el.appendChild(body);

    // Ports
    this.inputPort = new FlowPort('input', this.page.pageId, this.callbacks);
    this.outputPort = new FlowPort('output', this.page.pageId, this.callbacks);
    el.appendChild(this.inputPort.element);
    el.appendChild(this.outputPort.element);

    this._attachEvents(el);
    return el;
  }

  _attachEvents(el) {
    el.addEventListener('mousedown', (e) => {
      // Don't trigger node drag if clicking a port
      if (e.target.closest('.flow-port')) return;
      this.callbacks.onNodeMouseDown(e, this);
    });

    el.addEventListener('dblclick', (e) => {
      this.callbacks.onNodeDoubleClick(e, this);
    });

    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.callbacks.onNodeContextMenu(e, this);
    });
  }

  updatePosition(x, y) {
    this.x = x;
    this.y = y;
    this.element.style.transform = `translate(${x}px, ${y}px)`;
  }

  setSelected(isSelected) {
    this.selected = isSelected;
    if (isSelected) {
      this.element.classList.add('selected');
    } else {
      this.element.classList.remove('selected');
    }
  }

  setActive(isActive) {
    this.active = isActive;
    if (isActive) {
      this.element.classList.add('active-page');
    } else {
      this.element.classList.remove('active-page');
    }
  }

  setDragging(isDragging) {
    if (isDragging) {
      this.element.classList.add('dragging');
    } else {
      this.element.classList.remove('dragging');
    }
  }
}
