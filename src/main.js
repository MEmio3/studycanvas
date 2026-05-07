import { Router } from './router.js';
import { DeckManager } from './components/DeckManager.js';
import { TopBar } from './components/TopBar.js';
import { LeftPanel } from './components/LeftPanel.js';
import { SettingsPanel } from './components/Modals/SettingsPanel.js';
import { getDeck, updateDeck } from './store/decks.js';
import { getPagesForDeck, createPage, updatePage } from './store/pages.js';
import { getConnectionsForDeck } from './store/connections.js';

class EditorView {
  constructor(container, params) {
    this.container = container;
    this.deckId = params.get('id');
    this.deck = null;
    this.pages = [];
    this.activePageId = null;
    this.mode = 'edit';
    this.direction = 'right';
  }

  async mount() {
    this.container.innerHTML = `<div class="flex-center" style="height: 100vh;">Loading deck...</div>`;
    this.deck = await getDeck(this.deckId);
    if (!this.deck) {
      window.location.hash = '';
      return;
    }
    
    this.pages = await getPagesForDeck(this.deckId);
    if (this.pages.length > 0) {
      this.activePageId = this.pages[0].pageId;
    }

    this.renderLayout();

    // Bind event correctly
    this.handleDeckTitleChangeBound = this.handleDeckTitleChange.bind(this);
    document.addEventListener('deck-title-changed', this.handleDeckTitleChangeBound);
    
    this.handleSlideNextBound = this.handleSlideNext.bind(this);
    this.handleSlidePrevBound = this.handleSlidePrev.bind(this);
    document.addEventListener('slide-next', this.handleSlideNextBound);
    document.addEventListener('slide-prev', this.handleSlidePrevBound);
    
    this.handleExitPresentationBound = this.handleExitPresentation.bind(this);
    document.addEventListener('exit-presentation', this.handleExitPresentationBound);

    this.handlePresentationEndBound = () => {
      if (this.mode === 'present') {
         this.handleSlideNext();
      }
    };
    document.addEventListener('presentation-page-end', this.handlePresentationEndBound);

    this.handlePageCreatedBound = (e) => {
      if (e.detail.deckId === this.deckId) {
        this.pages.push(e.detail);
        this.setActivePage(e.detail.pageId);
        this.topBar.updateCounter(this.pages.length, this.pages.length);
      }
    };
    document.addEventListener('page-created', this.handlePageCreatedBound);

    this.handleFlowNodeSelectedBound = (e) => {
      this.setActivePage(e.detail.id, true); // true = skip canvas render to avoid unmounting FlowCanvas
    };
    document.addEventListener('flow-node-selected', this.handleFlowNodeSelectedBound);
  }

  unmount() {
    this.container.innerHTML = '';
    document.removeEventListener('deck-title-changed', this.handleDeckTitleChangeBound);
    document.removeEventListener('slide-next', this.handleSlideNextBound);
    document.removeEventListener('slide-prev', this.handleSlidePrevBound);
    document.removeEventListener('exit-presentation', this.handleExitPresentationBound);
    document.removeEventListener('presentation-page-end', this.handlePresentationEndBound);
    document.removeEventListener('page-created', this.handlePageCreatedBound);
    document.removeEventListener('flow-node-selected', this.handleFlowNodeSelectedBound);
    if (this.currentCanvasComponent && this.currentCanvasComponent.unmount) {
      this.currentCanvasComponent.unmount();
    }
  }

  handleExitPresentation() {
    if (this.mode === 'present') {
      this.mode = 'slide';
      this.topBar.currentMode = 'slide';
      this.topBar.render();
      this.renderLayout(); // Re-render to show panels again
    }
  }

  async handleDeckTitleChange(e) {
    if (this.deck) {
      this.deck.title = e.detail;
      await updateDeck(this.deck);
    }
  }
  
  async handleSlideNext() {
    if (this.mode !== 'slide' && this.mode !== 'present') return;
    
    let nextId = null;
    const settingsStr = localStorage.getItem('studycanvas_settings');
    const settings = settingsStr ? JSON.parse(settingsStr) : {};
    
    if (settings.playbackOrder === 'flow') {
      const connections = await getConnectionsForDeck(this.deckId);
      const seqEdge = connections.find(c => c.type === 'sequence' && c.sourcePageId === this.activePageId);
      if (seqEdge) {
        nextId = seqEdge.targetPageId;
      }
    }
    
    if (!nextId) {
      const idx = this.pages.findIndex(p => p.pageId === this.activePageId);
      if (idx < this.pages.length - 1) {
        nextId = this.pages[idx + 1].pageId;
      }
    }
    
    if (nextId) {
      this.direction = 'right';
      this.setActivePage(nextId);
    }
  }

