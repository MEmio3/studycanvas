import { VideoCard } from './VideoCard.js';

export class PlaylistSidebar {
  constructor(container, playlist, watchProgress, activeVideoId, onVideoSelect, onLinkPlaylist, onRefresh) {
    this.container = container;
    this.playlist = playlist;
    this.watchProgress = watchProgress || { videos: {} };
    this.activeVideoId = activeVideoId;
    this.onVideoSelect = onVideoSelect;
    this.onLinkPlaylist = onLinkPlaylist;
    this.onRefresh = onRefresh;
    this.searchQuery = '';
  }

  updateProgress(watchProgress) {
    this.watchProgress = watchProgress || { videos: {} };
    this.renderVideoList();
    this.renderProgressBar();
  }

  setActiveVideo(videoId) {
    this.activeVideoId = videoId;
    this.renderVideoList();
  }

  render() {
    this.container.innerHTML = `
      <div class="yt-sidebar">
        ${this.playlist ? `
          <div style="padding: var(--space-12); border-bottom: 1px solid var(--border-default);">
            <input type="text" id="yt-search-videos" placeholder="Search videos..." style="width: 100%; padding: var(--space-8); background: var(--bg-base); border: 1px solid var(--border-default); border-radius: var(--radius-sm); color: var(--text-primary); font-size: 13px;">
          </div>
          <div id="yt-video-list" style="flex-grow: 1; overflow-y: auto;"></div>
          <div class="yt-playlist-progress-container">
            <div class="yt-playlist-progress-track">
              <div id="yt-playlist-progress-fill" class="yt-playlist-progress-fill" style="width: 0%;"></div>
            </div>
            <div class="yt-playlist-progress-text">
              <span id="yt-playlist-progress-label">0 of ${this.playlist.videos.length} complete</span>
              <span id="yt-playlist-progress-percent">0%</span>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 12px;">
              <button id="yt-btn-link" class="ghost" style="flex: 1; font-size: 12px;"><i class="ti ti-link"></i> Link Playlist</button>
              <button id="yt-btn-refresh" class="ghost icon-only" title="Refresh Playlist"><i class="ti ti-refresh"></i></button>
            </div>
          </div>
        ` : `
          <div style="flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--space-24); text-align: center;">
            <i class="ti ti-brand-youtube" style="font-size: 48px; color: var(--text-secondary); margin-bottom: var(--space-16);"></i>
            <h3 style="color: var(--text-primary); margin-bottom: var(--space-8);">No playlist linked</h3>
            <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: var(--space-24);">Paste a YouTube playlist URL to get started</p>
            <button id="yt-btn-link" class="primary"><i class="ti ti-link"></i> Link Playlist</button>
          </div>
        `}
      </div>
    `;

    if (this.playlist) {
      this.renderVideoList();
      this.renderProgressBar();
      
      const searchInput = this.container.querySelector('#yt-search-videos');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.searchQuery = e.target.value.toLowerCase();
          this.renderVideoList();
        });
      }
      
      this.container.querySelector('#yt-btn-refresh').addEventListener('click', () => {
        if (this.onRefresh) this.onRefresh();
      });
    }

    const linkBtn = this.container.querySelector('#yt-btn-link');
    if (linkBtn) {
      linkBtn.addEventListener('click', () => {
        if (this.onLinkPlaylist) this.onLinkPlaylist();
      });
    }
  }

  renderVideoList() {
    const listEl = this.container.querySelector('#yt-video-list');
    if (!listEl || !this.playlist) return;

    listEl.innerHTML = '';

    const filteredVideos = this.playlist.videos.filter(v => 
      !this.searchQuery || v.title.toLowerCase().includes(this.searchQuery)
    );

    if (filteredVideos.length === 0) {
      listEl.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 13px;">No videos match your search</div>';
      return;
    }

    for (const video of filteredVideos) {
      const progress = this.watchProgress.videos[video.videoId];
      const isActive = video.videoId === this.activeVideoId;
      
      const card = new VideoCard(video, progress, isActive, this.onVideoSelect);
      const domEl = card.render();
      listEl.appendChild(domEl);

      if (isActive) {
        // Scroll into view if active
        setTimeout(() => {
          domEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    }
  }

  renderProgressBar() {
    if (!this.playlist) return;

    const fillEl = this.container.querySelector('#yt-playlist-progress-fill');
    const labelEl = this.container.querySelector('#yt-playlist-progress-label');
    const percentEl = this.container.querySelector('#yt-playlist-progress-percent');

    if (!fillEl || !labelEl || !percentEl) return;

    const total = this.playlist.videos.length;
    let complete = 0;

    for (const video of this.playlist.videos) {
      const p = this.watchProgress.videos[video.videoId];
      if (p && p.isComplete) complete++;
    }

    const percent = total > 0 ? Math.round((complete / total) * 100) : 0;

    fillEl.style.width = `${percent}%`;
    labelEl.textContent = `${complete} of ${total} complete`;
    percentEl.textContent = `${percent}%`;
  }
}
