import { tts } from '../services/tts.js';

export class SlideCanvas {
  constructor(container, page) {
    this.container = container;
    this.page = page;
  }

  render() {
    const textContent = this.page.textBlock?.rawText || 'No text added yet.';
    const imgRecord = this.page.images.length > 0 ? this.page.images[0] : null;

    this.container.innerHTML = `
      <div class="slide-canvas animate-fade-in" style="display: flex; height: 100%; background: var(--bg-base);">
        <div style="flex: 50%; padding: var(--space-24); display: flex; flex-direction: column; border-right: 1px solid var(--border-default);">
          <div style="flex-grow: 1; display: flex; align-items: center; justify-content: center; background: #000; border-radius: var(--radius-lg); overflow: hidden;">
            ${imgRecord ? `<img id="slide-img" src="" style="max-width: 100%; max-height: 100%; object-fit: contain;">` : `<div style="color: var(--text-tertiary);">No image</div>`}
          </div>
          ${imgRecord && imgRecord.caption ? `<div style="margin-top: var(--space-12); text-align: center;" class="caption-text">${imgRecord.caption}</div>` : ''}
        </div>
        <div style="flex: 50%; padding: var(--space-32); overflow-y: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-24);">
            <div class="pill">${this.page.textBlock?.source || 'Manual'}</div>
            <button class="primary icon-only" id="btn-tts-toggle" style="border-radius: 50%; width: 40px; height: 40px;"><i class="ti ti-player-play" id="tts-icon" style="font-size: 24px;"></i></button>
          </div>
          <div style="font-size: 16px; line-height: 1.8; white-space: pre-wrap;">${textContent}</div>
        </div>
      </div>
    `;

    if (imgRecord) {
      this.loadImage(imgRecord.storageKey);
    }
    this.attachEvents();
  }

  async loadImage(storageKey) {
    const { getImage } = await import('../store/images.js');
    const record = await getImage(storageKey);
    if (record && record.blob) {
      const url = URL.createObjectURL(record.blob);
      const imgEl = this.container.querySelector('#slide-img');
      if (imgEl) imgEl.src = url;
    }
  }

  attachEvents() {
    const ttsBtn = this.container.querySelector('#btn-tts-toggle');
    const ttsIcon = this.container.querySelector('#tts-icon');
    
    if (ttsBtn) {
      ttsBtn.addEventListener('click', () => {
        if (tts.isPlaying) {
          tts.stop();
          ttsIcon.className = 'ti ti-player-play';
        } else {
          tts.play(this.page.textBlock?.rawText || '', () => {
            ttsIcon.className = 'ti ti-player-play';
          });
          ttsIcon.className = 'ti ti-player-stop';
        }
      });
    }

    this.keydownHandler = (e) => {
      if (e.key === 'ArrowRight') {
        document.dispatchEvent(new CustomEvent('slide-next'));
      } else if (e.key === 'ArrowLeft') {
        document.dispatchEvent(new CustomEvent('slide-prev'));
      }
    };
    document.addEventListener('keydown', this.keydownHandler);
  }

  unmount() {
    tts.stop();
    document.removeEventListener('keydown', this.keydownHandler);
  }
}
