// src/components/YouTubeMode/VideoCard.js

export class VideoCard {
  constructor(video, progress, isActive, onClick) {
    this.video = video;
    this.progress = progress; // { watchedSeconds, isComplete }
    this.isActive = isActive;
    this.onClick = onClick;
  }

  render() {
    const el = document.createElement('div');
    el.className = `yt-video-card ${this.isActive ? 'active' : ''}`;
    el.title = this.video.title; // Full title on hover

    let statusHtml = '';
    let progressPercent = 0;

    if (this.progress) {
      if (this.progress.isComplete) {
        statusHtml = '<i class="ti ti-circle-check yt-status-icon yt-status-complete"></i>';
        progressPercent = 100;
      } else if (this.isActive) {
        statusHtml = '<i class="ti ti-player-play-filled yt-status-icon yt-status-complete"></i>';
        progressPercent = (this.progress.watchedSeconds / this.video.durationSeconds) * 100;
      } else if (this.progress.watchedSeconds > 0) {
        statusHtml = '<i class="ti ti-circle-half-2 yt-status-icon yt-status-partial"></i>';
        progressPercent = (this.progress.watchedSeconds / this.video.durationSeconds) * 100;
      } else {
        statusHtml = '<i class="ti ti-circle yt-status-icon yt-status-none"></i>';
      }
    } else {
      if (this.isActive) {
        statusHtml = '<i class="ti ti-player-play-filled yt-status-icon yt-status-complete"></i>';
      } else {
        statusHtml = '<i class="ti ti-circle yt-status-icon yt-status-none"></i>';
      }
    }

    el.innerHTML = `
      <div class="yt-thumbnail-wrapper">
        <img src="${this.video.thumbnail}" class="yt-thumbnail" alt="thumbnail">
        <div class="yt-duration-badge">${this.video.durationFormatted || '--:--'}</div>
      </div>
      <div class="yt-card-info">
        <div class="yt-card-title">${this.video.title}</div>
        ${statusHtml}
      </div>
      ${progressPercent > 0 && progressPercent < 100 ? `<div class="yt-card-progress-bar" style="width: ${progressPercent}%"></div>` : ''}
      ${progressPercent >= 100 ? `<div class="yt-card-progress-bar" style="width: 100%; background: var(--watch-complete-color);"></div>` : ''}
    `;

    el.addEventListener('click', () => {
      if (this.onClick) this.onClick(this.video);
    });

    return el;
  }
}
