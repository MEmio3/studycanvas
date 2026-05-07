export class FlowToolbar {
  constructor(container, canvasInstance) {
    this.container = container;
    this.canvasInstance = canvasInstance;
    
    this.element = this._createDOM();
    this.container.appendChild(this.element);
  }

  _createDOM() {
    const el = document.createElement('div');
    el.className = 'flow-toolbar';
    
    el.innerHTML = `
      <button id="ft-add" title="Add new page"><i class="ti ti-plus"></i></button>
      <button id="ft-import" title="Import images"><i class="ti ti-layout-grid-add"></i></button>
      <div class="divider"></div>
      <button id="ft-select" class="active" title="Select tool (V)"><i class="ti ti-pointer"></i></button>
      <button id="ft-connect" title="Connect tool (C)"><i class="ti ti-plug"></i></button>
      <div class="divider"></div>
      <button id="ft-layout" title="Auto Layout (Alt+L)"><i class="ti ti-layout-grid"></i></button>
      <button id="ft-fit" title="Fit to Screen (Ctrl+Shift+F)"><i class="ti ti-arrows-maximize"></i></button>
      <div class="divider"></div>
      <button id="ft-delete" title="Delete selected (Del)" disabled><i class="ti ti-trash"></i></button>
    `;

    this._attachEvents(el);
    return el;
  }

  _attachEvents(el) {
    el.querySelector('#ft-add').addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('create-page'));
    });
    
    el.querySelector('#ft-import').addEventListener('click', () => {
      document.querySelector('#file-import-input')?.click();
    });

    const selectBtn = el.querySelector('#ft-select');
    const connectBtn = el.querySelector('#ft-connect');
    
    selectBtn.addEventListener('click', () => {
      selectBtn.classList.add('active');
      connectBtn.classList.remove('active');
      // In a more complex implementation, we'd swap out the canvas interaction mode
    });
    
    connectBtn.addEventListener('click', () => {
      connectBtn.classList.add('active');
      selectBtn.classList.remove('active');
    });

    el.querySelector('#ft-layout').addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('flow-auto-layout'));
    });
    
    el.querySelector('#ft-fit').addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('flow-fit-screen'));
    });
    
    el.querySelector('#ft-delete').addEventListener('click', () => {
      this.canvasInstance._deleteSelectedEdges();
      // Handle node deletion if nodes are selected (can reuse main app logic or dispatch event)
    });

    // We can listen to selection changes to enable/disable delete btn
    // For now, it stays disabled unless something is explicitly wired
  }
}
