import { createPage, updatePage } from '../../store/pages.js';
import { getSubsectionsForNotebook } from '../../store/subsections.js';
import { getSectionsForNotebook } from '../../store/sections.js';
import { getDB } from '../../store/db.js';

export class CapturePanel {
  constructor(container, deckId, videoTitle, videoId, currentSeconds, onSaveComplete, onClose) {
    this.container = container;
    this.deckId = deckId;
    this.videoTitle = videoTitle;
    this.videoId = videoId;
    this.currentSeconds = currentSeconds;
    this.onSaveComplete = onSaveComplete;
    this.onClose = onClose;

    this.images = []; // Array of blobs
    this.targetSectionId = null;
    this.targetSubsectionId = null;
    this.targetLabel = 'Select Location';
  }

  async initLocation() {
    this.sections = await getSectionsForNotebook(this.deckId);
    this.subsections = await getSubsectionsForNotebook(this.deckId);
    
    const lastSubId = localStorage.getItem('studycanvas_last_subsection');
    let targetSub = null;
    if (lastSubId) targetSub = this.subsections.find(s => s.subsectionId === lastSubId);
    if (!targetSub && this.subsections.length > 0) targetSub = this.subsections[0];

    if (targetSub) {
      this.targetSubsectionId = targetSub.subsectionId;
      this.targetSectionId = targetSub.sectionId;
      const sec = this.sections.find(s => s.sectionId === targetSub.sectionId);
      this.targetLabel = (sec ? sec.title + ' / ' : '') + targetSub.title;
    }
    
    const btn = this.container.querySelector('#yt-capture-location');
    if (btn) btn.innerHTML = `<i class="ti ti-folder"></i> ${this.targetLabel}`;
  }

