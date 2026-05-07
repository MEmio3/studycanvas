export class ConnectionTypePopup {
  constructor(x, y, onConfirm, onCancel) {
    this.x = x;
    this.y = y;
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
    this.element = this._createDOM();
  }

  _createDOM() {
    const el = document.createElement('div');
    el.className = 'flow-popup';
    el.style.left = `${this.x}px`;
    el.style.top = `${this.y}px`;

    el.innerHTML = `
      <h3>Connection type:</h3>
      <div class="radio-group">
        <label>
          <input type="radio" name="conn-type" value="sequence" checked>
          <span style="color: var(--edge-sequence);">● Sequence</span>
        </label>
        <label>
          <input type="radio" name="conn-type" value="reference">
          <span style="color: var(--edge-reference);">◌ Reference</span>
        </label>
        <label>
          <input type="radio" name="conn-type" value="branch">
          <span style="color: var(--edge-branch);">● Branch</span>
        </label>
      </div>
      <input type="text" id="conn-label" placeholder="Label (optional)" autocomplete="off">
      <div class="popup-actions">
        <button class="ghost" id="conn-cancel">Cancel</button>
        <button class="primary" id="conn-confirm">Confirm</button>
      </div>
    `;

    this._attachEvents(el);
    return el;
  }

  _attachEvents(el) {
    const input = el.querySelector('#conn-label');
    const confirmBtn = el.querySelector('#conn-confirm');
    const cancelBtn = el.querySelector('#conn-cancel');

    const submit = () => {
      const type = el.querySelector('input[name="conn-type"]:checked').value;
      const label = input.value.trim();
      this.onConfirm(type, label);
      this.remove();
    };

    confirmBtn.addEventListener('click', submit);
    
    cancelBtn.addEventListener('click', () => {
      this.onCancel();
      this.remove();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
      if (e.key === 'Escape') {
        this.onCancel();
        this.remove();
      }
    });
    
    // Prevent canvas pan/zoom when interacting with popup
    el.addEventListener('mousedown', e => e.stopPropagation());
    el.addEventListener('wheel', e => e.stopPropagation());

    // Focus input on next tick
    setTimeout(() => input.focus(), 10);
  }

  remove() {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
