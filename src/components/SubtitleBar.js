export class SubtitleBar {
  constructor(container) {
    this.container = container;
    this.sentences = [];
    this.currentIndex = -1;
    this.currentWordIndex = -1;
  }

  setSentences(sentences) {
    this.sentences = sentences;
    this.currentIndex = -1;
    this.currentWordIndex = -1;
    this.render();
  }

  updateProgress(sentenceIndex, wordIndex = -1) {
    this.currentIndex = sentenceIndex;
    this.currentWordIndex = wordIndex;
    this.render();
  }

  render() {
    if (this.sentences.length === 0 || this.currentIndex === -1) {
      this.container.innerHTML = `<div class="subtitle-bar-inner"></div>`;
      return;
    }

    const prev = this.sentences[this.currentIndex - 1]?.text || '';
    const current = this.sentences[this.currentIndex]?.text || '';
    const next = this.sentences[this.currentIndex + 1]?.text || '';

    let currentHtml = current;
    if (this.currentWordIndex >= 0) {
      const words = current.split(/\s+/);
      if (words[this.currentWordIndex]) {
        words[this.currentWordIndex] = `<span class="word-active" style="color: var(--accent-light); font-weight: 500;">${words[this.currentWordIndex]}</span>`;
      }
      currentHtml = words.join(' ');
    }

    this.container.innerHTML = `
      <div class="subtitle-bar-inner" style="background: rgba(0,0,0,0.75); backdrop-filter: blur(4px); width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: var(--space-16); text-align: center; color: white; transition: all var(--transition-default);">
        <div class="subtitle-prev" style="font-size: 15px; opacity: 0.8; margin-bottom: var(--space-8); min-height: 22px;">${prev}</div>
        <div class="subtitle-curr" style="font-size: 20px; font-weight: 400; margin-bottom: var(--space-8); min-height: 30px;">${currentHtml}</div>
        <div class="subtitle-next" style="font-size: 15px; opacity: 0.6; font-style: italic; min-height: 22px;">${next}</div>
      </div>
    `;
  }
}
