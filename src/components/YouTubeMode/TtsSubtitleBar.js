import { tts } from '../../services/tts.js';

export class TtsSubtitleBar {
  constructor(container, onClose) {
    this.container = container;
    this.onClose = onClose;
    this.sentences = [];
    this.currentIndex = -1;
    this.currentWordIndex = -1;
  }

  updateText(rawText) {
    // Split into sentences roughly
    this.sentences = rawText.match(/[^.!?]+[.!?]*/g) || [rawText];
    this.sentences = this.sentences.map(s => s.trim()).filter(s => s.length > 0);
    this.currentIndex = 0;
    this.currentWordIndex = -1;
    this.renderText();
  }

  updateProgress(charIndex) {
    if (this.sentences.length === 0) return;
    
    // Find which sentence we are in based on total chars
    let totalLength = 0;
    let sentenceIdx = 0;
    let charOffsetInSentence = 0;

    for (let i = 0; i < this.sentences.length; i++) {
      if (totalLength + this.sentences[i].length > charIndex) {
        sentenceIdx = i;
        charOffsetInSentence = charIndex - totalLength;
        break;
      }
      totalLength += this.sentences[i].length + 1; // +1 for the space joining them in tts
    }

    if (sentenceIdx !== this.currentIndex) {
      this.currentIndex = sentenceIdx;
      this.currentWordIndex = -1; // reset word highlighting
      this.renderText();
    }

    // Now highlight the word
    this.highlightWordInCurrentSentence(charOffsetInSentence);
  }

  highlightWordInCurrentSentence(charOffset) {
    const currentSentenceEl = this.container.querySelector('#yt-tts-current-sentence');
    if (!currentSentenceEl) return;

    const sentenceText = this.sentences[this.currentIndex];
    if (!sentenceText) return;

    // Very naive word highlight: split by spaces and match char offset
    let wordIndex = 0;
    let charCount = 0;
    const words = sentenceText.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      if (charCount + words[i].length >= charOffset) {
        wordIndex = i;
        break;
      }
      charCount += words[i].length + 1; // +1 for space
    }

    if (wordIndex !== this.currentWordIndex) {
      this.currentWordIndex = wordIndex;
      
      const html = words.map((w, i) => {
        if (i === wordIndex) {
          return `<span style="color: var(--subtitle-word-highlight);">${w}</span>`;
        }
        return w;
      }).join(' ');
      
      currentSentenceEl.innerHTML = html;
    }
  }

  render() {
    this.container.innerHTML = `
      <div id="yt-subtitle-bar" style="
        position: absolute; 
        bottom: 0; left: 0; right: 0; 
        background: var(--subtitle-bar-bg); 
        backdrop-filter: blur(8px);
        display: flex; flex-direction: column; 
        padding: var(--space-16) var(--space-24);
        transform: translateY(100%);
        transition: transform 0.3s ease;
        z-index: 65;
        border-top: 1px solid var(--border-default);
      ">
        <div style="flex-grow: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; gap: 8px; margin-bottom: var(--space-16); min-height: 80px;">
          <div id="yt-tts-prev-sentence" style="font-size: 13px; color: var(--subtitle-adjacent-color); font-style: italic;"></div>
          <div id="yt-tts-current-sentence" style="font-size: 17px; color: var(--subtitle-current-color); font-weight: 500; line-height: 1.4; transition: all 0.2s;"></div>
          <div id="yt-tts-next-sentence" style="font-size: 13px; color: var(--subtitle-adjacent-color); font-style: italic;"></div>
        </div>

        <div style="display: flex; justify-content: center; align-items: center; gap: 16px;">
          <button class="ghost icon-only" id="yt-tts-btn-prev" title="Previous sentence"><i class="ti ti-player-skip-back"></i></button>
          <button class="primary icon-only" id="yt-tts-btn-playpause" style="border-radius: 50%; width: 40px; height: 40px;"><i class="ti ti-player-pause" id="yt-tts-icon-playpause"></i></button>
          <button class="ghost icon-only" id="yt-tts-btn-stop" title="Stop"><i class="ti ti-player-stop"></i></button>
          <button class="ghost icon-only" id="yt-tts-btn-next" title="Next sentence"><i class="ti ti-player-skip-forward"></i></button>
        </div>
      </div>
    `;

    requestAnimationFrame(() => {
      const el = this.container.querySelector('#yt-subtitle-bar');
      if (el) el.style.transform = 'translateY(0)';
    });

    this.attachEvents();
  }

  renderText() {
    const prevEl = this.container.querySelector('#yt-tts-prev-sentence');
    const currentEl = this.container.querySelector('#yt-tts-current-sentence');
    const nextEl = this.container.querySelector('#yt-tts-next-sentence');

    if (!prevEl || !currentEl || !nextEl) return;

    if (this.currentIndex > 0) {
      prevEl.textContent = this.sentences[this.currentIndex - 1];
    } else {
      prevEl.textContent = '';
    }

    if (this.currentIndex >= 0 && this.currentIndex < this.sentences.length) {
      currentEl.textContent = this.sentences[this.currentIndex];
    } else {
      currentEl.textContent = '';
    }

    if (this.currentIndex < this.sentences.length - 1) {
      nextEl.textContent = this.sentences[this.currentIndex + 1];
    } else {
      nextEl.textContent = '';
    }
  }

  updatePlayPauseState(isPlaying) {
    const icon = this.container.querySelector('#yt-tts-icon-playpause');
    if (icon) {
      icon.className = isPlaying ? 'ti ti-player-pause' : 'ti ti-player-play';
    }
  }

  attachEvents() {
    const playPauseBtn = this.container.querySelector('#yt-tts-btn-playpause');
    const stopBtn = this.container.querySelector('#yt-tts-btn-stop');
    const prevBtn = this.container.querySelector('#yt-tts-btn-prev');
    const nextBtn = this.container.querySelector('#yt-tts-btn-next');

    playPauseBtn.addEventListener('click', () => {
      if (tts.isPlaying && !tts.isPaused) {
        tts.pause();
      } else if (tts.isPaused) {
        tts.resume();
      }
    });

    stopBtn.addEventListener('click', () => {
      tts.stop();
      this.close();
    });

    prevBtn.addEventListener('click', () => {
      // Skipping logic would ideally stop and start TTS at a new utterance
      // But for simplicity, we just restart the TTS from the beginning of the sentence string 
      // or we just let it be for now since `tts.js` doesn't support seeking well.
      // We will skip implementing full seek for now.
    });

    nextBtn.addEventListener('click', () => {
      // Same here
    });

    this.keydownHandler = (e) => {
      if (e.key === 'Escape') {
        tts.stop();
        this.close();
      } else if (e.key === ' ') {
        e.preventDefault();
        playPauseBtn.click();
      }
    };
    document.addEventListener('keydown', this.keydownHandler);
  }

  close() {
    document.removeEventListener('keydown', this.keydownHandler);
    const el = this.container.querySelector('#yt-subtitle-bar');
    if (el) {
      el.style.transform = 'translateY(100%)';
      setTimeout(() => {
        if (this.onClose) this.onClose();
      }, 300);
    } else {
      if (this.onClose) this.onClose();
    }
  }
}
