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
          <button class="ghost icon-only" title="Edit Sentences" id="btn-edit-sentences"><i class="ti ti-cut"></i></button>
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

    const btnEdit = this.container.querySelector('#btn-edit-sentences');
    if (btnEdit) {
      btnEdit.addEventListener('click', () => this.toggleEditSentences());
    }
  }

  toggleEditSentences() {
    this.isEditSentencesMode = !this.isEditSentencesMode;
    const editor = this.container.querySelector('#text-editor');
    const btn = this.container.querySelector('#btn-edit-sentences');

    if (this.isEditSentencesMode) {
      btn.classList.replace('ghost', 'primary');
      editor.contentEditable = 'false';
      this.renderSentencesForEditing();
    } else {
      btn.classList.replace('primary', 'ghost');
      editor.contentEditable = 'true';
      this.page.textBlock.rawText = this.page.textBlock.sentences.map(s => s.text).join(' ');
      editor.innerText = this.page.textBlock.rawText;
      updatePage(this.page);
      this.updateWordCount();
    }
  }

  renderSentencesForEditing() {
    const editor = this.container.querySelector('#text-editor');
    editor.innerHTML = '';
    
    this.page.textBlock.sentences.forEach((sentence, i) => {
      const sSpan = document.createElement('span');
      sSpan.className = 'sentence-chunk';
      sSpan.style.lineHeight = '2';
      
      const words = sentence.text.split(/(\\s+)/);
      words.forEach((word, wordIndex) => {
        const wSpan = document.createElement('span');
        wSpan.textContent = word;
        if (word.trim().length > 0) {
          wSpan.style.cursor = 'crosshair';
          wSpan.title = 'Click to split sentence here';
          wSpan.addEventListener('click', (e) => {
            e.stopPropagation();
            this.splitSentence(i, wordIndex);
          });
          wSpan.addEventListener('mouseenter', () => wSpan.style.background = 'rgba(29, 158, 117, 0.2)');
          wSpan.addEventListener('mouseleave', () => wSpan.style.background = 'transparent');
        }
        sSpan.appendChild(wSpan);
      });
      
      editor.appendChild(sSpan);

      if (i < this.page.textBlock.sentences.length - 1) {
        const marker = document.createElement('span');
        marker.innerHTML = '<i class="ti ti-arrows-join-2"></i>';
        marker.className = 'boundary-marker';
        marker.style.cursor = 'pointer';
        marker.style.color = 'var(--text-secondary)';
        marker.style.margin = '0 6px';
        marker.style.display = 'inline-flex';
        marker.style.alignItems = 'center';
        marker.style.justifyContent = 'center';
        marker.style.background = 'var(--bg-hover)';
        marker.style.padding = '2px 4px';
        marker.style.borderRadius = '4px';
        marker.style.border = '1px solid var(--border-default)';
        marker.title = 'Click to merge sentences';
        
        marker.addEventListener('click', () => {
          this.mergeSentences(i);
        });
        
        editor.appendChild(marker);
      }
    });
  }

  mergeSentences(index) {
    const s1 = this.page.textBlock.sentences[index];
    const s2 = this.page.textBlock.sentences[index + 1];
    s1.text = s1.text.trim() + ' ' + s2.text.trim();
    this.page.textBlock.sentences.splice(index + 1, 1);
    
    this.page.textBlock.sentences.forEach((s, i) => s.index = i);
    this.renderSentencesForEditing();
  }

  splitSentence(sentenceIndex, wordIndex) {
    const sentence = this.page.textBlock.sentences[sentenceIndex];
    const wordsAndSpaces = sentence.text.split(/(\\s+)/);
    
    const part1 = wordsAndSpaces.slice(0, wordIndex + 1).join('').trim();
    const part2 = wordsAndSpaces.slice(wordIndex + 1).join('').trim();
    
    if (part1 && part2) {
      sentence.text = part1;
      this.page.textBlock.sentences.splice(sentenceIndex + 1, 0, {
        index: sentenceIndex + 1,
        text: part2
      });
      
      this.page.textBlock.sentences.forEach((s, i) => s.index = i);
      this.renderSentencesForEditing();
    }
  }

  updateWordCount() {
    const editor = this.container.querySelector('#text-editor');
    const text = editor.innerText.trim();
    const count = text ? text.split(/\s+/).length : 0;
    const countEl = this.container.querySelector('#word-count');
    if (countEl) countEl.textContent = `${count} words`;
  }

  segmentSentences(text) {
    const matches = text.match(/[^.!?]+[.!?]+/g) || (text ? [text] : []);
    this.page.textBlock.sentences = matches.map((s, i) => ({
      index: i,
      text: s.trim()
    })).filter(s => s.text.length > 0);
  }
}
