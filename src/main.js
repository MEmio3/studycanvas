import { Router } from './router.js';
import { DeckManager } from './components/DeckManager.js';
import { TopBar } from './components/TopBar.js';
import { LeftPanel } from './components/LeftPanel.js';
import { SettingsPanel } from './components/Modals/SettingsPanel.js';
import { getNotebook, updateNotebook } from './store/notebooks.js';
import { getSectionsForNotebook, updateSection, createSection } from './store/sections.js';
import { getSubsectionsForNotebook, createSubsection, updateSubsection } from './store/subsections.js';
import { getPagesForNotebook, createPage, updatePage, movePageToSubsection } from './store/pages.js';
import { initGlobalKeyboardShortcuts } from './services/keyboard.js';
import { setActivePageForAutosave, notifyChange, forceSavePage } from './services/autosave.js';
import { showToast } from './components/Toast.js';
import { showDeleteConfirm } from './components/DeleteConfirm.js';

class EditorView {
  constructor(container, params) {
    this.container = container;
    this.notebookId = params.get('id');
    this.notebook = null;
    this.sections = [];
    this.subsections = [];
    this.pages = [];
    this.activePageId = null;
    this.mode = 'edit';
    this.direction = 'right';
  }

  async mount() {
    this.container.innerHTML = `<div class="flex-center" style="height: 100vh;">Loading notebook...</div>`;
    this.notebook = await getNotebook(this.notebookId);
    if (!this.notebook) {
      window.location.hash = '';
      return;
    }

    this.sections = await getSectionsForNotebook(this.notebookId);
    this.subsections = await getSubsectionsForNotebook(this.notebookId);
    this.pages = await getPagesForNotebook(this.notebookId);

    if (this.pages.length > 0) {
      this.activePageId = this.pages[0].pageId;
    }

    this.renderLayout();

    this.handleDeckTitleChangeBound = this.handleDeckTitleChange.bind(this);
    document.addEventListener('deck-title-changed', this.handleDeckTitleChangeBound);

    this.handleSlideNextBound = this.handleSlideNext.bind(this);
    this.handleSlidePrevBound = this.handleSlidePrev.bind(this);
    document.addEventListener('slide-next', this.handleSlideNextBound);
    document.addEventListener('slide-prev', this.handleSlidePrevBound);

    this.handleExitPresentationBound = this.handleExitPresentation.bind(this);
    document.addEventListener('exit-presentation', this.handleExitPresentationBound);

    this.handlePresentationEndBound = () => {
      if (this.mode === 'present') this.handleSlideNext();
    };
    document.addEventListener('presentation-page-end', this.handlePresentationEndBound);

    this.handleDeletePageBound = (e) => {
      if (this.mode === 'edit') {
        this.handleDeletePage(e.detail.pageId);
      }
    };
    document.addEventListener('app-action-delete-page', this.handleDeletePageBound);

    this.handlePageCreatedBound = (e) => {
      if (e.detail.notebookId === this.notebookId) {
        this.pages.push(e.detail);
        this.setActivePage(e.detail.pageId);
      }
    };
    document.addEventListener('page-created', this.handlePageCreatedBound);

    // Ctrl+S save handler
    this.handleSaveBound = () => {
      const page = this.pages.find(p => p.pageId === this.activePageId);
      if (page) forceSavePage(page);
    };
    document.addEventListener('app-shortcut-save', this.handleSaveBound);

    // Add section shortcut
    this.handleNewSectionBound = () => this.handleAddSection();
    document.addEventListener('app-shortcut-new-section', this.handleNewSectionBound);
  }

  unmount() {
    this.container.innerHTML = '';
    document.removeEventListener('deck-title-changed', this.handleDeckTitleChangeBound);
    document.removeEventListener('slide-next', this.handleSlideNextBound);
    document.removeEventListener('slide-prev', this.handleSlidePrevBound);
    document.removeEventListener('exit-presentation', this.handleExitPresentationBound);
    document.removeEventListener('presentation-page-end', this.handlePresentationEndBound);
    document.removeEventListener('app-action-delete-page', this.handleDeletePageBound);
    document.removeEventListener('page-created', this.handlePageCreatedBound);
    document.removeEventListener('app-shortcut-save', this.handleSaveBound);
    document.removeEventListener('app-shortcut-new-section', this.handleNewSectionBound);
    if (this.currentCanvasComponent && this.currentCanvasComponent.unmount) {
      this.currentCanvasComponent.unmount();
    }
  }

