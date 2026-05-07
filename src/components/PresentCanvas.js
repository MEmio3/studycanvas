import { SubtitleBar } from './SubtitleBar.js';
import { PresentControls } from './PresentControls.js';
import { tts } from '../services/tts.js';

export class PresentCanvas {
  constructor(container, page) {
    this.container = container;
    this.page = page;
  }

  async render() {
    const imgRecord = this.page.images.length > 0 ? this.page.images[0] : null;

    this.container.innerHTML = `
      <div class="present-canvas animate-fade-in" style="display: flex; flex-direction: column; height: 100%; background: #111; position: relative;">
        
        <div id="present-progress" style="height: 3px; background: var(--accent-primary); width: 0%; transition: width 0.3s; position: absolute; top: 0; left: 0; z-index: 10;"></div>

        <div style="flex-grow: 1; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; padding-bottom: 20%;">
          ${imgRecord ? `<img id="present-img" src="" style="max-width: 90%; max-height: 90%; object-fit: contain;">` : `<div style="color: #666;">No image</div>`}
        </div>

        <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 20%; min-height: 120px; display: flex; flex-direction: column;">
          <div id="subtitle-container" style="flex-grow: 1;"></div>
          <div id="controls-container"></div>
        </div>

      </div>
    `;

    if (imgRecord) {
      await this.loadImage(imgRecord.storageKey);
    }

    this.subtitleBar = new SubtitleBar(this.container.querySelector('#subtitle-container'));
    if (this.page.textBlock && this.page.textBlock.sentences && this.page.textBlock.sentences.length > 0) {
      this.subtitleBar.setSentences(this.page.textBlock.sentences);
    } else {
      const text = this.page.textBlock?.rawText;
      if (text) {
         this.subtitleBar.setSentences([{index: 0, text}]);
      }
    }

    this.controls = new PresentControls(
      this.container.querySelector('#controls-container'),
      () => this.togglePlay(),
      () => this.stopPlay(),
      () => document.dispatchEvent(new CustomEvent('slide-prev')),
      () => document.dispatchEvent(new CustomEvent('slide-next')),
      () => this.exitPresentation()
    );
    this.controls.render();

    this.attachEvents();
    
    // Auto-start presentation
    setTimeout(() => {
      this.startPlay();
    }, 500);
  }

  async loadImage(storageKey) {
    const { getImage } = await import('../store/images.js');
    const record = await getImage(storageKey);
    if (record && record.blob) {
      const url = URL.createObjectURL(record.blob);
      const imgEl = this.container.querySelector('#present-img');
      if (imgEl) imgEl.src = url;
    }
  }

  startPlay() {
    const text = this.page.textBlock?.rawText || '';
    tts.play(text, () => {
      this.controls.setPlayingState(false);
      document.dispatchEvent(new CustomEvent('presentation-page-end'));
    });
    this.controls.setPlayingState(true);
    if (this.page.textBlock?.sentences?.length > 0 || this.page.textBlock?.rawText) {
      this.subtitleBar.updateProgress(0, -1);
    }
  }

  togglePlay() {
    if (tts.isPlaying) {
      tts.pause();
      this.controls.setPlayingState(false);
    } else {
      if (tts.synth.paused) {
        tts.resume();
      } else {
        this.startPlay();
      }
      this.controls.setPlayingState(true);
    }
  }

  stopPlay() {
    tts.stop();
    this.controls.setPlayingState(false);
    this.subtitleBar.updateProgress(-1, -1);
  }

  exitPresentation() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.log(err));
    }
    document.dispatchEvent(new CustomEvent('exit-presentation'));
  }

  attachEvents() {
    this.keydownHandler = (e) => {
      if (e.key === 'ArrowRight') {
        document.dispatchEvent(new CustomEvent('slide-next'));
      } else if (e.key === 'ArrowLeft') {
        document.dispatchEvent(new CustomEvent('slide-prev'));
      } else if (e.key === 'Escape') {
        this.exitPresentation();
      } else if (e.key === ' ') {
        this.togglePlay();
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', this.keydownHandler);
  }

  unmount() {
    tts.stop();
    document.removeEventListener('keydown', this.keydownHandler);
  }
}
