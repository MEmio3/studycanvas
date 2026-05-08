import { fetchPlaylist } from '../../services/youtubeApi.js';
import { savePlaylist } from '../../store/playlists.js';

export class PlaylistLinkModal {
  constructor(container, deckId, onComplete, onCancel) {
    this.container = container;
    this.deckId = deckId;
    this.onComplete = onComplete;
    this.onCancel = onCancel;
  }

  render() {
    this.container.innerHTML = `
      <div class="yt-modal-overlay">
        <div class="yt-modal-content">
          <h2 style="font-size: 18px; margin-bottom: var(--space-16);">Link a YouTube Playlist</h2>
          
          <label style="display: block; margin-bottom: var(--space-8); font-size: 14px; font-weight: 500;">Paste playlist URL or ID:</label>
          <input type="text" id="yt-playlist-input" style="width: 100%; padding: var(--space-12); background: var(--bg-base); border: 1px solid var(--border-default); border-radius: var(--radius-sm); color: var(--text-primary); margin-bottom: var(--space-8);" placeholder="e.g. youtube.com/playlist?list=PLxxxx">
          <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: var(--space-16);">e.g. youtube.com/playlist?list=PLxxxx or PLxxxx</p>
          
          <div style="display: flex; gap: var(--space-12); align-items: flex-start; padding: var(--space-12); background: rgba(212, 160, 23, 0.1); border-radius: var(--radius-sm); margin-bottom: var(--space-24);">
            <i class="ti ti-alert-triangle" style="color: var(--amber); margin-top: 2px;"></i>
            <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.4;">
              <span style="color: var(--amber); font-weight: 500;">Note:</span> This will replace the current linked playlist. Your saved Pages and watch progress will not be deleted.
            </p>
          </div>

          <div id="yt-playlist-error" style="color: var(--danger); font-size: 13px; min-height: 20px; margin-bottom: var(--space-16);"></div>

          <div style="display: flex; justify-content: flex-end; gap: var(--space-12);">
            <button id="yt-btn-cancel" class="ghost">Cancel</button>
            <button id="yt-btn-load" class="primary">Load Playlist</button>
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
    // Auto-focus
    setTimeout(() => {
      const input = this.container.querySelector('#yt-playlist-input');
      if (input) input.focus();
    }, 50);
  }

  attachEvents() {
    const cancelBtn = this.container.querySelector('#yt-btn-cancel');
    const loadBtn = this.container.querySelector('#yt-btn-load');
    const input = this.container.querySelector('#yt-playlist-input');
    const errorDiv = this.container.querySelector('#yt-playlist-error');

    cancelBtn.addEventListener('click', () => {
      if (this.onCancel) this.onCancel();
    });

    loadBtn.addEventListener('click', async () => {
      const rawVal = input.value.trim();
      if (!rawVal) {
        errorDiv.textContent = 'Please enter a URL or ID.';
        return;
      }

      let playlistId = rawVal;
      // Extract from URL if present
      if (rawVal.includes('list=')) {
        const urlParams = new URLSearchParams(rawVal.substring(rawVal.indexOf('?')));
        playlistId = urlParams.get('list') || rawVal;
      }

      const apiKey = localStorage.getItem('studycanvas_yt_apikey');
      if (!apiKey) {
        errorDiv.textContent = 'API key is missing. Please set it in Settings.';
        return;
      }

      loadBtn.disabled = true;
      loadBtn.textContent = 'Loading...';
      errorDiv.textContent = '';

      try {
        const playlistData = await fetchPlaylist(playlistId, apiKey);
        playlistData.deckId = this.deckId; // Link to current deck
        
        await savePlaylist(playlistData);
        
        if (this.onComplete) this.onComplete(playlistData);
      } catch (err) {
        errorDiv.textContent = err.message || 'Failed to load playlist.';
        loadBtn.disabled = false;
        loadBtn.textContent = 'Load Playlist';
      }
    });
  }
}