  async handleSlidePrev() {
    if (this.mode !== 'slide' && this.mode !== 'present') return;
    
    let prevId = null;
    const settingsStr = localStorage.getItem('studycanvas_settings');
    const settings = settingsStr ? JSON.parse(settingsStr) : {};
    
    if (settings.playbackOrder === 'flow') {
      const connections = await getConnectionsForDeck(this.deckId);
      const seqEdge = connections.find(c => c.type === 'sequence' && c.targetPageId === this.activePageId);
      if (seqEdge) {
        prevId = seqEdge.sourcePageId;
      }
    }
    
    if (!prevId) {
      const idx = this.pages.findIndex(p => p.pageId === this.activePageId);
      if (idx > 0) {
        prevId = this.pages[idx - 1].pageId;
      }
    }
    
    if (prevId) {
      this.direction = 'left';
      this.setActivePage(prevId);
    }
  }

  renderLayout() {
    this.container.innerHTML = `
      <div style="display: flex; flex-direction: column; height: 100vh;">
        <div id="top-bar-container"></div>
        <div style="display: flex; flex-grow: 1; overflow: hidden;">
          <div id="left-panel-container"></div>
          <div id="main-canvas-container" style="flex-grow: 1; overflow: auto; position: relative; background: var(--bg-base);">
          </div>
        </div>
      </div>
    `;

    const activePage = this.pages.find(p => p.pageId === this.activePageId);

    this.topBar = new TopBar(
      this.container.querySelector('#top-bar-container'),
      this.deck,
      activePage,
      (mode) => { this.mode = mode; this.renderMainCanvas(); },
      async (topic) => {
        const page = this.pages.find(p => p.pageId === this.activePageId);
        if (page) {
          page.topic = topic;
          import('./store/pages.js').then(async ({ updatePage }) => {
            await updatePage(page);
            this.leftPanel.updatePages(this.pages, this.activePageId);
          });
        }
      },
      async (isFlagged) => {
        const page = this.pages.find(p => p.pageId === this.activePageId);
        if (page) {
          page.isFlagged = isFlagged;
          import('./store/pages.js').then(async ({ updatePage }) => {
            await updatePage(page);
            this.leftPanel.updatePages(this.pages, this.activePageId);
          });
        }
      }
    );
    this.topBar.render();

    this.leftPanel = new LeftPanel(
      this.container.querySelector('#left-panel-container'),
      this.pages,
      this.activePageId,
      (id) => this.setActivePage(id),
      (oldIndex, newIndex) => this.reorderPages(oldIndex, newIndex),
      () => this.addNewPage()
    );
    this.leftPanel.render();
    
    this.renderMainCanvas();
  }

  setActivePage(id, skipCanvasRender = false) {
    const currentIndex = this.pages.findIndex(p => p.pageId === this.activePageId);
    const newIndex = this.pages.findIndex(p => p.pageId === id);
    if (currentIndex !== -1 && newIndex !== -1) {
      this.direction = newIndex > currentIndex ? 'right' : 'left';
    }

    this.activePageId = id;
    this.leftPanel.updatePages(this.pages, this.activePageId);
    
    if (!skipCanvasRender) {
      this.renderMainCanvas();
    }
    
    const activePage = this.pages.find(p => p.pageId === id);
    if (activePage && this.topBar) {
      this.topBar.setActivePage(activePage);
      const idx = this.pages.findIndex(p => p.pageId === id);
      this.topBar.updateCounter(idx + 1, this.pages.length);
    }
  }

  async addNewPage() {
    const page = await createPage(this.deckId, `Page ${this.pages.length + 1}`);
    this.pages.push(page);
    this.setActivePage(page.pageId);
    this.topBar.updateCounter(this.pages.length, this.pages.length);
  }

  async reorderPages(oldIndex, newIndex) {
    const moved = this.pages.splice(oldIndex, 1)[0];
    this.pages.splice(newIndex, 0, moved);
    
    for (let i = 0; i < this.pages.length; i++) {
      if (this.pages[i].order !== i) {
        this.pages[i].order = i;
        await updatePage(this.pages[i]);
      }
    }
    this.leftPanel.updatePages(this.pages, this.activePageId);
  }

