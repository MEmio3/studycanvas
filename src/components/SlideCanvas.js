import { tts } from '../services/tts.js';

export class SlideCanvas {
  constructor(container, page) {
    this.container = container;
    this.page = page;
    this.activeImageIndex = 0;
  }

  render() {
    const sentences = this.page.textBlock?.sentences || [];
    let textHtml = '';
    if (sentences.length > 0) {
      textHtml = sentences.map((s, i) => `<span id="sentence-${i}" style="transition: background-color 0.3s;">${s.text}</span>`).join(' ');
    } else {
      textHtml = this.page.textBlock?.rawText || 'No text added yet.';
    }
    const imgRecord = this.page.images.length > 0 ? this.page.images[this.activeImageIndex] : null;

    this.container.innerHTML = `
      <div class="slide-canvas animate-fade-in" style="display: flex; height: 100%; background: var(--bg-base);">
        <div style="flex: 50%; padding: var(--space-24); display: flex; flex-direction: column; border-right: 1px solid var(--border-default);">
          <div style="flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #000; border-radius: var(--radius-lg); overflow: hidden; position: relative;">
            ${imgRecord ? `
              <div id="img-wrapper" style="position: relative; display: inline-block; max-width: 100%; max-height: 100%;">
                <img id="slide-img" src="" style="display: block; max-width: 100%; max-height: 100%; object-fit: contain;">
                <div id="annotation-layer-container"></div>
              </div>
            ` : `<div style="color: var(--text-tertiary);">No image</div>`}
            ${this.page.images.length > 1 ? `
              <div style="position: absolute; bottom: 16px; display: flex; gap: var(--space-8); justify-content: center; width: 100%;">
                ${this.page.images.map((_, i) => `<div style="width: 8px; height: 8px; border-radius: 50%; background: ${i === this.activeImageIndex ? 'var(--text-primary)' : 'rgba(255,255,255,0.3)'};"></div>`).join('')}
              </div>
            ` : ''}
          </div>
          ${imgRecord && imgRecord.caption ? `<div style="margin-top: var(--space-12); text-align: center;" class="caption-text">${imgRecord.caption}</div>` : ''}
        </div>
        <div style="flex: 50%; padding: var(--space-32); overflow-y: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-24);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="pill">${this.page.textBlock?.source || 'Manual'}</div>
              ${this.page.videoTimestamp ? `
                <div class="pill" style="cursor: pointer; background: rgba(29, 158, 117, 0.1); color: var(--watch-complete-color); border: 1px solid var(--watch-complete-color);" onclick="document.dispatchEvent(new CustomEvent('app-watch-jump', { detail: { videoId: '${this.page.videoTimestamp.videoId}', time: ${this.page.videoTimestamp.seconds} } }))">
                  <i class="ti ti-brand-youtube"></i> ${this.page.videoTimestamp.formatted}
                </div>
              ` : ''}
            </div>
            <button class="primary icon-only" id="btn-tts-toggle" style="border-radius: 50%; width: 40px; height: 40px;"><i class="ti ti-player-play" id="tts-icon" style="font-size: 24px;"></i></button>
          </div>
          <div style="font-size: 16px; line-height: 1.8; white-space: pre-wrap;" id="slide-text-content">${textHtml}</div>
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
    const { AnnotationLayer } = await import('./AnnotationLayer.js');
    const record = await getImage(storageKey);
    if (record && record.blob) {
      const url = URL.createObjectURL(record.blob);
      const imgEl = this.container.querySelector('#slide-img');
      if (imgEl) {
        imgEl.onload = () => {
          this.annotationLayer = new AnnotationLayer(
            this.container.querySelector('#annotation-layer-container'),
            this.page.images[this.activeImageIndex],
            this.page,
            true, // clickable to scroll
            (ann) => {
              if (ann.sentenceIndex >= 0) {
                document.dispatchEvent(new CustomEvent('scroll-to-sentence', { detail: { sentenceIndex: ann.sentenceIndex } }));
              }
            }
          );
          this.annotationLayer.render();
        };
        imgEl.src = url;
      }
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
      } else if (e.key === 'ArrowUp') {
        if (this.activeImageIndex > 0) {
          this.activeImageIndex--;
          this.render();
        }
      } else if (e.key === 'ArrowDown') {
        if (this.activeImageIndex < this.page.images.length - 1) {
          this.activeImageIndex++;
          this.render();
        }
      }
    };
    document.addEventListener('keydown', this.keydownHandler);

    this.scrollToSentenceHandler = (e) => {
      const span = this.container.querySelector(`#sentence-${e.detail.sentenceIndex}`);
      if (span) {
        span.scrollIntoView({ behavior: 'smooth', block: 'center' });
        span.style.backgroundColor = 'var(--bg-hover)';
        setTimeout(() => span.style.backgroundColor = 'transparent', 2000);
      }
    };
    document.addEventListener('scroll-to-sentence', this.scrollToSentenceHandler);
  }

  unmount() {
    tts.stop();
    document.removeEventListener('keydown', this.keydownHandler);
    document.removeEventListener('scroll-to-sentence', this.scrollToSentenceHandler);
  }
}