  formatTimestamp(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  render() {
    const timestampStr = this.formatTimestamp(this.currentSeconds);
    const defaultTitle = `${this.videoTitle} @ ${timestampStr}`;

    this.container.innerHTML = `
      <div class="yt-capture-panel-overlay" id="yt-capture-overlay">
        <div class="yt-capture-header" style="gap: 16px;">
          <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">Capture Note &bull; ${this.videoTitle} &bull; @ ${timestampStr}</span>
          <button id="yt-capture-close" class="ghost icon-only" style="flex-shrink: 0;"><i class="ti ti-x"></i></button>
        </div>
        
        <div class="yt-capture-body">
          <div class="yt-capture-text-area">
            <div class="yt-capture-editor" id="yt-capture-editor" contenteditable="true" data-placeholder="Paste your AI response here..."></div>
            <div style="display: flex; gap: 8px; align-items: center; color: var(--text-secondary); font-size: 13px;">
              <span>Source:</span>
              <select id="yt-capture-source" style="background: var(--bg-surface); border: 1px solid var(--border-default); color: var(--text-primary); border-radius: 4px; padding: 2px 4px;">
                <option value="Gemini">Gemini</option>
                <option value="ChatGPT">ChatGPT</option>
                <option value="Claude">Claude</option>
                <option value="Perplexity">Perplexity</option>
                <option value="Manual">Manual</option>
              </select>
            </div>
          </div>

          <div class="yt-capture-images">
            <div id="yt-capture-image-list" style="display: flex; flex-direction: column; gap: 8px;"></div>
            <div class="yt-capture-dropzone" id="yt-capture-dropzone">
              <i class="ti ti-photo-plus" style="font-size: 24px; margin-bottom: 8px; display: block;"></i>
              + Add Image<br><span style="opacity: 0.6;">(drop / paste / click)</span>
              <input type="file" id="yt-capture-file-input" accept="image/*" style="display:none" multiple>
            </div>
          </div>
        </div>

        <div class="yt-capture-footer">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <button id="yt-capture-location" class="ghost" style="font-size: 12px; padding: 4px 8px; color: var(--text-secondary); max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              <i class="ti ti-folder"></i> ${this.targetLabel}
            </button>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
            <input type="text" id="yt-capture-title" value="${defaultTitle}" style="width: 100%; padding: 6px 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-default); border-radius: 4px; color: var(--text-primary); font-size: 13px;">
            <input type="text" id="yt-capture-topic" placeholder="Topic..." style="width: 100%; padding: 6px 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-default); border-radius: 4px; color: var(--text-primary); font-size: 13px;">
            <label style="display: flex; align-items: center; gap: 8px; color: var(--text-secondary); font-size: 13px; cursor: pointer; margin-top: 4px;">
              <input type="checkbox" id="yt-capture-resume" checked> Resume video after save
            </label>
          </div>
          <div style="display: flex; gap: 12px; justify-content: space-between; width: 100%;">
            <button id="yt-capture-btn-discard" class="ghost" style="flex: 1;">Discard</button>
            <button id="yt-capture-btn-save" class="primary" style="flex: 2;"><i class="ti ti-device-floppy"></i> Save as Page</button>
          </div>
        </div>
      </div>
    `;

    // Trigger open animation via container width
    requestAnimationFrame(() => {
      this.container.style.width = '450px';
    });

    this.attachEvents();
    this.initLocation();
    this.container.querySelector('#yt-capture-editor').focus();
  }

  attachEvents() {
    const closeBtn = this.container.querySelector('#yt-capture-close');
    const discardBtn = this.container.querySelector('#yt-capture-btn-discard');
    const saveBtn = this.container.querySelector('#yt-capture-btn-save');
    const dropzone = this.container.querySelector('#yt-capture-dropzone');
    const fileInput = this.container.querySelector('#yt-capture-file-input');
    const editor = this.container.querySelector('#yt-capture-editor');

    const handleClose = () => {
      this.container.style.width = '0';
      setTimeout(() => {
        if (this.onClose) this.onClose();
      }, 300);
    };

    closeBtn.addEventListener('click', handleClose);
    discardBtn.addEventListener('click', handleClose);

    // Save Logic
    saveBtn.addEventListener('click', () => this.handleSave());

    // Location Picker Logic
    const locBtn = this.container.querySelector('#yt-capture-location');
    locBtn.addEventListener('click', () => {
      import('../LocationPicker.js').then(({ LocationPicker }) => {
        const picker = new LocationPicker(
          locBtn,
          this.sections,
          this.subsections,
          this.targetSubsectionId,
          (secId, subId) => {
            this.targetSectionId = secId;
            this.targetSubsectionId = subId;
            const sec = this.sections.find(s => s.sectionId === secId);
            const sub = this.subsections.find(s => s.subsectionId === subId);
            this.targetLabel = (sec ? sec.title + ' / ' : '') + (sub ? sub.title : '');
            locBtn.innerHTML = `<i class="ti ti-folder"></i> ${this.targetLabel}`;
          },
          () => {
            alert('To create a new section, please use the Left Panel.');
          }
        );
        picker.render();
      });
    });

    // Image Upload Logic
    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));
    
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--primary)';
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.style.borderColor = 'var(--border-default)';
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--border-default)';
      if (e.dataTransfer.files) this.handleFiles(e.dataTransfer.files);
    });

    // Paste handler for images and plain text
    editor.addEventListener('paste', (e) => {
      // Handle images
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      let hasImage = false;
      for (const item of items) {
        if (item.type.indexOf('image') === 0) {
          const blob = item.getAsFile();
          this.handleFiles([blob]);
          hasImage = true;
          e.preventDefault();
        }
      }
      
      // Handle text as plain text to avoid rich formatting issues
      if (!hasImage) {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
      }
    });

    // Keyboard Shortcuts
    this.keydownHandler = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        this.handleSave();
      }
    };
    document.addEventListener('keydown', this.keydownHandler);
  }

  handleFiles(files) {
    if (!files) return;
    for (const file of files) {
      if (this.images.length >= 5) break; // Max 5 images
      if (file.type.startsWith('image/')) {
        this.images.push(file);
        this.renderImageList();
      }
    }
  }

  renderImageList() {
    const listEl = this.container.querySelector('#yt-capture-image-list');
    const dropzone = this.container.querySelector('#yt-capture-dropzone');
    listEl.innerHTML = '';

    this.images.forEach((blob, index) => {
      const url = URL.createObjectURL(blob);
      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.style.width = '100%';
      wrapper.style.height = '120px';
      wrapper.style.borderRadius = '4px';
      wrapper.style.overflow = 'hidden';
      wrapper.style.border = '1px solid var(--border-default)';
      
      wrapper.innerHTML = `
        <img src="${url}" style="width: 100%; height: 100%; object-fit: cover;">
        <button class="ghost icon-only" style="position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6); padding: 4px;" data-idx="${index}">
          <i class="ti ti-x" style="font-size: 14px;"></i>
        </button>
      `;
      
      wrapper.querySelector('button').addEventListener('click', () => {
        this.images.splice(index, 1);
        this.renderImageList();
      });
      
      listEl.appendChild(wrapper);
    });

    if (this.images.length >= 5) {
      dropzone.style.display = 'none';
    } else {
      dropzone.style.display = 'block';
    }
  }

  async handleSave() {
    const title = this.container.querySelector('#yt-capture-title').value.trim() || 'Untitled Capture';
    const topic = this.container.querySelector('#yt-capture-topic').value.trim();
    const source = this.container.querySelector('#yt-capture-source').value;
    const resumeVideo = this.container.querySelector('#yt-capture-resume').checked;
    const editor = this.container.querySelector('#yt-capture-editor');
    
    // Extract raw text, converting block elements to newlines
    let rawText = editor.innerText || '';

    if (this.images.length === 0 && !rawText.trim()) {
      alert("Add at least an image or some text before saving.");
      return;
    }

    const saveBtn = this.container.querySelector('#yt-capture-btn-save');
    saveBtn.disabled = true;
    saveBtn.innerHTML = 'Saving...';

    try {
      // 1. Use the selected target subsection
      if (!this.targetSectionId || !this.targetSubsectionId) {
        alert('Please select a valid section and subsection.');
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="ti ti-device-floppy"></i> Save as Page';
        return;
      }

      const page = await createPage(this.deckId, this.targetSectionId, this.targetSubsectionId, title);
      page.captureSource = 'youtube_capture';
      page.videoTimestamp = {
        videoId: this.videoId,
        seconds: this.currentSeconds,
        formatted: this.formatTimestamp(this.currentSeconds),
        videoTitle: this.videoTitle
      };
      
      page.textBlock.rawText = rawText;
      page.textBlock.source = source;

      // 2. Save Images
      const db = await getDB();
      for (const blob of this.images) {
        const imgObj = {
          storageKey: crypto.randomUUID(),
          blob: blob,
          type: blob.type,
          name: blob.name || 'capture.png'
        };
        await db.put('images', imgObj);
        
        page.images.push({
          storageKey: imgObj.storageKey,
          name: imgObj.name
        });
      }

      // 3. Update Page
      await updatePage(page);

      // Clean up
      document.removeEventListener('keydown', this.keydownHandler);
      
      const overlay = this.container.querySelector('#yt-capture-overlay');
      overlay.classList.remove('open');
      
      setTimeout(() => {
        if (this.onSaveComplete) this.onSaveComplete(page, resumeVideo);
      }, 300);

    } catch (e) {
      console.error(e);
      alert("Failed to save capture.");
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="ti ti-device-floppy"></i> Save as Page';
    }
  }
}