  renderMainCanvas() {
    const canvasContainer = this.container.querySelector('#main-canvas-container');
    const activePage = this.pages.find(p => p.pageId === this.activePageId);
    
    canvasContainer.classList.remove('animate-slide-in-right', 'animate-slide-in-left', 'animate-fade-in');
    void canvasContainer.offsetWidth; // Force reflow
    
    let transitionClass = '';
    const settingsStr = localStorage.getItem('studycanvas_settings');
    if (settingsStr) {
      const s = JSON.parse(settingsStr);
      if (s.transition === 'slide') {
         transitionClass = this.direction === 'left' ? 'animate-slide-in-left' : 'animate-slide-in-right';
      } else if (s.transition === 'fade') {
         transitionClass = 'animate-fade-in';
      }
    } else {
      transitionClass = this.direction === 'left' ? 'animate-slide-in-left' : 'animate-slide-in-right';
    }
    
    if (transitionClass) {
       canvasContainer.classList.add(transitionClass);
    }
    
    this.direction = 'right'; // default reset
    
    if (this.currentCanvasComponent && this.currentCanvasComponent.unmount) {
      this.currentCanvasComponent.unmount();
      this.currentCanvasComponent = null;
    }
    
    if (!activePage) {
      canvasContainer.innerHTML = '<div class="flex-center" style="height: 100%;">Select or create a page</div>';
      return;
    }

    if (this.mode === 'edit') {
      import('./components/EditCanvas.js').then(({ EditCanvas }) => {
        this.currentCanvasComponent = new EditCanvas(canvasContainer, activePage);
        this.currentCanvasComponent.render();
      });
    } else if (this.mode === 'slide') {
      import('./components/SlideCanvas.js').then(({ SlideCanvas }) => {
        this.currentCanvasComponent = new SlideCanvas(canvasContainer, activePage);
        this.currentCanvasComponent.render();
      });
    } else if (this.mode === 'present') {
      // Hide panels
      const topBarContainer = this.container.querySelector('#top-bar-container');
      const leftPanelContainer = this.container.querySelector('#left-panel-container');
      if (topBarContainer) topBarContainer.style.display = 'none';
      if (leftPanelContainer) leftPanelContainer.style.display = 'none';

      // Enter fullscreen
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(e => console.log('Fullscreen denied:', e));
      }

      import('./components/PresentCanvas.js').then(({ PresentCanvas }) => {
        this.currentCanvasComponent = new PresentCanvas(canvasContainer, activePage);
        this.currentCanvasComponent.render();
      });
    } else if (this.mode === 'flow') {
      // Flow View — render the node graph canvas
      import('./components/FlowCanvas/FlowCanvas.js').then(({ FlowCanvas }) => {
        this.currentCanvasComponent = new FlowCanvas(canvasContainer, this.deckId, this.pages);
        this.currentCanvasComponent.render();
      });
      return; // Don't run the per-page logic below
    }
  }
}

const routes = {
  '': DeckManager,
  'deck/:id': EditorView
};

document.addEventListener('DOMContentLoaded', () => {
  const settingsContainer = document.createElement('div');
  document.body.appendChild(settingsContainer);
  const settingsPanel = new SettingsPanel(settingsContainer);
  settingsPanel.render();

  const router = new Router(routes, '');
  router.start();

  // Extension Bridge
  if (window.chrome && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'save_new_page') {
        document.dispatchEvent(new CustomEvent('external-capture', { detail: request.payload }));
      }
    });
  }

  document.addEventListener('external-capture', async (e) => {
    const payload = e.detail;
    const { getDecks, createDeck } = await import('./store/decks.js');
    const { createPage, updatePage } = await import('./store/pages.js');
    const { saveImage } = await import('./store/images.js');
    const { generateId } = await import('./utils/uuid.js');

    let targetDeckId = null;
    const hash = window.location.hash;
    if (hash.startsWith('#deck/')) {
      targetDeckId = hash.split('/')[1];
    } else {
      const decks = await getDecks();
      if (decks.length > 0) {
        targetDeckId = decks[0].deckId;
      } else {
        const newDeck = await createDeck("Captured Notes");
        targetDeckId = newDeck.deckId;
      }
    }

    const page = await createPage(targetDeckId, `Captured Page`);
    page.topic = payload.topic || '';
    page.textBlock.rawText = payload.text || '';
    page.textBlock.source = payload.source || '';

    if (payload.screenshotDataUrl) {
      const res = await fetch(payload.screenshotDataUrl);
      const blob = await res.blob();
      const storageKey = `img_${generateId()}`;
      await saveImage(storageKey, blob);
      
      page.images = [{
        storageKey: storageKey,
        mimeType: 'image/jpeg',
        annotations: []
      }];
    }

    const matches = page.textBlock.rawText.match(/[^.!?]+[.!?]+/g) || (page.textBlock.rawText ? [page.textBlock.rawText] : []);
    page.textBlock.sentences = matches.map((s, i) => ({
      index: i,
      text: s.trim()
    })).filter(s => s.text.length > 0);

    await updatePage(page);
    document.dispatchEvent(new CustomEvent('page-created', { detail: page }));
    
    // If not in editor, might want to redirect
    if (!hash.startsWith('#deck/')) {
       window.location.hash = `#deck/${targetDeckId}`;
    }
  });
});
