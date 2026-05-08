export class TtsMicButton {
  constructor(container, onClick, onHoverStart, onHoverEnd) {
    this.container = container;
    this.onClick = onClick;
    this.onHoverStart = onHoverStart;
    this.onHoverEnd = onHoverEnd;
    this.isActive = false;
  }

  setActive(isActive) {
    this.isActive = isActive;
    const icon = this.container.querySelector('i');
    const wrap = this.container.querySelector('.yt-overlay-icon');
    if (icon && wrap) {
      if (isActive) {
        icon.className = 'ti ti-microphone';
        wrap.style.borderColor = 'var(--watch-complete-color)';
        wrap.style.color = 'var(--watch-complete-color)';
        wrap.style.boxShadow = '0 0 12px rgba(29,158,117,0.4)';
      } else {
        icon.className = 'ti ti-microphone';
        wrap.style.borderColor = '';
        wrap.style.color = '';
        wrap.style.boxShadow = '';
      }
    }
  }

  render() {
    this.container.innerHTML = `
      <div id="yt-tts-mic-icon" class="yt-overlay-icon" title="Select a page to read aloud (T)" style="bottom: 16px; left: 16px; top: auto;">
        <i class="ti ti-microphone"></i>
      </div>
    `;

    const iconEl = this.container.querySelector('#yt-tts-mic-icon');
    if (iconEl) {
      iconEl.addEventListener('click', () => {
        if (this.onClick) this.onClick();
      });
      iconEl.addEventListener('mouseenter', () => {
        if (this.onHoverStart) this.onHoverStart();
      });
      iconEl.addEventListener('mouseleave', () => {
        if (this.onHoverEnd) this.onHoverEnd();
      });
    }
  }
}
