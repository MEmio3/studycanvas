export class EdgeEditor {
  constructor(connection, sourceTitle, targetTitle, x, y, onSave, onDelete, onCancel) {
    this.connection = connection;
    this.sourceTitle = sourceTitle;
    this.targetTitle = targetTitle;
    this.x = x;
    this.y = y;
    this.onSave = onSave;
    this.onDelete = onDelete;
    this.onCancel = onCancel;
    
    this.element = this._createDOM();
  }

  _createDOM() {
    const el = document.createElement('div');
    el.className = 'flow-popup';
    el.style.left = `${this.x}px`;
    el.style.top = `${this.y}px`;

    el.innerHTML = `
      <h3>Edit Connection</h3>
      <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">
        From: <span style="color: var(--text-primary);">${this.sourceTitle}</span>
      </div>
      <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">
        To: <span style="color: var(--text-primary);">${this.targetTitle}</span>
      </div>
      
      <div style="margin-bottom: 8px;">
        <select id="conn-edit-type" style="width: 100%; padding: 6px; background: var(--bg-base); border: 1px solid var(--border-default); color: var(--text-primary); border-radius: 4px;">
          <option value="sequence" ${this.connection.type === 'sequence' ? 'selected' : ''}>Sequence</option>
          <option value="reference" ${this.connection.type === 'reference' ? 'selected' : ''}>Reference</option>
          <option value="branch" ${this.connection.type === 'branch' ? 'selected' : ''}>Branch</option>
        </select>
      </div>
      
      <input type="text" id="conn-edit-label" value="${this.connection.label || ''}" placeholder="Label (optional)" autocomplete="off">
      
      <div class="popup-actions" style="justify-content: space-between;">
        <button class="ghost" id="conn-delete" style="color: #E05252;"><i class="ti ti-trash"></i> Delete</button>
        <div style="display: flex; gap: 8px;">
          <button class="ghost" id="conn-cancel">Cancel</button>
          <button class="primary" id="conn-save">Save</button>
        </div>
      </div>
    `;

    this._attachEvents(el);
    return el;
  }

  _attachEvents(el) {
    const typeSelect = el.querySelector('#conn-edit-type');
    const labelInput = el.querySelector('#conn-edit-label');
    const saveBtn = el.querySelector('#conn-save');
    const cancelBtn = el.querySelector('#conn-cancel');
    const deleteBtn = el.querySelector('#conn-delete');

    const submit = () => {
      const type = typeSelect.value;
      const label = labelInput.value.trim();
      this.onSave(this.connection.connectionId, type, label);
      this.remove();
    };

    saveBtn.addEventListener('click', submit);
    
    cancelBtn.addEventListener('click', () => {
      this.onCancel();
      this.remove();
    });
    
    deleteBtn.addEventListener('click', () => {
      this.onDelete(this.connection.connectionId);
      this.remove();
    });

    labelInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
      if (e.key === 'Escape') {
        this.onCancel();
        this.remove();
      }
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
