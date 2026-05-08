import { getPlaylist } from '../../store/playlists.js';
import { getWatchProgress, saveWatchProgress } from '../../store/watchProgress.js';
import { ApiKeySetupScreen } from './ApiKeySetupScreen.js';
import { PlaylistLinkModal } from './PlaylistLinkModal.js';
import { PlaylistSidebar } from './PlaylistSidebar.js';
import { VideoPlayer } from './VideoPlayer.js';
import { VideoInfoBar } from './VideoInfoBar.js';
import { CaptureIcon } from './CaptureIcon.js';
import { CapturePanel } from './CapturePanel.js';
import { TtsMicButton } from './TtsMicButton.js';
import { LatestPagePreview } from './LatestPagePreview.js';
import { TtsPageSelector } from './TtsPageSelector.js';
import { TtsSubtitleBar } from './TtsSubtitleBar.js';
import { tts } from '../../services/tts.js';

export class YouTubeMode {
  constructor(container, deckId, topBar) {
    this.container = container;
    this.deckId = deckId;
    this.topBar = topBar;
    
    this.playlist = null;
    this.watchProgress = null;
    this.activeVideoId = null;
    
    this.sidebarComponent = null;
    this.playerComponent = null;
    this.infoBarComponent = null;
    this.captureIconComponent = null;
    this.ttsMicComponent = null;
    this.subtitleBarComponent = null;
    this.latestPreviewComponent = null;

    this.lastSavedTime = {};
    this.currentVideoTime = 0;
  }

  async render() {
    this.container.innerHTML = `
      <div style="display: flex; height: 100%; width: 100%;">
        <div id="yt-sidebar-container" style="flex-shrink: 0; width: 320px; height: 100%; border-right: 1px solid var(--border-default);"></div>
        <div class="yt-player-area" id="yt-player-area">
          <div class="yt-iframe-wrapper" id="yt-iframe-wrapper"></div>
          <div id="yt-info-bar-container"></div>
          <div id="yt-capture-icon-container"></div>
          <div id="yt-tts-mic-container"></div>
          <div id="yt-latest-preview-container"></div>
          <div id="yt-tts-subtitle-container"></div>
          <div id="yt-tts-selector-container"></div>
        </div>
        <div id="yt-capture-panel-container" style="width: 0; transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1); overflow: hidden; flex-shrink: 0; background: var(--bg-base); z-index: 50;"></div>
      </div>
    `;

    // 1. Load Data
    this.playlist = await getPlaylist(this.deckId);
    this.watchProgress = await getWatchProgress(this.deckId);

    // 2. Init Components
    this.sidebarComponent = new PlaylistSidebar(
      this.container.querySelector('#yt-sidebar-container'),
      this.playlist,
      this.watchProgress,
      this.activeVideoId,
      (video) => this.handleVideoSelect(video),
      () => this.showLinkModal(),
      () => this.refreshPlaylist()
    );
    this.sidebarComponent.render();

    this.infoBarComponent = new VideoInfoBar(
      this.container.querySelector('#yt-info-bar-container'),
      (isComplete) => this.handleMarkComplete(isComplete)
    );
    this.infoBarComponent.render();

    this.playerComponent = new VideoPlayer(
      this.container.querySelector('#yt-iframe-wrapper'),
      (videoId, time) => this.handleTimeUpdate(videoId, time),
      (videoId) => this.handleVideoEnd(videoId)
    );

    this.captureIconComponent = new CaptureIcon(
      this.container.querySelector('#yt-capture-icon-container'),
      () => this.openCapturePanel()
    );
    this.captureIconComponent.render();

    this.ttsMicComponent = new TtsMicButton(
      this.container.querySelector('#yt-tts-mic-container'),
      () => this.openTtsSelector(),
      () => this.showLatestPagePreview(),
      () => this.hideLatestPagePreview()
    );
    this.ttsMicComponent.render();

    this.subtitleBarComponent = new TtsSubtitleBar(
      this.container.querySelector('#yt-tts-subtitle-container'),
      () => this.stopTts()
    );
    // don't render until active

    // Subscribe to TTS events
    this.setupTtsListeners();

    this.attachGlobalShortcuts();

    // 3. First time API Key check
    const apiKey = localStorage.getItem('studycanvas_yt_apikey');
    if (!apiKey) {
      this.showApiKeySetup();
    } else {
      if (this.playlist && this.playlist.videos.length > 0) {
        this.updateTopBarTitle();
        // Load first incomplete video or first video
        let startVideo = this.playlist.videos[0];
        for (const v of this.playlist.videos) {
          const wp = this.watchProgress.videos[v.videoId];
          if (!wp || !wp.isComplete) {
            startVideo = v;
            break;
          }
        }
        this.handleVideoSelect(startVideo);
      }
    }
  }