  handleExitPresentation() {
    if (this.mode === 'present') {
      this.mode = 'slide';
      this.topBar.currentMode = 'slide';
      this.topBar.render();
      this.renderLayout();
    }
  }

  async handleDeckTitleChange(e) {
    if (this.notebook) {
      this.notebook.title = e.detail;
      await updateNotebook(this.notebook);
    }
  }

  async handleSlideNext() {
    if (this.mode !== 'slide' && this.mode !== 'present') return;
    const idx = this.pages.findIndex(p => p.pageId === this.activePageId);
    if (idx < this.pages.length - 1) {
      this.direction = 'right';
      this.setActivePage(this.pages[idx + 1].pageId);
    }
  }

  async handleSlidePrev() {
    if (this.mode !== 'slide' && this.mode !== 'present') return;
    const idx = this.pages.findIndex(p => p.pageId === this.activePageId);
    if (idx > 0) {
      this.direction = 'left';
      this.setActivePage(this.pages[idx - 1].pageId);
    }
  }

  renderLayout() {
    this.container.innerHTML = `
      <div style="display: flex; flex-direction: column; height: 100vh;">
        <div id="top-bar-container"></div>
        <div style="display: flex; flex-grow: 1; overflow: hidden;">
          <div id="left-panel-container"></div>
          <div id="main-canvas-container" style="flex-grow: 1; overflow: auto; position: relative; background: var(--bg-base);"></div>
        </div>
      </div>
    `;

    const activePage = this.pages.find(p => p.pageId === this.activePageId);

    this.topBar = new TopBar(
      this.container.querySelector('#top-bar-container'),
      this.notebook,
      activePage,
      (mode) => { this.mode = mode; this.renderMainCanvas(); },
      async (isFlagged) => {
        const page = this.pages.find(p => p.pageId === this.activePageId);
        if (page) {
          page.isFlagged = isFlagged;
          notifyChange(page);
          this.leftPanel.updateData(this.sections, this.subsections, this.pages, this.activePageId);
        }
      }
    );
    this.topBar.render();

    document.addEventListener('app-watch-jump', (e) => {
      const { videoId, time } = e.detail;
      this.mode = 'watch';
      this.renderMainCanvas();
      setTimeout(() => {
        if (this.currentCanvasComponent && this.currentCanvasComponent.handleVideoSelect) {
          this.currentCanvasComponent.activeVideoId = videoId;
          this.currentCanvasComponent.currentVideoTime = time;
          if (this.currentCanvasComponent.playlist) {
            const video = this.currentCanvasComponent.playlist.videos.find(v => v.videoId === videoId);
            if (video) {
              if (!this.currentCanvasComponent.watchProgress.videos[video.videoId]) {
                this.currentCanvasComponent.watchProgress.videos[video.videoId] = {
                  watchedSeconds: time, durationSeconds: video.durationSeconds,
                  isComplete: false, lastWatchedAt: null, completedAt: null
                };
              } else {
                this.currentCanvasComponent.watchProgress.videos[video.videoId].watchedSeconds = time;
              }
              this.currentCanvasComponent.handleVideoSelect(video);
            }
          }
        }
      }, 500);
    });

    this.leftPanel = new LeftPanel(
      this.container.querySelector('#left-panel-container'),
      {
        sections: this.sections,
        subsections: this.subsections,
        pages: this.pages,
        activePageId: this.activePageId,
        onPageSelect: (id) => this.setActivePage(id),
        onPageReorder: (pageId, newSubId, newIndex) => this.handlePageReorder(pageId, newSubId, newIndex),
        onNewPage: (subsectionId) => this.addNewPage(subsectionId),
        onAddSection: () => this.handleAddSection(),
        onAddSubsection: (sectionId) => this.handleAddSubsection(sectionId),
        onRenameSection: (id, title) => this.handleRenameSection(id, title),
        onRenameSubsection: (id, title) => this.handleRenameSubsection(id, title),
        onDeleteSection: (id, anchorEl) => this.handleDeleteSection(id, anchorEl),
        onDeleteSubsection: (id, anchorEl) => this.handleDeleteSubsection(id, anchorEl),
        onDeletePage: (id, anchorEl) => this.handleDeletePage(id, anchorEl),
      }
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

    // Save old page before switching
    const oldPage = this.pages.find(p => p.pageId === this.activePageId);
    if (oldPage) setActivePageForAutosave(oldPage);

    this.activePageId = id;
    this.leftPanel.updateData(this.sections, this.subsections, this.pages, this.activePageId);

    if (!skipCanvasRender) this.renderMainCanvas();

    const activePage = this.pages.find(p => p.pageId === id);
    if (activePage && this.topBar) {
      this.topBar.setActivePage(activePage);
      setActivePageForAutosave(activePage);
      const idx = this.pages.findIndex(p => p.pageId === id);
      this.topBar.updateCounter(idx + 1, this.pages.length);
    }
  }

  async addNewPage(subsectionId) {
    // Find the right subsection
    let targetSub = null;
    if (subsectionId === 'new') {
      const { createSection, updateSection } = await import('./store/sections.js');
      const { createSubsection } = await import('./store/subsections.js');
      const sec = await createSection(this.notebookId, 'New Section');
      targetSub = await createSubsection(this.notebookId, sec.sectionId, 'New Subsection');
      
      this.notebook.sections.push(sec.sectionId);
      await updateNotebook(this.notebook);
      
      sec.subsections.push(targetSub.subsectionId);
      await updateSection(sec.sectionId, { subsections: sec.subsections });
      
      // Reload hierarchy
      this.sections = await getSectionsForNotebook(this.notebookId);
      this.subsections = await getSubsectionsForNotebook(this.notebookId);
    } else if (subsectionId) {
      targetSub = this.subsections.find(s => s.subsectionId === subsectionId);
    } else {
      // Use active page's subsection, or first available
      const activePage = this.pages.find(p => p.pageId === this.activePageId);
      if (activePage) {
        targetSub = this.subsections.find(s => s.subsectionId === activePage.subsectionId);
      }
      if (!targetSub && this.subsections.length > 0) {
        targetSub = this.subsections[0];
      }
    }

    if (!targetSub) return;

    const page = await createPage(this.notebookId, targetSub.sectionId, targetSub.subsectionId, `Page ${this.pages.length + 1}`);
    this.pages.push(page);
    // Update the subsection's pages array in memory
    targetSub.pages.push(page.pageId);
    this.setActivePage(page.pageId);
    this.topBar.updateCounter(this.pages.length, this.pages.length);
  }

  async handlePageReorder(pageId, newSubId, newIndex) {
    await movePageToSubsection(pageId, newSubId, newIndex);
    // Reload data
    this.subsections = await getSubsectionsForNotebook(this.notebookId);
    this.pages = await getPagesForNotebook(this.notebookId);
    this.leftPanel.updateData(this.sections, this.subsections, this.pages, this.activePageId);
  }

  async handleAddSection() {
    const section = await createSection(this.notebookId, 'New Section', this.sections.length);
    this.sections.push(section);
    // Create default Uncategorised subsection
    const sub = await createSubsection(this.notebookId, section.sectionId, 'Uncategorised', true, 0);
    section.subsections = [sub.subsectionId];
    await updateSection(section.sectionId, { subsections: section.subsections });
    this.subsections.push(sub);
    // Update notebook
    this.notebook.sections.push(section.sectionId);
    await updateNotebook(this.notebook);
    this.leftPanel.updateData(this.sections, this.subsections, this.pages, this.activePageId);
  }

  async handleAddSubsection(sectionId) {
    const section = this.sections.find(s => s.sectionId === sectionId);
    if (!section) return;
    const sub = await createSubsection(this.notebookId, sectionId, 'New Subsection', false, (section.subsections?.length || 0));
    section.subsections = section.subsections || [];
    section.subsections.push(sub.subsectionId);
    await updateSection(sectionId, { subsections: section.subsections });
    this.subsections.push(sub);
    this.leftPanel.updateData(this.sections, this.subsections, this.pages, this.activePageId);
  }

  async handleRenameSection(sectionId, title) {
    const section = this.sections.find(s => s.sectionId === sectionId);
    if (section) {
      section.title = title;
      await updateSection(sectionId, { title });
    }
  }

  async handleRenameSubsection(subId, title) {
    const sub = this.subsections.find(s => s.subsectionId === subId);
    if (sub) {
      sub.title = title;
      await updateSubsection(subId, { title });
    }
  }

  async handleDeleteSection(sectionId, anchorEl) {
    const section = this.sections.find(s => s.sectionId === sectionId);
    if (!section) return;

    showDeleteConfirm(
      anchorEl || document.body,
      section.title,
      'This will delete the section and all its subsections. Pages will be moved to Uncategorised.',
      async () => {
        const { deleteSection } = await import('./store/sections.js');
        const sectionSubs = this.subsections.filter(s => s.sectionId === sectionId);
        const sectionPages = this.pages.filter(p => p.sectionId === sectionId);

        // Find another section's uncategorised, or first available sub
        const otherSubs = this.subsections.filter(s => s.sectionId !== sectionId && s.isBuiltIn);
        const fallbackSub = otherSubs[0] || this.subsections.find(s => s.sectionId !== sectionId);

        if (sectionPages.length > 0 && fallbackSub) {
          for (const p of sectionPages) {
            await movePageToSubsection(p.pageId, fallbackSub.subsectionId);
          }
        }

        // Delete subsections
        const { deleteSubsection } = await import('./store/subsections.js');
        for (const sub of sectionSubs) {
          await deleteSubsection(sub.subsectionId);
        }

        await deleteSection(sectionId);
        this.notebook.sections = this.notebook.sections.filter(id => id !== sectionId);
        await updateNotebook(this.notebook);

        this.sections = await getSectionsForNotebook(this.notebookId);
        this.subsections = await getSubsectionsForNotebook(this.notebookId);
        this.pages = await getPagesForNotebook(this.notebookId);
        this.leftPanel.updateData(this.sections, this.subsections, this.pages, this.activePageId);
        showToast(`Section deleted. ${sectionPages.length} pages moved to Uncategorised.`, 'info', 6000);
      }
    );
  }

  async handleDeleteSubsection(subId, anchorEl) {
    const sub = this.subsections.find(s => s.subsectionId === subId);
    if (!sub || sub.isBuiltIn) return;

    showDeleteConfirm(
      anchorEl || document.body,
      sub.title,
      'Pages in this subsection will be moved to Uncategorised.',
      async () => {
        // Move pages to the section's built-in Uncategorised
        const sectionSubs = this.subsections.filter(s => s.sectionId === sub.sectionId);
        const uncategorised = sectionSubs.find(s => s.isBuiltIn);
        const subPages = this.pages.filter(p => p.subsectionId === subId);

        if (subPages.length > 0 && uncategorised) {
          for (const p of subPages) {
            await movePageToSubsection(p.pageId, uncategorised.subsectionId);
          }
        }

        const { deleteSubsection } = await import('./store/subsections.js');
        await deleteSubsection(subId);

        // Update section
        const section = this.sections.find(s => s.sectionId === sub.sectionId);
        if (section) {
          section.subsections = (section.subsections || []).filter(id => id !== subId);
          await updateSection(section.sectionId, { subsections: section.subsections });
        }

        this.subsections = await getSubsectionsForNotebook(this.notebookId);
        this.pages = await getPagesForNotebook(this.notebookId);
        this.leftPanel.updateData(this.sections, this.subsections, this.pages, this.activePageId);
        const msg = subPages.length > 0 ? `Subsection deleted. ${subPages.length} pages moved to Uncategorised.` : 'Subsection deleted.';
        showToast(msg, 'info', 5000);
      }
    );
  }

  async handleDeletePage(pageId, anchorEl) {
    const page = this.pages.find(p => p.pageId === pageId);
    if (!page) return;

    showDeleteConfirm(
      anchorEl || document.body,
      page.title || 'Untitled Page',
      'Are you sure you want to delete this page?',
      async () => {
        // Cache data for undo
        const pageCopy = JSON.parse(JSON.stringify(page));
        const oldIndex = this.pages.findIndex(p => p.pageId === pageId);

        const { deletePage, createPage, updatePage } = await import('./store/pages.js');
        await deletePage(pageId);
        
        // Remove from local state
        this.pages = this.pages.filter(p => p.pageId !== pageId);
        
        // Fallback active page if we just deleted it
        if (this.activePageId === pageId) {
          const fallback = this.pages[Math.max(0, oldIndex - 1)] || this.pages[0];
          this.activePageId = fallback ? fallback.pageId : null;
        }

        this.leftPanel.updateData(this.sections, this.subsections, this.pages, this.activePageId);
        this.renderMainCanvas();
        if (this.activePageId && this.topBar) {
          const newActive = this.pages.find(p => p.pageId === this.activePageId);
          this.topBar.setActivePage(newActive);
        }

        showToast('Page deleted.', 'info', 6000, 'Undo', async () => {
          // Undo logic
          await updatePage(pageCopy);
          this.pages.splice(oldIndex, 0, pageCopy);
          this.activePageId = pageId;
          this.leftPanel.updateData(this.sections, this.subsections, this.pages, this.activePageId);
          this.renderMainCanvas();
          this.topBar?.setActivePage(pageCopy);
        });
      }
    );
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
    this.leftPanel.updateData(this.sections, this.subsections, this.pages, this.activePageId);
  }

  renderMainCanvas() {
    const canvasContainer = this.container.querySelector('#main-canvas-container');
    const activePage = this.pages.find(p => p.pageId === this.activePageId);

    canvasContainer.classList.remove('animate-slide-in-right', 'animate-slide-in-left', 'animate-fade-in');
    void canvasContainer.offsetWidth;

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

    if (transitionClass) canvasContainer.classList.add(transitionClass);
    this.direction = 'right';

    if (this.currentCanvasComponent && this.currentCanvasComponent.unmount) {
      this.currentCanvasComponent.unmount();
      this.currentCanvasComponent = null;
    }

    const topBarContainer = this.container.querySelector('#top-bar-container');
    const leftPanelContainer = this.container.querySelector('#left-panel-container');
    if (topBarContainer) topBarContainer.style.display = 'block';
    if (leftPanelContainer) leftPanelContainer.style.display = 'block';

    if (!activePage && this.mode !== 'watch') {
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
      if (topBarContainer) topBarContainer.style.display = 'none';
      if (leftPanelContainer) leftPanelContainer.style.display = 'none';
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(e => console.log('Fullscreen denied:', e));
      }
      import('./components/PresentCanvas.js').then(({ PresentCanvas }) => {
        this.currentCanvasComponent = new PresentCanvas(canvasContainer, activePage);
        this.currentCanvasComponent.render();
      });
    } else if (this.mode === 'watch') {
      if (leftPanelContainer) leftPanelContainer.style.display = 'none';
      import('./components/YouTubeMode/YouTubeMode.js').then(({ YouTubeMode }) => {
        this.currentCanvasComponent = new YouTubeMode(canvasContainer, this.notebookId, this.topBar);
        this.currentCanvasComponent.render();
      });
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

  initGlobalKeyboardShortcuts();

  // Migration banner
  if (!localStorage.getItem('studycanvas_migration_v4_seen')) {
    // Check if we have notebooks (meaning migration happened)
    import('./store/notebooks.js').then(async ({ getAllNotebooks }) => {
      const notebooks = await getAllNotebooks();
      if (notebooks.length > 0) {
        const banner = showToast(
          'Your notes were upgraded to the new format. Existing pages are in "Uncategorised". Organise them into sections from the left panel.',
          'info', 0, 'Got it', () => {
            localStorage.setItem('studycanvas_migration_v4_seen', 'true');
          }
        );
      } else {
        localStorage.setItem('studycanvas_migration_v4_seen', 'true');
      }
    });
  }

  // Global toast event listener
  document.addEventListener('app-toast', (e) => {
    const { message, type, action, pageId } = e.detail;
    showToast(message, type || 'info', 5000);
  });

  const router = new Router(routes, '');
  router.start();
});
