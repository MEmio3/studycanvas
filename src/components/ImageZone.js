import { saveImage } from '../store/images.js';
import { updatePage } from '../store/pages.js';
import { AnnotationLayer } from './AnnotationLayer.js';
import { AnnotationEditor } from './AnnotationEditor.js';

export class ImageZone {
  constructor(container, page) {
    this.container = container;
    this.page = page;
    this.activeImageIndex = 0;
  }

  render() {
    if (this.page.images.length === 0) {
      this.container.innerHTML = `
        <div class="flex-center" style="height: 100%; padding: var(--space-32);">
          <div id="drop-zone" style="border: 2px dashed var(--border-default); border-radius: var(--radius-lg); width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-secondary); cursor: pointer; transition: border-color var(--transition-fast);">
            <i class="ti ti-photo-plus" style="font-size: 48px; margin-bottom: var(--space-16); color: var(--text-tertiary);"></i>
            <p>Drop screenshots here or click to upload</p>
            <p style="font-size: 12px; margin-top: var(--space-8);">(Ctrl+V to paste)</p>
            <input type="file" id="file-input" accept="image/*" style="display: none;" multiple>
          </div>
        </div>
      `;
      this.attachDropEvents();
    } else {
      const img = this.page.images[this.activeImageIndex];
      const thumbsHtml = this.page.images.length > 1 ? `
        <div style="display: flex; gap: var(--space-8); padding: var(--space-8); overflow-x: auto; border-top: 1px solid var(--border-default); background: var(--bg-surface);">
          ${this.page.images.map((im, i) => `
            <div class="thumbnail-btn" data-index="${i}" style="width: 48px; height: 36px; background: #000; border-radius: var(--radius-sm); border: 2px solid ${i === this.activeImageIndex ? 'var(--accent-primary)' : 'transparent'}; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <i class="ti ti-photo" style="color: white; font-size: 16px;"></i>
            </div>
          `).join('')}
        </div>
      ` : '';

      this.container.innerHTML = `
        <div style="flex-grow: 1; display: flex; flex-direction: column; position: relative;">
          <div style="padding: var(--space-8); border-bottom: 1px solid var(--border-default); display: flex; justify-content: space-between; align-items: center;">
            <span class="meta-text">${this.activeImageIndex + 1} / ${this.page.images.length} images</span>
            <div>
              <button class="ghost icon-only" id="btn-add-img" title="Add Image"><i class="ti ti-plus"></i></button>
              <button class="ghost icon-only" id="btn-delete-img" title="Delete Image" style="color: var(--danger);"><i class="ti ti-trash"></i></button>
            </div>
            <input type="file" id="add-img-input" accept="image/*" style="display: none;" multiple>
          </div>
          <div style="flex-grow: 1; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #000; position: relative;" id="img-display-area">
             <div id="img-wrapper" style="position: relative; display: inline-block; max-width: 100%; max-height: 100%;">
               <img id="active-image" src="" style="display: block; max-width: 100%; max-height: 100%; object-fit: contain;">
               <div id="annotation-layer-container"></div>
             </div>
          </div>
          ${thumbsHtml}
          <div style="padding: var(--space-12); border-top: 1px solid var(--border-default); background: var(--bg-surface);">
            <input type="text" placeholder="Add image caption..." value="${img.caption || ''}" id="img-caption">
          </div>
        </div>
      `;
      this.loadImage(img.storageKey);
      this.attachCaptionEvents(img);

      const addBtn = this.container.querySelector('#btn-add-img');
      const addInput = this.container.querySelector('#add-img-input');
      addBtn.addEventListener('click', () => addInput.click());
      addInput.addEventListener('change', (e) => this.handleFiles(Array.from(e.target.files)));
      
      const delBtn = this.container.querySelector('#btn-delete-img');
      delBtn.addEventListener('click', async () => {
        if (confirm('Delete this image?')) {
          this.page.images.splice(this.activeImageIndex, 1);
          this.activeImageIndex = Math.max(0, this.activeImageIndex - 1);
          await updatePage(this.page);
          this.render();
        }
      });

      this.container.querySelectorAll('.thumbnail-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.activeImageIndex = parseInt(e.currentTarget.getAttribute('data-index'), 10);
          this.render();
        });
      });
    }
  }

  async loadImage(storageKey) {
    const { getImage } = await import('../store/images.js');
    const imageRecord = await getImage(storageKey);
    if (imageRecord && imageRecord.blob) {
      const url = URL.createObjectURL(imageRecord.blob);
      const imgEl = this.container.querySelector('#active-image');
      if (imgEl) {
        imgEl.onload = () => {
          this.annotationLayer = new AnnotationLayer(
            this.container.querySelector('#annotation-layer-container'),
            this.page.images[this.activeImageIndex],
            this.page,
            true, // isEditable
            (ann, idx) => {
              const editor = new AnnotationEditor(this.page, this.page.images[0], ann, idx, () => this.render(), null);
              editor.render();
            }
          );
          this.annotationLayer.render();
        };
        imgEl.src = url;
      }
    }
  }

  attachDropEvents() {
    const dropZone = this.container.querySelector('#drop-zone');
    const fileInput = this.container.querySelector('#file-input');

    if (!dropZone) return;

    dropZone.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
      this.handleFiles(Array.from(e.target.files));
    });

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = 'var(--accent-primary)';
      dropZone.style.backgroundColor = 'var(--bg-hover)';
    });

    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = 'var(--border-default)';
      dropZone.style.backgroundColor = 'transparent';
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = 'var(--border-default)';
      dropZone.style.backgroundColor = 'transparent';
      if (e.dataTransfer.files) {
        this.handleFiles(Array.from(e.dataTransfer.files));
      }
    });

    this.pasteHandler = this.handlePaste.bind(this);
    document.addEventListener('paste', this.pasteHandler);
  }

  handlePaste(e) {
    if (!this.container.isConnected) {
      document.removeEventListener('paste', this.pasteHandler);
      return;
    }
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    const files = [];
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        files.push(item.getAsFile());
      }
    }
    if (files.length > 0) {
      this.handleFiles(files);
    }
  }

  async handleFiles(files) {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    for (const file of imageFiles) {
      const storageKey = await saveImage(file, file.type, 0, 0);
      const { generateId } = await import('../utils/uuid.js');
      this.page.images.push({
        imageId: generateId(),
        storageKey,
        filename: file.name,
        mimeType: file.type,
        width: 0,
        height: 0,
        caption: "",
        annotations: []
      });
    }

    await updatePage(this.page);
    this.render();
  }

  attachCaptionEvents(img) {
    const captionInput = this.container.querySelector('#img-caption');
    if (captionInput) {
      captionInput.addEventListener('blur', async () => {
        img.caption = captionInput.value;
        await updatePage(this.page);
      });
    }
  }
}
