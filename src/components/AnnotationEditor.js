import { updatePage } from '../store/pages.js';

export class AnnotationEditor {
  constructor(page, imageRecord, annotation, annotationIndex, onSave, onCancel) {
    this.page = page;
    this.imageRecord = imageRecord;
    this.annotation = annotation;
    this.annotationIndex = annotationIndex;
    this.onSave = onSave;
    this.onCancel = onCancel;
  }

  render() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay flex-center animate-fade-in';
    this.overlay.style.position = 'fixed';
    this.overlay.style.top = '0';
    this.overlay.style.left = '0';
    this.overlay.style.width = '100vw';
    this.overlay.style.height = '100vh';
    this.overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    this.overlay.style.zIndex = '1000';

    const sentences = this.page.textBlock?.sentences || [];

    const sentenceOptions = sentences.map((s, i) => 
      `<option value="${i}" ${this.annotation.sentenceIndex === i ? 'selected' : ''}>${i + 1}: ${s.text.substring(0, 30)}...</option>`
    ).join('');

    this.overlay.innerHTML = `
      <div class="modal-content" style="background: var(--bg-surface); padding: var(--space-24); border-radius: var(--radius-lg); width: 400px; max-width: 90vw; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
        <h3 style="margin-bottom: var(--space-16);">Edit Annotation</h3>
        
        <div style="margin-bottom: var(--space-16);">
          <label style="display: block; margin-bottom: var(--space-4); font-size: 14px;">Link to Sentence</label>
          <select id="ann-sentence" style="width: 100%; padding: var(--space-8); border-radius: var(--radius-md); border: 1px solid var(--border-default); background: var(--bg-base);">
            <option value="-1">-- Unlinked --</option>
            ${sentenceOptions}
          </select>
        </div>

        <div style="margin-bottom: var(--space-24);">
          <label style="display: block; margin-bottom: var(--space-4); font-size: 14px;">Marker Color</label>
          <input type="color" id="ann-color" value="${this.annotation.color || '#3B82F6'}" style="width: 100%; height: 40px;">
        </div>

        <div class="flex-between">
          <button class="ghost" id="btn-ann-delete" style="color: var(--danger);">Delete</button>
          <div style="display: flex; gap: var(--space-8);">
            <button class="ghost" id="btn-ann-cancel">Cancel</button>
            <button class="primary" id="btn-ann-save">Save</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
    this.attachEvents();
  }

  attachEvents() {
    this.overlay.querySelector('#btn-ann-cancel').addEventListener('click', () => {
      this.close();
      if (this.onCancel) this.onCancel();
    });

    this.overlay.querySelector('#btn-ann-delete').addEventListener('click', async () => {
      if (this.annotationIndex >= 0) {
        this.imageRecord.annotations.splice(this.annotationIndex, 1);
        await updatePage(this.page);
      }
      this.close();
      if (this.onSave) this.onSave();
    });

    this.overlay.querySelector('#btn-ann-save').addEventListener('click', async () => {
      const sentenceIdx = parseInt(this.overlay.querySelector('#ann-sentence').value, 10);
      const color = this.overlay.querySelector('#ann-color').value;

      this.annotation.sentenceIndex = sentenceIdx;
      this.annotation.color = color;

      if (!this.imageRecord.annotations) this.imageRecord.annotations = [];

      if (this.annotationIndex >= 0) {
        this.imageRecord.annotations[this.annotationIndex] = this.annotation;
      } else {
        this.imageRecord.annotations.push(this.annotation);
      }

      await updatePage(this.page);
      this.close();
      if (this.onSave) this.onSave();
    });
  }

  close() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}
