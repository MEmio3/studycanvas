import { loadYouTubeApi, createPlayer } from '../../services/youtubePlayer.js';

export class VideoPlayer {
  constructor(container, onTimeUpdate, onVideoEnd) {
    this.container = container;
    this.onTimeUpdate = onTimeUpdate;
    this.onVideoEnd = onVideoEnd;
    
    this.player = null;
    this.activeVideoId = null;
    this.timeUpdateInterval = null;
    this.playerReady = false;
  }

  async loadVideo(videoId, startSeconds = 0) {
    this.activeVideoId = videoId;
    
    if (!this.player) {
      await this.initPlayer(videoId, startSeconds);
      return;
    }

    if (this.playerReady) {
      this.player.loadVideoById({
        videoId: videoId,
        startSeconds: startSeconds
      });
    }
  }

  async initPlayer(initialVideoId, startSeconds = 0) {
    this.container.innerHTML = '<div id="yt-iframe-placeholder" style="width: 100%; height: 100%;"></div>';
    
    try {
      await loadYouTubeApi();
      this.player = createPlayer(
        'yt-iframe-placeholder', 
        initialVideoId, 
        () => {
          this.playerReady = true;
          if (startSeconds > 0) {
            this.player.seekTo(startSeconds);
          }
          this.startProgressTracking();
        },
        (event) => {
          // YT.PlayerState.ENDED == 0
          if (event.data === 0) {
            if (this.onVideoEnd) this.onVideoEnd(this.activeVideoId);
          }
          
          // YT.PlayerState.PLAYING == 1
          if (event.data === 1) {
            this.startProgressTracking();
          } else {
            this.stopProgressTracking();
          }
        }
      );
    } catch (e) {
      console.error("Failed to load YouTube player", e);
      this.container.innerHTML = `<div class="flex-center" style="height: 100%; color: var(--danger);">Failed to load YouTube player. Check your internet connection.</div>`;
    }
  }

  startProgressTracking() {
    this.stopProgressTracking();
    this.timeUpdateInterval = setInterval(() => {
      if (this.player && this.playerReady && this.player.getCurrentTime) {
        const time = this.player.getCurrentTime();
        if (this.onTimeUpdate) this.onTimeUpdate(this.activeVideoId, time);
      }
    }, 1000);
  }

  stopProgressTracking() {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
  }

  pause() {
    if (this.player && this.playerReady && this.player.pauseVideo) {
      this.player.pauseVideo();
    }
  }

  play() {
    if (this.player && this.playerReady && this.player.playVideo) {
      this.player.playVideo();
    }
  }

  destroy() {
    this.stopProgressTracking();
    if (this.player && this.player.destroy) {
      this.player.destroy();
    }
    this.player = null;
    this.playerReady = false;
  }
}
