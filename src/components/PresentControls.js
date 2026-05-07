export class PresentControls {
  constructor(container, onPlayPause, onStop, onPrev, onNext, onExit) {
    this.container = container;
    this.onPlayPause = onPlayPause;
    this.onStop = onStop;
    this.onPrev = onPrev;
    this.onNext = onNext;
    this.onExit = onExit;
    this.isPlaying = false;
  }

  setPlayingState(isPlaying) {
    this.isPlaying = isPlaying;
    const playIcon = this.container.querySelector('#btn-pc-play i');
    if (playIcon) {
      playIcon.className = isPlaying ? 'ti ti-player-pause' : 'ti ti-player-play';
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="present-controls" style="display: flex; gap: var(--space-12); align-items: center; justify-content: center; background: rgba(0,0,0,0.9); padding: var(--space-8); border-top: 1px solid #333;">
        <button class="ghost icon-only" id="btn-pc-prev" style="color: white; border: none;" title="Previous Page"><i class="ti ti-player-skip-back"></i></button>
        <button class="ghost icon-only" id="btn-pc-play" style="color: white; border: none; font-size: 24px;" title="Play/Pause"><i class="ti ti-player-play"></i></button>
        <button class="ghost icon-only" id="btn-pc-stop" style="color: white; border: none;" title="Stop"><i class="ti ti-player-stop"></i></button>
        <button class="ghost icon-only" id="btn-pc-next" style="color: white; border: none;" title="Next Page"><i class="ti ti-player-skip-forward"></i></button>
        <div style="width: 1px; height: 24px; background: #444; margin: 0 var(--space-8);"></div>
        <button class="ghost icon-only" id="btn-pc-exit" style="color: white; border: none;" title="Exit Presentation"><i class="ti ti-x"></i></button>
      </div>
    `;
    this.attachEvents();
  }

  attachEvents() {
    this.container.querySelector('#btn-pc-prev').addEventListener('click', () => this.onPrev && this.onPrev());
    this.container.querySelector('#btn-pc-play').addEventListener('click', () => this.onPlayPause && this.onPlayPause());
    this.container.querySelector('#btn-pc-stop').addEventListener('click', () => this.onStop && this.onStop());
    this.container.querySelector('#btn-pc-next').addEventListener('click', () => this.onNext && this.onNext());
    this.container.querySelector('#btn-pc-exit').addEventListener('click', () => this.onExit && this.onExit());
  }
}
