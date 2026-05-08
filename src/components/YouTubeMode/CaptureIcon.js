export class CaptureIcon {
  constructor(container, onClick) {
    this.container = container;
    this.onClick = onClick;
  }

  render() {
    this.container.innerHTML = `
      <div id="yt-capture-icon" class="yt-overlay-icon" title="Capture a note for this video (C)">
        <i class="ti ti-clipboard-plus"></i>
      </div>
    `;

    const iconEl = this.container.querySelector('#yt-capture-icon');
    if (iconEl) {
      iconEl.addEventListener('click', () => {
        if (this.onClick) this.onClick();
      });
    }
  }
}
