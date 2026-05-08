export class LatestPagePreview {
  constructor(container, page, onPlay) {
    this.container = container;
    this.page = page;
    this.onPlay = onPlay;
  }

  render() {
    if (!this.page) {
      this.container.innerHTML = '';
      return;
    }

    let rawText = this.page.textBlock?.rawText || '';
    if (rawText.length > 80) rawText = rawText.substring(0, 80) + '...';

    this.container.innerHTML = `
      <div id="yt-latest-preview" style="
        position: absolute; 
        bottom: 64px; 
        left: 16px; 
        width: 320px; 
        background: var(--preview-card-bg); 
        border: 1px solid var(--preview-card-border); 
        border-radius: var(--radius-md); 
        padding: var(--space-16); 
        box-shadow: var(--preview-card-shadow); 
        z-index: 55;
        backdrop-filter: blur(8px);
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.2s ease;
        pointer-events: none;
      ">
        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: var(--space-8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          Latest: <span style="color: var(--text-primary); font-weight: 500;">${this.page.title}</span>
        </div>
        <div style="font-size: 13px; color: var(--text-primary); line-height: 1.4; font-style: italic; margin-bottom: var(--space-12);">
          "${rawText}"
        </div>
        <button id="yt-preview-play-btn" class="primary" style="width: 100%;"><i class="ti ti-player-play-filled"></i> Play this page</button>
      </div>
    `;

    // Trigger animation
    requestAnimationFrame(() => {
      const el = this.container.querySelector('#yt-latest-preview');
      if (el) {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        el.style.pointerEvents = 'auto';
      }
    });

    const btn = this.container.querySelector('#yt-preview-play-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        if (this.onPlay) this.onPlay(this.page);
      });
    }

    const previewEl = this.container.querySelector('#yt-latest-preview');
    if (previewEl) {
      // Prevent closing when interacting with the card itself
      previewEl.addEventListener('mouseenter', () => {
        const evt = new CustomEvent('yt-preview-hover-in');
        document.dispatchEvent(evt);
      });
      previewEl.addEventListener('mouseleave', () => {
        const evt = new CustomEvent('yt-preview-hover-out');
        document.dispatchEvent(evt);
      });
    }
  }

  destroy() {
    const el = this.container.querySelector('#yt-latest-preview');
    if (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
      el.style.pointerEvents = 'none';
      setTimeout(() => {
        this.container.innerHTML = '';
      }, 200);
    } else {
      this.container.innerHTML = '';
    }
  }
}
