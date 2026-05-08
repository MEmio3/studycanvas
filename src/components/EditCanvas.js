import { ImageZone } from './ImageZone.js';
import { TextZone } from './TextZone.js';

export class EditCanvas {
  constructor(container, page) {
    this.container = container;
    this.page = page;
  }

  render() {
    this.container.innerHTML = `
      <div class="edit-canvas" style="display: flex; height: 100%;">
        <div id="image-zone-container" style="flex: 55%; border-right: 1px solid var(--border-default); display: flex; flex-direction: column;"></div>
        <div style="flex: 45%; display: flex; flex-direction: column; background: var(--bg-surface);">
          ${this.page.videoTimestamp ? `
            <div style="padding: 8px 16px; background: rgba(29, 158, 117, 0.1); border-bottom: 1px solid var(--border-default); display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
              <span style="color: var(--text-secondary);"><i class="ti ti-video" style="margin-right: 4px;"></i> Captured from: <span style="color: var(--text-primary);">${this.page.videoTimestamp.videoTitle}</span> &middot; at ${this.page.videoTimestamp.formatted}</span>
              <button class="ghost" style="padding: 2px 8px; font-size: 11px; color: var(--watch-complete-color);" onclick="document.dispatchEvent(new CustomEvent('app-watch-jump', { detail: { videoId: '${this.page.videoTimestamp.videoId}', time: ${this.page.videoTimestamp.seconds} } }))">
                <i class="ti ti-player-play-filled"></i> Open in Watch mode
              </button>
            </div>
          ` : ''}
          <div id="text-zone-container" style="flex-grow: 1; display: flex; flex-direction: column; overflow: hidden;"></div>
        </div>
      </div>
    `;

    this.imageZone = new ImageZone(
      this.container.querySelector('#image-zone-container'), 
      this.page
    );
    this.imageZone.render();

    this.textZone = new TextZone(
      this.container.querySelector('#text-zone-container'), 
      this.page
    );
    this.textZone.render();
  }
}
