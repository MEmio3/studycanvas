import { Router } from './router.js';
import { DeckManager } from './components/DeckManager.js';

// Placeholder for main editor view
class EditorView {
  constructor(container, params) {
    this.container = container;
    this.deckId = params.get('id');
  }
  async mount() {
    this.container.innerHTML = `<div style="padding: 32px"><h2>Editor View for Deck: ${this.deckId}</h2><button onclick="window.location.hash=''" class="primary">Back to Home</button></div>`;
  }
  unmount() {
    this.container.innerHTML = '';
  }
}

const routes = {
  '': DeckManager,
  'deck/:id': EditorView
};

document.addEventListener('DOMContentLoaded', () => {
  const router = new Router(routes, '');
  router.start();
});
