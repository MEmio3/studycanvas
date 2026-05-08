export class VideoInfoBar {
  constructor(container, onMarkComplete) {
    this.container = container;
    this.onMarkComplete = onMarkComplete;
    this.video = null;
    this.isComplete = false;
    this.currentTime = 0;
    this.position = 0;
    this.total = 0;
  }

  updateState(video, isComplete, currentTime, position, total) {
    this.video = video;
    this.isComplete = isComplete;
    this.currentTime = currentTime;
    this.position = position;
    this.total = total;
    this.render();
  }

  updateTime(currentTime) {
    this.currentTime = currentTime;
    const timeEl = this.container.querySelector('#yt-info-current-time');
    if (timeEl) {
      timeEl.textContent = this.formatDuration(Math.floor(this.currentTime));
    }
  }

  updateCompleteState(isComplete) {
    this.isComplete = isComplete;
    const btn = this.container.querySelector('#yt-btn-mark-complete');
    if (btn) {
      if (this.isComplete) {
        btn.innerHTML = '<i class="ti ti-arrow-back-up"></i> Mark Incomplete';
        btn.classList.add('ghost');
        btn.classList.remove('primary');
      } else {
        btn.innerHTML = '<i class="ti ti-check"></i> Mark Complete';
        btn.classList.add('primary');
        btn.classList.remove('ghost');
      }
    }
  }

  render() {
    if (!this.video) {
      this.container.innerHTML = '<div class="yt-info-bar"></div>';
      return;
    }

    this.container.innerHTML = `
      <div class="yt-info-bar">
        <div class="yt-info-left">
          <span class="yt-info-title">${this.video.title}</span>
        </div>
        <div class="yt-info-right">
          <span class="yt-info-channel">${this.position} / ${this.total}</span>
          <span class="yt-info-time" id="yt-info-current-time">${this.formatDuration(Math.floor(this.currentTime))}</span>
          <button id="yt-btn-mark-complete" class="${this.isComplete ? 'ghost' : 'primary'}" style="padding: 4px 8px; font-size: 12px; min-width: 120px;">
            ${this.isComplete ? '<i class="ti ti-arrow-back-up"></i> Mark Incomplete' : '<i class="ti ti-check"></i> Mark Complete'}
          </button>
        </div>
      </div>
    `;

    const btn = this.container.querySelector('#yt-btn-mark-complete');
    if (btn) {
      btn.addEventListener('click', () => {
        if (this.onMarkComplete) this.onMarkComplete(!this.isComplete);
      });
    }
  }

  formatDuration(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