  attachGlobalShortcuts() {
    this.keydownHandler = (e) => {
      // Don't trigger if user is typing in an input or contenteditable
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable) return;

      switch(e.key.toLowerCase()) {
        case 'c':
          e.preventDefault();
          this.openCapturePanel();
          break;
        case 't':
          e.preventDefault();
          this.openTtsSelector();
          break;
        case ' ':
          // Handled by YouTube iframe natively if focused, but we can try to toggle if not
          break;
      }
    };
    document.addEventListener('keydown', this.keydownHandler);
  }

  unmount() {
    if (this.playerComponent) {
      this.playerComponent.destroy();
    }
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
    }
    this.container.innerHTML = '';
    if (this.topBar) {
      this.topBar.setPlaylistTitle(null);
      this.topBar.updateCounter(1, 1); // Reset back to default
    }
  }

  updateTopBarTitle() {
    if (this.topBar && this.playlist) {
      this.topBar.setPlaylistTitle(this.playlist.playlistTitle);
    }
  }

  showApiKeySetup() {
    const overlayContainer = document.createElement('div');
    document.body.appendChild(overlayContainer);

    const setup = new ApiKeySetupScreen(
      overlayContainer,
      () => {
        document.body.removeChild(overlayContainer);
        // If there's no playlist, automatically show the link modal after API setup
        if (!this.playlist) {
          this.showLinkModal();
        }
      },
      () => {
        document.body.removeChild(overlayContainer);
      }
    );
    setup.render();
  }

  showLinkModal() {
    const overlayContainer = document.createElement('div');
    document.body.appendChild(overlayContainer);

    const modal = new PlaylistLinkModal(
      overlayContainer,
      this.deckId,
      (newPlaylist) => {
        document.body.removeChild(overlayContainer);
        this.playlist = newPlaylist;
        this.updateTopBarTitle();
        this.sidebarComponent.playlist = newPlaylist;
        if (newPlaylist.videos.length > 0) {
          this.handleVideoSelect(newPlaylist.videos[0]);
        }
      },
      () => {
        document.body.removeChild(overlayContainer);
      }
    );
    modal.render();
  }

  async refreshPlaylist() {
    const apiKey = localStorage.getItem('studycanvas_yt_apikey');
    if (!apiKey || !this.playlist) return;

    try {
      const { fetchPlaylist } = await import('../../services/youtubeApi.js');
      const { savePlaylist } = await import('../../store/playlists.js');
      const newData = await fetchPlaylist(this.playlist.playlistId, apiKey);
      newData.notebookId = this.deckId;
      await savePlaylist(newData);
      
      this.playlist = newData;
      this.sidebarComponent.playlist = newData;
      this.sidebarComponent.render();
      
      // Toast success
      this.showToast(`Refreshed: ${newData.playlistTitle}`, 'success');
    } catch (e) {
      this.showToast(e.message, 'error');
    }
  }

  handleVideoSelect(video) {
    this.activeVideoId = video.videoId;
    
    // Ensure watch progress object exists for this video
    if (!this.watchProgress.videos[video.videoId]) {
      this.watchProgress.videos[video.videoId] = {
        watchedSeconds: 0,
        durationSeconds: video.durationSeconds,
        isComplete: false,
        lastWatchedAt: null,
        completedAt: null
      };
    }
    
    const wp = this.watchProgress.videos[video.videoId];
    const startSec = wp.isComplete ? 0 : (wp.watchedSeconds > 10 ? wp.watchedSeconds : 0);

    this.playerComponent.loadVideo(video.videoId, startSec);
    this.sidebarComponent.setActiveVideo(video.videoId);
    
    // Update Info Bar
    this.infoBarComponent.updateState(
      video,
      wp.isComplete,
      startSec,
      video.position + 1,
      this.playlist.videos.length
    );

    if (startSec > 10 && !wp.isComplete) {
      this.showToast(`Resuming from ${this.infoBarComponent.formatDuration(Math.floor(startSec))}`, 'info');
    }
  }

  async handleTimeUpdate(videoId, timeSeconds) {
    if (this.activeVideoId !== videoId) return;

    this.currentVideoTime = timeSeconds;

    const video = this.playlist.videos.find(v => v.videoId === videoId);
    if (!video) return;

    const wp = this.watchProgress.videos[videoId] || {
      watchedSeconds: 0,
      durationSeconds: video.durationSeconds,
      isComplete: false,
      lastWatchedAt: null,
      completedAt: null
    };

    // Only update if time advanced
    if (timeSeconds > wp.watchedSeconds) {
      wp.watchedSeconds = timeSeconds;
      wp.lastWatchedAt = new Date().toISOString();
      this.watchProgress.videos[videoId] = wp;

      // Auto-complete at 92%
      if (!wp.isComplete && wp.watchedSeconds >= video.durationSeconds * 0.92) {
        wp.isComplete = true;
        wp.completedAt = new Date().toISOString();
        this.showToast(`Marked complete: ${video.title}`, 'success');
        this.infoBarComponent.updateCompleteState(true);
      }

      // Save to DB every ~5 seconds
      const lastSaved = this.lastSavedTime[videoId] || 0;
      if (timeSeconds - lastSaved > 5) {
        this.lastSavedTime[videoId] = timeSeconds;
        await saveWatchProgress(this.watchProgress);
        this.sidebarComponent.updateProgress(this.watchProgress);
      }
    }

    this.infoBarComponent.updateTime(timeSeconds);
  }

  async handleVideoEnd(videoId) {
    if (this.activeVideoId !== videoId) return;
    const wp = this.watchProgress.videos[videoId];
    if (wp && !wp.isComplete) {
      wp.isComplete = true;
      wp.completedAt = new Date().toISOString();
      await saveWatchProgress(this.watchProgress);
      this.infoBarComponent.updateCompleteState(true);
      this.sidebarComponent.updateProgress(this.watchProgress);
    }
  }

  async handleMarkComplete(isComplete) {
    if (!this.activeVideoId) return;
    const wp = this.watchProgress.videos[this.activeVideoId];
    if (wp) {
      wp.isComplete = isComplete;
      if (isComplete) {
        wp.completedAt = new Date().toISOString();
      } else {
        wp.completedAt = null;
      }
      await saveWatchProgress(this.watchProgress);
      this.infoBarComponent.updateCompleteState(isComplete);
      this.sidebarComponent.updateProgress(this.watchProgress);
    }
  }

  openCapturePanel() {
    if (!this.activeVideoId) return;
    
    // Pause video
    if (this.playerComponent) {
      this.playerComponent.pause();
    }

    const video = this.playlist.videos.find(v => v.videoId === this.activeVideoId);
    if (!video) return;

    const panelContainer = this.container.querySelector('#yt-capture-panel-container');
    const panel = new CapturePanel(
      panelContainer,
      this.deckId,
      video.title,
      this.activeVideoId,
      this.currentVideoTime,
      (page, resumeVideo) => {
        // On Save Complete
        this.topBar.updateCounter(this.playlist.videos.length + 1, this.playlist.videos.length + 1); // Mock counter update
        this.showToast(`Page saved: ${page.title}`, 'success');
        
        // Ensure LeftPanel updates if it exists
        const event = new CustomEvent('app-page-captured', { detail: { pageId: page.pageId } });
        document.dispatchEvent(event);

        if (resumeVideo && this.playerComponent) {
          this.playerComponent.play();
        }
      },
      () => {
        // On Close
        panelContainer.innerHTML = '';
      }
    );
    panel.render();
  }

  // --- TTS Integration ---

  setupTtsListeners() {
    this.ttsBoundaryHandler = (e) => {
      if (this.subtitleBarComponent) {
        this.subtitleBarComponent.updateProgress(e.detail.wordIndex);
      }
    };
    this.ttsEndHandler = () => {
      this.stopTts();
    };
    this.ttsPauseHandler = () => {
      if (this.subtitleBarComponent) this.subtitleBarComponent.updatePlayPauseState(false);
    };
    this.ttsResumeHandler = () => {
      if (this.subtitleBarComponent) this.subtitleBarComponent.updatePlayPauseState(true);
    };

    document.addEventListener('tts-boundary', this.ttsBoundaryHandler);
    document.addEventListener('tts-end', this.ttsEndHandler);
    document.addEventListener('tts-pause', this.ttsPauseHandler);
    document.addEventListener('tts-resume', this.ttsResumeHandler);
  }

  async showLatestPagePreview() {
    if (tts.isPlaying) return; // Don't show if currently playing TTS
    
    const { getPagesForNotebook } = await import('../../store/pages.js');
    const pages = await getPagesForNotebook(this.deckId);
    if (pages.length === 0) return;
    
    pages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const latestPage = pages[0];

    const container = this.container.querySelector('#yt-latest-preview-container');
    if (!this.latestPreviewComponent) {
      this.latestPreviewComponent = new LatestPagePreview(
        container,
        latestPage,
        (page) => {
          this.hideLatestPagePreview();
          this.startTts(page);
        }
      );
    } else {
      this.latestPreviewComponent.page = latestPage;
    }
    this.latestPreviewComponent.render();
  }

  hideLatestPagePreview() {
    if (this.latestPreviewComponent) {
      this.latestPreviewComponent.destroy();
    }
  }

  openTtsSelector() {
    if (tts.isPlaying) {
      this.stopTts();
      return;
    }

    this.hideLatestPagePreview();

    const container = this.container.querySelector('#yt-tts-selector-container');
    const selector = new TtsPageSelector(
      container,
      this.deckId,
      (page) => {
        this.startTts(page);
      },
      () => {
        container.innerHTML = '';
      }
    );
    selector.render();
  }

  startTts(page) {
    if (this.playerComponent) {
      this.playerComponent.pause();
    }

    const rawText = page.textBlock?.rawText || '';
    if (!rawText) {
      this.showToast('No text found on this page.', 'error');
      return;
    }

    this.ttsMicComponent.setActive(true);
    
    this.subtitleBarComponent.render();
    this.subtitleBarComponent.updateText(rawText);
    this.subtitleBarComponent.updatePlayPauseState(true);

    tts.play(rawText);
  }

  stopTts() {
    tts.stop();
    if (this.ttsMicComponent) this.ttsMicComponent.setActive(false);
    if (this.subtitleBarComponent) this.subtitleBarComponent.close();
  }

  showToast(message, type = 'info') {
    const event = new CustomEvent('app-toast', { detail: { message, type } });
    document.dispatchEvent(event);
  }
}
