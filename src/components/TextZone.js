import { updatePage } from '../store/pages.js';

export class TextZone {
  constructor(container, page) {
    this.container = container;
    this.page = page;
  }

  render() {
    this.container.innerHTML = `
      <div style="display: flex; flex-direction: column; height: 100%;">
        <div style="padding: var(--space-8) var(--space-16); border-bottom: 1px solid var(--border-default); display: flex; align-items: center; justify-content: space-between;">
          <div class="pill" style="cursor: pointer; background: var(--bg-hover); color: var(--text-primary); border: 1px solid var(--border-default);">${this.page.textBlock.source || 'Manual'} <i class="ti ti-chevron-down" style="font-size: 10px;"></i></div>
          <div class="meta-text" id="word-count">0 words</div>
        </div>
        <div style="flex-grow: 1; padding: var(--space-16); overflow-y: auto;">
          <div id="text-editor" contenteditable="true" style="min-height: 100%; outline: none; white-space: pre-wrap; line-height: 1.6;" data-placeholder="Paste your AI response here, or type your explanation..."></div>
        </div>
        <div style="padding: var(--space-8) var(--space-16); border-top: 1px solid var(--border-default); background: var(--bg-surface); display: flex; gap: var(--space-8);">
          <button class="ghost icon-only" title="Paste from AI"><i class="ti ti-clipboard"></i></button>
          <button class="ghost icon-only" title="Clear text" id="btn-clear"><i class="ti ti-eraser"></i></button>
          <div style="flex-grow: 1;"></div>
          <button class="ghost icon-only" title="Preview TTS"><i class="ti ti-player-play"></i></button>
        </div>
      </div>
    `;

    if (!document.getElementById('editor-placeholder-css')) {
      const style = document.createElement('style');
      style.id = 'editor-placeholder-css';
      style.textContent = `
        #text-editor:empty:before {
          content: attr(data-placeholder);
          color: var(--text-tertiary);
          pointer-events: none;
        }
      `;
      document.head.appendChild(style);
    }

    this.attachEvents();
    this.populateText();
  }

  populateText() {
    const editor = this.container.querySelector('#text-editor');
    if (this.page.textBlock && this.page.textBlock.rawText) {
      editor.innerText = this.page.textBlock.rawText;
    }
    this.updateWordCount();
  }

  attachEvents() {
    const editor = this.container.querySelector('#text-editor');
    
    let debounceTimer;
    editor.addEventListener('input', () => {
      this.updateWordCount();
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        this.page.textBlock.rawText = editor.innerText;
        this.segmentSentences(editor.innerText);
        await updatePage(this.page);
      }, 1000);
    });

    const btnClear = this.container.querySelector('#btn-clear');
    btnClear.addEventListener('click', async () => {
      if (confirm('Clear all text?')) {
        editor.innerText = '';
        this.page.textBlock.rawText = '';
        this.page.textBlock.sentences = [];
        await updatePage(this.page);
        this.updateWordCount();
      }
    });
  }

  updateWordCount() {
    const editor = this.container.querySelector('#text-editor');
    const text = editor.innerText.trim();
    const count = text ? text.split(/\\s+/).length : 0;
    const countEl = this.container.querySelector('#word-count');
    if (countEl) countEl.textContent = \`\${count} words\`;
  }

  segmentSentences(text) {
    const matches = text.match(/[^.!?]+[.!?]+/g) || (text ? [text] : []);
    this.page.textBlock.sentences = matches.map((s, i) => ({
      index: i,
      text: s.trim()
    })).filter(s => s.text.length > 0);
  }
}
