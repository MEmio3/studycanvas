export class AutoLayoutPopup {
  constructor(x, y, onApply, onCancel) {
    this.x = x;
    this.y = y;
    this.onApply = onApply;
    this.onCancel = onCancel;
    this.element = this._createDOM();
  }

  _createDOM() {
    const el = document.createElement('div');
    el.className = 'flow-popup';
    el.style.left = `${this.x}px`;
    el.style.top = `${this.y}px`;

    el.innerHTML = `
      <h3>Auto Layout</h3>
      <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">Algorithm:</div>
      <div class="radio-group">
        <label>
          <input type="radio" name="layout-alg" value="LR" checked>
          <span>● Left to Right (default)</span>
        </label>
        <label>
          <input type="radio" name="layout-alg" value="TB">
          <span>◌ Top to Bottom</span>
        </label>
        <label>
          <input type="radio" name="layout-alg" value="Grid">
          <span>◌ Grid (no connections)</span>
        </label>
      </div>
      
      <div style="margin-top: 16px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">
          <span>Spacing</span>
          <span id="layout-spacing-val">80px</span>
        </div>
        <input type="range" id="layout-spacing" min="40" max="200" value="80" style="width: 100%;">
      </div>
      
      <div style="margin-bottom: 16px;">
        <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
          <input type="checkbox" id="layout-animate" checked>
          Animate transition
        </label>
      </div>
      
      <div class="popup-actions">
        <button class="ghost" id="layout-cancel">Cancel</button>
        <button class="primary" id="layout-apply">Apply</button>
      </div>
    `;

    this._attachEvents(el);
    return el;
  }

  _attachEvents(el) {
    const applyBtn = el.querySelector('#layout-apply');
    const cancelBtn = el.querySelector('#layout-cancel');
    const spacingSlider = el.querySelector('#layout-spacing');
    const spacingVal = el.querySelector('#layout-spacing-val');
    
    spacingSlider.addEventListener('input', (e) => {
      spacingVal.textContent = `${e.target.value}px`;
    });

    const submit = () => {
      const alg = el.querySelector('input[name="layout-alg"]:checked').value;
      const spacing = parseInt(spacingSlider.value, 10);
      const animate = el.querySelector('#layout-animate').checked;
      
      this.onApply(alg, spacing, animate);
      this.remove();
    };

    applyBtn.addEventListener('click', submit);
    
    cancelBtn.addEventListener('click', () => {
      this.onCancel();
      this.remove();
    });

    // Global click-outside to cancel
    setTimeout(() => {
      this._clickOutsideHandler = (e) => {
        if (!el.contains(e.target)) {
          this.onCancel();
          this.remove();
        }
      };
      window.addEventListener('mousedown', this._clickOutsideHandler);
    }, 10);

    el.addEventListener('mousedown', e => e.stopPropagation());
    el.addEventListener('wheel', e => e.stopPropagation());
  }

  remove() {
    if (this._clickOutsideHandler) {
      window.removeEventListener('mousedown', this._clickOutsideHandler);
    }
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
