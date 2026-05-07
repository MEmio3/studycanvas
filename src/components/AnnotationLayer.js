export class AnnotationLayer {
  constructor(container, imageRecord, page, isEditable = false, onAnnotationClick) {
    this.container = container;
    this.imageRecord = imageRecord;
    this.page = page;
    this.isEditable = isEditable;
    this.onAnnotationClick = onAnnotationClick;
    this.activeSentenceIndex = -1;
  }

  setActiveSentence(index) {
    this.activeSentenceIndex = index;
    this.render();
  }

  render() {
    this.container.innerHTML = '';
    this.container.style.position = 'absolute';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.pointerEvents = this.isEditable ? 'auto' : 'none';

    if (!this.imageRecord.annotations) {
      this.imageRecord.annotations = [];
    }

    this.imageRecord.annotations.forEach((ann, idx) => {
      const marker = document.createElement('div');
      const isActive = ann.sentenceIndex === this.activeSentenceIndex;
      
      marker.style.position = 'absolute';
      marker.style.left = `${ann.x}%`;
      marker.style.top = `${ann.y}%`;
      marker.style.width = '24px';
      marker.style.height = '24px';
      marker.style.marginLeft = '-12px';
      marker.style.marginTop = '-12px';
      marker.style.borderRadius = '50%';
      marker.style.backgroundColor = ann.color || 'var(--accent-primary)';
      marker.style.border = '2px solid white';
      marker.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      marker.style.cursor = this.isEditable ? 'pointer' : 'default';
      marker.style.pointerEvents = 'auto';
      marker.title = `Sentence ${ann.sentenceIndex + 1}`;
      
      if (isActive) {
        marker.style.animation = 'pulse-annotation 1.5s infinite';
        marker.style.transform = 'scale(1.2)';
        marker.style.zIndex = '100';
      }

      if (this.isEditable) {
        marker.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.onAnnotationClick) this.onAnnotationClick(ann, idx);
        });
      }

      this.container.appendChild(marker);
    });

    if (this.isEditable) {
      this.container.addEventListener('click', (e) => {
        const rect = this.container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        if (this.onAnnotationClick) {
          this.onAnnotationClick({ x, y, sentenceIndex: -1, color: '#3B82F6' }, -1);
        }
      });
    }
  }
}
